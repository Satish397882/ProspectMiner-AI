/**
 * validate.js — Request validation middleware (Week 3, Day 5)
 */

// ── Lead query validator ───────────────────────────────────────────────────────

exports.validateLeadQuery = (req, res, next) => {
  const { page, limit, rating, sortBy, sortOrder } = req.query;

  if (page && (isNaN(page) || parseInt(page) < 1)) {
    return res.status(400).json({ error: "page must be a positive integer" });
  }

  if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    return res.status(400).json({ error: "limit must be between 1 and 100" });
  }

  if (
    rating &&
    (isNaN(rating) || parseFloat(rating) < 0 || parseFloat(rating) > 5)
  ) {
    return res.status(400).json({ error: "rating must be between 0 and 5" });
  }

  const ALLOWED_SORT = [
    "createdAt",
    "rating",
    "businessName",
    "leadScore",
    "category",
  ];
  if (sortBy && !ALLOWED_SORT.includes(sortBy)) {
    return res
      .status(400)
      .json({ error: `sortBy must be one of: ${ALLOWED_SORT.join(", ")}` });
  }

  if (sortOrder && !["asc", "desc"].includes(sortOrder)) {
    return res.status(400).json({ error: "sortOrder must be asc or desc" });
  }

  next();
};

// ── Job creation validator ────────────────────────────────────────────────────

exports.validateCreateJob = (req, res, next) => {
  const { keyword, location, numberOfLeads } = req.body;

  if (!keyword || typeof keyword !== "string" || keyword.trim().length < 2) {
    return res
      .status(400)
      .json({ error: "keyword must be at least 2 characters" });
  }

  if (!location || typeof location !== "string" || location.trim().length < 2) {
    return res
      .status(400)
      .json({ error: "location must be at least 2 characters" });
  }

  if (numberOfLeads !== undefined) {
    const n = parseInt(numberOfLeads);
    if (isNaN(n) || n < 1 || n > 500) {
      return res
        .status(400)
        .json({ error: "numberOfLeads must be between 1 and 500" });
    }
  }

  // Sanitize
  req.body.keyword = keyword.trim();
  req.body.location = location.trim();

  next();
};
