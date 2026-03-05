/**
 * enrichmentWorker.js — Week 3, Day 4
 *
 * BullMQ worker that processes enrichment jobs for individual leads.
 * For each lead it:
 *   1. Crawls the business website (crawler.js)
 *   2. Detects category via LLM / heuristics (llmService.js)
 *   3. Analyzes social media presence
 *   4. Generates AI lead score (hot/warm/cold)
 *   5. Updates the Lead document in MongoDB
 *   6. Broadcasts enrichment update via SSE
 *   7. Caches result in Redis
 */

const { Worker } = require("bullmq");
const redisClient = require("../config/redis");
const { cacheEnrichmentResult } = require("../config/redis");
const Lead = require("../models/Lead");
const { crawlWebsite } = require("../services/crawler");
const {
  detectCategory,
  analyzeSocialPresence,
  generateLeadScore,
} = require("../services/llmService");
const { broadcastEnrichmentUpdate } = require("../controllers/sseController");

// ── Worker ────────────────────────────────────────────────────────────────────

const enrichmentWorker = new Worker(
  "enrichment-jobs",
  async (job) => {
    const { leadId, jobId, userId } = job.data;

    try {
      console.log(`🔍 Enriching lead: ${leadId}`);

      // Load lead from DB
      const lead = await Lead.findById(leadId);
      if (!lead) {
        console.warn(`⚠️ Lead not found: ${leadId}`);
        return { skipped: true };
      }

      // ── Step 1: Website Crawl ────────────────────────────────────────────
      let crawlData = {};
      if (lead.website) {
        crawlData = await crawlWebsite(lead.website);
        console.log(
          `🌐 Crawled ${lead.website}: ${crawlData.success ? "✅" : "❌"} ${crawlData.error || ""}`,
        );
      }

      // ── Step 2: Category Detection ───────────────────────────────────────
      const detectedCategory = await detectCategory(
        {
          businessName: lead.businessName,
          category: lead.category,
          website: lead.website,
        },
        crawlData,
      );

      // ── Step 3: Social Media Analysis ────────────────────────────────────
      const socialAnalysis = analyzeSocialPresence(crawlData.social || {});

      // ── Step 4: Lead Scoring ─────────────────────────────────────────────
      const leadScoreResult = await generateLeadScore(
        lead,
        crawlData,
        socialAnalysis,
      );

      // ── Step 5: Build enrichment patch ───────────────────────────────────
      const patch = {
        // Enriched contact data
        email: lead.email || crawlData.primaryEmail || null,
        category: detectedCategory,
        leadScore: leadScoreResult.score,

        // Enrichment metadata (stored in enrichmentData field)
        enrichmentData: {
          crawl: {
            success: crawlData.success || false,
            title: crawlData.title || null,
            description: crawlData.description || null,
            emails: crawlData.emails || [],
            signals: crawlData.signals || [],
            fromCache: crawlData.fromCache || false,
          },
          social: socialAnalysis,
          score: leadScoreResult,
          enrichedAt: new Date().toISOString(),
        },

        enriched: true,
        enrichedAt: new Date(),
      };

      // ── Step 6: Persist to MongoDB ───────────────────────────────────────
      const updatedLead = await Lead.findByIdAndUpdate(leadId, patch, {
        new: true,
      });

      // ── Step 7: Cache enrichment result in Redis ──────────────────────────
      await cacheEnrichmentResult(leadId, patch.enrichmentData);

      // ── Step 8: Broadcast SSE update to connected frontend ───────────────
      broadcastEnrichmentUpdate(userId, jobId, {
        leadId,
        businessName: lead.businessName,
        category: detectedCategory,
        leadScore: leadScoreResult.score,
        email: patch.email,
        social: socialAnalysis,
        enrichedAt: patch.enrichedAt,
      });

      console.log(
        `✅ Enriched: ${lead.businessName} → ${detectedCategory} | ${leadScoreResult.score}`,
      );

      return {
        leadId,
        category: detectedCategory,
        score: leadScoreResult.score,
        emailFound: !!patch.email,
        socialPlatforms: socialAnalysis.platforms,
      };
    } catch (err) {
      console.error(`❌ Enrichment failed for lead ${leadId}:`, err.message);
      throw err; // BullMQ will retry based on queue config
    }
  },
  {
    connection: redisClient,
    concurrency: 3, // process 3 leads at once
  },
);

// ── Worker Event Listeners ────────────────────────────────────────────────────

enrichmentWorker.on("completed", (job, result) => {
  console.log(
    `✅ Enrichment job done: lead ${result?.leadId} → ${result?.score}`,
  );
});

enrichmentWorker.on("failed", (job, err) => {
  console.error(`❌ Enrichment job failed: ${job?.id}`, err.message);
});

enrichmentWorker.on("error", (err) => {
  console.error("❌ EnrichmentWorker error:", err.message);
});

module.exports = enrichmentWorker;
