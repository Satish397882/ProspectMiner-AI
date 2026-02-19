const express = require("express");
const router = express.Router();
const exportController = require("../controllers/exportController");
const auth = require("../middleware/auth");

// GET /api/export/:jobId - Export leads as CSV
router.get("/:jobId", auth, exportController.exportCSV);

module.exports = router;
