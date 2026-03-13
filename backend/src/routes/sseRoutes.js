const express = require("express");
const router = express.Router();
const sseController = require("../controllers/sseController");
const auth = require("../middleware/auth");

// GET /api/sse/:jobId/progress    — job scraping progress stream
router.get("/:jobId/progress", auth, sseController.streamJobProgress);

// GET /api/sse/:jobId/enrichment  — per-lead enrichment update stream
router.get("/:jobId/enrichment", auth, sseController.streamEnrichmentUpdates);

module.exports = router;
