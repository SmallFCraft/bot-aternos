// src/core/BotManager.js - Multi-Bot Management System
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const Bot = require("./Bot");
const Logger = require("./Logger");
const BetterStackMonitor = require("./BetterStackMonitor");
const config = require("../config/default");

class BotManager {
  constructor() {
    this.bots = new Map(); // Map<botId, Bot>
    this.dataFile = path.join(__dirname, "../../data/bots.json");
    this.logBroadcasters = new Set(); // For real-time log broadcasting

    // Ensure data directory exists
    this.ensureDataDirectory();

    // Initialize Better Stack monitoring
    this.betterStack = new BetterStackMonitor(this);

    // Load existing bots from storage
    this.loadBotsFromStorage();

    console.log("🤖 BotManager initialized");
  }

  // Ensure data directory exists
  ensureDataDirectory() {
    const dataDir = path.dirname(this.dataFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  // Add log broadcaster for real-time updates
  addLogBroadcaster(broadcaster) {
    this.logBroadcasters.add(broadcaster);
  }

  // Remove log broadcaster
  removeLogBroadcaster(broadcaster) {
    this.logBroadcasters.delete(broadcaster);
  }

  // Broadcast log to all connected clients
  broadcastLog(message, type = "info", botId = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      message,
      type,
      source: botId ? `bot-${botId}` : "manager",
      botId,
    };

    // Broadcast to all connected clients
    this.logBroadcasters.forEach(broadcaster => {
      try {
        broadcaster(logEntry);
      } catch (error) {
        console.error("Error broadcasting log:", error);
      }
    });

    // Also log to console
    const timeStr = new Date().toLocaleTimeString();
    const icon = type === "error" ? "❌" : type === "warn" ? "⚠️" : "ℹ️";
    const prefix = botId ? `[Bot-${botId.slice(0, 8)}]` : "[Manager]";
    console.log(`${icon} ${prefix} [${timeStr}] ${message}`);
  }

  // Create a new bot
  async createBot(botConfig) {
    try {
      // Validate required config
      if (!botConfig.host || !botConfig.port || !botConfig.username) {
        throw new Error("Missing required config: host, port, username");
      }

      const botId = uuidv4();
      // Merge with default config from .env
      const defaultConfig = config.getDefaultBotConfig();

      const finalBotConfig = {
        id: botId,
        name: botConfig.name || `Bot-${botId.slice(0, 8)}`,
        host: botConfig.host || defaultConfig.host,
        port: parseInt(botConfig.port) || defaultConfig.port,
        username: botConfig.username || defaultConfig.username,
        version: botConfig.version || defaultConfig.version,
        isOfflineMode:
          botConfig.isOfflineMode !== undefined
            ? botConfig.isOfflineMode
            : defaultConfig.isOfflineMode,
        skipAuthentication:
          botConfig.skipAuthentication !== undefined
            ? botConfig.skipAuthentication
            : defaultConfig.skipAuthentication,
        antiAfk: {
          enabled:
            botConfig.antiAfkEnabled !== undefined
              ? botConfig.antiAfkEnabled
              : defaultConfig.antiAfkEnabled,
          interval: botConfig.antiAfkInterval || defaultConfig.antiAfkInterval,
          movementRange: botConfig.movementRange || defaultConfig.movementRange,
        },
        maxReconnectAttempts:
          botConfig.maxReconnectAttempts || defaultConfig.maxReconnectAttempts,
        createdAt: new Date().toISOString(),
        autoStart: botConfig.autoStart || false,
      };

      // Create bot logger
      const logger = new Logger(`./logs/bots/bot-${botId}.log`);

      // Create bot instance
      const bot = new Bot(finalBotConfig, logger, (message, type) => {
        this.broadcastLog(message, type, botId);
      });

      // Store bot
      this.bots.set(botId, bot);

      // Save to storage
      await this.saveBotsToStorage();

      this.broadcastLog(
        `✅ Bot created: ${finalBotConfig.name} (${finalBotConfig.host}:${finalBotConfig.port})`,
        "info"
      );

      // Auto-start if requested
      if (botConfig.autoStart) {
        setTimeout(() => this.startBot(botId), 1000);
      }

      return {
        success: true,
        botId,
        config: botConfig,
      };
    } catch (error) {
      this.broadcastLog(`❌ Failed to create bot: ${error.message}`, "error");
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Delete a bot
  async deleteBot(botId) {
    try {
      const bot = this.bots.get(botId);
      if (!bot) {
        throw new Error("Bot not found");
      }

      // Stop bot if running
      if (bot.isConnected()) {
        await this.stopBot(botId);
      }

      // Remove from memory
      this.bots.delete(botId);

      // Save to storage
      await this.saveBotsToStorage();

      this.broadcastLog(`🗑️ Bot deleted: ${bot.config.name}`, "info");

      return { success: true };
    } catch (error) {
      this.broadcastLog(`❌ Failed to delete bot: ${error.message}`, "error");
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Start a bot
  async startBot(botId) {
    try {
      const bot = this.bots.get(botId);
      if (!bot) {
        throw new Error("Bot not found");
      }

      if (bot.isConnected()) {
        throw new Error("Bot is already running");
      }

      await bot.connect();
      this.broadcastLog(`🚀 Bot started: ${bot.config.name}`, "info");

      return { success: true };
    } catch (error) {
      this.broadcastLog(`❌ Failed to start bot: ${error.message}`, "error");
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Stop a bot
  async stopBot(botId) {
    try {
      const bot = this.bots.get(botId);
      if (!bot) {
        throw new Error("Bot not found");
      }

      // Always try to disconnect, regardless of connection status
      // This handles cases where status might be out of sync
      await bot.disconnect();
      this.broadcastLog(`🛑 Bot stopped: ${bot.config.name}`, "info");

      return { success: true };
    } catch (error) {
      this.broadcastLog(`❌ Failed to stop bot: ${error.message}`, "error");
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Restart a bot
  async restartBot(botId) {
    try {
      const bot = this.bots.get(botId);
      if (!bot) {
        throw new Error("Bot not found");
      }

      this.broadcastLog(`🔄 Restarting bot: ${bot.config.name}`, "info");

      if (bot.isConnected()) {
        await this.stopBot(botId);
        // Wait a moment before restarting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      await this.startBot(botId);

      return { success: true };
    } catch (error) {
      this.broadcastLog(`❌ Failed to restart bot: ${error.message}`, "error");
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get all bots
  getAllBots() {
    const bots = [];
    for (const [botId, bot] of this.bots) {
      bots.push({
        id: botId,
        config: bot.config,
        status: bot.getStatus(),
        isConnected: bot.isConnected(),
      });
    }
    return bots;
  }

  // Get specific bot
  getBot(botId) {
    const bot = this.bots.get(botId);
    if (!bot) return null;

    return {
      id: botId,
      config: bot.config,
      status: bot.getStatus(),
      isConnected: bot.isConnected(),
    };
  }

  // Update bot configuration
  async updateBotConfig(botId, newConfig) {
    try {
      const bot = this.bots.get(botId);
      if (!bot) {
        throw new Error("Bot not found");
      }

      // Update config
      Object.assign(bot.config, newConfig);

      // Save to storage
      await this.saveBotsToStorage();

      this.broadcastLog(`⚙️ Bot config updated: ${bot.config.name}`, "info");

      return { success: true };
    } catch (error) {
      this.broadcastLog(
        `❌ Failed to update bot config: ${error.message}`,
        "error"
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Save bots to storage
  async saveBotsToStorage() {
    try {
      const botsData = {};
      for (const [botId, bot] of this.bots) {
        botsData[botId] = bot.config;
      }

      fs.writeFileSync(this.dataFile, JSON.stringify(botsData, null, 2));
    } catch (error) {
      console.error("Failed to save bots to storage:", error);
    }
  }

  // Load bots from storage
  loadBotsFromStorage() {
    try {
      if (!fs.existsSync(this.dataFile)) {
        return;
      }

      const data = fs.readFileSync(this.dataFile, "utf8");
      const botsData = JSON.parse(data);

      for (const [botId, config] of Object.entries(botsData)) {
        // Create logger
        const logger = new Logger(`./logs/bots/bot-${botId}.log`);

        // Create bot instance
        const bot = new Bot(config, logger, (message, type) => {
          this.broadcastLog(message, type, botId);
        });

        this.bots.set(botId, bot);

        // Auto-start if configured
        if (config.autoStart) {
          setTimeout(() => this.startBot(botId), 2000);
        }
      }

      this.broadcastLog(
        `📂 Loaded ${this.bots.size} bots from storage`,
        "info"
      );
    } catch (error) {
      console.error("Failed to load bots from storage:", error);
    }
  }

  // Get manager statistics
  getStats() {
    const totalBots = this.bots.size;
    const runningBots = Array.from(this.bots.values()).filter(bot =>
      bot.isConnected()
    ).length;
    const stoppedBots = totalBots - runningBots;

    return {
      totalBots,
      runningBots,
      stoppedBots,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    };
  }

  // Better Stack methods
  async setupBetterStack(heartbeatUrl) {
    return await this.betterStack.setup(heartbeatUrl);
  }

  getBetterStackStatus() {
    return this.betterStack.getStatus();
  }

  getBetterStackConfig() {
    return this.betterStack.getConfig();
  }

  disableBetterStack() {
    this.betterStack.disable();
  }

  updateBetterStackInterval(interval) {
    this.betterStack.updateInterval(interval);
  }

  // Shutdown all bots
  async shutdown() {
    this.broadcastLog("🔄 Shutting down all bots...", "warn");

    // Stop Better Stack monitoring
    if (this.betterStack) {
      this.betterStack.stop();
    }

    const shutdownPromises = [];
    for (const [botId, bot] of this.bots) {
      if (bot.isConnected()) {
        shutdownPromises.push(this.stopBot(botId));
      }
    }

    await Promise.all(shutdownPromises);
    this.broadcastLog("✅ All bots shut down", "info");
  }
}

module.exports = BotManager;
