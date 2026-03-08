const express = require("express");
const router = express.Router();
const jobController = require("../controllers/jobController");
const auth = require("../middleware/auth");

// POST /api/jobs - Create new scraping job
router.post("/", auth, jobController.createJob);

// GET /api/jobs/stats - Dashboard stats
router.get("/stats", auth, jobController.getDashboardStats);

// GET /api/jobs - Get job history
router.get("/", auth, jobController.getJobHistory);

// GET /api/jobs/:jobId - Get job status
router.get("/:jobId", auth, jobController.getJobStatus);

// DELETE /api/jobs/:jobId - Delete job
router.delete("/:jobId", auth, jobController.deleteJob);

// PUT /api/jobs/:jobId/cancel - Cancel job
router.put("/:jobId/cancel", auth, jobController.cancelJob);

module.exports = router;
