// src/config/default.js - Default Configuration from Environment Variables
require("dotenv").config();

class Config {
  constructor() {
    this.loadEnvironmentConfig();
  }

  loadEnvironmentConfig() {
    // Environment
    this.nodeEnv = process.env.NODE_ENV || "development";
    this.isDevelopment = this.nodeEnv === "development";
    this.isProduction = this.nodeEnv === "production";

    // API Server
    this.port = parseInt(process.env.PORT) || 3000;

    // Better Stack Configuration
    this.betterStack = {
      enabled: process.env.BETTER_STACK_ENABLED === "true",
      apiKey: process.env.BETTER_STACK_API_KEY || null,
      heartbeatUrl: process.env.BETTER_STACK_HEARTBEAT || null,
      interval: parseInt(process.env.BETTER_STACK_INTERVAL) || 60000, // 60 seconds
    };

    // Default Server Configuration
    this.defaultServer = {
      host: process.env.SERVER_HOST || "localhost",
      port: parseInt(process.env.SERVER_PORT) || 19132,
      version: process.env.MC_VERSION || "1.21.90",
    };

    // Default Bot Configuration
    this.defaultBot = {
      username: process.env.BOT_USERNAME || "MinecraftBot",
      isOfflineMode: process.env.DEFAULT_OFFLINE_MODE === "true",
      skipAuthentication: process.env.SKIP_AUTHENTICATION === "true",
      antiAfk: {
        enabled: process.env.DEFAULT_ANTI_AFK_ENABLED !== "false",
        interval: parseInt(process.env.DEFAULT_ANTI_AFK_INTERVAL) || 30000,
        movementRange: parseFloat(process.env.DEFAULT_MOVEMENT_RANGE) || 2.0,
      },
      maxReconnectAttempts:
        parseInt(process.env.DEFAULT_MAX_RECONNECT_ATTEMPTS) || 50,
    };

    // Logging Configuration
    this.logging = {
      level: process.env.LOG_LEVEL || "info",
      maxLogSize: parseInt(process.env.MAX_LOG_SIZE) || 5 * 1024 * 1024, // 5MB
      rotationEnabled: process.env.LOG_ROTATION_ENABLED !== "false",
    };

    // Paths
    this.paths = {
      data: process.env.DATA_PATH || "./data",
      logs: process.env.LOGS_PATH || "./logs",
      botLogs: process.env.BOT_LOGS_PATH || "./logs/bots",
    };
  }

  // Get default bot configuration for new bots
  getDefaultBotConfig() {
    return {
      name: "New Bot",
      host: this.defaultServer.host,
      port: this.defaultServer.port,
      username: this.defaultBot.username,
      version: this.defaultServer.version,
      isOfflineMode: this.defaultBot.isOfflineMode,
      skipAuthentication: this.defaultBot.skipAuthentication,
      antiAfkEnabled: this.defaultBot.antiAfk.enabled,
      antiAfkInterval: this.defaultBot.antiAfk.interval,
      movementRange: this.defaultBot.antiAfk.movementRange,
      maxReconnectAttempts: this.defaultBot.maxReconnectAttempts,
      autoStart: false,
    };
  }

  // Get Better Stack configuration
  getBetterStackConfig() {
    return {
      enabled: this.betterStack.enabled,
      heartbeatUrl: this.betterStack.heartbeatUrl,
      interval: this.betterStack.interval,
    };
  }

  // Validate configuration
  validate() {
    const errors = [];

    // Validate port
    if (this.port < 1 || this.port > 65535) {
      errors.push("PORT must be between 1 and 65535");
    }

    // Validate Better Stack if enabled
    if (this.betterStack.enabled) {
      if (!this.betterStack.heartbeatUrl) {
        errors.push(
          "BETTER_STACK_HEARTBEAT is required when Better Stack is enabled"
        );
      } else if (!this.betterStack.heartbeatUrl.includes("betterstack.com")) {
        errors.push("BETTER_STACK_HEARTBEAT must be a valid Better Stack URL");
      }
    }

    // Validate default server
    if (!this.defaultServer.host) {
      errors.push("SERVER_HOST is required");
    }

    if (this.defaultServer.port < 1 || this.defaultServer.port > 65535) {
      errors.push("SERVER_PORT must be between 1 and 65535");
    }

    // Validate bot username
    if (!this.defaultBot.username || this.defaultBot.username.length < 3) {
      errors.push("BOT_USERNAME must be at least 3 characters long");
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  // Display configuration summary
  displaySummary() {
    console.log("⚙️  CONFIGURATION SUMMARY:");
    console.log(`   • Environment: ${this.nodeEnv}`);
    console.log(`   • API Port: ${this.port}`);
    console.log(
      `   • Default Server: ${this.defaultServer.host}:${this.defaultServer.port}`
    );
    console.log(`   • Default Username: ${this.defaultBot.username}`);
    console.log(`   • Minecraft Version: ${this.defaultServer.version}`);
    console.log(
      `   • Offline Mode: ${
        this.defaultBot.isOfflineMode ? "Enabled" : "Disabled"
      }`
    );
    console.log(
      `   • Better Stack: ${this.betterStack.enabled ? "Enabled" : "Disabled"}`
    );

    if (this.betterStack.enabled) {
      console.log(
        `   • Heartbeat Interval: ${this.betterStack.interval / 1000}s`
      );
    }

    console.log("");
  }

  // Get environment info for API
  getEnvironmentInfo() {
    return {
      nodeEnv: this.nodeEnv,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      port: this.port,
      betterStackEnabled: this.betterStack.enabled,
      defaultServer: this.defaultServer,
      defaultBot: {
        username: this.defaultBot.username,
        isOfflineMode: this.defaultBot.isOfflineMode,
        antiAfkEnabled: this.defaultBot.antiAfk.enabled,
      },
    };
  }
}

// Export singleton instance
module.exports = new Config();
