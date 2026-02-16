const { Worker } = require("bullmq");
const redisClient = require("../config/redis");
const Job = require("../models/Job");
const Lead = require("../models/Lead");

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

      // Simulate scraping process (Backend Dev 1 will do actual scraping)
      // For now, we'll create dummy progress updates
      for (let i = 1; i <= numberOfLeads; i++) {
        // Update progress
        const progress = Math.round((i / numberOfLeads) * 100);
        await Job.findByIdAndUpdate(jobId, {
          progress,
          leadsScraped: i,
        });

        // Simulate processing time
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Report progress to BullMQ
        await job.updateProgress(progress);
      }

      // Mark job as completed
      await Job.findByIdAndUpdate(jobId, {
        status: "completed",
        progress: 100,
      });

      console.log(`✅ Job completed: ${jobId}`);
      return { success: true, jobId };
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
    concurrency: 5, // Process 5 jobs simultaneously
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
