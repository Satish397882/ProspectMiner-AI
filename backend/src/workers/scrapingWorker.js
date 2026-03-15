const { Worker } = require("bullmq");
const redisClient = require("../config/redis");
const { cacheJobProgress, deleteJobProgressCache } = require("../config/redis");
const { enrichmentQueue } = require("../config/queue");
const Job = require("../models/Job");
const Lead = require("../models/Lead");
const User = require("../models/User");
const axios = require("axios");
const { broadcastJobProgress } = require("../controllers/sseController");

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://127.0.0.1:8000";

const scrapingWorker = new Worker(
  "scraping-jobs",
  async (job) => {
    const { jobId, userId, keyword, location, numberOfLeads } = job.data;

    try {
      console.log("🔄 Processing job: " + jobId);

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

      console.log(
        "📡 Calling Python scraper for " + keyword + " in " + location,
      );

      const response = await axios.post(
        PYTHON_API_URL + "/scrape/",
        { keyword, location, count: numberOfLeads },
        { timeout: 30000 },
      );

      const pythonJobId = response.data.job_id;
      console.log("🐍 Python job started: " + pythonJobId);

      var scrapedLeads = [];
      var attempts = 0;
      var maxAttempts = 300;

      while (attempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, 3000));

        // Retry logic — ECONNRESET handle karo
        let statusData;
        let retries = 3;
        while (retries > 0) {
          try {
            const statusRes = await axios.get(
              PYTHON_API_URL + "/scrape/" + pythonJobId,
              { timeout: 15000, headers: { Authorization: "Bearer internal" } },
            );
            statusData = statusRes.data;
            break;
          } catch (err) {
            retries--;
            console.log(
              `⚠️ Poll error (${err.message}), retries left: ${retries}`,
            );
            if (retries === 0) {
              statusData = { status: "scraping", leads: [] };
            } else {
              await new Promise((r) => setTimeout(r, 2000));
            }
          }
        }

        const leadsScraped = statusData.leads ? statusData.leads.length : 0;
        const progress =
          statusData.status === "completed"
            ? 100
            : numberOfLeads > 0
              ? Math.min(
                  99,
                  Math.round(20 + (leadsScraped / numberOfLeads) * 79),
                )
              : 20;

        console.log(
          "📊 Python job status: " +
            statusData.status +
            " | leads: " +
            leadsScraped +
            " | progress: " +
            progress +
            "%",
        );

        await Job.findByIdAndUpdate(jobId, { progress, leadsScraped });
        await cacheJobProgress(jobId, {
          status: "running",
          progress,
          leadsScraped,
          numberOfLeads,
        });

        broadcastJobProgress(userId, {
          type: "update",
          job: {
            id: jobId,
            status: "running",
            progress,
            leadsScraped,
            numberOfLeads,
          },
        });

        if (statusData.status === "completed") {
          scrapedLeads = statusData.leads || [];
          break;
        }

        if (statusData.status === "failed" || statusData.status === "error") {
          throw new Error("Python scraper failed");
        }

        attempts++;
      }

      if (attempts >= maxAttempts) {
        console.log("⚠️ Max attempts reached, fetching final leads...");
        try {
          const finalRes = await axios.get(
            PYTHON_API_URL + "/scrape/" + pythonJobId,
            { timeout: 15000, headers: { Authorization: "Bearer internal" } },
          );
          scrapedLeads = finalRes.data.leads || [];
        } catch (e) {
          console.error("❌ Final fetch failed:", e.message);
        }
      }

      console.log("✅ Scraped " + scrapedLeads.length + " leads from Python");

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

      var enrichmentJobs = [];

      for (var i = 0; i < scrapedLeads.length; i++) {
        const leadData = scrapedLeads[i];

        const lead = await Lead.findOneAndUpdate(
          {
            jobId,
            businessName: leadData.name || "Unknown",
            phone: leadData.phone || null,
          },
          {
            $setOnInsert: {
              jobId,
              userId,
              businessName: leadData.name || "Unknown",
              phone: leadData.phone || null,
              website: leadData.website || null,
              email: leadData.email || null,
              rating: leadData.rating ? parseFloat(leadData.rating) : null,
              address: leadData.address || null,
              category: leadData.category || null,
              leadScore: "warm",
              enriched: false,
            },
          },
          { upsert: true, returnDocument: "after" },
        );

        enrichmentJobs.push({
          name: "enrich-lead",
          data: { leadId: lead._id.toString(), jobId, userId },
          opts: { delay: i * 2000 },
        });

        const progress = Math.round(((i + 1) / scrapedLeads.length) * 100);
        await Job.findByIdAndUpdate(jobId, { progress, leadsScraped: i + 1 });
        await cacheJobProgress(jobId, {
          status: "running",
          progress,
          leadsScraped: i + 1,
          numberOfLeads,
        });
        await job.updateProgress(progress);

        broadcastJobProgress(userId, {
          type: "update",
          job: {
            id: jobId,
            status: "running",
            progress,
            leadsScraped: i + 1,
            numberOfLeads,
          },
        });
      }

      await enrichmentQueue.addBulk(enrichmentJobs);
      console.log("📬 Queued " + enrichmentJobs.length + " enrichment jobs");

      // Credits deduct
      await User.findByIdAndUpdate(userId, {
        $inc: { credits: -scrapedLeads.length },
      });
      console.log(
        "💳 Deducted " + scrapedLeads.length + " credits from user " + userId,
      );

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
        "✅ Job completed: " +
          jobId +
          " | " +
          scrapedLeads.length +
          " leads | " +
          enrichmentJobs.length +
          " enrichments queued",
      );
      return { success: true, jobId, leadsCount: scrapedLeads.length };
    } catch (error) {
      console.error("❌ Job failed: " + jobId, error.message);

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
  { connection: redisClient, concurrency: 5 },
);

scrapingWorker.on("completed", (job) =>
  console.log("✅ Worker completed job: " + job.id),
);
scrapingWorker.on("failed", (job, err) =>
  console.error(
    "❌ Worker failed job: " + (job ? job.id : "unknown"),
    err.message,
  ),
);
scrapingWorker.on("error", (err) =>
  console.error("❌ Worker error:", err.message),
);

module.exports = scrapingWorker;
