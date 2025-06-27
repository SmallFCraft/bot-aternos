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
    username: process.env.BOT_USERNAME || "KeepBot_403",
    maxReconnectAttempts: parseInt(process.env.MAX_RECONNECT_ATTEMPTS) || 50,
    isOfflineMode: process.env.OFFLINE_MODE === "true", // Crack server support
    skipAuthentication: process.env.SKIP_AUTH === "true",
  },

  // ===== ANTI-AFK SETTINGS =====
  antiAfk: {
    enabled: process.env.ANTI_AFK_ENABLED !== "false",
    interval: parseInt(process.env.ANTI_AFK_INTERVAL) || 45000, // 45 seconds
    method: process.env.ANTI_AFK_METHOD || "verified_chat", // Server-verified method
    fallbackToKeepalive: process.env.FALLBACK_ENABLED !== "false",

    // Available methods (prioritizing server-verified approaches)
    availableMethods: [
      "verified_chat", // Most reliable - chat with server verification
      "verified_command", // Very effective - commands with response validation
      "player_action_verified", // Good - proper Bedrock player actions
      "connection_heartbeat", // Basic - UDP socket maintenance
      "gentle_movement_tracked", // Limited - movement with position tracking
      "simple_presence", // Fallback - basic presence
    ],

    // Important notes about Bedrock server communication
    notes: [
      "Bedrock edition uses UDP protocol - packets may be dropped",
      "Server verification ensures packets actually reach the server",
      "Chat messages and commands provide the best verification",
      "Movement packets are often ignored without manual interaction",
      "Bot must be properly spawned for packets to be processed",
    ],

    // Verification settings
    verification: {
      enabled: true,
      timeoutMs: 4000, // How long to wait for server response
      trackFailures: true,
      maxConsecutiveFailures: 3,
    },
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
    enableAntiAfkLogs: true,
    enableConnectionLogs: true,
    enablePacketLogs: false, // Set true để debug
  },

  // ===== SERVER TYPE PRESETS =====
  presets: {
    // Preset cho server crack/offline
    crackServer: {
      isOfflineMode: true,
      skipAuthentication: true,
      username: `LOADING99_${Math.floor(Math.random() * 999)}`,
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
    riskLevel: "HIGH",
    recommendation: "Consider migrating to bot-friendly hosting platform",
    violatedRules: [
      "§5.2.c.1: Using fake players (bots)",
      "§5.2.c.2: Automatically reconnecting after disconnect",
      "§5.2.c.3: Faking player activity",
    ],
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
