const Job = require("../models/Job");

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

    // TODO: Add job to BullMQ queue (Week 2)

    res.status(201).json({
      message: "Job created successfully",
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
