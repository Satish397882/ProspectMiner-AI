/**
 * leadController.js — UPDATED Week 3
 *
 * New endpoints:
 *   GET  /api/leads/:jobId        — paginated, filtered, sorted leads table
 *   GET  /api/leads/:jobId/stats  — category/score breakdown for filters UI
 *   POST /api/leads/:jobId/enrich — manually trigger enrichment for all leads
 *   GET  /api/leads/lead/:leadId  — single lead detail
 */

const Lead = require("../models/Lead");
const Job = require("../models/Job");
const { enrichmentQueue } = require("../config/queue");

// ── GET /api/leads/:jobId ─────────────────────────────────────────────────────
// Supports: page, limit, rating, category, leadScore, search, sortBy, sortOrder

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

    // Verify job belongs to user
    const job = await Job.findOne({ _id: jobId, userId: req.userId });
    if (!job) return res.status(404).json({ error: "Job not found" });

    // ── Build filter ──────────────────────────────────────────────────────
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

    // ── Sort ──────────────────────────────────────────────────────────────
    const ALLOWED_SORT = [
      "createdAt",
      "rating",
      "businessName",
      "leadScore",
      "category",
    ];
    const sortField = ALLOWED_SORT.includes(sortBy) ? sortBy : "createdAt";
    const sortDir = sortOrder === "asc" ? 1 : -1;
    const sort = { [sortField]: sortDir };

    // ── Query ─────────────────────────────────────────────────────────────
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [leads, total] = await Promise.all([
      Lead.find(filter).sort(sort).skip(skip).limit(limitNum).lean(),
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
      filters: {
        rating,
        category,
        leadScore,
        location,
        search,
        sortBy,
        sortOrder,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/leads/:jobId/stats ───────────────────────────────────────────────
// Returns aggregated stats for filter dropdowns + summary cards

exports.getLeadStats = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findOne({ _id: jobId, userId: req.userId });
    if (!job) return res.status(404).json({ error: "Job not found" });

    const [categoryAgg, scoreAgg, ratingAgg, enrichedCount] = await Promise.all(
      [
        // Category breakdown
        Lead.aggregate([
          { $match: { jobId: job._id, userId: req.userId } },
          { $group: { _id: "$category", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        // Lead score breakdown
        Lead.aggregate([
          { $match: { jobId: job._id, userId: req.userId } },
          { $group: { _id: "$leadScore", count: { $sum: 1 } } },
        ]),
        // Rating distribution
        Lead.aggregate([
          {
            $match: {
              jobId: job._id,
              userId: req.userId,
              rating: { $ne: null },
            },
          },
          {
            $group: {
              _id: null,
              avgRating: { $avg: "$rating" },
              maxRating: { $max: "$rating" },
            },
          },
        ]),
        // Enriched count
        Lead.countDocuments({ jobId, userId: req.userId, enriched: true }),
      ],
    );

    const totalLeads = await Lead.countDocuments({ jobId, userId: req.userId });

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

// ── POST /api/leads/:jobId/enrich ─────────────────────────────────────────────
// Manually trigger enrichment for all un-enriched leads in a job

exports.triggerEnrichment = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findOne({ _id: jobId, userId: req.userId });
    if (!job) return res.status(404).json({ error: "Job not found" });

    // Only enrich completed jobs
    if (job.status !== "completed") {
      return res
        .status(400)
        .json({ error: "Job must be completed before enrichment" });
    }

    // Get all un-enriched leads
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

    // Queue enrichment jobs with staggered delays
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

// ── GET /api/leads/lead/:leadId ───────────────────────────────────────────────

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
