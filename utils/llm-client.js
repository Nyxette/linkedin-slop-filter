async function summariseBatch(posts, settings) {
  switch (settings.provider) {
    case "groq":
      return await callGroq(posts, settings);
    case "ollama":
      return await callOllama(posts, settings);
    case "openai-compatible":
      return await callOpenAICompatible(posts, settings);
    default:
      throw new Error(`Unknown provider: ${settings.provider}`);
  }
}

// ─── PROMPT ───────────────────────────────────────────────────────────────────

function buildPrompt(posts, settings) {
  const numbered = posts
    .map((text, i) => `POST ${i + 1}:\n${text}`)
    .join("\n\n---\n\n");

  const lengthMap = {
    "very-short": "1-2 sentences maximum. One if possible.",
    "short":      "2-3 sentences.",
    "medium":     "4-5 sentences. Include more supporting detail.",
  };

  const toneMap = {
    "professional": "Write in a clear, neutral, professional tone.",
    "blunt":        "Write in a blunt, no-nonsense tone. No softening. Be brutal.",
    "sarcastic":    "Write with dry sarcasm. Make it clear the post is LinkedIn fluff dressed up as wisdom.",
    "casual":       "Write casually, like you're telling a friend what the post said.",
    "gen-z":        "Write in Gen Z internet slang. Be brief, use expressions like 'basically', 'lowkey', 'fr'.",
  };

  const lengthInstruction = lengthMap[settings?.summaryLength] || lengthMap["short"];
  const toneInstruction   = toneMap[settings?.tone]           || toneMap["professional"];

  return `You are summarising LinkedIn posts flagged as likely AI-generated or low-quality.

Length: ${lengthInstruction}
Tone: ${toneInstruction}

For each post:
1. Start with "The author [claims/argues/shares/announces] that…" and state the core point.
2. Include any specific facts, numbers, or technical details they mention.
3. If there is concrete advice or a takeaway, state it. If the post is pure inspiration or a humble-brag with no real substance, say so plainly.

Do not reproduce hype, filler phrases, or rhetorical hooks. Write in third person.

Return ONLY a JSON array of strings — one summary per post, in order.
No markdown, no explanation. Just the raw JSON array.

${numbered}`;
}

// ─── RESPONSE PARSING ─────────────────────────────────────────────────────────

function parseResponse(rawText, expectedCount) {
  const cleaned = rawText.replace(/```json|```/gi, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.warn("SLF: JSON parse failed. Raw:", rawText.slice(0, 200));
    return Array(expectedCount).fill("Summary unavailable.");
  }

  if (!Array.isArray(parsed)) {
    return Array(expectedCount).fill("Summary unavailable.");
  }

  // Pad if short, trim if long
  while (parsed.length < expectedCount) parsed.push("Summary unavailable.");
  return parsed.slice(0, expectedCount);
}

// ─── GROQ ─────────────────────────────────────────────────────────────────────

async function callGroq(posts, settings) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model || "llama-3.1-8b-instant",
      messages: [{ role: "user", content: buildPrompt(posts, settings)}],
      temperature: 0.3,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(`Groq ${response.status}: ${errData?.error?.message || "unknown error"}`);
  }

  const data = await response.json();
  return parseResponse(data.choices[0].message.content, posts.length);
}

// ─── OLLAMA ───────────────────────────────────────────────────────────────────

async function callOllama(posts, settings) {
  const baseUrl = settings.ollamaUrl || "http://localhost:11434";

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: settings.model || "llama3",
      messages: [{ role: "user", content: buildPrompt(posts, settings)}],
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama ${response.status}`);
  }

  const data = await response.json();
  // Ollama /api/chat returns data.message.content, NOT data.choices[0]
  return parseResponse(data.message.content, posts.length);
}

// ─── OPENAI-COMPATIBLE ────────────────────────────────────────────────────────

async function callOpenAICompatible(posts, settings) {
  const response = await fetch(`${settings.openaiBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model,
      messages: [{ role: "user", content: buildPrompt(posts, settings)}],
      temperature: 0.3,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    throw new Error(`API ${response.status}`);
  }

  const data = await response.json();
  return parseResponse(data.choices[0].message.content, posts.length);
}