const Lead = require("../models/Lead");
const Job = require("../models/Job");
const mongoose = require("mongoose");
const { enrichmentQueue } = require("../config/queue");

exports.getLeads = async (req, res) => {
  try {
    const { jobId } = req.params;
    const {
      page = 1,
      limit = 25,
      rating,
      category,
      leadScore,
      location,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const job = await Job.findOne({ _id: jobId, userId: req.userId });
    if (!job) return res.status(404).json({ error: "Job not found" });

    const filter = { jobId, userId: req.userId };

    if (rating) filter.rating = { $gte: parseFloat(rating) };
    if (category) filter.category = category;
    if (leadScore) filter.leadScore = leadScore;
    if (location) filter.address = { $regex: location, $options: "i" };

    if (search) {
      filter.$or = [
        { businessName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    const ALLOWED_SORT = [
      "createdAt",
      "rating",
      "businessName",
      "leadScore",
      "category",
    ];
    const sortField = ALLOWED_SORT.includes(sortBy) ? sortBy : "createdAt";
    const sortDir = sortOrder === "asc" ? 1 : -1;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Lead.countDocuments(filter),
    ]);

    res.json({
      leads,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalLeads: total,
        limit: limitNum,
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getLeadStats = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.userId;

    const job = await Job.findOne({ _id: jobId, userId });
    if (!job) return res.status(404).json({ error: "Job not found" });

    // jobId ko string aur ObjectId dono se match karo
    const jobObjectId = new mongoose.Types.ObjectId(jobId);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const matchStage = {
      $or: [
        { jobId: jobId, userId: userId },
        { jobId: jobObjectId, userId: userObjectId },
        { jobId: jobId, userId: userObjectId },
        { jobId: jobObjectId, userId: userId },
      ],
    };

    const [categoryAgg, scoreAgg, ratingAgg, totalLeads, enrichedCount] =
      await Promise.all([
        Lead.aggregate([
          { $match: matchStage },
          { $group: { _id: "$category", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        Lead.aggregate([
          { $match: matchStage },
          { $group: { _id: "$leadScore", count: { $sum: 1 } } },
        ]),
        Lead.aggregate([
          { $match: { ...matchStage, rating: { $ne: null, $exists: true } } },
          {
            $group: {
              _id: null,
              avgRating: { $avg: "$rating" },
              maxRating: { $max: "$rating" },
            },
          },
        ]),
        Lead.countDocuments({ jobId, userId }),
        Lead.countDocuments({ jobId, userId, enriched: true }),
      ]);

    res.json({
      totalLeads,
      enrichedLeads: enrichedCount,
      enrichmentProgress:
        totalLeads > 0 ? Math.round((enrichedCount / totalLeads) * 100) : 0,
      categories: categoryAgg.map((c) => ({
        name: c._id || "Unknown",
        count: c.count,
      })),
      scores: {
        hot: scoreAgg.find((s) => s._id === "hot")?.count || 0,
        warm: scoreAgg.find((s) => s._id === "warm")?.count || 0,
        cold: scoreAgg.find((s) => s._id === "cold")?.count || 0,
      },
      rating: ratingAgg[0]
        ? {
            avg: Math.round(ratingAgg[0].avgRating * 10) / 10,
            max: ratingAgg[0].maxRating,
          }
        : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.triggerEnrichment = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findOne({ _id: jobId, userId: req.userId });
    if (!job) return res.status(404).json({ error: "Job not found" });

    if (job.status !== "completed") {
      return res
        .status(400)
        .json({ error: "Job must be completed before enrichment" });
    }

    const leads = await Lead.find({
      jobId,
      userId: req.userId,
      enriched: false,
    })
      .select("_id")
      .lean();

    if (leads.length === 0) {
      return res.json({ message: "All leads already enriched", queued: 0 });
    }

    const jobs = leads.map((lead, i) => ({
      name: "enrich-lead",
      data: {
        leadId: lead._id.toString(),
        jobId,
        userId: req.userId.toString(),
      },
      opts: { delay: i * 300 },
    }));

    await enrichmentQueue.addBulk(jobs);

    res.json({
      message: `Enrichment queued for ${leads.length} leads`,
      queued: leads.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getLead = async (req, res) => {
  try {
    const lead = await Lead.findOne({
      _id: req.params.leadId,
      userId: req.userId,
    });
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    res.json({ lead });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
