// config.js - Cấu hình Bot Aternos Bedrock
module.exports = {
  // ===== SERVER CONFIGURATION =====
  server: {
    host: process.env.SERVER_HOST || "Meo_MC403-IFBX.aternos.me",
    port: parseInt(process.env.SERVER_PORT) || 33122,
    version: process.env.MC_VERSION || "1.21.70", // Bedrock version
  },

  // ===== BOT CONFIGURATION =====
  bot: {
    username: process.env.BOT_USERNAME || "LOADING99",
    maxReconnectAttempts: parseInt(process.env.MAX_RECONNECT_ATTEMPTS) || 50,
    isOfflineMode: process.env.OFFLINE_MODE === "true", // Crack server support
    skipAuthentication: process.env.SKIP_AUTH === "true",
  },

  // ===== SCHEDULED RESTART =====
  scheduling: {
    autoRestart: process.env.AUTO_RESTART_ENABLED === "true",
    restartInterval: process.env.RESTART_CRON || "0 6 * * *", // Daily at 6 AM
  },

  // ===== WEB SERVER =====
  webServer: {
    port: parseInt(process.env.PORT) || 3000,
    enableDashboard: process.env.DASHBOARD_ENABLED !== "false",
  },

  // ===== BETTER STACK MONITORING =====
  monitoring: {
    betterStack: {
      enabled: process.env.BETTER_STACK_ENABLED === "true",
      heartbeatUrl: process.env.BETTER_STACK_HEARTBEAT_URL,
      apiKey: process.env.BETTER_STACK_API_KEY,
      heartbeatInterval: parseInt(process.env.HEARTBEAT_INTERVAL) || 60000, // 1 minute
    },
  },

  // ===== LOGGING =====
  logging: {
    enableTimestamp: true,
    enableConnectionLogs: true,
    enablePacketLogs: false, // Set true để debug
  },

  // ===== MOVEMENT & POSITION TRACKING =====
  movement: {
    // Anti-AFK movement system
    antiAfk: {
      enabled: process.env.ANTI_AFK_ENABLED !== "false", // true by default
      interval: parseInt(process.env.ANTI_AFK_INTERVAL) || 30000, // 30 seconds
      movementRange: parseFloat(process.env.MOVEMENT_RANGE) || 2.0, // blocks
      randomMovement: process.env.RANDOM_MOVEMENT !== "false", // true by default
    },

    // Position tracking
    tracking: {
      enabled: process.env.POSITION_TRACKING_ENABLED !== "false", // true by default
      logMovement: process.env.LOG_MOVEMENT === "true",
      trackOtherPlayers: process.env.TRACK_OTHER_PLAYERS !== "false", // true by default
      maxPlayerHistory: parseInt(process.env.MAX_PLAYER_HISTORY) || 100,
    },

    // Movement statistics
    statistics: {
      enabled: process.env.MOVEMENT_STATS_ENABLED !== "false", // true by default
      trackDistance: process.env.TRACK_DISTANCE !== "false", // true by default
      resetStatsOnRestart: process.env.RESET_STATS_ON_RESTART === "true",
    },
  },

  // ===== SERVER TYPE PRESETS =====
  presets: {
    // Preset cho server crack/offline
    crackServer: {
      isOfflineMode: true,
      skipAuthentication: true,
      username: process.env.BOT_USERNAME || "LOADING99",
    },

    // Preset cho server premium/online
    premiumServer: {
      isOfflineMode: false,
      skipAuthentication: false,
      username: "YourMinecraftUsername", // Thay bằng username thật
    },
  },

  // Compliance and warnings
  compliance: {
    aternosWarning: true,
    riskLevel: "MEDIUM",
    recommendation: "Consider migrating to bot-friendly hosting platform",
    violatedRules: ["§5.2.c.2: Automatically reconnecting after disconnect"],
    legalAlternatives: [
      "Minehut (free, bot-friendly)",
      "FreeMcServer.net (free, bot-friendly)",
      "Server.pro (free, bot-friendly)",
      "Oracle Always Free (full control)",
      "AWS Free Tier (12 months free)",
    ],
  },
};

// ===== QUICK SETUP FUNCTIONS =====

// Sử dụng preset crack server
const useCrackServerPreset = () => {
  const config = module.exports;
  Object.assign(config.bot, config.presets.crackServer);
  console.log("🔧 Using Crack Server preset");
  return config;
};

// Sử dụng preset premium server
const usePremiumServerPreset = () => {
  const config = module.exports;
  Object.assign(config.bot, config.presets.premiumServer);
  console.log("🔧 Using Premium Server preset");
  return config;
};

// Export helper functions
module.exports.useCrackServerPreset = useCrackServerPreset;
module.exports.usePremiumServerPreset = usePremiumServerPreset;

// ===== AUTO SETUP =====
// Tự động dùng crack preset (phổ biến nhất)
useCrackServerPreset();

console.log("📋 Config loaded:", {
  serverType: module.exports.bot.isOfflineMode
    ? "Crack/Offline"
    : "Premium/Online",
  host: module.exports.server.host,
  username: module.exports.bot.username,
});
