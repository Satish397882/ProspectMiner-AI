const express = require("express");
const router = express.Router();
const leadController = require("../controllers/leadController");
const auth = require("../middleware/auth");

// GET /api/leads/:jobId - Get all leads for a job
router.get("/:jobId", auth, leadController.getLeads);

// GET /api/leads/single/:leadId - Get single lead
router.get("/single/:leadId", auth, leadController.getLead);

module.exports = router;
