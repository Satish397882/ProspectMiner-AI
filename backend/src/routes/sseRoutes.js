const express = require("express");
const router = express.Router();
const sseController = require("../controllers/sseController");
const auth = require("../middleware/auth");

// All routes are protected
router.use(auth);

// GET /api/sse/job/:jobId - Stream job progress
router.get("/job/:jobId", sseController.streamJobProgress);

module.exports = router;
