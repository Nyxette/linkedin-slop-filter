importScripts(
  "/utils/storage.js",
  "/utils/llm-client.js"
);

let queue=[];
let debounceTimer=null;
const DEBOUNCE_MS=800;
const MAX_BATCH=10;

chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
    if(message.type !=="SUMMARISE")return;

    handleSummariseRequest(message.text,sendResponse);
    return true;
});


async function handleSummariseRequest(text,sendResponse){
    const cached =await getCachedSummary(text);
    if (cached){
        sendResponse({summary:cached});
        return;
    }
    const summary=await addToQueue(text);
    sendResponse({summary});

}

function addToQueue(text){
    return new Promise((resolve)=>{
        queue.push({text,resolve});
        if (queue.length>=MAX_BATCH){
            clearTimeout(debounceTimer);
            flushQueue();
            return;
        }
        clearTimeout(debounceTimer);
        debounceTimer=setTimeout(flushQueue,DEBOUNCE_MS);
    });
}


async function flushQueue() {
  if (queue.length === 0) return;

  const batch = queue.splice(0, queue.length);
  const settings = await getSettings();

  if (!settings.apiKey && settings.provider !== "ollama") {
    for (const item of batch) {
      item.resolve("No API Key configured. Add one in the extension settings.");
    }
    return;
  }

  try {
    const texts = batch.map(item => item.text);
    const summaries = await summariseBatch(texts, settings);

    for (let i = 0; i < batch.length; i++) {
      const summary = summaries[i] || "Summary unavailable.";
      await setCachedSummary(batch[i].text, summary);
      batch[i].resolve(summary);
    }
  } catch (error) {
    // ── Rate limit detection ──
    if (error.message.includes("429")) {
      notifyRateLimit(settings.provider);
      for (const item of batch) {
        item.resolve("Rate limited — summaries paused. Switch provider in settings.");
      }
      return;
    }

    for (const item of batch) {
      item.resolve(`Summary failed: ${error.message}`);
    }
  }
}

function notifyRateLimit(provider) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "RATE_LIMITED",
        provider,
      });
    }
  });
}