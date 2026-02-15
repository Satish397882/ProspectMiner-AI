const Lead = require("../models/Lead");
const Job = require("../models/Job");

// Get Leads for a Job
exports.getLeads = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { page = 1, limit = 50, rating, category, search } = req.query;

    // Verify job belongs to user
    const job = await Job.findOne({ _id: jobId, userId: req.userId });
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Build filter
    const filter = { jobId, userId: req.userId };

    if (rating) filter.rating = { $gte: parseFloat(rating) };
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { businessName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Get leads with pagination
    const leads = await Lead.find(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Lead.countDocuments(filter);

    res.json({
      leads,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalLeads: count,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Single Lead
exports.getLead = async (req, res) => {
  try {
    const lead = await Lead.findOne({
      _id: req.params.leadId,
      userId: req.userId,
    });

    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    res.json({ lead });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
