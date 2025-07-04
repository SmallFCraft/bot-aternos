// src/api/routes/betterstack.js - Better Stack API Routes
const express = require("express");
const router = express.Router();

module.exports = botManager => {
  // Get Better Stack status
  router.get("/status", (req, res) => {
    try {
      const status = botManager.getBetterStackStatus();
      const config = botManager.getBetterStackConfig();

      res.json({
        success: true,
        enabled: status.enabled,
        lastHeartbeat: status.lastHeartbeat,
        statistics: status.statistics,
        config: {
          heartbeatUrl: config.heartbeatUrl,
          interval: config.interval,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // Setup Better Stack monitoring
  router.post("/setup", async (req, res) => {
    try {
      const { heartbeatUrl, interval } = req.body;

      if (!heartbeatUrl) {
        return res.status(400).json({
          success: false,
          error: "Heartbeat URL is required",
        });
      }

      // Setup Better Stack
      const result = await botManager.setupBetterStack(heartbeatUrl);

      if (result.success) {
        // Update interval if provided
        if (interval && interval >= 30000) {
          botManager.updateBetterStackInterval(interval);
        }

        res.json({
          success: true,
          message: "Better Stack monitoring enabled successfully",
          status: botManager.getBetterStackStatus(),
        });
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // Disable Better Stack monitoring
  router.post("/disable", (req, res) => {
    try {
      botManager.disableBetterStack();
      res.json({
        success: true,
        message: "Better Stack monitoring disabled",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // Update heartbeat interval
  router.put("/interval", (req, res) => {
    try {
      const { interval } = req.body;

      if (!interval || interval < 30000) {
        return res.status(400).json({
          success: false,
          error: "Interval must be at least 30 seconds (30000ms)",
        });
      }

      botManager.updateBetterStackInterval(interval);

      res.json({
        success: true,
        message: `Heartbeat interval updated to ${interval / 1000} seconds`,
        status: botManager.getBetterStackStatus(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // Test heartbeat (manual trigger)
  router.post("/test", async (req, res) => {
    try {
      const status = botManager.getBetterStackStatus();

      if (!status.enabled || !status.heartbeatUrl) {
        return res.status(400).json({
          success: false,
          error: "Better Stack monitoring is not configured",
        });
      }

      // Trigger manual heartbeat
      const result = await botManager.betterStack.sendHeartbeat();

      if (result.success) {
        res.json({
          success: true,
          message: "Test heartbeat sent successfully",
          response: result.response,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // Get heartbeat history
  router.get("/history", (req, res) => {
    try {
      const history = botManager.betterStack.getHeartbeatHistory();
      res.json({
        success: true,
        history: history,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  return router;
};
