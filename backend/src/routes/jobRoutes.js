const express = require("express");
const router = express.Router();
const jobController = require("../controllers/jobController");
const auth = require("../middleware/auth");

// All routes are protected with auth middleware
router.use(auth);

// POST /api/jobs - Create new scraping job
router.post("/", jobController.createJob);

// GET /api/jobs/:jobId - Get job status
router.get("/:jobId", jobController.getJobStatus);

// GET /api/jobs - Get job history
router.get("/", jobController.getJobHistory);

// DELETE /api/jobs/:jobId - Delete job
router.delete("/:jobId", jobController.deleteJob);

// PUT /api/jobs/:jobId/cancel - Cancel job
router.put("/:jobId/cancel", jobController.cancelJob);

module.exports = router;
