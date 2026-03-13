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

const enrichmentWorker = new Worker(
  "enrichment-jobs",
  async (job) => {
    const { leadId, jobId, userId } = job.data;

    try {
      console.log(`🔍 Enriching lead: ${leadId}`);

      const lead = await Lead.findById(leadId);
      if (!lead) {
        console.warn(`⚠️ Lead not found: ${leadId}`);
        return { skipped: true };
      }

      let crawlData = {};
      if (lead.website) {
        crawlData = await crawlWebsite(lead.website);
        console.log(
          `🌐 Crawled ${lead.website}: ${crawlData.success ? "✅" : "❌"} ${crawlData.error || ""}`,
        );
      }

      const detectedCategory = await detectCategory(
        {
          businessName: lead.businessName,
          category: lead.category,
          website: lead.website,
        },
        crawlData,
      );

      const socialAnalysis = analyzeSocialPresence(crawlData.social || {});

      const leadScoreResult = await generateLeadScore(
        lead,
        crawlData,
        socialAnalysis,
      );

      const patch = {
        email: lead.email || crawlData.primaryEmail || null,
        category: detectedCategory,
        leadScore: leadScoreResult.score,
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

      const updatedLead = await Lead.findByIdAndUpdate(leadId, patch, {
        returnDocument: "after",
      });

      await cacheEnrichmentResult(leadId, patch.enrichmentData);

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
      throw err;
    }
  },
  {
    connection: redisClient,
    concurrency: 1,
    lockDuration: 300000,
    lockRenewTime: 60000,
  },
);

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
