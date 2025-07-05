// src/api/routes/uptime.js - Uptime Status API Routes
const express = require("express");
const LogAnalyzer = require("../../core/LogAnalyzer");
const router = express.Router();

module.exports = botManager => {
  const logAnalyzer = new LogAnalyzer();

  // Get comprehensive uptime data
  router.get("/", (req, res) => {
    try {
      const stats = botManager.getStats();
      const bots = botManager.getAllBots();
      const betterStackStatus = botManager.getBetterStackStatus();
      const uptimeStats = logAnalyzer.getUptimeStatistics(24);

      // Calculate overall system uptime percentage using real data
      const overallUptimePercentage = uptimeStats.averageUptime;

      // Calculate bot success rate
      const activeBots = bots.filter(bot => bot.isConnected).length;
      const totalBots = bots.length;
      const botSuccessRate = totalBots > 0 ? (activeBots / totalBots) * 100 : 0;

      // Get system start time
      const systemStartTime = new Date(Date.now() - stats.uptime * 1000);

      // Prepare bot uptime details with real timeline data
      const botDetails = bots.map(bot => {
        const botUptimeStats = uptimeStats.botStats.find(
          bs => bs.botId === bot.id
        ) || {
          uptime: 0,
          timeline: logAnalyzer.generateDefaultTimeline(),
        };

        return {
          id: bot.id,
          name: bot.config.name,
          host: bot.config.host,
          port: bot.config.port,
          connected: bot.isConnected,
          uptime: bot.status.uptime || 0,
          lastConnected: bot.status.lastConnected,
          lastDisconnected: bot.status.lastDisconnected,
          reconnectAttempts: bot.status.reconnectAttempts || 0,
          hasSpawned: bot.status.hasSpawned,
          antiAfkActive: bot.status.antiAfkActive,
          packetsSent: bot.status.packetsSent || 0,
          packetsReceived: bot.status.packetsReceived || 0,
          uptimePercentage: botUptimeStats.uptime,
          timeline: botUptimeStats.timeline,
          config: {
            name: bot.config.name,
            host: bot.config.host,
            port: bot.config.port,
            version: bot.config.version,
            antiAfk: bot.config.antiAfk,
          },
        };
      });

      // Prepare Better Stack data
      const betterStackData = {
        enabled: betterStackStatus.enabled,
        lastHeartbeat: betterStackStatus.lastHeartbeat,
        totalHeartbeats: betterStackStatus.statistics?.totalHeartbeats || 0,
        failedHeartbeats: betterStackStatus.statistics?.failedHeartbeats || 0,
        successRate: betterStackStatus.statistics?.successRate || 0,
      };

      const uptimeData = {
        success: true,
        timestamp: new Date().toISOString(),
        system: {
          uptime: stats.uptime,
          uptimeFormatted: formatUptime(stats.uptime),
          startTime: systemStartTime.toISOString(),
          overallUptimePercentage: parseFloat(
            overallUptimePercentage.toFixed(1)
          ),
          memory: stats.memoryUsage,
          nodeVersion: process.version,
          platform: process.platform,
        },
        bots: {
          total: totalBots,
          active: activeBots,
          inactive: totalBots - activeBots,
          successRate: parseFloat(botSuccessRate.toFixed(1)),
          details: botDetails,
        },
        betterStack: betterStackData,
        statistics: {
          totalPacketsSent: botDetails.reduce(
            (sum, bot) => sum + bot.packetsSent,
            0
          ),
          totalPacketsReceived: botDetails.reduce(
            (sum, bot) => sum + bot.packetsReceived,
            0
          ),
          totalReconnects: botDetails.reduce(
            (sum, bot) => sum + bot.reconnectAttempts,
            0
          ),
          averageUptime:
            botDetails.length > 0
              ? botDetails.reduce((sum, bot) => sum + bot.uptime, 0) /
                botDetails.length
              : 0,
        },
      };

      res.json(uptimeData);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Get uptime history from real data
  router.get("/history", (req, res) => {
    try {
      const { period = "24h" } = req.query;

      // Get historical data based on period
      let hoursBack;
      let intervals;

      switch (period) {
        case "1h":
          hoursBack = 1;
          intervals = 60; // 1 minute intervals
          break;
        case "24h":
          hoursBack = 24;
          intervals = 24; // 1 hour intervals
          break;
        case "7d":
          hoursBack = 7 * 24;
          intervals = 7 * 24; // 1 hour intervals
          break;
        case "30d":
          hoursBack = 30 * 24;
          intervals = 30; // 1 day intervals
          break;
        default:
          hoursBack = 24;
          intervals = 24;
      }

      // Get real uptime statistics
      const uptimeStats = logAnalyzer.getUptimeStatistics(hoursBack);
      const incidents = logAnalyzer.extractIncidents(hoursBack);

      // Generate data points based on real data
      const now = new Date();
      const intervalMs = (hoursBack * 60 * 60 * 1000) / intervals;
      const dataPoints = [];

      for (let i = intervals - 1; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * intervalMs);

        // Calculate average uptime for this interval
        const avgUptime =
          uptimeStats.botStats.length > 0
            ? uptimeStats.botStats.reduce((sum, bot) => sum + bot.uptime, 0) /
              uptimeStats.botStats.length
            : 100;

        // Count incidents in this interval
        const intervalStart = timestamp;
        const intervalEnd = new Date(timestamp.getTime() + intervalMs);
        const intervalIncidents = incidents.filter(incident => {
          const incidentTime = new Date(incident.startTime);
          return incidentTime >= intervalStart && incidentTime < intervalEnd;
        }).length;

        dataPoints.push({
          timestamp: timestamp.toISOString(),
          uptime: parseFloat(avgUptime.toFixed(2)),
          activeBots: uptimeStats.botStats.filter(bot => bot.uptime > 50)
            .length,
          incidents: intervalIncidents,
        });
      }

      res.json({
        success: true,
        period,
        dataPoints,
        summary: {
          averageUptime:
            dataPoints.reduce((sum, point) => sum + point.uptime, 0) /
            dataPoints.length,
          totalIncidents: dataPoints.reduce(
            (sum, point) => sum + point.incidents,
            0
          ),
          minUptime: Math.min(...dataPoints.map(point => point.uptime)),
          maxUptime: Math.max(...dataPoints.map(point => point.uptime)),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // Get incidents from real log data
  router.get("/incidents", (req, res) => {
    try {
      const { limit = 10, hours = 24 } = req.query;

      // Get bot information for name mapping
      const bots = botManager.getAllBots();
      const botNameMap = {};
      bots.forEach(bot => {
        botNameMap[bot.id] = bot.config.name;
      });

      // Extract real incidents from log files
      const incidents = logAnalyzer.extractIncidents(
        parseInt(hours),
        parseInt(limit),
        botNameMap
      );

      res.json({
        success: true,
        incidents: incidents,
        total: incidents.length,
        summary: {
          open: incidents.filter(i => i.status !== "resolved").length,
          resolved: incidents.filter(i => i.status === "resolved").length,
          totalDowntime: incidents.reduce((sum, i) => sum + i.duration, 0),
        },
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

// Helper function to format uptime
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}
