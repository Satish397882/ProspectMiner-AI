const Job = require("../models/Job");
const { exportLeadsToCSV } = require("../utils/csvExport");

// Export Leads as CSV
exports.exportCSV = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { rating, category, search } = req.query;

    // Verify job belongs to user
    const job = await Job.findOne({ _id: jobId, userId: req.userId });
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Build filters
    const filters = {};
    if (rating) filters.rating = rating;
    if (category) filters.category = category;
    if (search) filters.search = search;

    // Generate CSV
    const csv = await exportLeadsToCSV(jobId, req.userId, filters);

    // Set headers for download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="leads-${jobId}.csv"`,
    );

    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
