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
    businessName: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
    },
    website: {
      type: String,
    },
    email: {
      type: String,
    },
    rating: {
      type: Number,
    },
    address: {
      type: String,
    },
    category: {
      type: String,
    },
    leadScore: {
      type: String,
      enum: ["hot", "warm", "cold"],
      default: "warm",
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
leadSchema.index({ jobId: 1, userId: 1 });

module.exports = mongoose.model("Lead", leadSchema);
