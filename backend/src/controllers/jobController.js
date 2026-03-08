const Job = require("../models/Job");
const Lead = require("../models/Lead");
const mongoose = require("mongoose");
const { scrapingQueue } = require("../config/queue");

exports.createJob = async (req, res) => {
  try {
    const { keyword, location, numberOfLeads } = req.body;
    console.log("📝 Creating job:", {
      keyword,
      location,
      numberOfLeads,
      userId: req.userId,
    });

    const job = new Job({
      userId: req.userId,
      keyword,
      location,
      numberOfLeads: numberOfLeads || 50,
      status: "pending",
    });

    await job.save();
    console.log("✅ Job saved:", job._id);

    await scrapingQueue.add("scrape-leads", {
      jobId: job._id.toString(),
      userId: req.userId,
      keyword,
      location,
      numberOfLeads: numberOfLeads || 50,
    });

    console.log("✅ Job queued:", job._id);
    res
      .status(201)
      .json({ message: "Job created and queued successfully", job });
  } catch (error) {
    console.error("❌ createJob error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getJobStatus = async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.jobId,
      userId: req.userId,
    });
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json({ job });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getJobHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const db = mongoose.connection.db;
    const jobsCollection = db.collection("jobs");

    const allJobs = await jobsCollection
      .find({
        $or: [
          { userId: new mongoose.Types.ObjectId(userId) },
          { user_id: userId },
        ],
      })
      .sort({ createdAt: -1, created_at: -1 })
      .toArray();

    const normalized = allJobs.map((job) => ({
      _id: job._id?.toString(),
      keyword: job.keyword || "Unknown",
      location: job.location || "Unknown",
      status: job.status || "unknown",
      progress: job.progress || 0,
      numberOfLeads: job.numberOfLeads || job.requested_leads || 0,
      leadsScraped:
        job.leadsScraped || (Array.isArray(job.leads) ? job.leads.length : 0),
      createdAt: job.createdAt || job.created_at || null,
      source: job.user_id ? "python" : "node",
      navigateId: job.user_id ? job.job_id : job._id?.toString(),
    }));

    res.json({ jobs: normalized });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.userId;
    const db = mongoose.connection.db;
    const jobsCollection = db.collection("jobs");

    const allJobs = await jobsCollection
      .find({
        $or: [
          { userId: new mongoose.Types.ObjectId(userId) },
          { user_id: userId },
        ],
      })
      .toArray();

    const totalJobs = allJobs.length;
    const completedJobs = allJobs.filter(
      (j) => j.status === "completed",
    ).length;
    const activeJobs = allJobs.filter((j) =>
      ["pending", "running", "scraping"].includes(j.status),
    ).length;
    const failedJobs = allJobs.filter((j) => j.status === "failed").length;

    const leadsFromCollection = await Lead.countDocuments({ userId });

    let pythonLeadsCount = 0;
    for (const job of allJobs) {
      if (job.user_id && Array.isArray(job.leads)) {
        pythonLeadsCount += job.leads.length;
      }
    }

    const totalLeads = leadsFromCollection + pythonLeadsCount;
    const successRate =
      totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;

    res.json({
      total_leads: totalLeads,
      active_jobs: activeJobs,
      completed_jobs: completedJobs,
      failed_jobs: failedJobs,
      total_jobs: totalJobs,
      success_rate: successRate,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({
      _id: req.params.jobId,
      userId: req.userId,
    });
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.cancelJob = async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.jobId,
      userId: req.userId,
    });
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (job.status === "completed" || job.status === "failed") {
      return res
        .status(400)
        .json({ error: "Cannot cancel completed or failed job" });
    }
    job.status = "failed";
    job.errorMessage = "Job cancelled by user";
    await job.save();
    res.json({ message: "Job cancelled successfully", job });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
