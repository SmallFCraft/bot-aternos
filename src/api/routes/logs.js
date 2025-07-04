// src/api/routes/logs.js - Logging API Routes
const express = require("express");
const router = express.Router();

module.exports = botManager => {
  // Get recent logs from all bots
  router.get("/recent", (req, res) => {
    try {
      const maxLines = parseInt(req.query.lines) || 100;
      const allLogs = [];

      // Collect logs from all bots
      for (const [botId, bot] of botManager.bots) {
        try {
          const botLogs = bot.logger.getRecentLogs(Math.min(maxLines, 50)); // Limit per bot
          botLogs.forEach(log => {
            allLogs.push({
              ...log,
              botId: botId,
              botName: bot.config.name,
              shortId: botId.slice(0, 8),
            });
          });
        } catch (error) {
          console.error(`Error reading logs for bot ${botId}:`, error.message);
          // Add error log entry
          allLogs.push({
            timestamp: new Date().toISOString(),
            message: `Failed to read logs: ${error.message}`,
            type: "error",
            source: "system",
            botId: botId,
            botName: bot.config.name,
            shortId: botId.slice(0, 8),
          });
        }
      }

      // Add system logs if available
      try {
        const systemLogs = [
          {
            timestamp: new Date().toISOString(),
            message: `System status: ${botManager.bots.size} bots configured`,
            type: "info",
            source: "system",
            botId: null,
            botName: "System",
            shortId: "system",
          },
        ];
        allLogs.push(...systemLogs);
      } catch (error) {
        console.error("Error adding system logs:", error.message);
      }

      // Sort by timestamp (newest first)
      allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Limit total results
      const limitedLogs = allLogs.slice(0, maxLines);

      res.json({
        success: true,
        logs: limitedLogs,
        total: limitedLogs.length,
        totalBots: botManager.bots.size,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // Server-Sent Events for real-time logs
  router.get("/stream", (req, res) => {
    // Set headers for SSE
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    });

    // Send initial connection message
    res.write(
      `data: ${JSON.stringify({
        timestamp: new Date().toISOString(),
        message: "Connected to live log stream",
        type: "info",
        source: "system",
      })}\n\n`
    );

    // Create broadcaster function
    const broadcaster = logEntry => {
      try {
        res.write(`data: ${JSON.stringify(logEntry)}\n\n`);
      } catch (error) {
        // Client disconnected, remove broadcaster
        botManager.removeLogBroadcaster(broadcaster);
      }
    };

    // Add broadcaster to manager
    botManager.addLogBroadcaster(broadcaster);

    // Handle client disconnect
    req.on("close", () => {
      botManager.removeLogBroadcaster(broadcaster);
    });

    req.on("aborted", () => {
      botManager.removeLogBroadcaster(broadcaster);
    });
  });

  // Clear all logs
  router.post("/clear", (req, res) => {
    try {
      let clearedCount = 0;
      let failedCount = 0;

      // Clear logs for all bots
      for (const [botId, bot] of botManager.bots) {
        const success = bot.logger.clearLogs();
        if (success) {
          clearedCount++;
        } else {
          failedCount++;
        }
      }

      botManager.broadcastLog(
        `🗑️ Logs cleared for ${clearedCount} bots`,
        "info"
      );

      res.json({
        success: true,
        message: `Logs cleared for ${clearedCount} bots`,
        cleared: clearedCount,
        failed: failedCount,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // Get log statistics
  router.get("/stats", (req, res) => {
    try {
      const stats = {
        totalBots: botManager.bots.size,
        logFiles: [],
        totalSize: 0,
        totalLines: 0,
      };

      // Collect stats from all bot logs
      for (const [botId, bot] of botManager.bots) {
        const logStats = bot.logger.getLogStats();
        stats.logFiles.push({
          botId: botId,
          botName: bot.config.name,
          ...logStats,
        });

        if (logStats.exists) {
          stats.totalSize += logStats.size;
          stats.totalLines += logStats.lines;
        }
      }

      res.json({
        success: true,
        stats: stats,
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
