// index.js - Aternos Bedrock Keep-Alive Bot
const bedrock = require("bedrock-protocol");
const express = require("express");
const cron = require("node-cron");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Import configuration
const config = require("./config");

// Extract configurations for easier access
const SERVER_CONFIG = {
  host: config.server.host,
  port: config.server.port,
  username: config.bot.username,
  version: config.server.version,
  maxReconnectAttempts: config.bot.maxReconnectAttempts,
  isOfflineMode: config.bot.isOfflineMode,
  skipAuthentication: config.bot.skipAuthentication,
};

// Better Stack monitoring
const BETTER_STACK = {
  heartbeatUrl: config.monitoring.betterStack.heartbeatUrl,
  apiKey: config.monitoring.betterStack.apiKey,
  enabled: config.monitoring.betterStack.enabled,
  interval: config.monitoring.betterStack.heartbeatInterval,
};

// Bot status tracking
let botStatus = {
  isConnected: false,
  lastConnected: null,
  lastDisconnected: null,
  reconnectAttempts: 0,
  totalUptime: 0,
  startTime: new Date(),
  serverOnline: false,
  antiAfkActive: false,
  packetsSent: 0,
  packetsReceived: 0,
};

// Express web server để keep repl alive
const app = express();

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Routes
app.get("/", (req, res) => {
  res.json({
    status: "Aternos Bedrock Keep-Alive Bot",
    server: `${SERVER_CONFIG.host}:${SERVER_CONFIG.port}`,
    botStatus: {
      connected: botStatus.isConnected,
      lastConnected: botStatus.lastConnected,
      lastDisconnected: botStatus.lastDisconnected,
      reconnectAttempts: botStatus.reconnectAttempts,
      uptime: Math.floor((Date.now() - botStatus.startTime.getTime()) / 1000),
      antiAfkActive: botStatus.antiAfkActive,
      packetsSent: botStatus.packetsSent,
      packetsReceived: botStatus.packetsReceived,
    },
    serverInfo: SERVER_CONFIG,
  });
});

app.get("/health", (req, res) => {
  // Health check endpoint cho Better Stack
  res.status(botStatus.isConnected ? 200 : 503).json({
    status: botStatus.isConnected ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - botStatus.startTime.getTime()) / 1000),
  });
});

app.get("/restart", (req, res) => {
  res.json({
    message: "Restarting bot...",
    timestamp: new Date().toISOString(),
  });
  restartBot();
});

app.get("/stats", (req, res) => {
  res.json({
    botStatus,
    serverConfig: SERVER_CONFIG,
    betterStackEnabled: BETTER_STACK.enabled,
    antiAfkConfig: config.antiAfk,
    availableMethods: Object.keys(antiAfkMethods),
  });
});

app.get("/change-antiafk/:method", (req, res) => {
  const method = req.params.method;

  if (!antiAfkMethods[method]) {
    return res.status(400).json({
      error: "Invalid method",
      available: Object.keys(antiAfkMethods),
    });
  }

  config.antiAfk.method = method;
  console.log(`🔧 Anti-AFK method changed to: ${method}`);

  // Restart anti-AFK with new method
  if (botStatus.isConnected) {
    stopAntiAFK();
    setTimeout(startAntiAFK, 1000);
  }

  res.json({
    message: `Anti-AFK method changed to: ${method}`,
    newConfig: config.antiAfk,
  });
});

// Dashboard HTML
app.get("/dashboard", (req, res) => {
  const htmlPath = path.join(__dirname, "monitor.html");
  if (fs.existsSync(htmlPath)) {
    res.sendFile(htmlPath);
  } else {
    res.json({ error: "Dashboard not found" });
  }
});

const PORT = config.webServer.port;
app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`❤️ Health check: http://localhost:${PORT}/health`);
});

// Bot variables
let botClient = null;
let reconnectTimeout = null;
let antiAfkInterval = null;
let betterStackInterval = null;

// Better Stack functions
const sendBetterStackHeartbeat = async () => {
  if (!BETTER_STACK.enabled || !BETTER_STACK.heartbeatUrl) return;

  try {
    await axios.get(BETTER_STACK.heartbeatUrl, { timeout: 5000 });
    console.log("💗 Better Stack heartbeat sent");
  } catch (error) {
    console.log(`⚠️ Better Stack heartbeat failed: ${error.message}`);
  }
};

const sendBetterStackAlert = async (message, type = "info") => {
  if (!BETTER_STACK.enabled || !BETTER_STACK.apiKey) return;

  try {
    await axios.post(
      "https://uptime.betterstack.com/api/v1/incidents",
      {
        name: `Aternos Bot: ${message}`,
        summary: message,
        description: `Bot status: ${JSON.stringify(botStatus, null, 2)}`,
        severity: type === "error" ? "critical" : "info",
      },
      {
        headers: {
          Authorization: `Bearer ${BETTER_STACK.apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 5000,
      }
    );

    console.log(`📢 Better Stack alert sent: ${message}`);
  } catch (error) {
    console.log(`⚠️ Better Stack alert failed: ${error.message}`);
  }
};

// Tạo bot connection
const createBot = () => {
  try {
    console.log(
      `🤖 [${new Date().toLocaleTimeString()}] Connecting to ${
        SERVER_CONFIG.host
      }:${SERVER_CONFIG.port}...`
    );
    console.log(
      `🔐 Mode: ${
        SERVER_CONFIG.isOfflineMode ? "Crack/Offline" : "Premium/Online"
      }`
    );
    console.log(`👤 Username: ${SERVER_CONFIG.username}`);

    // Cleanup previous connection
    if (botClient) {
      try {
        botClient.disconnect();
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    botClient = bedrock.createClient({
      host: SERVER_CONFIG.host,
      port: SERVER_CONFIG.port,
      username: SERVER_CONFIG.username,
      version: SERVER_CONFIG.version,
      skipPing: false,
      offline: SERVER_CONFIG.isOfflineMode, // Support cả crack và premium server
      skipAuthentication: SERVER_CONFIG.skipAuthentication,
      conLog: console.log,
    });

    // Bot events
    botClient.on("spawn", () => {
      const now = new Date();
      console.log(
        `✅ [${now.toLocaleTimeString()}] Bot joined server successfully!`
      );

      botStatus.isConnected = true;
      botStatus.lastConnected = now.toISOString();
      botStatus.reconnectAttempts = 0;
      botStatus.serverOnline = true;

      // Start anti-AFK system
      startAntiAFK();

      // Send success alert
      sendBetterStackAlert("Bot connected successfully");
    });

    botClient.on("text", packet => {
      botStatus.packetsReceived++;
      if (packet.message && packet.message.includes("KeepBot")) {
        console.log(`💬 Chat mention: ${packet.message}`);
      }
    });

    botClient.on("disconnect", reason => {
      const now = new Date();
      console.log(
        `❌ [${now.toLocaleTimeString()}] Bot disconnected: ${reason}`
      );

      botStatus.isConnected = false;
      botStatus.lastDisconnected = now.toISOString();

      stopAntiAFK();
      handleDisconnect(reason);
    });

    botClient.on("error", err => {
      console.log(
        `⚠️ [${new Date().toLocaleTimeString()}] Bot error: ${err.message}`
      );

      botStatus.isConnected = false;
      stopAntiAFK();
      handleDisconnect(`Error: ${err.message}`);
    });

    botClient.on("packet", () => {
      botStatus.packetsReceived++;
    });
  } catch (error) {
    console.log(
      `💥 [${new Date().toLocaleTimeString()}] Create bot error: ${
        error.message
      }`
    );
    handleDisconnect(`Create error: ${error.message}`);
  }
};

// Anti-AFK Methods - Multiple approaches để tránh lỗi BigInt
const antiAfkMethods = {
  // Method 1: Simple keepalive (safest - no packets)
  simple: () => {
    try {
      console.log(
        `💓 [${new Date().toLocaleTimeString()}] Anti-AFK keepalive (simple method)`
      );
      botStatus.packetsSent++;
      return true;
    } catch (error) {
      console.log(`⚠️ Simple method error: ${error.message}`);
      return false;
    }
  },

  // Method 2: Rotation only (safer than movement)
  rotation: () => {
    try {
      if (!botClient.write) return false;

      const yaw = Math.random() * 360;
      const pitch = (Math.random() - 0.5) * 30;

      // Try basic rotation without BigInt
      botClient.write("move_player", {
        runtime_id: 1,
        position: { x: 0, y: 64, z: 0 },
        pitch: pitch,
        yaw: yaw,
        head_yaw: yaw,
        mode: 0,
        on_ground: true,
        riding_runtime_id: 0,
        teleport: { cause: 0, source_entity_type: 0 },
        tick: Date.now(),
      });

      console.log(
        `🔄 [${new Date().toLocaleTimeString()}] Anti-AFK rotation sent`
      );
      botStatus.packetsSent++;
      return true;
    } catch (error) {
      console.log(`⚠️ Rotation method error: ${error.message}`);
      return false;
    }
  },

  // Method 3: Connection ping (very safe)
  ping: () => {
    try {
      if (botClient && botClient.socket && botClient.socket.writable) {
        // Just maintain connection without sending complex packets
        console.log(
          `🏓 [${new Date().toLocaleTimeString()}] Anti-AFK connection ping`
        );
        botStatus.packetsSent++;
        return true;
      }
      return false;
    } catch (error) {
      console.log(`⚠️ Ping method error: ${error.message}`);
      return false;
    }
  },

  // Method 4: Minimal movement (for stable servers)
  minimal_movement: () => {
    try {
      if (!botClient.write) return false;

      // Very small, safe movement
      const smallX = (Math.random() - 0.5) * 0.01; // Very small movement
      const smallZ = (Math.random() - 0.5) * 0.01;

      botClient.write("move_player", {
        runtime_id: 1, // Use simple number instead of BigInt
        position: {
          x: smallX,
          y: 64,
          z: smallZ,
        },
        pitch: 0,
        yaw: 0,
        head_yaw: 0,
        mode: 0,
        on_ground: true,
        riding_runtime_id: 0,
        teleport: { cause: 0, source_entity_type: 0 },
        tick: Date.now(), // Use simple number
      });

      console.log(
        `🚶 [${new Date().toLocaleTimeString()}] Anti-AFK minimal movement sent`
      );
      botStatus.packetsSent++;
      return true;
    } catch (error) {
      console.log(`⚠️ Minimal movement error: ${error.message}`);
      return false;
    }
  },
};

// Anti-AFK system với multiple fallback methods
const startAntiAFK = () => {
  stopAntiAFK(); // Clear existing interval

  botStatus.antiAfkActive = true;
  const method = config.antiAfk.method || "simple";
  console.log(`🏃 Starting anti-AFK system (${method} method)...`);

  antiAfkInterval = setInterval(() => {
    if (!botStatus.isConnected || !botClient) {
      stopAntiAFK();
      return;
    }

    let success = false;

    // Try primary method first
    if (antiAfkMethods[method]) {
      success = antiAfkMethods[method]();
    }

    // If primary method fails, try fallback methods in order
    if (!success && config.antiAfk.fallbackToKeepalive) {
      console.log(`🔄 Primary method failed, trying fallbacks...`);

      const fallbackOrder = ["simple", "ping", "rotation", "minimal_movement"];

      for (const fallbackMethod of fallbackOrder) {
        if (fallbackMethod !== method && antiAfkMethods[fallbackMethod]) {
          console.log(`🔄 Trying fallback: ${fallbackMethod}`);
          if (antiAfkMethods[fallbackMethod]()) {
            success = true;
            break;
          }
        }
      }
    }

    // If all methods fail, just log that we're still connected
    if (!success) {
      console.log(
        `💗 [${new Date().toLocaleTimeString()}] Anti-AFK: Connection maintained (all packet methods failed)`
      );
    }
  }, config.antiAfk.interval);
};

const stopAntiAFK = () => {
  if (antiAfkInterval) {
    clearInterval(antiAfkInterval);
    antiAfkInterval = null;
    botStatus.antiAfkActive = false;
    console.log("⏹️ Anti-AFK system stopped");
  }
};

// Handle disconnect và reconnect
const handleDisconnect = (reason = "Unknown") => {
  botStatus.reconnectAttempts++;

  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }

  // Exponential backoff: 5s, 10s, 20s, 40s, max 2 phút
  const baseDelay = 5000;
  const maxDelay = 120000;
  const delay = Math.min(
    baseDelay * Math.pow(2, Math.min(botStatus.reconnectAttempts - 1, 5)),
    maxDelay
  );

  console.log(
    `🔄 [${new Date().toLocaleTimeString()}] Reconnecting in ${
      delay / 1000
    }s... (Attempt ${botStatus.reconnectAttempts}/${
      SERVER_CONFIG.maxReconnectAttempts
    })`
  );
  console.log(`📋 Disconnect reason: ${reason}`);

  // Send alert if too many reconnect attempts
  if (botStatus.reconnectAttempts >= 5) {
    sendBetterStackAlert(
      `Bot struggling to connect (${botStatus.reconnectAttempts} attempts)`,
      "error"
    );
  }

  // Give up after max attempts
  if (botStatus.reconnectAttempts >= SERVER_CONFIG.maxReconnectAttempts) {
    console.log(`💀 Max reconnect attempts reached. Stopping bot.`);
    sendBetterStackAlert("Bot stopped after max reconnect attempts", "error");
    return;
  }

  reconnectTimeout = setTimeout(() => {
    createBot();
  }, delay);
};

// Manual restart
const restartBot = () => {
  console.log(
    `🔄 [${new Date().toLocaleTimeString()}] Manual restart triggered`
  );

  stopAntiAFK();

  if (botClient) {
    try {
      botClient.disconnect();
    } catch (error) {
      console.log(`⚠️ Disconnect error: ${error.message}`);
    }
  }

  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }

  botStatus.reconnectAttempts = 0;
  setTimeout(createBot, 3000);

  sendBetterStackAlert("Bot manually restarted");
};

// Scheduled operations
// Restart bot theo lịch để tránh memory leaks
if (config.scheduling.autoRestart) {
  cron.schedule(config.scheduling.restartInterval, () => {
    console.log(`⏰ [${new Date().toLocaleTimeString()}] Scheduled restart`);
    restartBot();
  });
}

// Better Stack heartbeat
if (BETTER_STACK.enabled) {
  betterStackInterval = setInterval(
    sendBetterStackHeartbeat,
    BETTER_STACK.interval
  );
  console.log(
    `💗 Better Stack heartbeat enabled (${
      BETTER_STACK.interval / 1000
    }s interval)`
  );
}

// Cleanup functions
const cleanup = () => {
  console.log(`🛑 [${new Date().toLocaleTimeString()}] Shutting down bot...`);

  stopAntiAFK();

  if (betterStackInterval) {
    clearInterval(betterStackInterval);
  }

  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }

  if (botClient) {
    try {
      botClient.disconnect();
    } catch (error) {
      console.log(`⚠️ Cleanup disconnect error: ${error.message}`);
    }
  }

  sendBetterStackAlert("Bot shutting down");

  setTimeout(() => {
    process.exit(0);
  }, 2000);
};

// Process event handlers
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("uncaughtException", error => {
  console.log(`💥 Uncaught exception: ${error.message}`);
  console.log(error.stack);
  sendBetterStackAlert(`Uncaught exception: ${error.message}`, "error");
});

process.on("unhandledRejection", (reason, promise) => {
  console.log(`💥 Unhandled rejection: ${reason}`);
  sendBetterStackAlert(`Unhandled rejection: ${reason}`, "error");
});

// Start the bot
console.log("🚀 Starting Aternos Bedrock Keep-Alive Bot...");
console.log(`📋 Server: ${SERVER_CONFIG.host}:${SERVER_CONFIG.port}`);
console.log(`🎮 Version: ${SERVER_CONFIG.version}`);
console.log(`👤 Username: ${SERVER_CONFIG.username}`);
console.log(
  `💗 Better Stack: ${BETTER_STACK.enabled ? "Enabled" : "Disabled"}`
);
console.log(`⏰ Start time: ${botStatus.startTime.toLocaleString()}`);

// Initial connection
createBot();
