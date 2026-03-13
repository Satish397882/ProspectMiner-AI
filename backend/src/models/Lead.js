const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ── Core scraped fields ─────────────────────────────────────────────────
    businessName: { type: String, required: true },
    phone: { type: String, default: null },
    website: { type: String, default: null },
    email: { type: String, default: null },
    rating: { type: Number, default: null },
    address: { type: String, default: null },
    category: { type: String, default: null },

    // ── AI Lead Score ───────────────────────────────────────────────────────
    leadScore: {
      type: String,
      enum: ["hot", "warm", "cold"],
      default: "warm",
    },

    // ── Week 3: Enrichment fields ───────────────────────────────────────────
    enriched: { type: Boolean, default: false },
    enrichedAt: { type: Date, default: null },

    enrichmentData: {
      crawl: {
        success: Boolean,
        title: String,
        description: String,
        emails: [String],
        signals: [String],
        fromCache: Boolean,
      },
      social: {
        platforms: [String],
        platformCount: Number,
        hasPresence: Boolean,
        socialScore: Number,
        hasFacebook: Boolean,
        hasInstagram: Boolean,
        hasLinkedIn: Boolean,
      },
      score: {
        score: String,
        reason: String,
        confidence: Number,
        method: String,
      },
      enrichedAt: String,
    },
  },
  { timestamps: true },
);

// ── Indexes ───────────────────────────────────────────────────────────────────
leadSchema.index({ jobId: 1, userId: 1 });
leadSchema.index({ userId: 1, leadScore: 1 });
leadSchema.index({ userId: 1, category: 1 });
leadSchema.index({ userId: 1, rating: -1 });
leadSchema.index({ enriched: 1 });

module.exports = mongoose.model("Lead", leadSchema);
