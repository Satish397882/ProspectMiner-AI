/**
 * scrapingWorker.js — UPDATED Week 3, Day 5
 *
 * Replaces the Week 2 version. Changes:
 *   - Caches progress in Redis on every update
 *   - Dispatches enrichment jobs to enrichmentQueue after scraping
 *   - Improved failure recovery with retry/backoff
 *   - Broadcasts SSE progress updates via sseController
 *   - Cleans up Redis cache on job completion/failure
 */

const { Worker } = require("bullmq");
const redisClient = require("../config/redis");
const { cacheJobProgress, deleteJobProgressCache } = require("../config/redis");
const { enrichmentQueue } = require("../config/queue");
const Job = require("../models/Job");
const Lead = require("../models/Lead");
const axios = require("axios");
const { broadcastJobProgress } = require("../controllers/sseController");

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://127.0.0.1:8000";

// ── Worker ────────────────────────────────────────────────────────────────────

const scrapingWorker = new Worker(
  "scraping-jobs",
  async (job) => {
    const { jobId, userId, keyword, location, numberOfLeads } = job.data;

    try {
      console.log(`🔄 Processing job: ${jobId}`);

      // ── Mark running + cache initial progress ────────────────────────────
      await Job.findByIdAndUpdate(jobId, { status: "running", progress: 0 });
      await cacheJobProgress(jobId, {
        status: "running",
        progress: 0,
        leadsScraped: 0,
      });

      broadcastJobProgress(userId, {
        type: "update",
        job: {
          id: jobId,
          status: "running",
          progress: 0,
          leadsScraped: 0,
          numberOfLeads,
        },
      });

      // ── Call Python scraper ───────────────────────────────────────────────
      console.log(
        `📡 Calling Python scraper for "${keyword}" in "${location}"...`,
      );
      const response = await axios.post(
        `${PYTHON_API_URL}/scrape`,
        { keyword, location, count: numberOfLeads },
        { timeout: 300000 }, // 5 min timeout for large jobs
      );

      const scrapedLeads = response.data.leads || [];
      console.log(`✅ Scraped ${scrapedLeads.length} leads from Python`);

      if (scrapedLeads.length === 0) {
        await Job.findByIdAndUpdate(jobId, {
          status: "completed",
          progress: 100,
          leadsScraped: 0,
        });
        await deleteJobProgressCache(jobId);
        broadcastJobProgress(userId, {
          type: "done",
          job: {
            id: jobId,
            status: "completed",
            progress: 100,
            leadsScraped: 0,
          },
        });
        return { success: true, jobId, leadsCount: 0 };
      }

      // ── Save leads + dispatch enrichment jobs ─────────────────────────────
      const enrichmentJobs = [];

      for (let i = 0; i < scrapedLeads.length; i++) {
        const leadData = scrapedLeads[i];

        // Save lead to MongoDB
        const lead = await Lead.create({
          jobId,
          userId,
          businessName: leadData.name || "Unknown",
          phone: leadData.phone || null,
          website: leadData.website || null,
          email: leadData.email || null,
          rating: leadData.rating ? parseFloat(leadData.rating) : null,
          address: leadData.address || null,
          category: leadData.category || null,
          leadScore: "warm", // enrichment worker will update this
          enriched: false,
        });

        // Queue enrichment job for this lead
        enrichmentJobs.push({
          name: "enrich-lead",
          data: { leadId: lead._id.toString(), jobId, userId },
          opts: { delay: i * 200 }, // stagger to avoid rate limits
        });

        // ── Update progress ──────────────────────────────────────────────
        const progress = Math.round(((i + 1) / scrapedLeads.length) * 100);
        const progressData = {
          status: "running",
          progress,
          leadsScraped: i + 1,
          numberOfLeads,
        };

        await Job.findByIdAndUpdate(jobId, { progress, leadsScraped: i + 1 });
        await cacheJobProgress(jobId, progressData);
        await job.updateProgress(progress);

        broadcastJobProgress(userId, {
          type: "update",
          job: { id: jobId, ...progressData },
        });
      }

      // ── Dispatch all enrichment jobs in bulk ──────────────────────────────
      await enrichmentQueue.addBulk(enrichmentJobs);
      console.log(`📬 Queued ${enrichmentJobs.length} enrichment jobs`);

      // ── Mark job as completed ─────────────────────────────────────────────
      await Job.findByIdAndUpdate(jobId, {
        status: "completed",
        progress: 100,
        leadsScraped: scrapedLeads.length,
      });

      await deleteJobProgressCache(jobId);

      broadcastJobProgress(userId, {
        type: "done",
        job: {
          id: jobId,
          status: "completed",
          progress: 100,
          leadsScraped: scrapedLeads.length,
          enrichmentQueued: enrichmentJobs.length,
        },
      });

      console.log(
        `✅ Job completed: ${jobId} | ${scrapedLeads.length} leads | ${enrichmentJobs.length} enrichments queued`,
      );
      return { success: true, jobId, leadsCount: scrapedLeads.length };
    } catch (error) {
      console.error(`❌ Job failed: ${jobId}`, error.message);

      await Job.findByIdAndUpdate(jobId, {
        status: "failed",
        errorMessage: error.message,
      });

      await deleteJobProgressCache(jobId);

      broadcastJobProgress(userId, {
        type: "error",
        job: { id: jobId, status: "failed", error: error.message },
      });

      throw error;
    }
  },
  {
    connection: redisClient,
    concurrency: 5,
  },
);

// ── Worker Event Listeners ────────────────────────────────────────────────────

scrapingWorker.on("completed", (job) => {
  console.log(`✅ Worker completed job: ${job.id}`);
});

scrapingWorker.on("failed", (job, err) => {
  console.error(`❌ Worker failed job: ${job?.id}`, err.message);
});

scrapingWorker.on("error", (err) => {
  console.error("❌ Worker error:", err.message);
});

module.exports = scrapingWorker;
