const express = require("express");
const router = express.Router();
const jobController = require("../controllers/jobController");
const auth = require("../middleware/auth");

router.post("/", auth, jobController.createJob);
router.get("/stats", auth, jobController.getDashboardStats);
router.get("/analytics", auth, jobController.getAnalytics);
router.get("/credits", auth, jobController.getCredits);
router.get("/", auth, jobController.getJobHistory);
router.get("/:jobId", auth, jobController.getJobStatus);
router.delete("/:jobId", auth, jobController.deleteJob);
router.put("/:jobId/cancel", auth, jobController.cancelJob);

module.exports = router;
