require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/database");

// Import Routes
const authRoutes = require("./src/routes/authRoutes");
const jobRoutes = require("./src/routes/jobRoutes");
const leadRoutes = require("./src/routes/leadRoutes");
const exportRoutes = require("./src/routes/exportRoutes");
const sseRoutes = require("./src/routes/sseRoutes");

// Import Workers
const scrapingWorker = require("./src/workers/scrapingWorker");
const enrichmentWorker = require("./src/workers/enrichmentWorker");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Test Route
app.get("/", (req, res) => {
  res.json({
    message: "ProspectMiner API is running! 🚀",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      jobs: "/api/jobs",
      leads: "/api/leads",
      export: "/api/export",
      sse: "/api/sse",
    },
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/sse", sseRoutes);

// Worker Status
console.log("🔄 Scraping worker started and listening for jobs...");
console.log("🤖 Enrichment worker started and listening for jobs...");

// Start Server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
