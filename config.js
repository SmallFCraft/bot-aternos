// config.js - Cấu hình Bot Aternos Bedrock
module.exports = {
  // ===== SERVER CONFIGURATION =====
  server: {
    host: "Meo_MC403-IFBX.aternos.me",
    port: 33122,
    version: "1.21.70", // Version Bedrock server
  },

  // ===== BOT CONFIGURATION =====
  bot: {
    username: `AFKBOT_${Math.floor(Math.random() * 999)}`,

    // *** QUAN TRỌNG: SERVER TYPE ***
    isOfflineMode: true, // true = Server crack, false = Server premium
    skipAuthentication: true, // Bỏ qua Microsoft authentication

    // Reconnection settings
    maxReconnectAttempts: 15,
    baseReconnectDelay: 5000, // milliseconds
    maxReconnectDelay: 120000, // 2 phút
  },

  // ===== ANTI-AFK SETTINGS =====
  antiAfk: {
    enabled: true,
    interval: 30000, // 30 giây (tăng để tránh spam)
    movementRange: 0.1, // Phạm vi di chuyển nhỏ hơn
    includeJumping: false, // Tắt nhảy để tránh lỗi
    method: "simple", // "simple" hoặc "movement" hoặc "rotation"
    fallbackToKeepalive: true, // Fallback về keepalive nếu movement fail
  },

  // ===== SCHEDULED RESTART =====
  scheduling: {
    autoRestart: true,
    restartInterval: "0 */6 * * *", // Mỗi 6 tiếng (cron format)
  },

  // ===== WEB SERVER =====
  webServer: {
    port: process.env.PORT || 10000, // Render sử dụng port 10000
    enableDashboard: true,
    enableHealthCheck: true,
  },

  // ===== BETTER STACK MONITORING =====
  monitoring: {
    betterStack: {
      enabled: process.env.BETTER_STACK_ENABLED === "true",
      heartbeatUrl: process.env.BETTER_STACK_HEARTBEAT || "",
      apiKey: process.env.BETTER_STACK_API_KEY || "",
      heartbeatInterval: 60000, // 1 phút
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
      username: `AFKBOT_999`,
    },

    // Preset cho server premium/online
    premiumServer: {
      isOfflineMode: false,
      skipAuthentication: false,
      username: "YourMinecraftUsername", // Thay bằng username thật
    },
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
