const Job = require("../models/Job");
const { scrapingQueue } = require("../config/queue");
// Create Scraping Job
exports.createJob = async (req, res) => {
  try {
    const { keyword, location, numberOfLeads } = req.body;

    const job = new Job({
      userId: req.userId,
      keyword,
      location,
      numberOfLeads: numberOfLeads || 50,
      status: "pending",
    });

    await job.save();

    // Add job to BullMQ queue
    await scrapingQueue.add("scrape-leads", {
      jobId: job._id.toString(),
      userId: req.userId,
      keyword,
      location,
      numberOfLeads: numberOfLeads || 50,
    });

    res.status(201).json({
      message: "Job created and queued successfully",
      job,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Job Status
exports.getJobStatus = async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.jobId,
      userId: req.userId,
    });

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json({ job });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Job History
exports.getJobHistory = async (req, res) => {
  try {
    const jobs = await Job.find({ userId: req.userId }).sort({ createdAt: -1 });

    res.json({ jobs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Job
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({
      _id: req.params.jobId,
      userId: req.userId,
    });

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cancel Job
exports.cancelJob = async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.jobId,
      userId: req.userId,
    });

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (job.status === "completed" || job.status === "failed") {
      return res
        .status(400)
        .json({ error: "Cannot cancel completed or failed job" });
    }

    // Update job status to failed
    job.status = "failed";
    job.errorMessage = "Job cancelled by user";
    await job.save();

    res.json({ message: "Job cancelled successfully", job });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
