const Lead = require("../models/Lead");

// Convert leads to CSV format
exports.exportLeadsToCSV = async (jobId, userId, filters = {}) => {
  try {
    // Build filter
    const filter = { jobId, userId };

    if (filters.rating) filter.rating = { $gte: parseFloat(filters.rating) };
    if (filters.category) filter.category = filters.category;
    if (filters.search) {
      filter.$or = [
        { businessName: { $regex: filters.search, $options: "i" } },
        { email: { $regex: filters.search, $options: "i" } },
      ];
    }

    // Get leads
    const leads = await Lead.find(filter);

    // CSV Header
    let csv =
      "Business Name,Phone,Website,Email,Rating,Address,Category,Lead Score\n";

    // CSV Rows
    leads.forEach((lead) => {
      csv += `"${lead.businessName || ""}","${lead.phone || ""}","${lead.website || ""}","${lead.email || ""}","${lead.rating || ""}","${lead.address || ""}","${lead.category || ""}","${lead.leadScore || ""}"\n`;
    });

    return csv;
  } catch (error) {
    throw new Error("CSV export failed: " + error.message);
  }
};
