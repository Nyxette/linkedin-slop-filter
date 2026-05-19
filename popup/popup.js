const toggle      = document.getElementById("enabledToggle");
const statusDot   = document.getElementById("statusDot");
const optionsLink = document.getElementById("optionsLink");

const pillThreshold = document.getElementById("pillThreshold");
const pillProvider  = document.getElementById("pillProvider");
const pillLength    = document.getElementById("pillLength");
const pillTone      = document.getElementById("pillTone");

const detectLength  = document.getElementById("detectLength");
const lengthThreshold=document.getElementById("pillLengthThreshold");


const lengthLabels = {
  "very-short": "Very short",
  "short":      "Short",
  "medium":     "Medium",
};

const toneLabels = {
  "professional": "💼 Pro",
  "blunt":        "🔪 Blunt",
  "sarcastic":    "🙄 Sarcastic",
  "casual":       "👋 Casual",
  "gen-z":        "✨ Gen Z",
};

// Load saved state and populate UI
getSettings().then((s) => {
  toggle.checked = s.enabled !== false;
  updateDot(s.enabled !== false);

  detectLength.checked = s.detectLength !==false;
  lengthThreshold.textContent=s.lengthThreshold + "chars"; 

  pillThreshold.textContent = s.threshold + "/100";
  pillProvider.textContent  = s.provider === "openai-compatible" ? "OpenAI" : s.provider.charAt(0).toUpperCase() + s.provider.slice(1);
  pillLength.textContent    = lengthLabels[s.summaryLength] || s.summaryLength;
  pillTone.textContent      = toneLabels[s.tone] || s.tone;
});

function updateDot(enabled) {
  statusDot.classList.toggle("off", !enabled);
}

// Toggle for ai detector
toggle.addEventListener("change", () => {
  const enabled = toggle.checked;
  chrome.storage.sync.set({ enabled });
  updateDot(enabled);

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "SET_ENABLED", enabled }).catch(() => {});
    }
  });
});

//toggle for length detector
detectLength.addEventListener("change", () => {
  chrome.storage.sync.set({ detectLength: detectLength.checked });

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "SET_DETECT_LENGTH",
        detectLength: detectLength.checked
      }).catch(() => {});
    }
  });
});

// Open settings
optionsLink.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});