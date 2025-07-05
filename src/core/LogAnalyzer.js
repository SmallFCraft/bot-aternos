// src/core/LogAnalyzer.js - Analyze bot logs for incidents and uptime data
const fs = require("fs");
const path = require("path");

class LogAnalyzer {
  constructor() {
    this.logsDir = path.join(__dirname, "../../logs/bots");
  }

  // Get all bot log files
  getBotLogFiles() {
    try {
      if (!fs.existsSync(this.logsDir)) {
        return [];
      }

      const files = fs.readdirSync(this.logsDir);
      return files
        .filter(file => file.endsWith(".log"))
        .map(file => ({
          path: path.join(this.logsDir, file),
          botId: file.replace("bot-", "").replace(".log", ""),
          filename: file,
        }));
    } catch (error) {
      console.error("Error reading log directory:", error);
      return [];
    }
  }

  // Parse log file and extract entries
  parseLogFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        return [];
      }

      const content = fs.readFileSync(filePath, "utf8");
      const lines = content
        .trim()
        .split("\n")
        .filter(line => line.trim());

      const logs = [];
      for (const line of lines) {
        try {
          const logEntry = JSON.parse(line);
          logs.push(logEntry);
        } catch (parseError) {
          // Skip malformed lines
          continue;
        }
      }

      return logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } catch (error) {
      console.error(`Error parsing log file ${filePath}:`, error);
      return [];
    }
  }

  // Extract incidents from logs
  extractIncidents(hoursBack = 24, limit = 10, botNameMap = {}) {
    const incidents = [];
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    const logFiles = this.getBotLogFiles();

    for (const logFile of logFiles) {
      const logs = this.parseLogFile(logFile.path);
      const botIncidents = this.analyzeLogsForIncidents(
        logs,
        logFile.botId,
        cutoffTime,
        botNameMap
      );
      incidents.push(...botIncidents);
    }

    // Sort by start time (newest first) and limit
    incidents.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    return incidents.slice(0, limit);
  }

  // Analyze logs for a specific bot to find incidents
  analyzeLogsForIncidents(logs, botId, cutoffTime, botNameMap = {}) {
    const incidents = [];
    let currentIncident = null;
    const botName = botNameMap[botId] || `Bot-${botId.slice(0, 8)}`;

    for (const log of logs) {
      const logTime = new Date(log.timestamp);

      // Skip logs older than cutoff
      if (logTime < cutoffTime) continue;

      // Detect incident start
      if (this.isIncidentStart(log)) {
        // Close previous incident if exists
        if (currentIncident) {
          currentIncident.endTime = log.timestamp;
          currentIncident.duration = Math.floor(
            (new Date(currentIncident.endTime) -
              new Date(currentIncident.startTime)) /
              1000
          );
          incidents.push(currentIncident);
        }

        // Start new incident
        currentIncident = {
          id: `${botId}-${logTime.getTime()}`,
          title: this.getIncidentTitle(log),
          description: this.getIncidentDescription(log, botName),
          severity: this.getIncidentSeverity(log),
          status: "ongoing",
          startTime: log.timestamp,
          endTime: null,
          duration: 0,
          affectedServices: [botName],
          resolvedBy: null,
          botId: botId,
          botName: botName,
        };
      }

      // Detect incident resolution
      if (currentIncident && this.isIncidentResolution(log)) {
        currentIncident.endTime = log.timestamp;
        currentIncident.status = "resolved";
        currentIncident.resolvedBy = this.getResolutionMethod(log);
        currentIncident.duration = Math.floor(
          (new Date(currentIncident.endTime) -
            new Date(currentIncident.startTime)) /
            1000
        );
        incidents.push(currentIncident);
        currentIncident = null;
      }
    }

    // Handle ongoing incident
    if (currentIncident) {
      currentIncident.endTime = new Date().toISOString();
      currentIncident.duration = Math.floor(
        (new Date(currentIncident.endTime) -
          new Date(currentIncident.startTime)) /
          1000
      );
      incidents.push(currentIncident);
    }

    return incidents;
  }

  // Check if log entry indicates incident start
  isIncidentStart(log) {
    const errorPatterns = [
      /❌ Connection error/,
      /🔌 Disconnected/,
      /❌ Failed to create/,
      /Connection timeout/,
      /Ping timed out/,
      /Server offline/,
      /ECONNREFUSED/,
      /ETIMEDOUT/,
      /ENOTFOUND/,
    ];

    return (
      log.type === "error" ||
      (log.type === "warn" && log.message.includes("🔌 Disconnected")) ||
      errorPatterns.some(pattern => pattern.test(log.message))
    );
  }

  // Check if log entry indicates incident resolution
  isIncidentResolution(log) {
    const resolutionPatterns = [
      /🎮 Bot spawned successfully/,
      /🔗 Connected to Bedrock server/,
      /🔐 Login successful/,
      /✅ Bot connected/,
    ];

    return resolutionPatterns.some(pattern => pattern.test(log.message));
  }

  // Get incident title from log
  getIncidentTitle(log) {
    if (log.message.includes("Connection error")) return "Bot Connection Error";
    if (log.message.includes("Disconnected")) return "Bot Disconnection";
    if (log.message.includes("timeout")) return "Connection Timeout";
    if (log.message.includes("Ping timed out")) return "Ping Timeout";
    if (log.message.includes("Server offline")) return "Server Unavailable";
    if (log.message.includes("ECONNREFUSED")) return "Connection Refused";
    if (log.message.includes("ENOTFOUND")) return "Server Not Found";
    return "Bot Connection Issue";
  }

  // Get incident description
  getIncidentDescription(log, botName) {
    const message = log.message.replace(/[🔌❌⚠️🔗]/g, "").trim();
    return `"${botName}" experienced: ${message}`;
  }

  // Get incident severity
  getIncidentSeverity(log) {
    if (log.type === "error") return "high";
    if (log.message.includes("timeout") || log.message.includes("ECONNREFUSED"))
      return "medium";
    return "low";
  }

  // Get resolution method
  getResolutionMethod(log) {
    if (log.message.includes("spawned successfully")) return "auto-reconnect";
    if (log.message.includes("Connected")) return "connection-restored";
    if (log.message.includes("Login successful"))
      return "authentication-success";
    return "automatic";
  }

  // Calculate uptime timeline for a bot
  calculateBotUptimeTimeline(botId, hoursBack = 24) {
    const logFile = this.getBotLogFiles().find(f => f.botId === botId);
    if (!logFile) return this.generateDefaultTimeline();

    const logs = this.parseLogFile(logFile.path);
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    // Create hourly segments
    const segments = [];
    const segmentDuration = (hoursBack * 60 * 60 * 1000) / 24; // 24 segments

    for (let i = 0; i < 24; i++) {
      const segmentStart = new Date(cutoffTime.getTime() + i * segmentDuration);
      const segmentEnd = new Date(segmentStart.getTime() + segmentDuration);

      const segmentLogs = logs.filter(log => {
        const logTime = new Date(log.timestamp);
        return logTime >= segmentStart && logTime < segmentEnd;
      });

      // Determine segment status based on logs
      const hasErrors = segmentLogs.some(log => this.isIncidentStart(log));
      const hasSuccess = segmentLogs.some(log =>
        this.isIncidentResolution(log)
      );

      let status = "up";
      if (hasErrors && !hasSuccess) {
        status = "down";
      } else if (hasErrors && hasSuccess) {
        status = "up"; // Recovered within the segment
      }

      segments.push(status);
    }

    return segments;
  }

  // Generate default timeline when no data available
  generateDefaultTimeline() {
    return Array(24).fill("up");
  }

  // Calculate overall uptime percentage for a bot
  calculateBotUptimePercentage(botId, hoursBack = 24) {
    const timeline = this.calculateBotUptimeTimeline(botId, hoursBack);
    const upSegments = timeline.filter(segment => segment === "up").length;
    return (upSegments / timeline.length) * 100;
  }

  // Get summary statistics
  getUptimeStatistics(hoursBack = 24) {
    const logFiles = this.getBotLogFiles();
    const stats = {
      totalBots: logFiles.length,
      averageUptime: 0,
      incidents: this.extractIncidents(hoursBack).length,
      botStats: [],
    };

    let totalUptime = 0;
    for (const logFile of logFiles) {
      const uptime = this.calculateBotUptimePercentage(
        logFile.botId,
        hoursBack
      );
      totalUptime += uptime;

      stats.botStats.push({
        botId: logFile.botId,
        uptime: uptime,
        timeline: this.calculateBotUptimeTimeline(logFile.botId, hoursBack),
      });
    }

    stats.averageUptime =
      logFiles.length > 0 ? totalUptime / logFiles.length : 100;

    return stats;
  }
}

module.exports = LogAnalyzer;
