// src/core/BetterStackMonitor.js - Better Stack Integration for Multi-Bot System
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const config = require("../config/default");

class BetterStackMonitor {
  constructor(botManager) {
    this.botManager = botManager;
    this.configFile = path.join(
      __dirname,
      "../../data/betterstack-config.json"
    );
    this.config = this.loadConfig();
    this.heartbeatInterval = null;
    this.isEnabled = false;

    // Auto-setup from .env if configured
    this.autoSetupFromEnv();

    this.initialize();
  }

  // Load Better Stack configuration
  loadConfig() {
    try {
      if (fs.existsSync(this.configFile)) {
        const data = fs.readFileSync(this.configFile, "utf8");
        return JSON.parse(data);
      }
    } catch (error) {
      console.error("Failed to load Better Stack config:", error.message);
    }

    return {
      enabled: false,
      heartbeatUrl: null,
      interval: 60000, // 60 seconds
      lastHeartbeat: null,
      totalHeartbeats: 0,
      failedHeartbeats: 0,
    };
  }

  // Save Better Stack configuration
  saveConfig() {
    try {
      const configDir = path.dirname(this.configFile);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      fs.writeFileSync(this.configFile, JSON.stringify(this.config, null, 2));
      return true;
    } catch (error) {
      console.error("Failed to save Better Stack config:", error.message);
      return false;
    }
  }

  // Auto-setup from environment variables
  autoSetupFromEnv() {
    const envConfig = config.getBetterStackConfig();

    if (envConfig.enabled && envConfig.heartbeatUrl) {
      // Override config with .env values
      this.config.enabled = true;
      this.config.heartbeatUrl = envConfig.heartbeatUrl;
      this.config.interval = envConfig.interval;

      // Save to file for persistence
      this.saveConfig();

      this.botManager.broadcastLog(
        "⚙️ Better Stack auto-configured from .env file",
        "info"
      );
    }
  }

  // Initialize Better Stack monitoring
  initialize() {
    if (this.config.enabled && this.config.heartbeatUrl) {
      this.start();
    }
  }

  // Setup Better Stack monitoring
  async setup(heartbeatUrl) {
    try {
      // Validate URL format
      if (
        !heartbeatUrl ||
        !heartbeatUrl.includes("betterstack.com/api/v1/heartbeat/")
      ) {
        throw new Error("Invalid Better Stack heartbeat URL format");
      }

      // Test heartbeat
      await this.sendHeartbeat(heartbeatUrl);

      // Update configuration
      this.config.enabled = true;
      this.config.heartbeatUrl = heartbeatUrl;
      this.config.lastHeartbeat = new Date().toISOString();

      if (this.saveConfig()) {
        this.start();
        this.botManager.broadcastLog(
          "✅ Better Stack monitoring enabled",
          "info"
        );
        return { success: true };
      } else {
        throw new Error("Failed to save configuration");
      }
    } catch (error) {
      this.botManager.broadcastLog(
        `❌ Better Stack setup failed: ${error.message}`,
        "error"
      );
      return { success: false, error: error.message };
    }
  }

  // Start Better Stack monitoring
  start() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    if (!this.config.enabled || !this.config.heartbeatUrl) {
      return;
    }

    this.isEnabled = true;

    // Send initial heartbeat
    this.sendHeartbeat();

    // Setup interval
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, this.config.interval);

    this.botManager.broadcastLog(
      `💓 Better Stack heartbeat started (${
        this.config.interval / 1000
      }s interval)`,
      "info"
    );
  }

  // Stop Better Stack monitoring
  stop() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    this.isEnabled = false;
    this.botManager.broadcastLog("🛑 Better Stack monitoring stopped", "warn");
  }

  // Disable Better Stack monitoring
  disable() {
    this.stop();
    this.config.enabled = false;
    this.saveConfig();
    this.botManager.broadcastLog("❌ Better Stack monitoring disabled", "warn");
  }

  // Send heartbeat to Better Stack
  async sendHeartbeat(customUrl = null) {
    const url = customUrl || this.config.heartbeatUrl;

    if (!url) {
      return { success: false, error: "No heartbeat URL configured" };
    }

    try {
      // Prepare heartbeat data
      const stats = this.botManager.getStats();
      const bots = this.botManager.getAllBots();

      const heartbeatData = {
        timestamp: new Date().toISOString(),
        system: {
          totalBots: stats.totalBots,
          runningBots: stats.runningBots,
          stoppedBots: stats.stoppedBots,
          uptime: stats.uptime,
          memoryUsage: Math.round(stats.memoryUsage.heapUsed / 1024 / 1024), // MB
        },
        bots: bots.map(bot => ({
          id: bot.id.slice(0, 8),
          name: bot.config.name,
          connected: bot.isConnected,
          server: `${bot.config.host}:${bot.config.port}`,
          uptime: bot.status.uptime || 0,
        })),
      };

      // Send heartbeat with system data
      const response = await axios.post(url, heartbeatData, {
        timeout: 10000,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Multi-Bot-Aternos-System/1.0",
        },
      });

      // Update statistics
      this.config.totalHeartbeats = (this.config.totalHeartbeats || 0) + 1;
      this.config.lastHeartbeat = new Date().toISOString();
      this.saveConfig();

      // Only log success for setup, not regular heartbeats
      if (customUrl) {
        this.botManager.broadcastLog(
          "💓 Better Stack heartbeat test successful",
          "info"
        );
      }

      return { success: true, response: response.status };
    } catch (error) {
      this.config.failedHeartbeats = (this.config.failedHeartbeats || 0) + 1;
      this.saveConfig();

      const errorMessage = error.response?.status
        ? `HTTP ${error.response.status}`
        : error.message;

      // Only log errors, not regular failed heartbeats to avoid spam
      if (customUrl || this.config.failedHeartbeats % 5 === 0) {
        this.botManager.broadcastLog(
          `💔 Better Stack heartbeat failed: ${errorMessage}`,
          "warn"
        );
      }

      return { success: false, error: errorMessage };
    }
  }

  // Get Better Stack status
  getStatus() {
    const successRate =
      this.config.totalHeartbeats > 0
        ? (
            ((this.config.totalHeartbeats -
              (this.config.failedHeartbeats || 0)) /
              this.config.totalHeartbeats) *
            100
          ).toFixed(1)
        : 0;

    return {
      enabled: this.config.enabled,
      active: this.isEnabled,
      heartbeatUrl: this.config.heartbeatUrl ? "***configured***" : null,
      interval: this.config.interval,
      lastHeartbeat: this.config.lastHeartbeat,
      statistics: {
        totalRequests: this.config.totalHeartbeats || 0,
        successfulRequests:
          (this.config.totalHeartbeats || 0) -
          (this.config.failedHeartbeats || 0),
        failedRequests: this.config.failedHeartbeats || 0,
        successRate: successRate,
      },
      nextHeartbeat:
        this.isEnabled && this.config.lastHeartbeat
          ? new Date(
              new Date(this.config.lastHeartbeat).getTime() +
                this.config.interval
            ).toISOString()
          : null,
    };
  }

  // Get Better Stack configuration (for setup modal)
  getConfig() {
    return {
      heartbeatUrl: this.config.heartbeatUrl || "",
      interval: this.config.interval || 60000,
      enabled: this.config.enabled || false,
    };
  }

  // Update heartbeat interval
  updateInterval(newInterval) {
    if (newInterval < 30000) {
      // Minimum 30 seconds
      throw new Error("Heartbeat interval must be at least 30 seconds");
    }

    this.config.interval = newInterval;
    this.saveConfig();

    if (this.isEnabled) {
      this.start(); // Restart with new interval
    }

    this.botManager.broadcastLog(
      `⚙️ Better Stack interval updated to ${newInterval / 1000}s`,
      "info"
    );
  }

  // Get heartbeat history (last 24 hours simulation)
  getHeartbeatHistory() {
    // This is a simplified version - in production you might want to store actual history
    const now = new Date();
    const history = [];

    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000); // Hour ago
      const success = Math.random() > 0.1; // 90% success rate simulation

      history.push({
        timestamp: time.toISOString(),
        success: success,
        responseTime: success ? Math.floor(Math.random() * 500) + 100 : null, // 100-600ms
      });
    }

    return history;
  }
}

module.exports = BetterStackMonitor;
