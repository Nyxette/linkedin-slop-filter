function checkLength(text,minWords){
    wordCount=text.trim().split(/\s+/).length;
    return wordCount >=minWords;
}

function scorePost(text) {
  let score = 0;

  score += checkBuzzwords(text);
  score += checkLineBreakRatio(text);
  score += checkHookOpener(text);
  score += checkEngagementBait(text);
  score += checkNumberedLessons(text);
  score += checkSentenceLength(text);
  score += checkVocabularyDiversity(text);
  score += checkEmojiOverload(text);
  score += checkBulletLists(text);
  score += checkHookPhrases(text);
  score += checkCTAUrges(text);
  score += checkPunctuationQuirks(text);
  score += checkShortLineUniformity(text);

  return Math.min(score, 100);
}


// ─── ORIGINAL CHECKS ──────────────────────────────────────────────────────────

function checkBuzzwords(text) {
  const buzzwords = [
    "game.?changer",
    "dive deep",
    "at the end of the day",
    "let that sink in",
    "here's what nobody tells you",
    "i'm excited to share",
    "humbled and hono[u]red",
    "hard truth",
    "unpopular opinion",
    "this is your sign",
    "the secret is",
    "years? of experience taught me",
    "stop doing this",
    "do this instead",
    "most people don't know",
  ];

  let points = 0;
  for (const pattern of buzzwords) {
    if (new RegExp(pattern, "i").test(text)) points += 8;
  }
  return points;
}

function checkLineBreakRatio(text) {
  const lines = text.split("\n").filter(l => l.trim().length > 0);
  const words = text.split(/\s+/).length;
  const ratio = lines.length / words;
  if (ratio > 0.3) return 25;
  if (ratio > 0.2) return 15;
  if (ratio > 0.1) return 5;
  return 0;
}

function checkHookOpener(text) {
  const firstLine = text.split("\n")[0].trim();
  const hookPatterns = [
    /^i (almost|nearly|just|finally)/i,
    /^(this|it) changed (my|everything)/i,
    /^\d+ (years?|months?|weeks?) ago/i,
    /^(nobody|no one) talks about/i,
    /^(hot take|unpopular opinion|real talk):/i,
    /^what (nobody|no one) tells you/i,
    /^stop (doing|trying|waiting)/i,
  ];
  for (const pattern of hookPatterns) {
    if (pattern.test(firstLine)) return 20;
  }
  return 0;
}

function checkEngagementBait(text) {
  const tail = text.slice(-200).toLowerCase();
  const baits = [
    "drop a comment", "what do you think", "let me know below",
    "share this with", "repost if you agree", "follow me for",
    "thoughts?", "agree or disagree", "tag someone who",
  ];
  for (const bait of baits) {
    if (tail.includes(bait)) return 15;
  }
  return 0;
}

function checkNumberedLessons(text) {
  const listItems = text.match(/\d+[\.\)]\s+\w/g) || [];
  if (listItems.length >= 4) return 20;
  if (listItems.length >= 2) return 10;
  if (/\d+ (things?|lessons?|tips?|ways?|reasons?|steps?)/i.test(text)) return 10;
  return 0;
}

function checkSentenceLength(text) {
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
  if (sentences.length === 0) return 0;
  const avgWords = sentences.map(s => s.split(/\s+/).length)
    .reduce((sum, n) => sum + n, 0) / sentences.length;
  if (avgWords < 10) return 15;
  if (avgWords < 14) return 7;
  return 0;
}

function checkVocabularyDiversity(text) {
  const words = text.toLowerCase().replace(/[^a-z\s]/g, "")
    .split(/\s+/).filter(w => w.length > 3);
  if (words.length < 20) return 0;
  const ratio = new Set(words).size / words.length;
  if (ratio < 0.5) return 20;
  if (ratio < 0.6) return 10;
  return 0;
}


// ─── NEW CHECKS ───────────────────────────────────────────────────────────────

// 1. EMOJI OVERLOAD
// AI piles emojis for visual pop — 3+ emojis is a strong signal
function checkEmojiOverload(text) {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  const emojis = text.match(emojiRegex) || [];

  if (emojis.length >= 6) return 20;
  if (emojis.length >= 3) return 10;

  // Also check for 2+ emojis on a single line
  const lines = text.split("\n");
  for (const line of lines) {
    const lineEmojis = line.match(emojiRegex) || [];
    if (lineEmojis.length >= 2) return 10;
  }

  return 0;
}


// 2. BULLET LISTS
// AI loves structured bullet lists — 3+ bullets is a listicle signal
function checkBulletLists(text) {
  const bulletLines = text.split("\n").filter(line =>
    /^\s*[•\-\*]\s+\w/.test(line) || /^\s*\d+[\.\)]\s+\w/.test(line)
  );

  if (bulletLines.length >= 5) return 20;
  if (bulletLines.length >= 3) return 15;
  return 0;
}


// 3. HOOK PHRASES
// Specific clichéd phrases repeated across AI posts
function checkHookPhrases(text) {
  const phrases = [
    /biggest mistake/i,
    /used to (believe|think)/i,
    /here.?s (the thing|what (no ?one|nobody))/i,
    /if i told you/i,
    /stop scrolling/i,
    /what if i told you/i,
    /nobody talks about this/i,
    /this changed everything/i,
    /i wish i knew this/i,
    /years? ago (i|we)/i,
    /the truth (is|about)/i,
    /most people (will|won't|don't|never)/i,
    /\bpsa\b/i,
    /raise your hand if/i,
    /hot take:/i,
  ];

  let points = 0;
  for (const pattern of phrases) {
    if (pattern.test(text)) points += 10;
  }
  return Math.min(points, 30); // cap at 30 so one category can't dominate
}


// 4. CTA URGES
// Forced interaction prompts — strong AI signal especially at end of post
function checkCTAUrges(text) {
  const tail = text.slice(-300).toLowerCase();
  const ctas = [
    /comment (below|👇|your|if)/i,
    /tag someone (who|that)/i,
    /dm (me |"yes"|'yes'|for)/i,
    /save (this|for later)/i,
    /double.?tap/i,
    /let that sink in/i,
    /follow (me|us) for (more|daily)/i,
    /share this (post|with)/i,
    /repost (if|this)/i,
    /drop a (comment|👇)/i,
    /which (one|point) resonates/i,
    /what.?s your (take|thought)/i,
  ];

  let points = 0;
  for (const cta of ctas) {
    if (cta.test(tail)) points += 10;
  }
  return Math.min(points, 25);
}


// 5. PUNCTUATION QUIRKS
// AI-specific formatting patterns
function checkPunctuationQuirks(text) {
  let points = 0;

  // Em dash used as "not X — do Y" construction
  const emDashPattern = /\w+—\w+/g;
  const emDashes = text.match(emDashPattern) || [];
  if (emDashes.length >= 2) points += 10;

  // Quoted single words for emphasis: "mindset", 'growth'
  const quotedWords = text.match(/["\u201C\u201D][^"]{1,20}["\u201C\u201D]/g) || [];
  if (quotedWords.length >= 2) points += 8;

  // Excessive ellipsis for drama
  const ellipsis = text.match(/\.\.\./g) || [];
  if (ellipsis.length >= 3) points += 8;

  // ALL CAPS words for emphasis (not full sentences)
  const capsWords = text.match(/\b[A-Z]{3,}\b/g) || [];
  if (capsWords.length >= 3) points += 8;

  return Math.min(points, 20);
}


// 6. SHORT LINE UNIFORMITY
// AI uses lots of very short lines for scroll-stopping effect
function checkShortLineUniformity(text) {
  const lines = text.split("\n").filter(l => l.trim().length > 0);
  if (lines.length < 4) return 0;

  const shortLines = lines.filter(l => l.trim().length < 40);
  const ratio = shortLines.length / lines.length;

  if (ratio > 0.7) return 20;
  if (ratio > 0.5) return 12;
  if (ratio > 0.3) return 5;
  return 0;
}