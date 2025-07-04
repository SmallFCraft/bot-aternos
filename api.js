// api.js - Express API Routes (Ultra Simplified)
const express = require("express");
const config = require("./config");

class BotAPI {
  constructor(bot, logger, broadcastLog) {
    this.bot = bot;
    this.logger = logger;
    this.broadcastLog = broadcastLog;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.static("public"));
  }

  setupRoutes() {
    // Helper function to format uptime
    const formatUptime = seconds => {
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;

      if (days > 0) return `${days}d ${hours}h ${minutes}m`;
      else if (hours > 0) return `${hours}h ${minutes}m`;
      else if (minutes > 0) return `${minutes}m ${secs}s`;
      else return `${secs}s`;
    };

    // Main status endpoint (simplified)
    this.app.get("/", (req, res) => {
      const botStatus = this.bot.getStatus();

      res.json({
        status: "Aternos Bedrock Keep-Alive Bot (Ultra Simplified)",
        server: `${this.bot.serverConfig.host}:${this.bot.serverConfig.port}`,
        botStatus: botStatus,
        serverInfo: this.bot.serverConfig,
        antiAfk: {
          enabled: config.antiAfk.enabled,
          active: botStatus.antiAfkActive,
          interval: config.antiAfk.interval / 1000 + "s",
          range: config.antiAfk.movementRange + " blocks",
        },
        compliance: {
          aternosPolicy: "⚠️ WARNING: This bot may violate Aternos ToS",
          recommendation: "Consider switching to bot-friendly hosting",
          riskLevel: "MEDIUM",
        },
      });
    });

    // Health check endpoint
    this.app.get("/health", (req, res) => {
      const botStatus = this.bot.getStatus();

      res.status(botStatus.connected ? 200 : 503).json({
        status: botStatus.connected ? "healthy" : "unhealthy",
        timestamp: new Date().toISOString(),
        uptime: formatUptime(botStatus.uptime),
        mode: "Ultra Simplified Keep-Alive",
      });
    });

    // Restart bot endpoint
    this.app.get("/restart", (req, res) => {
      res.json({
        message: "Restarting bot...",
        timestamp: new Date().toISOString(),
      });
      this.broadcastLog("Manual restart triggered via API", "warn");
      this.bot.restart();
    });

    // Basic statistics
    this.app.get("/stats", (req, res) => {
      const botStatus = this.bot.getStatus();

      res.json({
        botStatus: botStatus,
        serverConfig: this.bot.serverConfig,
        betterStackEnabled: config.monitoring.betterStack.enabled,
        mode: "Ultra Simplified Keep-Alive",
        complianceWarning: "⚠️ This bot may violate Aternos Terms of Service",
        antiAfkConfig: config.antiAfk,
      });
    });

    // Anti-AFK control endpoints (simplified)
    this.app.post("/anti-afk/start", (req, res) => {
      if (!this.bot.status.hasSpawned) {
        return res.status(400).json({
          error: "Bot not spawned yet",
          message: "Wait for bot to spawn before starting anti-AFK",
        });
      }

      if (this.bot.status.antiAfk.active) {
        return res.json({
          message: "Anti-AFK already active",
          status: "already_running",
        });
      }

      this.bot.startAntiAfk();
      res.json({
        message: "Anti-AFK started",
        status: "started",
        interval: config.antiAfk.interval / 1000 + "s",
      });
    });

    this.app.post("/anti-afk/stop", (req, res) => {
      if (!this.bot.status.antiAfk.active) {
        return res.json({
          message: "Anti-AFK not active",
          status: "already_stopped",
        });
      }

      this.bot.stopAntiAfk();
      res.json({
        message: "Anti-AFK stopped",
        status: "stopped",
      });
    });

    // Simple manual movement endpoint
    this.app.post("/manual-move", (req, res) => {
      const { x, y, z } = req.body;

      if (!this.bot.status.hasSpawned) {
        return res.status(400).json({
          error: "Bot not spawned yet",
          message: "Wait for bot to spawn before manual movement",
        });
      }

      if (
        typeof x !== "number" ||
        typeof y !== "number" ||
        typeof z !== "number"
      ) {
        return res.status(400).json({
          error: "Invalid coordinates",
          message: "x, y, z must be numbers",
          example: { x: 0, y: 64, z: 0 },
        });
      }

      try {
        const result = this.bot.manualMove(x, y, z);
        res.json({
          message: "Manual movement command sent",
          position: result.position,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        res.status(500).json({
          error: "Movement failed",
          message: error.message,
        });
      }
    });

    // Simple Better Stack setup endpoint
    this.app.post("/setup-betterstack", (req, res) => {
      const { heartbeatUrl } = req.body;

      if (
        !heartbeatUrl ||
        !heartbeatUrl.includes("betterstack.com/api/v1/heartbeat/")
      ) {
        return res.status(400).json({
          error: "Invalid heartbeat URL format",
          expected: "https://betterstack.com/api/v1/heartbeat/YOUR_KEY",
        });
      }

      // Update runtime configuration
      config.monitoring.betterStack.heartbeatUrl = heartbeatUrl;
      config.monitoring.betterStack.enabled = true;

      this.broadcastLog("Better Stack monitoring enabled", "info");

      res.json({
        success: true,
        enabled: true,
        heartbeatUrl: heartbeatUrl,
        interval: config.monitoring.betterStack.heartbeatInterval / 1000 + "s",
        message: "🟢 Better Stack monitoring is now ACTIVE!",
      });
    });

    // Better Stack status endpoint
    this.app.get("/betterstack-status", (req, res) => {
      res.json({
        enabled: config.monitoring.betterStack.enabled,
        heartbeatUrl: config.monitoring.betterStack.heartbeatUrl
          ? "✅ Configured"
          : "❌ Not Set",
        interval: config.monitoring.betterStack.heartbeatInterval / 1000 + "s",
      });
    });

    // Basic log endpoints
    this.app.get("/logs/recent", (req, res) => {
      try {
        const maxLines = parseInt(req.query.lines) || 100;
        const logs = this.logger.getRecentLogs(maxLines);
        res.json({
          logs: logs,
          total: logs.length,
          maxLines: maxLines,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        res.status(500).json({
          error: "Failed to read logs",
          message: error.message,
        });
      }
    });

    this.app.post("/logs/clear", (req, res) => {
      try {
        const success = this.logger.clearLogs();
        if (success) {
          this.broadcastLog("Log file cleared by user", "info", "system");
          res.json({
            message: "Logs cleared successfully",
            timestamp: new Date().toISOString(),
          });
        } else {
          res.status(500).json({ error: "Failed to clear logs" });
        }
      } catch (error) {
        res.status(500).json({
          error: "Failed to clear logs",
          message: error.message,
        });
      }
    });

    // Simple Server-Sent Events for live logs
    this.app.get("/logs/stream", (req, res) => {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      });

      // Send initial logs from file
      try {
        const recentLogs = this.logger.getRecentLogs(50);
        recentLogs.forEach(log => {
          res.write(`data: ${JSON.stringify(log)}\n\n`);
        });
      } catch (error) {
        console.error("Failed to send initial logs:", error.message);
      }

      const broadcaster = logEntry => {
        res.write(`data: ${JSON.stringify(logEntry)}\n\n`);
      };

      // Add to broadcasters
      if (global.logBroadcasters) {
        global.logBroadcasters.add(broadcaster);
        this.broadcastLog(
          "Dashboard connected to live log stream",
          "info",
          "system"
        );

        req.on("close", () => {
          if (global.logBroadcasters) {
            global.logBroadcasters.delete(broadcaster);
            this.broadcastLog(
              "Dashboard disconnected from live log stream",
              "info",
              "system"
            );
          }
        });
      }
    });

    // Compliance information endpoint
    this.app.get("/compliance", (req, res) => {
      res.json({
        warning: "⚠️ ATERNOS POLICY VIOLATION WARNING",
        details: {
          violated_rules: config.compliance.violatedRules,
          consequences: [
            "Account suspension",
            "Server deletion",
            "Permanent ban",
          ],
          legal_alternatives: config.compliance.legalAlternatives,
        },
        recommendation: config.compliance.recommendation,
      });
    });

    // Dashboard endpoint (serves monitor.html)
    this.app.get("/dashboard", (req, res) => {
      const fs = require("fs");
      const path = require("path");

      const htmlPath = path.join(__dirname, "monitor.html");
      if (fs.existsSync(htmlPath)) {
        res.sendFile(path.resolve(htmlPath));
      } else {
        res.status(404).json({
          error: "Dashboard file not found",
          expectedPath: htmlPath,
        });
      }
    });

    // Alternative dashboard access (root path)
    this.app.get("/monitor", (req, res) => {
      const fs = require("fs");
      const path = require("path");

      const htmlPath = path.join(__dirname, "monitor.html");
      if (fs.existsSync(htmlPath)) {
        res.sendFile(path.resolve(htmlPath));
      } else {
        res.status(404).json({
          error: "Dashboard file not found",
          expectedPath: htmlPath,
        });
      }
    });

    // --- Update Bot Config ---
    this.app.post("/config/update", async (req, res) => {
      const { host, port, version, username } = req.body;
      // Validate
      if (!host || typeof host !== "string" || !/^[\w.-]+$/.test(host)) {
        return res.status(400).json({ success: false, error: "Invalid host" });
      }
      if (!port || typeof port !== "number" || port < 1 || port > 65535) {
        return res.status(400).json({ success: false, error: "Invalid port" });
      }
      if (!version || typeof version !== "string" || version.length < 3) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid version" });
      }
      if (!username || typeof username !== "string" || username.length < 3) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid username" });
      }
      // Update runtime config
      this.bot.serverConfig.host = host;
      this.bot.serverConfig.port = port;
      this.bot.serverConfig.version = version;
      this.bot.serverConfig.username = username;
      // Cập nhật config gốc (nếu cần)
      const config = require("./config");
      config.server.host = host;
      config.server.port = port;
      config.server.version = version;
      config.bot.username = username;
      // Restart bot
      try {
        this.broadcastLog(
          `Bot config updated: ${host}:${port} (${version}) as ${username}`,
          "info"
        );
        this.bot.restart();
        res.json({ success: true });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });
  }

  // Start the web server
  start(port = config.webServer.port) {
    this.app.listen(port, () => {
      this.broadcastLog(`Web server running on port ${port}`, "info");
      this.broadcastLog(
        `Dashboard: http://localhost:${port}/dashboard`,
        "info"
      );
      console.log(`📊 Dashboard: http://localhost:${port}/dashboard`);
      console.log(`📊 Alternative: http://localhost:${port}/monitor`);
      console.log(`❤️ Health check: http://localhost:${port}/health`);
      console.log(`📋 API status: http://localhost:${port}/`);
      console.log(`🔄 Live logs: http://localhost:${port}/logs/stream`);
    });
  }

  // Get Express app instance
  getApp() {
    return this.app;
  }
}

module.exports = BotAPI;
