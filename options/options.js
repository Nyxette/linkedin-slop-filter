// Grab all the form elements
const providerEl   = document.getElementById("provider");
const apiKeyEl     = document.getElementById("apiKey");
const ollamaUrlEl  = document.getElementById("ollamaUrl");
const ollamaField  = document.getElementById("ollamaField");
const modelEl      = document.getElementById("model");
const thresholdEl  = document.getElementById("threshold");
const thresholdVal = document.getElementById("thresholdValue");
const summaryEl    = document.getElementById("summaryLength");
const saveBtn      = document.getElementById("saveBtn");
const clearBtn     = document.getElementById("clearCacheBtn");
const statusEl     = document.getElementById("status");

// tone is a radio group, not a single element
function getSelectedTone() {
  const checked = document.querySelector('input[name="tone"]:checked');
  return checked ? checked.value : "professional";
}

function setSelectedTone(value) {
  const radio = document.querySelector(`input[name="tone"][value="${value}"]`);
  if (radio) radio.checked = true;
}

// ─── ON LOAD: POPULATE FORM WITH SAVED SETTINGS ───────────────────────────

getSettings().then((settings) => {
  providerEl.value    = settings.provider;
  apiKeyEl.value      = settings.apiKey;
  ollamaUrlEl.value   = settings.ollamaUrl;
  modelEl.value       = settings.model;
  thresholdEl.value   = settings.threshold;
  thresholdVal.textContent = settings.threshold;
  summaryEl.value     = settings.summaryLength;
  setSelectedTone(settings.tone || "professional");

  // Show/hide Ollama URL field based on saved provider
  toggleOllamaField(settings.provider);
});


// ─── THRESHOLD SLIDER: UPDATE DISPLAYED NUMBER AS YOU DRAG ────────────────

thresholdEl.addEventListener("input", () => {
  thresholdVal.textContent = thresholdEl.value;
});


// ─── PROVIDER DROPDOWN: SHOW OLLAMA FIELD ONLY WHEN RELEVANT ──────────────

providerEl.addEventListener("change", () => {
  toggleOllamaField(providerEl.value);
});

function toggleOllamaField(provider) {
  ollamaField.style.display = provider === "ollama" ? "block" : "none";
}


// ─── SAVE BUTTON ──────────────────────────────────────────────────────────

saveBtn.addEventListener("click", async () => {
  await saveSettings({
    provider:      providerEl.value,
    apiKey:        apiKeyEl.value,
    ollamaUrl:     ollamaUrlEl.value,
    model:         modelEl.value,
    threshold:     parseInt(thresholdEl.value),
    summaryLength: summaryEl.value,
    tone:          getSelectedTone(),   // ← add this
  });
  showStatus("Settings saved.");
});

// ─── CLEAR CACHE BUTTON ───────────────────────────────────────────────────

clearBtn.addEventListener("click", async () => {
  await clearCache();
  showStatus("Cache cleared.");
});


// ─── STATUS MESSAGE HELPER ────────────────────────────────────────────────
// Shows a message then fades it out after 2 seconds.

function showStatus(message) {
  statusEl.textContent = message;
  setTimeout(() => {
    statusEl.textContent = "";
  }, 2000);
}