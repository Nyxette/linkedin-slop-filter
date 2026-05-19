console.log("✅ SLF content script loaded");

let isEnabled = true;
let cachedThreshold = 30;
let feedObserver = null;
let isDetectLength = false;
let lengthMin      = 100;

// ─── CONTEXT INVALIDATION GUARD ───────────────────────────────────────────────

const checkContext = setInterval(() => {
  try {
    if (!chrome.runtime?.id) {
      clearInterval(checkContext);
      if (feedObserver) feedObserver.disconnect();
    }
  } catch {
    clearInterval(checkContext);
    if (feedObserver) feedObserver.disconnect();
  }
}, 5000);

// ─── LIVE SETTINGS SYNC ───────────────────────────────────────────────────────
// If the user changes settings while the tab is open, pick them up immediately

chrome.storage.onChanged.addListener((changes) => {
  if (changes.threshold) {
    cachedThreshold = changes.threshold.newValue;
    console.log("SLF: threshold updated to", cachedThreshold);
  }
  if (changes.enabled) {
    isEnabled = changes.enabled.newValue;
    console.log("SLF: enabled updated to", isEnabled);
  }
  if (changes.detectLength) {
    isDetectLength = changes.detectLength.newValue;
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "SET_ENABLED") {
    console.log(`SLF: ${wordCount} words | tooLong: ${tooLong} (min: ${lengthMin}) | aiDetected: ${aiDetected} (score: ${score})`);
    isEnabled = message.enabled;
  }
  if (message.type === "SET_DETECT_LENGTH") {
    isDetectLength = message.detectLength;
  }
  if (message.type === "RATE_LIMITED")      showRateLimitToast(message.provider);

});

init();

// ─── INIT ─────────────────────────────────────────────────────────────────────
// Must be async — we load settings BEFORE observing the feed so the threshold
// is correct from the very first post that gets scored.

async function init() {
  const s = await getSettings();
  isDetectLength = s.detectLength !== false;
  lengthMin      = parseInt(s.lengthThreshold?.split("-")[0]) || 0;
  isEnabled = s.enabled;
  cachedThreshold = s.threshold;


  console.log("SLF: settings loaded →", { threshold: cachedThreshold, enabled: isEnabled });

  const waitForFeed = setInterval(() => {
    const feed = document.querySelector("main");
    if (feed) {
      clearInterval(waitForFeed);
      observeFeed(feed);
    }
  }, 500);
}

// ─── OBSERVE FEED ─────────────────────────────────────────────────────────────

function observeFeed(feed) {
  console.log("SLF: feed found, observing");

  for (const postEl of feed.querySelectorAll("[role='listitem']")) {
    processPost(postEl);
  }

  feedObserver = new MutationObserver((mutations) => {
    if (!chrome.runtime?.id) {
      feedObserver.disconnect();
      return;
    }
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        if (node.classList?.contains("slf-card") || node.closest?.(".slf-card")) continue;

        const posts = node.matches("[role='listitem']")
          ? [node]
          : [...node.querySelectorAll("[role='listitem']")];

        for (const postEl of posts) {
          processPost(postEl);
        }
      }
    }
  });

  feedObserver.observe(feed, { childList: true, subtree: true });
}

// ─── PROCESS POST ─────────────────────────────────────────────────────────────

const processedElements = new WeakSet();
const processedTexts = new Set();

function processPost(postEl) {

  if (!isEnabled && !isDetectLength) return;
  if (processedElements.has(postEl)) return;
  processedElements.add(postEl);

  const textEl = postEl.querySelector("[data-testid='expandable-text-box']");
  if (!textEl) return;

  const textKey = text.slice(0, 120);
  if (processedTexts.has(textKey)) return;
  processedTexts.add(textKey);

  const wordCount = text.trim().split(/\s+/).length;
  const tooLong   = isDetectLength && checkLength(text,lengthMin);
  const score     = isEnabled ? scorePost(text) : 0;
  const aiDetected= isEnabled && score >= cachedThreshold;

  console.log(`SLF: ${wordCount} words | tooLong: ${tooLong} (min: ${lengthMin}) | aiDetected: ${aiDetected} (score: ${score})`);

  if (!tooLong && !aiDetected) return;

  console.log("SLF score:", score, "| tooLong:", tooLong, "| aiDetected:", aiDetected);
  collapsePost(postEl, text, score, aiDetected, tooLong, wordCount);

}

// ─── COLLAPSE POST ────────────────────────────────────────────────────────────
function collapsePost(postEl, text, score, aiDetected, tooLong, wordCount) {

  const originalContent = postEl.querySelector("[data-testid='expandable-text-box']");
  if (!originalContent) return;
  if (!chrome.runtime?.id) return;
  if (!text || text.trim().length === 0) return;

  // Hide the entire wrapper but save a reference
  originalContent.style.visibility = "hidden";
  originalContent.style.height = "0";
  originalContent.style.overflow = "hidden";

  const card = buildSummaryCard(score, aiDetected, tooLong, wordCount);
  originalContent.parentNode.insertBefore(card, originalContent);

  try {
    chrome.runtime.sendMessage({ type: "SUMMARISE", text }, (response) => {
      if (chrome.runtime.lastError) {
        handleMessageError(card, originalContent);
        return;
      }
      if (response?.summary) {
        updateCardWithSummary(card, response.summary, originalContent);
      } else {
        handleMessageError(card, originalContent);
      }
    });
  } catch (e) {
    handleMessageError(card, originalContent);
  }
}

function handleMessageError(card, originalContent) {
  if (card?.parentNode) card.remove();
  if (originalContent) {
    originalContent.style.visibility = "";
    originalContent.style.height = "";
    originalContent.style.overflow = "";
  }
}

// ─── CARD UI ──────────────────────────────────────────────────────────────────

function buildSummaryCard(score, aiDetected, tooLong, wordCount) {
  let headerHTML="";
if (aiDetected && tooLong) {
  headerHTML = `
    <span class="slf-badge"> AI content detected</span>
    <span class="slf-score">${score}/100</span>
    <span class="slf-divider">·</span>
    <span class="slf-badge">Word Count: ${wordCount} words</span>
  `;
} else if (aiDetected) {
  headerHTML = `
    <span class="slf-badge"> AI content detected</span>
    <span class="slf-score">${score}/100</span>
  `;
} else {
  headerHTML = `<span class="slf-badge"> ${wordCount} words</span>`;
}

  const card = document.createElement("div");
  card.className = "slf-card";
  card.innerHTML = `
    <div class="slf-header">${headerHTML}</div>
    <div class="slf-summary slf-loading">Summarising…</div>
    <button class="slf-show-btn" style="display:none">↩ Show original post</button>
  `;
  return card;
}


function updateCardWithSummary(card, summary, originalContent) {
  const summaryEl = card.querySelector(".slf-summary");
  const showBtn = card.querySelector(".slf-show-btn");

  summaryEl.classList.remove("slf-loading");
  summaryEl.textContent = summary;
  showBtn.style.display = "inline-block";

  showBtn.addEventListener("click", () => {
    const isHidden = originalContent.style.visibility === "hidden";

    if (isHidden) {
      // Show original below the card
      originalContent.style.visibility = "";
      originalContent.style.height = "";
      originalContent.style.overflow = "";
      showBtn.textContent = "↑ Collapse post";
    } else {
      // Hide it again
      originalContent.style.visibility = "hidden";
      originalContent.style.height = "0";
      originalContent.style.overflow = "hidden";
      showBtn.textContent = "↩ Show original post";
    }
    // Auto-click LinkedIn's "...more" to expand the full post
    setTimeout(() => {
      const seeMore = originalContent.querySelector("button[aria-label*='see more']") ||
                      originalContent.querySelector(".feed-shared-inline-show-more-text__see-more-less-toggle") ||
                      [...originalContent.querySelectorAll("button")].find(b => b.innerText.includes("more"));
      if (seeMore) seeMore.click();
    }, 50);
  });
}



function showRateLimitToast(provider) {
  // Don't stack duplicates
  if (document.getElementById("slf-toast")) return;

  const toast = document.createElement("div");
  toast.id = "slf-toast";
  toast.innerHTML = `
    <div class="slf-toast-title">⚠️ Rate limit hit — ${provider}</div>
    <div class="slf-toast-body">Summaries paused. Switch provider in settings.</div>
    <button class="slf-toast-close">✕</button>
  `;
  document.body.appendChild(toast);

  toast.querySelector(".slf-toast-close").addEventListener("click", () => toast.remove());

  // Auto-dismiss after 8 seconds
  setTimeout(() => toast?.remove(), 8000);
}