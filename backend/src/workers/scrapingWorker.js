const { Worker } = require("bullmq");
const redisClient = require("../config/redis");
const Job = require("../models/Job");
const Lead = require("../models/Lead");
const axios = require("axios");

// Python FastAPI server URL
const PYTHON_API_URL = "http://127.0.0.1:8000";

// Create Worker
const scrapingWorker = new Worker(
  "scraping-jobs",
  async (job) => {
    const { jobId, userId, keyword, location, numberOfLeads } = job.data;

    try {
      console.log(`🔄 Processing job: ${jobId}`);

      // Update job status to running
      await Job.findByIdAndUpdate(jobId, {
        status: "running",
        progress: 0,
      });

      // ✅ CALL PYTHON SCRAPER
      console.log(`📡 Calling Python scraper...`);

      const response = await axios.post(`${PYTHON_API_URL}/scrape`, {
        keyword,
        location,
        count: numberOfLeads,
      });

      const scrapedLeads = response.data.leads || [];
      console.log(`✅ Scraped ${scrapedLeads.length} leads from Python`);

      // Save leads to MongoDB
      for (let i = 0; i < scrapedLeads.length; i++) {
        const leadData = scrapedLeads[i];

        await Lead.create({
          jobId,
          userId,
          businessName: leadData.name || "Unknown",
          phone: leadData.phone,
          website: leadData.website,
          email: leadData.email,
          rating: leadData.rating,
          address: leadData.address,
          category: leadData.category,
          leadScore: leadData.score || "warm",
        });

        // Update progress
        const progress = Math.round(((i + 1) / numberOfLeads) * 100);
        await Job.findByIdAndUpdate(jobId, {
          progress,
          leadsScraped: i + 1,
        });

        await job.updateProgress(progress);
      }

      // Mark job as completed
      await Job.findByIdAndUpdate(jobId, {
        status: "completed",
        progress: 100,
      });

      console.log(`✅ Job completed: ${jobId}`);
      return { success: true, jobId, leadsCount: scrapedLeads.length };
    } catch (error) {
      console.error(`❌ Job failed: ${jobId}`, error.message);

      // Mark job as failed
      await Job.findByIdAndUpdate(jobId, {
        status: "failed",
        errorMessage: error.message,
      });

      throw error;
    }
  },
  {
    connection: redisClient,
    concurrency: 5,
  },
);

// Worker event listeners
scrapingWorker.on("completed", (job) => {
  console.log(`✅ Worker completed job: ${job.id}`);
});

scrapingWorker.on("failed", (job, err) => {
  console.error(`❌ Worker failed job: ${job?.id}`, err.message);
});

scrapingWorker.on("error", (error) => {
  console.error("❌ Worker error:", error.message);
});

module.exports = scrapingWorker;
