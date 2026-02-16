const Job = require("../models/Job");

// Store active SSE connections
const clients = new Map();

// Stream Job Progress
exports.streamJobProgress = async (req, res) => {
  const { jobId } = req.params;
  const userId = req.userId;

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: "connected", jobId })}\n\n`);

  // Store client connection
  const clientId = `${userId}-${jobId}`;
  clients.set(clientId, res);

  // Send job updates every 2 seconds
  const interval = setInterval(async () => {
    try {
      const job = await Job.findOne({ _id: jobId, userId });

      if (!job) {
        res.write(
          `data: ${JSON.stringify({ type: "error", message: "Job not found" })}\n\n`,
        );
        clearInterval(interval);
        clients.delete(clientId);
        res.end();
        return;
      }

      // Send job status update
      res.write(
        `data: ${JSON.stringify({
          type: "update",
          job: {
            id: job._id,
            status: job.status,
            progress: job.progress,
            leadsScraped: job.leadsScraped,
            numberOfLeads: job.numberOfLeads,
          },
        })}\n\n`,
      );

      // If job is completed or failed, stop streaming
      if (job.status === "completed" || job.status === "failed") {
        res.write(`data: ${JSON.stringify({ type: "done", job })}\n\n`);
        clearInterval(interval);
        clients.delete(clientId);
        res.end();
      }
    } catch (error) {
      res.write(
        `data: ${JSON.stringify({ type: "error", message: error.message })}\n\n`,
      );
      clearInterval(interval);
      clients.delete(clientId);
      res.end();
    }
  }, 2000);

  // Clean up on client disconnect
  req.on("close", () => {
    clearInterval(interval);
    clients.delete(clientId);
  });
};

module.exports.clients = clients;
