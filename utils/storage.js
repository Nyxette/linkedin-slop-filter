const DEFAULT_SETTINGS = {
  enabled: true,
  threshold: 30,
  provider: "groq",
  apiKey: "",
  ollamaUrl: "http://localhost:11434",
  model: "",
  summaryLength: "short",
  tone: "professional",   // ← add this
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
      resolve(result[key] || null);
    });
  });
}

function setCachedSummary(text, summary) {
  const key = "cache_" + text.slice(0, 100);
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: summary }, resolve);
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