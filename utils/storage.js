const DEFAULT_SETTINGS = {

  detectLength:true,
  lengthThreshold:"100-medium",

  enabled: true, //detectAI
  threshold: 30,
  provider: "groq",
  apiKey: "",
  ollamaUrl: "http://localhost:11434",
  model: "",
  summaryLength: "short",
  tone: "professional",
};



function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (result) => {
      resolve(result);
    });
  });
}

function saveSettings(updates) {
  return new Promise((resolve) => {
    chrome.storage.sync.set(updates, resolve);
  });
}

function getCachedSummary(text) {
  const key = "cache_" + text.slice(0, 100);
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      const entry = result[key];
      if (!entry) return resolve(null);
      const age = Date.now() - entry.ts;
      if (age > 24 * 60 * 60 * 1000) {
        chrome.storage.local.remove(key);
        return resolve(null);
      }
      resolve(entry.summary);
    });
  });
}

function setCachedSummary(text, summary) {
  const key = "cache_" + text.slice(0, 100);
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: { summary, ts: Date.now() } }, resolve);
  });
}

function clearCache() {
  return new Promise((resolve) => {
    chrome.storage.local.get(null, (items) => {
      const cacheKeys = Object.keys(items).filter((k) => k.startsWith("cache_"));
      chrome.storage.local.remove(cacheKeys, resolve);
    });
  });
}