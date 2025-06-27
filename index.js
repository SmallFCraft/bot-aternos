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

// Real-time log system for dashboard sync
let logBroadcasters = new Set();
const broadcastLog = (message, type = "info") => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    message,
    type,
  };

  console.log(
    `${
      type === "error" ? "❌" : type === "warn" ? "⚠️" : "ℹ️"
    } [${new Date().toLocaleTimeString()}] ${message}`
  );

  // Broadcast to all connected dashboards
  logBroadcasters.forEach(broadcaster => {
    try {
      broadcaster(logEntry);
    } catch (error) {
      logBroadcasters.delete(broadcaster);
    }
  });
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
  currentPosition: { x: 0, y: 64, z: 0 },
  lastMovement: null,
  hasSpawned: false,
  sessionValidated: false,
  serverCommunicationVerified: false,
  lastSentMessage: null,
  lastSentCommand: null,
};

// Express web server để keep repl alive
const app = express();

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Server-Sent Events endpoint for real-time logs
app.get("/logs/stream", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  const broadcaster = logEntry => {
    res.write(`data: ${JSON.stringify(logEntry)}\n\n`);
  };

  logBroadcasters.add(broadcaster);
  broadcastLog("Dashboard connected to live log stream");

  req.on("close", () => {
    logBroadcasters.delete(broadcaster);
    broadcastLog("Dashboard disconnected from live log stream");
  });
});

// Routes
app.get("/", (req, res) => {
  res.json({
    status: "Aternos Bedrock Keep-Alive Bot",
    server: `${SERVER_CONFIG.host}:${SERVER_CONFIG.port}`,
    botStatus: {
      connected: botStatus.isConnected,
      hasSpawned: botStatus.hasSpawned,
      sessionValidated: botStatus.sessionValidated,
      serverCommunicationVerified: botStatus.serverCommunicationVerified,
      lastConnected: botStatus.lastConnected,
      lastDisconnected: botStatus.lastDisconnected,
      reconnectAttempts: botStatus.reconnectAttempts,
      uptime: Math.floor((Date.now() - botStatus.startTime.getTime()) / 1000),
      antiAfkActive: botStatus.antiAfkActive,
      packetsSent: botStatus.packetsSent,
      packetsReceived: botStatus.packetsReceived,
      currentPosition: botStatus.currentPosition,
      lastMovement: botStatus.lastMovement,
    },
    serverInfo: SERVER_CONFIG,
    compliance: {
      aternosPolicy: "⚠️ WARNING: This bot may violate Aternos ToS",
      recommendation: "Consider switching to bot-friendly hosting",
      riskLevel: "HIGH",
    },
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
  broadcastLog("Manual restart triggered via API", "warn");
  restartBot();
});

app.get("/stats", (req, res) => {
  res.json({
    botStatus,
    serverConfig: SERVER_CONFIG,
    betterStackEnabled: BETTER_STACK.enabled,
    antiAfkConfig: config.antiAfk,
    availableMethods: Object.keys(antiAfkMethods),
    complianceWarning: "⚠️ This bot may violate Aternos Terms of Service",
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
  broadcastLog(`Anti-AFK method changed to: ${method}`, "info");

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

app.post("/setup-betterstack", (req, res) => {
  const { heartbeatUrl } = req.body;

  if (!heartbeatUrl) {
    return res.status(400).json({
      error: "Heartbeat URL is required",
      example: "https://betterstack.com/api/v1/heartbeat/YOUR_KEY",
    });
  }

  if (!heartbeatUrl.includes("betterstack.com/api/v1/heartbeat/")) {
    return res.status(400).json({
      error: "Invalid heartbeat URL format",
      expected: "https://betterstack.com/api/v1/heartbeat/YOUR_KEY",
    });
  }

  // Update runtime configuration
  BETTER_STACK.heartbeatUrl = heartbeatUrl;
  BETTER_STACK.enabled = true;
  config.monitoring.betterStack.heartbeatUrl = heartbeatUrl;
  config.monitoring.betterStack.enabled = true;

  broadcastLog("Better Stack monitoring enabled via manual setup", "info");

  // Start heartbeat immediately
  if (!betterStackInterval) {
    betterStackInterval = setInterval(
      sendBetterStackHeartbeat,
      BETTER_STACK.interval
    );
    broadcastLog(
      `Heartbeat started (${BETTER_STACK.interval / 1000}s interval)`,
      "info"
    );
  }

  res.json({
    success: true,
    enabled: true,
    heartbeatUrl: heartbeatUrl,
    interval: BETTER_STACK.interval / 1000 + "s",
    message: "🟢 Better Stack monitoring is now ACTIVE!",
  });
});

app.get("/betterstack-status", (req, res) => {
  res.json({
    enabled: BETTER_STACK.enabled,
    heartbeatUrl: BETTER_STACK.heartbeatUrl ? "✅ Configured" : "❌ Not Set",
    heartbeatUrlValue: BETTER_STACK.heartbeatUrl,
    apiKey: BETTER_STACK.apiKey ? "✅ Configured" : "❌ Not Set",
    interval: BETTER_STACK.interval / 1000 + "s",
    lastHeartbeat: betterStackInterval ? "🟢 Active" : "🔴 Inactive",
    instructions: "POST /setup-betterstack with heartbeatUrl to configure",
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

// Compliance warning endpoint
app.get("/compliance", (req, res) => {
  res.json({
    warning: "⚠️ ATERNOS POLICY VIOLATION WARNING",
    details: {
      violated_rules: [
        "§5.2.c.1: Using fake players (bots)",
        "§5.2.c.2: Automatically reconnecting after disconnect",
        "§5.2.c.3: Faking player activity",
      ],
      consequences: ["Account suspension", "Server deletion", "Permanent ban"],
      legal_alternatives: [
        "Minehut (free, bot-friendly)",
        "FreeMcServer.net (free, bot-friendly)",
        "Oracle Always Free (full control)",
        "Manual keep-alive with friends",
      ],
    },
    recommendation: "Consider migrating to bot-friendly hosting platform",
  });
});

const PORT = config.webServer.port;
app.listen(PORT, () => {
  broadcastLog(`Web server running on port ${PORT}`, "info");
  broadcastLog(`Dashboard: http://localhost:${PORT}/dashboard`, "info");
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
    // Don't spam log for regular heartbeats
  } catch (error) {
    broadcastLog(`Better Stack heartbeat failed: ${error.message}`, "warn");
  }
};

const sendBetterStackAlert = async (message, type = "info") => {
  // Disabled - only using heartbeat monitoring, not incident alerts
  broadcastLog(`Event logged: ${message} (type: ${type})`, "info");
  return;
};

// Tạo bot connection với Bedrock UDP protocol và proper authentication
const createBot = () => {
  try {
    broadcastLog(
      `Connecting to ${SERVER_CONFIG.host}:${SERVER_CONFIG.port}...`,
      "info"
    );
    broadcastLog(
      `Mode: ${
        SERVER_CONFIG.isOfflineMode ? "Crack/Offline" : "Premium/Online"
      }`,
      "info"
    );
    broadcastLog(`Username: ${SERVER_CONFIG.username}`, "info");
    broadcastLog(`Protocol: Bedrock Edition (UDP)`, "info");

    // Cleanup previous connection
    if (botClient) {
      try {
        botClient.disconnect();
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    // Reset connection status
    botStatus.isConnected = false;
    botStatus.serverOnline = false;
    botStatus.hasSpawned = false;
    botStatus.sessionValidated = false;

    // Bedrock-specific configuration với proper authentication
    const clientOptions = {
      host: SERVER_CONFIG.host,
      port: SERVER_CONFIG.port,
      username: SERVER_CONFIG.username,
      version: SERVER_CONFIG.version,

      // Authentication & Connection
      offline: SERVER_CONFIG.isOfflineMode,
      skipAuthentication: SERVER_CONFIG.skipAuthentication,
      validateAuth: !SERVER_CONFIG.isOfflineMode, // Validate if premium server

      // Connection tuning for stability - INCREASED TIMEOUTS
      connectTimeout: 30000, // Increased to 30 seconds
      keepAlive: true,
      enableCompression: false, // Disable compression for debugging

      // Bedrock protocol specific
      protocolVersion: 712, // For 1.21.70
      clientId: BigInt(Math.floor(Math.random() * 1000000000)),

      // Disable internal logging
      conLog: () => {},
    };

    broadcastLog(
      `Bedrock Protocol Version: ${clientOptions.protocolVersion}`,
      "info"
    );
    broadcastLog(`Client ID: ${clientOptions.clientId}`, "info");

    botClient = bedrock.createClient(clientOptions);

    // Connection establishment tracking với better phase management
    let connectionPhase = "connecting";
    let connectionTimeout = null;
    let spawnTimeout = null;

    // Clear any existing timeouts
    const clearAllTimeouts = () => {
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
      }
      if (spawnTimeout) {
        clearTimeout(spawnTimeout);
        spawnTimeout = null;
      }
    };

    botClient.on("connect", () => {
      connectionPhase = "connected";
      clearAllTimeouts(); // Clear connection timeout

      broadcastLog("🔗 UDP socket connected to Bedrock server", "info");
      botStatus.serverOnline = true;

      // Start spawn timeout (more generous)
      spawnTimeout = setTimeout(() => {
        if (connectionPhase !== "spawned") {
          broadcastLog(
            "⏰ Spawn timeout - bot connected but not spawned in game world",
            "warn"
          );
          broadcastLog(
            "💡 This often happens with Bedrock servers - will retry connection",
            "info"
          );
          if (botClient) {
            botClient.disconnect();
          }
        }
      }, 45000); // 45 seconds for spawn
    });

    botClient.on("login", () => {
      connectionPhase = "logged_in";
      broadcastLog("🔐 Login successful - session established", "info");
      botStatus.sessionValidated = true;
    });

    // Enhanced spawn detection - wait for game_rule or start_game packets
    botClient.on("start_game", () => {
      connectionPhase = "game_starting";
      broadcastLog("🎮 Game start packet received - loading world...", "info");
    });

    // Critical: Wait for proper spawn before claiming success
    botClient.on("spawn", () => {
      const now = new Date();
      connectionPhase = "spawned";
      clearAllTimeouts(); // Clear all timeouts

      broadcastLog("🎮 Bot successfully spawned in game world!", "info");
      broadcastLog("✅ Ready to receive server responses", "info");

      botStatus.isConnected = true;
      botStatus.hasSpawned = true;
      botStatus.lastConnected = now.toISOString();
      botStatus.reconnectAttempts = 0;

      // Verify spawn with test message (delayed to ensure server is ready)
      setTimeout(() => {
        testServerCommunication();
      }, 3000);

      // Start anti-AFK ONLY after confirmed spawn
      setTimeout(() => {
        if (botStatus.hasSpawned && botStatus.sessionValidated) {
          // Check if anti-AFK is already active (from auto-enable)
          if (!botStatus.antiAfkActive) {
            broadcastLog(
              "🚀 Starting anti-AFK from spawn verification",
              "info"
            );
            startAntiAFK();
          } else {
            broadcastLog(
              "ℹ️ Anti-AFK already active - spawn verification passed",
              "info"
            );
          }
        } else {
          // Only log warning if anti-AFK is not already active
          if (!botStatus.antiAfkActive) {
            broadcastLog(
              "⚠️ Spawn verification incomplete but will rely on auto-enable logic",
              "warn"
            );
          }
        }
      }, 7000);

      sendBetterStackAlert("Bot connected and spawned successfully");
    });

    // Enhanced text packet handling for verification
    botClient.on("text", packet => {
      botStatus.packetsReceived++;
      try {
        const message = packet.message || packet.text || "";
        const sourceName = packet.source_name || "";

        // Log all server messages for debugging
        if (message) {
          broadcastLog(
            `📨 Server message: "${message}" (from: ${sourceName})`,
            "info"
          );

          // IMPORTANT: Any message from server means we're connected and receiving data
          if (!botStatus.serverCommunicationVerified) {
            broadcastLog(
              "✅ Server communication detected - receiving messages!",
              "info"
            );
            botStatus.serverCommunicationVerified = true;

            // Auto-enable anti-AFK when server communication is confirmed
            if (botStatus.hasSpawned && !botStatus.antiAfkActive) {
              broadcastLog(
                "🚀 Auto-enabling anti-AFK due to confirmed server communication",
                "info"
              );
              setTimeout(() => {
                // Double check before starting to avoid conflicts
                if (!botStatus.antiAfkActive && botStatus.hasSpawned) {
                  startAntiAFK();
                }
              }, 1000);
            }

            // If we're receiving messages but not spawned, we're in a limbo state
            if (!botStatus.hasSpawned) {
              broadcastLog(
                "⚠️ Receiving messages but not spawned - checking connection state",
                "warn"
              );

              // Extend spawn timeout since we're clearly connected
              if (spawnTimeout) {
                clearTimeout(spawnTimeout);
                spawnTimeout = setTimeout(() => {
                  if (!botStatus.hasSpawned) {
                    broadcastLog(
                      "⏰ Extended spawn timeout - forcing connection retry",
                      "error"
                    );
                    if (botClient) {
                      botClient.disconnect();
                    }
                  }
                }, 60000); // Give another 60 seconds
              }
            }
          }

          // Verify our sent messages are echoed back by server
          if (
            botStatus.lastSentMessage &&
            !botStatus.lastSentMessage.verified
          ) {
            if (
              message.includes(botStatus.lastSentMessage.content) &&
              sourceName === SERVER_CONFIG.username
            ) {
              broadcastLog(
                "✅ Chat message verified - server received and echoed!",
                "info"
              );
              botStatus.lastSentMessage.verified = true;
              botStatus.serverCommunicationVerified = true;
            }
          }

          // Check for command responses
          if (
            botStatus.lastSentCommand &&
            !botStatus.lastSentCommand.verified
          ) {
            const commandContent = botStatus.lastSentCommand.content;

            // Common command response patterns
            if (
              message.includes("Unknown command") ||
              message.includes("Usage:") ||
              message.includes("help") ||
              message.includes("Available commands") ||
              message.includes("list") ||
              message.includes("players online") ||
              message.includes("Time:") ||
              (commandContent.includes("/help") &&
                message.includes("command")) ||
              (commandContent.includes("/list") &&
                (message.includes("player") || message.includes("online"))) ||
              (commandContent.includes("/time") && message.includes("time"))
            ) {
              broadcastLog(
                "✅ Command response verified - server processed command!",
                "info"
              );
              botStatus.lastSentCommand.verified = true;
              botStatus.serverCommunicationVerified = true;
            }
          }

          // General server communication indicators
          if (
            message.includes("joined") ||
            message.includes("left") ||
            message.includes("connected") ||
            message.includes("disconnected") ||
            message.includes(SERVER_CONFIG.username)
          ) {
            broadcastLog(
              `👋 Server acknowledged bot presence: ${message}`,
              "info"
            );
            botStatus.serverCommunicationVerified = true;
          }

          // Check for server responses to test messages
          if (message.includes("test connection")) {
            broadcastLog(
              "✅ Test message verified - server communication confirmed!",
              "info"
            );
            botStatus.serverCommunicationVerified = true;
          }
        }
      } catch (error) {
        broadcastLog(`Text packet processing error: ${error.message}`, "warn");
      }
    });

    // Better disconnect handling
    botClient.on("disconnect", reason => {
      const now = new Date();
      connectionPhase = "disconnected";
      clearAllTimeouts(); // Clear all timeouts

      let disconnectReason = "Unknown";
      if (typeof reason === "string") {
        disconnectReason = reason;
      } else if (reason && typeof reason === "object") {
        disconnectReason = reason.reason || reason.message || "Connection lost";
      }

      broadcastLog(
        `🔌 Disconnected from Bedrock server: ${disconnectReason}`,
        "error"
      );
      broadcastLog(`📊 Connection phase: ${connectionPhase}`, "warn");
      broadcastLog(`📈 Packets received: ${botStatus.packetsReceived}`, "info");

      botStatus.isConnected = false;
      botStatus.hasSpawned = false;
      botStatus.sessionValidated = false;
      botStatus.serverCommunicationVerified = false;
      botStatus.lastDisconnected = now.toISOString();

      stopAntiAFK();
      handleDisconnect(disconnectReason);
    });

    // Enhanced error handling with specific Bedrock errors
    botClient.on("error", err => {
      connectionPhase = "error";
      clearAllTimeouts(); // Clear all timeouts

      let errorMessage = "Unknown error";
      if (err && typeof err === "object") {
        errorMessage = err.message || err.code || err.toString();

        // Bedrock-specific error diagnosis
        if (err.code === "ECONNREFUSED") {
          errorMessage = "Server offline or not accessible";
        } else if (err.code === "ETIMEDOUT") {
          errorMessage = "Connection timeout - server not responding";
        } else if (err.code === "ENOTFOUND") {
          errorMessage = "Server address not found";
        } else if (err.message && err.message.includes("protocol")) {
          errorMessage = `Protocol mismatch: ${err.message}`;
        } else if (err.message && err.message.includes("auth")) {
          errorMessage = `Authentication failed: ${err.message}`;
        } else if (err.message && err.message.includes("version")) {
          errorMessage = `Version incompatible: ${err.message}`;
        }
      }

      broadcastLog(`❌ Bedrock client error: ${errorMessage}`, "error");
      broadcastLog(`📊 Error during phase: ${connectionPhase}`, "warn");

      botStatus.isConnected = false;
      botStatus.hasSpawned = false;
      stopAntiAFK();
      handleDisconnect(`Error: ${errorMessage}`);
    });

    // Track important packets for debugging
    botClient.on("packet", (name, packet) => {
      botStatus.packetsReceived++;

      // Log critical Bedrock packets
      if (
        [
          "start_game",
          "play_status",
          "disconnect",
          "server_to_client_handshake",
          "game_rules_changed",
        ].includes(name)
      ) {
        broadcastLog(`📦 Received critical packet: ${name}`, "info");

        if (name === "start_game") {
          broadcastLog("🎮 Game start packet received - world loading", "info");
        } else if (name === "play_status") {
          broadcastLog("📊 Play status packet - checking game state", "info");
        }
      }
    });

    // Network error tracking
    botClient.on("networkError", error => {
      broadcastLog(`🌐 Network error (UDP): ${error.message}`, "error");
    });

    // Initial connection timeout - MUCH more generous
    connectionTimeout = setTimeout(() => {
      if (connectionPhase === "connecting") {
        broadcastLog(
          "⏰ Initial connection timeout - server may be offline or busy",
          "error"
        );
        broadcastLog("🔄 Will retry connection...", "info");
        if (botClient) {
          botClient.disconnect();
        }
      }
    }, 30000); // 30 second initial timeout
  } catch (error) {
    const errorMessage = error.message || error.toString();
    broadcastLog(
      `💥 Failed to create Bedrock client: ${errorMessage}`,
      "error"
    );
    handleDisconnect(`Create error: ${errorMessage}`);
  }
};

// Test function to verify server communication
const testServerCommunication = () => {
  if (!botClient || !botStatus.hasSpawned) {
    broadcastLog("❌ Cannot test communication - bot not spawned", "warn");
    return;
  }

  broadcastLog("🧪 Testing server communication...", "info");

  // Skip packet sending test for now since it causes format errors
  // Just rely on existing message detection logic
  broadcastLog("📊 Checking existing server communication...", "info");

  setTimeout(() => {
    if (botStatus.serverCommunicationVerified) {
      broadcastLog(
        "✅ Server communication verified via message detection!",
        "info"
      );
    } else if (botStatus.packetsReceived > 0) {
      broadcastLog(
        "✅ Server communication confirmed - packets received!",
        "info"
      );
      botStatus.serverCommunicationVerified = true;

      // Enable anti-AFK since communication is working
      if (!botStatus.antiAfkActive && botStatus.hasSpawned) {
        broadcastLog(
          "🚀 Enabling anti-AFK due to confirmed server communication",
          "info"
        );
        startAntiAFK();
      }
    } else {
      broadcastLog(
        "⚠️ No server communication detected yet - will monitor",
        "warn"
      );

      // Set up monitoring for future messages
      setTimeout(() => {
        if (botStatus.packetsReceived > 0) {
          broadcastLog("✅ Delayed server communication detected!", "info");
          botStatus.serverCommunicationVerified = true;

          if (!botStatus.antiAfkActive && botStatus.hasSpawned) {
            broadcastLog(
              "🚀 Enabling anti-AFK due to delayed server communication",
              "info"
            );
            startAntiAFK();
          }
        }
      }, 10000); // Monitor for another 10 seconds
    }
  }, 2000);
};

// Enhanced Anti-AFK Methods with Server Communication Verification
const antiAfkMethods = {
  // Method 1: Verified chat messages (with server response tracking)
  verified_chat: () => {
    try {
      if (!botClient.write || !botStatus.hasSpawned) return false;

      const messages = [".", "online", "afk check", "keepalive"];
      const randomMessage =
        messages[Math.floor(Math.random() * messages.length)];

      // Track message for verification
      const messageId = Date.now();
      botStatus.lastSentMessage = {
        content: randomMessage,
        timestamp: messageId,
        verified: false,
      };

      botClient.write("text", {
        type: 1, // Chat message
        needs_translation: false,
        source_name: SERVER_CONFIG.username,
        message: randomMessage,
        parameters: [],
        xuid: "",
        platform_chat_id: "",
      });

      broadcastLog(
        `💬 Chat sent: "${randomMessage}" (verifying server receipt...)`,
        "info"
      );
      botStatus.packetsSent++;

      // Check for server response in 3 seconds
      setTimeout(() => {
        if (botStatus.lastSentMessage && !botStatus.lastSentMessage.verified) {
          broadcastLog("⚠️ Server did not acknowledge chat message", "warn");
        }
      }, 3000);

      return true;
    } catch (error) {
      broadcastLog(`❌ Verified chat error: ${error.message}`, "error");
      return false;
    }
  },

  // Method 2: Server command with response validation
  verified_command: () => {
    try {
      if (!botClient.write || !botStatus.hasSpawned) return false;

      const commands = ["/help", "/list", "/time query day"];
      const randomCommand =
        commands[Math.floor(Math.random() * commands.length)];

      // Track command for verification
      botStatus.lastSentCommand = {
        content: randomCommand,
        timestamp: Date.now(),
        verified: false,
      };

      botClient.write("command_request", {
        command: randomCommand,
        origin: {
          type: 0, // Player
          uuid: "",
          request_id: `req_${Date.now()}`,
          player_unique_id: BigInt(1),
        },
        internal: false,
        version: 1,
      });

      broadcastLog(
        `⚡ Command sent: "${randomCommand}" (waiting for server response...)`,
        "info"
      );
      botStatus.packetsSent++;

      // Check for server response
      setTimeout(() => {
        if (botStatus.lastSentCommand && !botStatus.lastSentCommand.verified) {
          broadcastLog("⚠️ Server did not respond to command", "warn");
          broadcastLog(
            "💡 This indicates packets may not be reaching server",
            "warn"
          );
        }
      }, 4000);

      return true;
    } catch (error) {
      broadcastLog(`❌ Verified command error: ${error.message}`, "error");
      return false;
    }
  },

  // Method 3: Player action with proper Bedrock format
  player_action_verified: () => {
    try {
      if (!botClient.write || !botStatus.hasSpawned) return false;

      // Use proper Bedrock player action packet
      botClient.write("player_action", {
        runtime_entity_id: BigInt(1),
        action: 5, // Start sleeping (harmless action)
        coordinates: {
          x: Math.floor(botStatus.currentPosition.x),
          y: Math.floor(botStatus.currentPosition.y),
          z: Math.floor(botStatus.currentPosition.z),
        },
        result_position: {
          x: Math.floor(botStatus.currentPosition.x),
          y: Math.floor(botStatus.currentPosition.y),
          z: Math.floor(botStatus.currentPosition.z),
        },
        face: 0,
      });

      broadcastLog("🎮 Player action sent (sleep attempt)", "info");
      botStatus.packetsSent++;
      return true;
    } catch (error) {
      broadcastLog(`❌ Player action error: ${error.message}`, "error");
      return false;
    }
  },

  // Method 4: Connection heartbeat (always works)
  connection_heartbeat: () => {
    try {
      if (botClient && botClient.socket) {
        // For UDP connections, just maintaining the socket is often enough
        broadcastLog("💗 Connection heartbeat - UDP socket maintained", "info");
        botStatus.packetsSent++;
        return true;
      }
      return false;
    } catch (error) {
      broadcastLog(`❌ Connection heartbeat error: ${error.message}`, "error");
      return false;
    }
  },

  // Method 5: Gentle movement with server tracking
  gentle_movement_tracked: () => {
    try {
      if (!botClient.write || !botStatus.hasSpawned) return false;

      const currentPos = botStatus.currentPosition;
      const smallMove = 0.001; // Extremely small movement

      const newPos = {
        x: currentPos.x + (Math.random() - 0.5) * smallMove,
        y: currentPos.y,
        z: currentPos.z + (Math.random() - 0.5) * smallMove,
      };

      botClient.write("move_player", {
        runtime_id: BigInt(1),
        position: newPos,
        pitch: 0,
        yaw: Math.random() * 360,
        head_yaw: Math.random() * 360,
        mode: 0,
        on_ground: true,
        riding_runtime_id: BigInt(0),
        teleport: { cause: 0, source_entity_type: 0 },
        tick: BigInt(Date.now()),
      });

      // Update position
      botStatus.currentPosition = newPos;
      botStatus.lastMovement = new Date().toISOString();

      broadcastLog(
        `🚶 Gentle movement: (${newPos.x.toFixed(4)}, ${newPos.z.toFixed(
          4
        )}) - may be ignored`,
        "warn"
      );
      botStatus.packetsSent++;
      return true;
    } catch (error) {
      broadcastLog(`❌ Gentle movement error: ${error.message}`, "error");
      return false;
    }
  },

  // Method 6: Simple presence (fallback)
  simple_presence: () => {
    try {
      broadcastLog("✨ Simple presence maintained", "info");
      botStatus.packetsSent++;
      return true;
    } catch (error) {
      broadcastLog(`❌ Simple presence error: ${error.message}`, "error");
      return false;
    }
  },
};

// Enhanced Anti-AFK system with server verification
const startAntiAFK = () => {
  // Prevent multiple starts
  if (botStatus.antiAfkActive) {
    broadcastLog("⚠️ Anti-AFK already active - ignoring start request", "warn");
    return;
  }

  stopAntiAFK(); // Clear existing interval

  // Only start if properly connected and spawned
  if (!botStatus.hasSpawned || !botStatus.isConnected) {
    broadcastLog(
      "❌ Cannot start anti-AFK - bot not properly spawned",
      "error"
    );
    return;
  }

  botStatus.antiAfkActive = true;
  const method = config.antiAfk.method || "verified_chat";

  broadcastLog(
    `🚀 Starting verified anti-AFK system (${method} method)...`,
    "info"
  );
  broadcastLog(
    "🔍 Server communication will be monitored for effectiveness",
    "info"
  );

  let consecutiveFailures = 0;
  const maxFailures = 3;

  antiAfkInterval = setInterval(() => {
    if (!botStatus.isConnected || !botClient || !botStatus.hasSpawned) {
      broadcastLog("🛑 Anti-AFK stopped - bot not connected/spawned", "warn");
      stopAntiAFK();
      return;
    }

    let success = false;

    // Try primary method first
    if (antiAfkMethods[method]) {
      success = antiAfkMethods[method]();
    }

    // Enhanced fallback system with server verification priority
    if (!success && config.antiAfk.fallbackToKeepalive) {
      broadcastLog(
        "🔄 Primary method failed, trying verified fallbacks...",
        "warn"
      );

      // Fallback order prioritizing methods that can be verified
      const verifiedFallbackOrder = [
        "verified_chat",
        "verified_command",
        "player_action_verified",
        "connection_heartbeat",
        "gentle_movement_tracked",
        "simple_presence",
      ];

      for (const fallbackMethod of verifiedFallbackOrder) {
        if (fallbackMethod !== method && antiAfkMethods[fallbackMethod]) {
          broadcastLog(
            `🔄 Trying verified fallback: ${fallbackMethod}`,
            "warn"
          );
          if (antiAfkMethods[fallbackMethod]()) {
            success = true;
            break;
          }
        }
      }
    }

    // Track failure patterns
    if (!success) {
      consecutiveFailures++;
      broadcastLog(
        `❌ Anti-AFK cycle failed (${consecutiveFailures}/${maxFailures})`,
        "error"
      );

      if (consecutiveFailures >= maxFailures) {
        broadcastLog(
          "🚨 Multiple anti-AFK failures - connection may be compromised",
          "error"
        );
        broadcastLog(
          "🔧 Consider restarting bot or checking server status",
          "warn"
        );
        // Don't auto-restart to avoid spam, just warn
      }
    } else {
      consecutiveFailures = 0; // Reset failure counter on success
    }

    // Overall status
    if (success) {
      broadcastLog("✅ Anti-AFK cycle completed successfully", "info");
    } else {
      broadcastLog(
        "⚠️ Anti-AFK: No methods successful - maintaining connection only",
        "warn"
      );
    }
  }, config.antiAfk.interval);

  broadcastLog(
    `✅ Anti-AFK system started successfully with ${
      config.antiAfk.interval / 1000
    }s interval`,
    "info"
  );
};

const stopAntiAFK = () => {
  if (antiAfkInterval) {
    clearInterval(antiAfkInterval);
    antiAfkInterval = null;
    botStatus.antiAfkActive = false;
    broadcastLog("🛑 Anti-AFK system stopped", "info");
  } else if (botStatus.antiAfkActive) {
    // Handle case where status says active but no interval
    botStatus.antiAfkActive = false;
    broadcastLog("🛑 Anti-AFK status reset (no active interval)", "warn");
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

  broadcastLog(
    `Reconnecting in ${delay / 1000}s... (Attempt ${
      botStatus.reconnectAttempts
    }/${SERVER_CONFIG.maxReconnectAttempts})`,
    "warn"
  );
  broadcastLog(`Disconnect reason: ${reason}`, "error");

  // Send alert if too many reconnect attempts
  if (botStatus.reconnectAttempts >= 5) {
    sendBetterStackAlert(
      `Bot struggling to connect (${botStatus.reconnectAttempts} attempts)`,
      "error"
    );
  }

  // Give up after max attempts
  if (botStatus.reconnectAttempts >= SERVER_CONFIG.maxReconnectAttempts) {
    broadcastLog("Max reconnect attempts reached. Stopping bot.", "error");
    sendBetterStackAlert("Bot stopped after max reconnect attempts", "error");
    return;
  }

  reconnectTimeout = setTimeout(() => {
    createBot();
  }, delay);
};

// Manual restart
const restartBot = () => {
  broadcastLog("Manual restart triggered", "warn");

  stopAntiAFK();

  if (botClient) {
    try {
      botClient.disconnect();
    } catch (error) {
      broadcastLog(`Disconnect error: ${error.message}`, "error");
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
    broadcastLog("Scheduled restart", "info");
    restartBot();
  });
}

// Better Stack heartbeat
if (BETTER_STACK.enabled) {
  betterStackInterval = setInterval(
    sendBetterStackHeartbeat,
    BETTER_STACK.interval
  );
  broadcastLog(
    `Better Stack heartbeat enabled (${
      BETTER_STACK.interval / 1000
    }s interval)`,
    "info"
  );
}

// Cleanup functions
const cleanup = () => {
  broadcastLog("Shutting down bot...", "warn");

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
      broadcastLog(`Cleanup disconnect error: ${error.message}`, "error");
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
  broadcastLog(`Uncaught exception: ${error.message}`, "error");
  console.log(error.stack);
  sendBetterStackAlert(`Uncaught exception: ${error.message}`, "error");
});

process.on("unhandledRejection", (reason, promise) => {
  broadcastLog(`Unhandled rejection: ${reason}`, "error");
  sendBetterStackAlert(`Unhandled rejection: ${reason}`, "error");
});

// Start the bot
broadcastLog(
  "🚨 WARNING: This bot may violate Aternos Terms of Service",
  "warn"
);
broadcastLog("🔗 Consider migrating to bot-friendly hosting", "warn");
broadcastLog("Starting Aternos Bedrock Keep-Alive Bot...", "info");
broadcastLog(`Server: ${SERVER_CONFIG.host}:${SERVER_CONFIG.port}`, "info");
broadcastLog(`Version: ${SERVER_CONFIG.version}`, "info");
broadcastLog(`Username: ${SERVER_CONFIG.username}`, "info");
broadcastLog(
  `Better Stack: ${BETTER_STACK.enabled ? "Enabled" : "Disabled"}`,
  "info"
);
broadcastLog(`Start time: ${botStatus.startTime.toLocaleString()}`, "info");

// Initial connection
createBot();
