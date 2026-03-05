/**
 * llmService.js — LLM Integration (Week 3, Day 3)
 *
 * Uses OpenAI GPT-3.5-turbo (or Anthropic Claude via env flag) to:
 *   1. Detect business category from name + website content
 *   2. Detect social media presence quality
 *   3. Generate AI lead score (hot / warm / cold) with reasoning
 *
 * Prompts are kept tight (< 300 tokens input) for speed + cost.
 * Falls back gracefully if LLM is unavailable or key is missing.
 */

const axios = require("axios");

const LLM_ENABLED = !!process.env.OPENAI_API_KEY;
const OPENAI_BASE = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-3.5-turbo";

// ── Core LLM Call ─────────────────────────────────────────────────────────────

async function callLLM(systemPrompt, userPrompt, maxTokens = 150) {
  if (!LLM_ENABLED) return null;

  try {
    const res = await axios.post(
      OPENAI_BASE,
      {
        model: MODEL,
        max_tokens: maxTokens,
        temperature: 0.2,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      },
    );

    return res.data.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error(
      "❌ LLM call failed:",
      err.response?.data?.error?.message || err.message,
    );
    return null;
  }
}

// ── Safe JSON Extractor ───────────────────────────────────────────────────────

function parseJSON(text, fallback) {
  if (!text) return fallback;
  try {
    // Strip markdown code fences if present
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return fallback;
  }
}

// ── 1. Category Detection ─────────────────────────────────────────────────────

const CATEGORY_LIST = [
  "Restaurant",
  "Retail",
  "Healthcare",
  "Legal",
  "Real Estate",
  "Automotive",
  "Beauty & Wellness",
  "Education",
  "Finance",
  "Construction",
  "Technology",
  "Hospitality",
  "Fitness",
  "Home Services",
  "Professional Services",
  "Other",
];

/**
 * Detect business category using LLM or fallback heuristics.
 * @param {Object} lead - lead fields (businessName, category, website crawl data)
 * @param {Object} crawlData - result from crawler.js
 * @returns {string} normalized category
 */
async function detectCategory(lead, crawlData = {}) {
  // If category already looks good, normalize and return
  if (
    lead.category &&
    lead.category.length > 2 &&
    lead.category !== "Unknown"
  ) {
    return normalizeCategory(lead.category);
  }

  // Build context string
  const context = [
    lead.businessName,
    crawlData.title || "",
    crawlData.description || "",
  ]
    .filter(Boolean)
    .join(" | ")
    .slice(0, 300);

  const system =
    `You are a business classifier. Return ONLY a JSON object: {"category": "..."} ` +
    `choosing from: ${CATEGORY_LIST.join(", ")}.`;
  const user = `Business info: ${context}`;

  const result = await callLLM(system, user, 50);
  const parsed = parseJSON(result, {});

  return parsed.category && CATEGORY_LIST.includes(parsed.category)
    ? parsed.category
    : heuristicCategory(lead.businessName, crawlData);
}

function normalizeCategory(raw) {
  const lower = raw.toLowerCase();
  if (
    lower.includes("restaurant") ||
    lower.includes("food") ||
    lower.includes("cafe")
  )
    return "Restaurant";
  if (
    lower.includes("salon") ||
    lower.includes("spa") ||
    lower.includes("beauty")
  )
    return "Beauty & Wellness";
  if (
    lower.includes("gym") ||
    lower.includes("fitness") ||
    lower.includes("yoga")
  )
    return "Fitness";
  if (
    lower.includes("doctor") ||
    lower.includes("clinic") ||
    lower.includes("dental")
  )
    return "Healthcare";
  if (
    lower.includes("law") ||
    lower.includes("attorney") ||
    lower.includes("legal")
  )
    return "Legal";
  if (lower.includes("real estate") || lower.includes("realty"))
    return "Real Estate";
  if (
    lower.includes("auto") ||
    lower.includes("car") ||
    lower.includes("garage")
  )
    return "Automotive";
  if (
    lower.includes("school") ||
    lower.includes("academy") ||
    lower.includes("tutor")
  )
    return "Education";
  if (
    lower.includes("hotel") ||
    lower.includes("motel") ||
    lower.includes("inn")
  )
    return "Hospitality";
  if (
    lower.includes("construction") ||
    lower.includes("plumbing") ||
    lower.includes("electrician")
  )
    return "Construction";
  return raw.length > 2 ? raw : "Other";
}

function heuristicCategory(businessName = "", crawlData = {}) {
  const text = (businessName + " " + (crawlData.title || "")).toLowerCase();
  if (/restaurant|pizza|burger|cafe|coffee|bakery|sushi/.test(text))
    return "Restaurant";
  if (/salon|spa|beauty|nails|hair/.test(text)) return "Beauty & Wellness";
  if (/gym|fitness|yoga|crossfit/.test(text)) return "Fitness";
  if (/doctor|clinic|dental|medical|pharmacy/.test(text)) return "Healthcare";
  if (/law|attorney|lawyer|legal/.test(text)) return "Legal";
  if (/hotel|motel|inn|lodge/.test(text)) return "Hospitality";
  if (/school|academy|tutoring|education/.test(text)) return "Education";
  if (/auto|car|garage|mechanic/.test(text)) return "Automotive";
  if (/realty|real estate|property/.test(text)) return "Real Estate";
  if (/plumbing|electrician|roofing|hvac|contractor/.test(text))
    return "Construction";
  if (/shop|store|boutique|retail/.test(text)) return "Retail";
  return "Other";
}

// ── 2. Social Media Quality Analysis ─────────────────────────────────────────

/**
 * Assess social media presence quality.
 * @param {Object} social - e.g. { facebook, instagram, linkedin }
 * @returns {Object} { score: 0-10, platforms: [], hasPresence: bool }
 */
function analyzeSocialPresence(social = {}) {
  const platforms = Object.keys(social).filter((k) => social[k]);
  const score = Math.min(platforms.length * 2.5, 10); // 0-10
  return {
    platforms,
    platformCount: platforms.length,
    hasPresence: platforms.length > 0,
    socialScore: Math.round(score),
    hasFacebook: !!social.facebook,
    hasInstagram: !!social.instagram,
    hasLinkedIn: !!social.linkedin,
  };
}

// ── 3. AI Lead Scoring ────────────────────────────────────────────────────────

/**
 * Generate AI lead score: hot / warm / cold
 *
 * Scoring logic (with LLM):
 *   hot  — has email + phone + website + social presence + high rating
 *   warm — has phone or website, partial data
 *   cold — minimal contact info
 *
 * Fallback heuristic used when LLM is off/fails.
 *
 * @param {Object} lead - lead fields
 * @param {Object} crawlData - crawler result
 * @param {Object} socialAnalysis - from analyzeSocialPresence()
 * @returns {{ score: "hot"|"warm"|"cold", reason: string, confidence: number }}
 */
async function generateLeadScore(lead, crawlData = {}, socialAnalysis = {}) {
  // Build context
  const context = {
    businessName: lead.businessName,
    hasPhone: !!lead.phone,
    hasWebsite: !!lead.website,
    hasEmail: !!(lead.email || crawlData.primaryEmail),
    rating: lead.rating || null,
    socialPlatforms: socialAnalysis.platforms || [],
    hasContactForm: (crawlData.signals || []).includes("has_contact_form"),
    category: lead.category || "Unknown",
  };

  // LLM scoring
  if (LLM_ENABLED) {
    const system =
      `You are a B2B sales lead qualifier. Based on business data, return ONLY JSON: ` +
      `{"score": "hot"|"warm"|"cold", "reason": "one sentence", "confidence": 0-100}. ` +
      `Hot = complete contact info + online presence + high rating. ` +
      `Cold = missing most data.`;
    const user = `Lead data: ${JSON.stringify(context)}`;

    const result = await callLLM(system, user, 100);
    const parsed = parseJSON(result, null);

    if (parsed && ["hot", "warm", "cold"].includes(parsed.score)) {
      return {
        score: parsed.score,
        reason: parsed.reason || "AI scored",
        confidence: parsed.confidence || 75,
        method: "llm",
      };
    }
  }

  // Heuristic fallback
  return heuristicLeadScore(context);
}

function heuristicLeadScore(ctx) {
  let points = 0;
  if (ctx.hasPhone) points += 2;
  if (ctx.hasEmail) points += 3;
  if (ctx.hasWebsite) points += 2;
  if (ctx.socialPlatforms.length >= 2) points += 2;
  if (ctx.rating >= 4.0) points += 2;
  if (ctx.hasContactForm) points += 1;

  let score, reason;
  if (points >= 8) {
    score = "hot";
    reason = "Strong contact info, online presence, and good rating.";
  } else if (points >= 4) {
    score = "warm";
    reason = "Partial contact info — worth following up.";
  } else {
    score = "cold";
    reason = "Limited contact information available.";
  }

  return {
    score,
    reason,
    confidence: Math.min(points * 10, 95),
    method: "heuristic",
  };
}

module.exports = {
  detectCategory,
  analyzeSocialPresence,
  generateLeadScore,
  CATEGORY_LIST,
};
