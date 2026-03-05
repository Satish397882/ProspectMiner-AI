/**
 * sseController.js — UPDATED Week 3, Day 5
 *
 * Manages Server-Sent Events for:
 *   1. Job progress (scraping) — existing
 *   2. Enrichment updates (new) — real-time per-lead enrichment results
 *
 * Architecture:
 *   - clients Map: userId → { res, jobId }
 *   - broadcastJobProgress(userId, data) — called by scrapingWorker
 *   - broadcastEnrichmentUpdate(userId, jobId, data) — called by enrichmentWorker
 */

const Job = require("../models/Job");

// ── SSE Client Store ──────────────────────────────────────────────────────────
// Map<clientKey, res>  where clientKey = `${userId}-${jobId}`
const clients = new Map();

// ── SSE Helper ────────────────────────────────────────────────────────────────

function sendSSE(res, data) {
  try {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  } catch (e) {
    // Client disconnected mid-write — ignore
  }
}

// ── Stream Job Progress ───────────────────────────────────────────────────────

exports.streamJobProgress = async (req, res) => {
  const { jobId } = req.params;
  const userId = req.userId;

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering
  res.flushHeaders();

  // Initial handshake
  sendSSE(res, { type: "connected", jobId });

  // Register client
  const clientKey = `${userId}-${jobId}`;
  clients.set(clientKey, res);
  console.log(`📡 SSE client connected: ${clientKey} (total: ${clients.size})`);

  // Poll MongoDB every 2s as fallback (workers also push directly)
  const interval = setInterval(async () => {
    try {
      const job = await Job.findOne({ _id: jobId, userId });
      if (!job) {
        sendSSE(res, { type: "error", message: "Job not found" });
        cleanup();
        return;
      }

      sendSSE(res, {
        type: "update",
        job: {
          id: job._id,
          status: job.status,
          progress: job.progress,
          leadsScraped: job.leadsScraped,
          numberOfLeads: job.numberOfLeads,
        },
      });

      if (job.status === "completed" || job.status === "failed") {
        sendSSE(res, { type: "done", job });
        cleanup();
      }
    } catch (err) {
      sendSSE(res, { type: "error", message: err.message });
      cleanup();
    }
  }, 2000);

  function cleanup() {
    clearInterval(interval);
    clients.delete(clientKey);
    try {
      res.end();
    } catch {}
    console.log(
      `📡 SSE client disconnected: ${clientKey} (total: ${clients.size})`,
    );
  }

  req.on("close", cleanup);
};

// ── Stream Enrichment Updates ─────────────────────────────────────────────────
// Separate SSE endpoint for enrichment progress on the Leads page

exports.streamEnrichmentUpdates = async (req, res) => {
  const { jobId } = req.params;
  const userId = req.userId;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  sendSSE(res, { type: "connected", jobId, channel: "enrichment" });

  const clientKey = `enrichment-${userId}-${jobId}`;
  clients.set(clientKey, res);
  console.log(`🔍 Enrichment SSE connected: ${clientKey}`);

  // Keep-alive ping every 25s to prevent timeout
  const pingInterval = setInterval(() => {
    try {
      res.write(": ping\n\n");
    } catch {}
  }, 25000);

  function cleanup() {
    clearInterval(pingInterval);
    clients.delete(clientKey);
    try {
      res.end();
    } catch {}
  }

  req.on("close", cleanup);
};

// ── Broadcast Helpers (called by workers) ────────────────────────────────────

/**
 * Push job progress update to connected SSE client
 */
function broadcastJobProgress(userId, data) {
  // Find all clients for this user (any active job)
  for (const [key, res] of clients.entries()) {
    if (key.startsWith(`${userId}-`) && !key.startsWith(`enrichment-`)) {
      sendSSE(res, data);
    }
  }
}

/**
 * Push enrichment update to connected SSE client
 */
function broadcastEnrichmentUpdate(userId, jobId, enrichmentData) {
  const clientKey = `enrichment-${userId}-${jobId}`;
  const res = clients.get(clientKey);
  if (res) {
    sendSSE(res, {
      type: "enrichment_update",
      data: enrichmentData,
    });
  }
}

exports.broadcastJobProgress = broadcastJobProgress;
exports.broadcastEnrichmentUpdate = broadcastEnrichmentUpdate;
exports.clients = clients;
