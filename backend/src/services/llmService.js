const axios = require("axios");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const LLM_ENABLED = !!GROQ_API_KEY;
const GROQ_BASE = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant";

async function callLLM(systemPrompt, userPrompt, maxTokens = 150) {
  if (!LLM_ENABLED) return null;

  try {
    const res = await axios.post(
      GROQ_BASE,
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
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
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

function parseJSON(text, fallback) {
  if (!text) return fallback;
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return fallback;
  }
}

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

async function detectCategory(lead, crawlData = {}) {
  if (
    lead.category &&
    lead.category.length > 2 &&
    lead.category !== "Unknown"
  ) {
    return normalizeCategory(lead.category);
  }

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
  if (/restaurant|food|cafe/.test(lower)) return "Restaurant";
  if (/salon|spa|beauty/.test(lower)) return "Beauty & Wellness";
  if (/gym|fitness|yoga/.test(lower)) return "Fitness";
  if (/doctor|clinic|dental/.test(lower)) return "Healthcare";
  if (/law|attorney|legal/.test(lower)) return "Legal";
  if (/real estate|realty/.test(lower)) return "Real Estate";
  if (/auto|car|garage/.test(lower)) return "Automotive";
  if (/school|academy|tutor/.test(lower)) return "Education";
  if (/hotel|motel|inn/.test(lower)) return "Hospitality";
  if (/construction|plumbing|electrician/.test(lower)) return "Construction";
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

function analyzeSocialPresence(social = {}) {
  const platforms = Object.keys(social).filter((k) => social[k]);
  const score = Math.min(platforms.length * 2.5, 10);
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

async function generateLeadScore(lead, crawlData = {}, socialAnalysis = {}) {
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

  if (LLM_ENABLED) {
    const system =
      `You are a B2B sales lead qualifier. Based on business data, return ONLY JSON: ` +
      `{"score": "hot"|"warm"|"cold", "reason": "one sentence", "confidence": 0-100}. ` +
      `Hot = complete contact info + online presence + high rating. Cold = missing most data.`;
    const user = `Lead data: ${JSON.stringify(context)}`;

    const result = await callLLM(system, user, 100);
    const parsed = parseJSON(result, null);

    if (parsed && ["hot", "warm", "cold"].includes(parsed.score)) {
      return {
        score: parsed.score,
        reason: parsed.reason || "AI scored",
        confidence: parsed.confidence || 75,
        method: "groq",
      };
    }
  }

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
