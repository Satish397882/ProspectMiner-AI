const express = require("express");
const router = express.Router();
const exportController = require("../controllers/exportController");
const auth = require("../middleware/auth");

// All routes are protected
router.use(auth);

// GET /api/export/:jobId - Export leads as CSV
router.get("/:jobId", exportController.exportCSV);

module.exports = router;
