const Redis = require("ioredis");

const redisClient = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redisClient.on("connect", () => console.log("✅ Redis Connected"));
redisClient.on("error", (err) => console.error("❌ Redis Error:", err.message));

// ── Progress Cache Helpers ────────────────────────────────────────────────────

const cacheJobProgress = async (jobId, data) => {
  try {
    await redisClient.setex(
      `job:progress:${jobId}`,
      7200,
      JSON.stringify(data),
    );
  } catch (e) {
    console.error("Redis cacheJobProgress:", e.message);
  }
};

const getCachedJobProgress = async (jobId) => {
  try {
    const raw = await redisClient.get(`job:progress:${jobId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const deleteJobProgressCache = async (jobId) => {
  try {
    await redisClient.del(`job:progress:${jobId}`);
  } catch (e) {
    console.error("Redis deleteJobProgressCache:", e.message);
  }
};

const cacheEnrichmentResult = async (leadId, data) => {
  try {
    await redisClient.setex(
      `lead:enrichment:${leadId}`,
      3600,
      JSON.stringify(data),
    );
  } catch (e) {
    console.error("Redis cacheEnrichmentResult:", e.message);
  }
};

const getCachedEnrichment = async (leadId) => {
  try {
    const raw = await redisClient.get(`lead:enrichment:${leadId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// TTL: 24 hours — website content doesn't change often
const cacheDomainCrawl = async (domain, data) => {
  try {
    await redisClient.setex(
      `domain:crawl:${domain}`,
      86400,
      JSON.stringify(data),
    );
  } catch (e) {
    console.error("Redis cacheDomainCrawl:", e.message);
  }
};

const getCachedDomainCrawl = async (domain) => {
  try {
    const raw = await redisClient.get(`domain:crawl:${domain}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

module.exports = redisClient;
module.exports.cacheJobProgress = cacheJobProgress;
module.exports.getCachedJobProgress = getCachedJobProgress;
module.exports.deleteJobProgressCache = deleteJobProgressCache;
module.exports.cacheEnrichmentResult = cacheEnrichmentResult;
module.exports.getCachedEnrichment = getCachedEnrichment;
module.exports.cacheDomainCrawl = cacheDomainCrawl;
module.exports.getCachedDomainCrawl = getCachedDomainCrawl;
