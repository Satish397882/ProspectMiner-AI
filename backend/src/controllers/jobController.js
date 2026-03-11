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

    const totalLeads = await Lead.countDocuments({ userId });
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

exports.getAnalytics = async (req, res) => {
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

    const totalJobs = allJobs.length;
    const completedJobs = allJobs.filter(
      (j) => j.status === "completed",
    ).length;
    const totalLeads = await Lead.countDocuments({ userId });
    const avgLeadsPerJob =
      totalJobs > 0 ? Math.round(totalLeads / totalJobs) : 0;

    // Last 7 days activity
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStr = date.toLocaleDateString("en-US", { weekday: "short" });
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayJobs = allJobs.filter((j) => {
        const created = new Date(j.createdAt || j.created_at);
        return created >= dayStart && created <= dayEnd;
      });

      const dayLeads = dayJobs.reduce((sum, j) => {
        return (
          sum +
          (j.leadsScraped || (Array.isArray(j.leads) ? j.leads.length : 0))
        );
      }, 0);

      last7Days.push({ day: dayStr, jobs: dayJobs.length, leads: dayLeads });
    }

    // Leads per job
    const leadsPerJob = allJobs.slice(0, 8).map((j) => ({
      name: (j.keyword || "Unknown").slice(0, 10),
      leads: j.leadsScraped || (Array.isArray(j.leads) ? j.leads.length : 0),
    }));

    // Top keywords
    const keywordMap = {};
    allJobs.forEach((j) => {
      const kw = j.keyword || "Unknown";
      if (!keywordMap[kw]) keywordMap[kw] = { count: 0, leads: 0 };
      keywordMap[kw].count++;
      keywordMap[kw].leads +=
        j.leadsScraped || (Array.isArray(j.leads) ? j.leads.length : 0);
    });
    const topKeywords = Object.entries(keywordMap)
      .map(([keyword, val]) => ({ keyword, ...val }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Donut data
    const activeJobs = allJobs.filter((j) =>
      ["pending", "running", "scraping"].includes(j.status),
    ).length;
    const failedJobs = allJobs.filter((j) => j.status === "failed").length;

    const donutData = [
      { name: "Completed", value: completedJobs, color: "#10b981" },
      { name: "Active", value: activeJobs, color: "#6366f1" },
      { name: "Failed", value: failedJobs, color: "#ef4444" },
    ].filter((d) => d.value > 0);

    res.json({
      summary: {
        total_jobs: totalJobs,
        completed_jobs: completedJobs,
        total_leads: totalLeads,
        avg_leads_per_job: avgLeadsPerJob,
      },
      jobs_over_time: last7Days,
      leads_per_job: leadsPerJob,
      top_keywords: topKeywords,
      donut_data: donutData,
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
