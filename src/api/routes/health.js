// src/api/routes/health.js - Health Check and System Status Routes
const express = require("express");
const router = express.Router();

module.exports = botManager => {
  // Health check endpoint
  router.get("/", (req, res) => {
    try {
      const stats = botManager.getStats();
      const bots = botManager.getAllBots();

      const healthStatus = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: stats.uptime,
        system: {
          memory: stats.memoryUsage,
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
        },
        bots: {
          total: stats.totalBots,
          running: stats.runningBots,
          stopped: stats.stoppedBots,
          details: bots.map(bot => ({
            id: bot.id,
            name: bot.config.name,
            host: bot.config.host,
            port: bot.config.port,
            connected: bot.isConnected,
            uptime: bot.status.uptime,
            lastConnected: bot.status.lastConnected,
            reconnectAttempts: bot.status.reconnectAttempts,
          })),
        },
        services: {
          botManager: "operational",
          logging: "operational",
          api: "operational",
        },
      };

      // Determine overall health status
      if (stats.totalBots === 0) {
        healthStatus.status = "warning";
        healthStatus.message = "No bots configured";
      } else if (stats.runningBots === 0) {
        healthStatus.status = "degraded";
        healthStatus.message = "No bots currently running";
      } else if (stats.runningBots < stats.totalBots) {
        healthStatus.status = "partial";
        healthStatus.message = `${stats.runningBots}/${stats.totalBots} bots running`;
      } else {
        healthStatus.message = "All systems operational";
      }

      // Set appropriate HTTP status code
      // Always return 200 for health check unless there's a server error
      // Bot status should not affect server health status
      const httpStatus = 200;

      res.status(httpStatus).json(healthStatus);
    } catch (error) {
      res.status(500).json({
        status: "error",
        timestamp: new Date().toISOString(),
        error: error.message,
        message: "Health check failed",
      });
    }
  });

  // Detailed system information
  router.get("/system", (req, res) => {
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      res.json({
        success: true,
        system: {
          node: {
            version: process.version,
            platform: process.platform,
            arch: process.arch,
            uptime: process.uptime(),
            pid: process.pid,
          },
          memory: {
            rss: memUsage.rss,
            heapTotal: memUsage.heapTotal,
            heapUsed: memUsage.heapUsed,
            external: memUsage.external,
            arrayBuffers: memUsage.arrayBuffers,
          },
          cpu: {
            user: cpuUsage.user,
            system: cpuUsage.system,
          },
          env: {
            nodeEnv: process.env.NODE_ENV || "development",
            port: process.env.PORT || 3000,
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // Bot manager statistics
  router.get("/stats", (req, res) => {
    try {
      const stats = botManager.getStats();
      const bots = botManager.getAllBots();

      // Calculate additional statistics
      const botStats = {
        byStatus: {
          connected: bots.filter(bot => bot.isConnected).length,
          disconnected: bots.filter(bot => !bot.isConnected).length,
          spawned: bots.filter(bot => bot.status.hasSpawned).length,
          antiAfkActive: bots.filter(bot => bot.status.antiAfkActive).length,
        },
        byServer: {},
        totalPackets: {
          sent: bots.reduce(
            (sum, bot) => sum + (bot.status.packetsSent || 0),
            0
          ),
          received: bots.reduce(
            (sum, bot) => sum + (bot.status.packetsReceived || 0),
            0
          ),
        },
        totalReconnects: bots.reduce(
          (sum, bot) => sum + (bot.status.reconnectAttempts || 0),
          0
        ),
      };

      // Group bots by server
      bots.forEach(bot => {
        const serverKey = `${bot.config.host}:${bot.config.port}`;
        if (!botStats.byServer[serverKey]) {
          botStats.byServer[serverKey] = {
            host: bot.config.host,
            port: bot.config.port,
            bots: [],
          };
        }
        botStats.byServer[serverKey].bots.push({
          id: bot.id,
          name: bot.config.name,
          username: bot.config.username,
          connected: bot.isConnected,
        });
      });

      res.json({
        success: true,
        stats: {
          ...stats,
          bots: botStats,
          servers: Object.keys(botStats.byServer).length,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // Compliance and policy information
  router.get("/compliance", (req, res) => {
    res.json({
      warning: "⚠️ WARNING: This bot may violate Aternos Terms of Service",
      recommendation: "Consider migrating to bot-friendly hosting platforms",
      riskLevel: "MEDIUM",
      details: {
        violated_rules: [
          "Automated server keep-alive may violate ToS",
          "Continuous connection without human interaction",
          "Potential resource abuse on free hosting",
        ],
        consequences: [
          "Account suspension or termination",
          "Server deletion without warning",
          "IP address blocking",
        ],
        legal_alternatives: [
          "Oracle Cloud Always Free (24/7 support)",
          "Google Cloud Platform Free Tier",
          "AWS Free Tier",
          "Self-hosted VPS solutions",
          "Dedicated Minecraft hosting services",
        ],
      },
      lastUpdated: "2024-07-04",
    });
  });

  return router;
};
