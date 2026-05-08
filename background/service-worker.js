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

async function flushQueue(){
    if (queue.length===0) return;

    const batch=queue.splice(0,queue.length);
    const settings =await getSettings();
    if(!settings.apiKey && settings.provider !=="ollama"){
        for (const item of batch){
            item.resolve("No API Key configured. Add one in the extension setings please");
        }
        return;
    }

    try{
        const texts = batch.map(item=>item.text);
        const summaries=await summariseBatch(texts,settings);

        for (let i=0;i<batch.length;i++){
            const summary = summaries[i] || "Summary Unavailable.";

            await setCachedSummary(batch[i].text,summary);
            
            batch[i].resolve(summary);
        }
    }catch (error) {
        console.error("Batch summarisation failed:", error.message, "| Stack:", error.stack);
        for (const item of batch) {
            item.resolve(`Summary failed: ${error.message}`);
        }
}
}