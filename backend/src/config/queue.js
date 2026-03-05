const { Queue, QueueEvents } = require("bullmq");
const redisClient = require("./redis");

// ── Scraping Queue (existing) ──────────────────────────────────────────────────
const scrapingQueue = new Queue("scraping-jobs", {
  connection: redisClient,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 20 },
  },
});

// ── Enrichment Queue (NEW — Week 3) ──────────────────────────────────────────
// Processes website crawling + LLM analysis + social media detection per lead
const enrichmentQueue = new Queue("enrichment-jobs", {
  connection: redisClient,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "fixed", delay: 3000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

// ── Queue Event Listeners ─────────────────────────────────────────────────────
scrapingQueue.on("error", (err) =>
  console.error("❌ ScrapingQueue Error:", err.message),
);
enrichmentQueue.on("error", (err) =>
  console.error("❌ EnrichmentQueue Error:", err.message),
);

// ── Queue Events (for SSE broadcasting) ──────────────────────────────────────
const enrichmentQueueEvents = new QueueEvents("enrichment-jobs", {
  connection: new (require("ioredis"))({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null,
  }),
});

module.exports = { scrapingQueue, enrichmentQueue, enrichmentQueueEvents };
