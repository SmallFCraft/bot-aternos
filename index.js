// index-new.js - Simplified Main Entry Point
const cron = require("node-cron");
const axios = require("axios");

// Import modular components
const AternosBot = require("./bot");
const BotAPI = require("./api");
const FileLogger = require("./logger");
const config = require("./config");

// Initialize logger
const logger = new FileLogger("./logs/bot.log");

// Real-time log broadcasting for dashboard
let logBroadcasters = new Set();
global.logBroadcasters = logBroadcasters; // Make available globally for API

const broadcastLog = (message, type = "info", source = "bot") => {
  // Log to file
  logger.log(message, type, source);

  // Create log entry for broadcasting
  const logEntry = {
    timestamp: new Date().toISOString(),
    message,
    type,
    source,
  };

  // Broadcast to all connected dashboards
  logBroadcasters.forEach(broadcaster => {
    try {
      broadcaster(logEntry);
    } catch (error) {
      logBroadcasters.delete(broadcaster);
    }
  });
};

// Better Stack monitoring
const BETTER_STACK = {
  heartbeatUrl: config.monitoring.betterStack.heartbeatUrl,
  enabled: config.monitoring.betterStack.enabled,
  interval: config.monitoring.betterStack.heartbeatInterval,
};

let betterStackInterval = null;

// Better Stack heartbeat function
const sendBetterStackHeartbeat = async () => {
  if (!BETTER_STACK.enabled || !BETTER_STACK.heartbeatUrl) return;

  try {
    await axios.get(BETTER_STACK.heartbeatUrl, { timeout: 5000 });
    // Don't spam log for regular heartbeats
  } catch (error) {
    broadcastLog(`Better Stack heartbeat failed: ${error.message}`, "warn");
  }
};

// Initialize bot and API
const bot = new AternosBot(logger, broadcastLog);
const api = new BotAPI(bot, logger, broadcastLog);

// Start Better Stack heartbeat if enabled
if (BETTER_STACK.enabled) {
  betterStackInterval = setInterval(
    sendBetterStackHeartbeat,
    BETTER_STACK.interval
  );
  broadcastLog(
    `Better Stack heartbeat enabled (${BETTER_STACK.interval / 1000}s interval)`,
    "info"
  );
}

// Scheduled restart (if enabled)
if (config.scheduling.autoRestart) {
  cron.schedule(config.scheduling.restartInterval, () => {
    broadcastLog("Scheduled restart", "info");
    bot.restart();
  });
  broadcastLog(
    `Scheduled restart enabled: ${config.scheduling.restartInterval}`,
    "info"
  );
}

// Cleanup function
const cleanup = () => {
  broadcastLog("Shutting down bot...", "warn");

  if (betterStackInterval) {
    clearInterval(betterStackInterval);
  }

  bot.cleanup();

  setTimeout(() => {
    process.exit(0);
  }, 2000);
};

// Process event handlers
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

process.on("uncaughtException", error => {
  broadcastLog(`Uncaught exception: ${error.message}`, "error");
  console.log(error.stack);
});

process.on("unhandledRejection", (reason, promise) => {
  broadcastLog(`Unhandled rejection: ${reason}`, "error");
});

// Start application
broadcastLog("🚨 WARNING: This bot may violate Aternos Terms of Service", "warn");
broadcastLog("🔗 Consider migrating to bot-friendly hosting", "warn");
broadcastLog("Starting Aternos Bedrock Keep-Alive Bot (Simplified)...", "info");

// Display configuration
broadcastLog(`Server: ${bot.serverConfig.host}:${bot.serverConfig.port}`, "info");
broadcastLog(`Version: ${bot.serverConfig.version}`, "info");
broadcastLog(`Username: ${bot.serverConfig.username}`, "info");
broadcastLog(`Anti-AFK: ${config.antiAfk.enabled ? "Enabled" : "Disabled"}`, "info");
broadcastLog(`Better Stack: ${BETTER_STACK.enabled ? "Enabled" : "Disabled"}`, "info");
broadcastLog(`Start time: ${new Date().toLocaleString()}`, "info");

// Start components
try {
  // Start web server
  api.start();
  
  // Start bot connection
  bot.connect();
  
  broadcastLog("✅ Application started successfully", "info");
  
} catch (error) {
  broadcastLog(`❌ Failed to start application: ${error.message}`, "error");
  console.error("Startup error:", error);
  process.exit(1);
} 