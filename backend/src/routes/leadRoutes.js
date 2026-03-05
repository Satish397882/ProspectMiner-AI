const express = require("express");
const router = express.Router();
const leadController = require("../controllers/leadController");
const auth = require("../middleware/auth");

// GET  /api/leads/:jobId         — paginated leads with filters + sorting
router.get("/:jobId", auth, leadController.getLeads);

// GET  /api/leads/:jobId/stats   — stats for filter UI + enrichment progress
router.get("/:jobId/stats", auth, leadController.getLeadStats);

// POST /api/leads/:jobId/enrich  — manually trigger enrichment
router.post("/:jobId/enrich", auth, leadController.triggerEnrichment);

// GET  /api/leads/lead/:leadId   — single lead detail
router.get("/lead/:leadId", auth, leadController.getLead);

module.exports = router;
