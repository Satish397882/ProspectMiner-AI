/**
 * crawler.js — Lightweight Website Crawler (Week 3, Day 1-2)
 *
 * Fetches a business website and extracts:
 *   - Contact email addresses
 *   - Social media links (Facebook, Instagram, LinkedIn, Twitter/X)
 *   - Page title & meta description
 *   - Technology hints (contact forms, e-commerce, etc.)
 *
 * Uses axios + cheerio (no Playwright) for speed.
 * Results are cached in Redis for 24 hours to avoid re-crawling.
 */

const axios = require("axios");
const cheerio = require("cheerio");
const { cacheDomainCrawl, getCachedDomainCrawl } = require("../config/redis");

// ── Constants ─────────────────────────────────────────────────────────────────

const CRAWL_TIMEOUT_MS = 8000;

const SOCIAL_PATTERNS = {
  facebook:
    /facebook\.com\/(?!sharer|share|tr|plugins|login)([a-zA-Z0-9._-]+)/i,
  instagram: /instagram\.com\/([a-zA-Z0-9._-]+)/i,
  linkedin: /linkedin\.com\/company\/([a-zA-Z0-9._-]+)/i,
  twitter: /(?:twitter|x)\.com\/([a-zA-Z0-9_]+)/i,
  youtube: /youtube\.com\/(?:channel\/|@)([a-zA-Z0-9_-]+)/i,
};

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Normalize a raw website URL to a clean origin
 * e.g. "www.example.com" → "https://www.example.com"
 */
function normalizeUrl(raw) {
  if (!raw) return null;
  let url = raw.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }
  try {
    const parsed = new URL(url);
    return parsed.origin; // strips path/query/hash
  } catch {
    return null;
  }
}

/**
 * Extract the bare domain for caching purposes
 */
function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * Extract emails from raw HTML text
 * Filters out common false-positives (image extensions, etc.)
 */
function extractEmails(html) {
  const matches = html.match(EMAIL_REGEX) || [];
  const BLACKLIST = /\.(png|jpg|jpeg|gif|svg|webp|css|js|woff|ttf|eot)$/i;
  return [
    ...new Set(
      matches
        .map((e) => e.toLowerCase())
        .filter((e) => !BLACKLIST.test(e) && e.length < 100),
    ),
  ].slice(0, 5); // cap at 5 emails
}

/**
 * Extract social media profiles from all <a href> links on the page
 */
function extractSocialLinks($) {
  const social = {};
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    for (const [platform, pattern] of Object.entries(SOCIAL_PATTERNS)) {
      if (!social[platform] && pattern.test(href)) {
        social[platform] = href.trim();
      }
    }
  });
  return social;
}

/**
 * Detect technology signals from the page
 */
function detectSignals($, html) {
  const signals = [];
  const lower = html.toLowerCase();

  if ($("form").length > 0) signals.push("has_contact_form");
  if (
    lower.includes("shopify") ||
    lower.includes("woocommerce") ||
    lower.includes("add to cart")
  )
    signals.push("ecommerce");
  if (lower.includes("booking") || lower.includes("appointment"))
    signals.push("booking_system");
  if ($("script[src*='wp-content']").length > 0) signals.push("wordpress");
  if ($("script[src*='squarespace']").length > 0) signals.push("squarespace");

  return signals;
}

// ── Main Crawler ──────────────────────────────────────────────────────────────

/**
 * crawlWebsite(websiteUrl)
 *
 * @param {string} websiteUrl — raw website URL from lead data
 * @returns {Object} crawl result with emails, social, signals, meta
 */
async function crawlWebsite(websiteUrl) {
  const normalizedUrl = normalizeUrl(websiteUrl);
  if (!normalizedUrl) {
    return { success: false, error: "Invalid URL", url: websiteUrl };
  }

  const domain = extractDomain(normalizedUrl);

  // ── Check Redis cache first ───────────────────────────────────────────────
  const cached = await getCachedDomainCrawl(domain);
  if (cached) {
    console.log(`📦 Cache hit for domain: ${domain}`);
    return { ...cached, fromCache: true };
  }

  // ── Fetch the page ────────────────────────────────────────────────────────
  let html;
  try {
    const response = await axios.get(normalizedUrl, {
      headers: HEADERS,
      timeout: CRAWL_TIMEOUT_MS,
      maxRedirects: 5,
      validateStatus: (s) => s < 500,
    });
    html = response.data;
    if (typeof html !== "string") {
      return { success: false, error: "Non-HTML response", url: normalizedUrl };
    }
  } catch (err) {
    const errMsg = err.code || err.message || "Fetch failed";
    return { success: false, error: errMsg, url: normalizedUrl };
  }

  // ── Parse HTML ────────────────────────────────────────────────────────────
  const $ = cheerio.load(html);

  const title = $("title").first().text().trim().slice(0, 120) || null;
  const description =
    $('meta[name="description"]').attr("content")?.trim().slice(0, 300) || null;

  const emails = extractEmails(html);
  const social = extractSocialLinks($);
  const signals = detectSignals($, html);

  // ── Also try /contact page for more emails ────────────────────────────────
  let contactEmails = [];
  try {
    const contactRes = await axios.get(`${normalizedUrl}/contact`, {
      headers: HEADERS,
      timeout: 5000,
      maxRedirects: 3,
      validateStatus: (s) => s < 400,
    });
    contactEmails = extractEmails(contactRes.data || "");
  } catch {
    // contact page doesn't exist — that's fine
  }

  const allEmails = [...new Set([...emails, ...contactEmails])].slice(0, 5);

  const result = {
    success: true,
    url: normalizedUrl,
    domain,
    title,
    description,
    emails: allEmails,
    primaryEmail: allEmails[0] || null,
    social,
    signals,
    crawledAt: new Date().toISOString(),
    fromCache: false,
  };

  // ── Cache result in Redis ─────────────────────────────────────────────────
  await cacheDomainCrawl(domain, result);

  return result;
}

module.exports = { crawlWebsite, normalizeUrl, extractDomain };
