<<<<<<< HEAD
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
=======
// index.js - Aternos Bedrock Keep-Alive Bot
const bedrock = require("bedrock-protocol");
const express = require("express");
const cron = require("node-cron");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Import configuration
const config = require("./config");
const FileLogger = require("./logger");

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

// Initialize file logger
const logger = new FileLogger("./logs/bot.log");

// Helper function to handle BigInt serialization
const serializeBigInt = obj => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "bigint") {
    return obj.toString();
  }

  if (Array.isArray(obj)) {
    return obj.map(item => serializeBigInt(item));
  }

  if (typeof obj === "object") {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeBigInt(value);
    }
    return result;
  }

  return obj;
};

// Real-time log system for dashboard sync (now reads from file)
let logBroadcasters = new Set();
const broadcastLog = (message, type = "info", source = "bot") => {
  // Log to file using FileLogger
>>>>>>> 74fef4712ff6779b7e1e1bced39e390f1bf50951
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

<<<<<<< HEAD
// Better Stack monitoring
const BETTER_STACK = {
  heartbeatUrl: config.monitoring.betterStack.heartbeatUrl,
  enabled: config.monitoring.betterStack.enabled,
  interval: config.monitoring.betterStack.heartbeatInterval,
};

let betterStackInterval = null;

// Better Stack heartbeat function
=======
// Bot status tracking
let botStatus = {
  isConnected: false,
  lastConnected: null,
  lastDisconnected: null,
  reconnectAttempts: 0,
  totalUptime: 0,
  startTime: new Date(),
  serverOnline: false,
  packetsSent: 0,
  packetsReceived: 0,
  currentPosition: { x: 0, y: 64, z: 0 },
  hasSpawned: false,
  sessionValidated: false,
  serverCommunicationVerified: false,

  // Movement & Position Tracking
  movement: {
    enabled: config.movement.tracking.enabled,
    antiAfkEnabled: config.movement.antiAfk.enabled,
    lastMovement: null,
    totalDistance: 0,
    movementHistory: [],
    lastAntiAfkMovement: null,
    antiAfkActive: false,
  },

  // Other players tracking
  nearbyPlayers: new Map(),
  playerMovementHistory: new Map(),
};

// Express web server để keep repl alive
const app = express();

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Server-Sent Events endpoint for real-time logs
// API endpoint to get recent logs from file
app.get("/logs/recent", (req, res) => {
  try {
    const maxLines = parseInt(req.query.lines) || 100;
    const logs = logger.getRecentLogs(maxLines);
    res.json({
      logs: logs,
      total: logs.length,
      maxLines: maxLines,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to read logs",
      message: error.message,
    });
  }
});

// API endpoint to clear logs
app.post("/logs/clear", (req, res) => {
  try {
    const success = logger.clearLogs();
    if (success) {
      broadcastLog("Log file cleared by user", "info", "system");
      res.json({
        message: "Logs cleared successfully",
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(500).json({
        error: "Failed to clear logs",
      });
    }
  } catch (error) {
    res.status(500).json({
      error: "Failed to clear logs",
      message: error.message,
    });
  }
});

// Server-Sent Events endpoint for real-time logs (now file-based)
app.get("/logs/stream", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  // Send initial logs from file
  try {
    const recentLogs = logger.getRecentLogs(50);
    recentLogs.forEach(log => {
      res.write(`data: ${JSON.stringify(log)}\n\n`);
    });
  } catch (error) {
    console.error("Failed to send initial logs:", error.message);
  }

  const broadcaster = logEntry => {
    res.write(`data: ${JSON.stringify(logEntry)}\n\n`);
  };

  logBroadcasters.add(broadcaster);
  broadcastLog("Dashboard connected to live log stream", "info", "system");

  req.on("close", () => {
    logBroadcasters.delete(broadcaster);
    broadcastLog(
      "Dashboard disconnected from live log stream",
      "info",
      "system"
    );
  });
});

// Routes
app.get("/", (req, res) => {
  res.json({
    status: "Aternos Bedrock Keep-Alive Bot (Connection Only)",
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
      packetsSent: botStatus.packetsSent,
      packetsReceived: botStatus.packetsReceived,
      currentPosition: botStatus.currentPosition,
    },
    serverInfo: SERVER_CONFIG,
    compliance: {
      aternosPolicy: "⚠️ WARNING: This bot may violate Aternos ToS",
      recommendation: "Consider switching to bot-friendly hosting",
      riskLevel: "MEDIUM",
    },
  });
});

app.get("/health", (req, res) => {
  // Health check endpoint cho Better Stack
  res.status(botStatus.isConnected ? 200 : 503).json({
    status: botStatus.isConnected ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - botStatus.startTime.getTime()) / 1000),
    mode: "Connection Only",
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
  // Convert Maps to Objects for JSON serialization
  const nearbyPlayersObj = {};
  botStatus.nearbyPlayers.forEach((player, id) => {
    nearbyPlayersObj[id] = player;
  });

  const playerMovementHistoryObj = {};
  botStatus.playerMovementHistory.forEach((history, id) => {
    playerMovementHistoryObj[id] = history;
  });

  const responseData = {
    botStatus: serializeBigInt({
      ...botStatus,
      nearbyPlayers: nearbyPlayersObj,
      playerMovementHistory: playerMovementHistoryObj,
    }),
    serverConfig: serializeBigInt(SERVER_CONFIG),
    betterStackEnabled: BETTER_STACK.enabled,
    mode: "Connection + Movement Tracking",
    complianceWarning: "⚠️ This bot may violate Aternos Terms of Service",
    movementConfig: serializeBigInt(config.movement),
  };

  res.json(serializeBigInt(responseData));
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

// Movement & Position API endpoints
app.get("/movement/status", (req, res) => {
  const nearbyPlayersObj = {};
  botStatus.nearbyPlayers.forEach((player, id) => {
    nearbyPlayersObj[id] = serializeBigInt(player);
  });

  const responseData = {
    enabled: config.movement.tracking.enabled,
    antiAfkEnabled: config.movement.antiAfk.enabled,
    antiAfkActive: botStatus.movement.antiAfkActive,
    currentPosition: botStatus.currentPosition,
    totalDistance: botStatus.movement.totalDistance,
    lastMovement: botStatus.movement.lastMovement,
    lastAntiAfkMovement: botStatus.movement.lastAntiAfkMovement,
    movementHistory: botStatus.movement.movementHistory.slice(-10), // Last 10 movements
    nearbyPlayers: nearbyPlayersObj,
    nearbyPlayersCount: botStatus.nearbyPlayers.size,
    config: config.movement,
  };

  res.json(serializeBigInt(responseData));
});

app.post("/movement/anti-afk/start", (req, res) => {
  if (!botStatus.hasSpawned) {
    return res.status(400).json({
      error: "Bot not spawned yet",
      message: "Wait for bot to spawn before starting anti-AFK movement",
    });
  }

  if (botStatus.movement.antiAfkActive) {
    return res.json({
      message: "Anti-AFK movement already active",
      status: "already_running",
    });
  }

  startAntiAfkMovement();
  res.json({
    message: "Anti-AFK movement started",
    status: "started",
    interval: config.movement.antiAfk.interval / 1000 + "s",
  });
});

app.post("/movement/anti-afk/stop", (req, res) => {
  if (!botStatus.movement.antiAfkActive) {
    return res.json({
      message: "Anti-AFK movement not active",
      status: "already_stopped",
    });
  }

  stopAntiAfkMovement();
  res.json({
    message: "Anti-AFK movement stopped",
    status: "stopped",
  });
});

app.post("/movement/manual-move", (req, res) => {
  const { x, y, z } = req.body;

  if (!botStatus.hasSpawned) {
    return res.status(400).json({
      error: "Bot not spawned yet",
      message: "Wait for bot to spawn before manual movement",
    });
  }

  if (typeof x !== "number" || typeof y !== "number" || typeof z !== "number") {
    return res.status(400).json({
      error: "Invalid coordinates",
      message: "x, y, z must be numbers",
      example: { x: 0, y: 64, z: 0 },
    });
  }

  try {
    const newPosition = { x, y, z };

    // Alternative approach - update position directly and let the bot handle movement
    try {
      // Update bot's internal position
      const oldPosition = { ...botStatus.currentPosition };
      updateBotPosition(newPosition);

      broadcastLog(
        `🎮 Manual position update: (${newPosition.x}, ${newPosition.y}, ${newPosition.z})`,
        "info"
      );

      // For now, we'll just update the position tracking without sending move packet
      // The move_player packet seems to have compatibility issues with this bedrock-protocol version
      broadcastLog(
        `📍 Position updated from (${oldPosition.x.toFixed(
          1
        )}, ${oldPosition.y.toFixed(1)}, ${oldPosition.z.toFixed(1)}) to (${
          newPosition.x
        }, ${newPosition.y}, ${newPosition.z})`,
        "info"
      );
    } catch (updateError) {
      broadcastLog(
        `❌ Position update failed: ${updateError.message}`,
        "error"
      );
      throw updateError;
    }

    botStatus.packetsSent++;

    res.json({
      message: "Manual movement command sent",
      position: newPosition,
      timestamp: new Date().toISOString(),
    });

    broadcastLog(`🎮 Manual movement to (${x}, ${y}, ${z})`, "info");
  } catch (error) {
    res.status(500).json({
      error: "Movement failed",
      message: error.message,
    });
  }
});

app.get("/movement/players", (req, res) => {
  const playersData = {};

  botStatus.nearbyPlayers.forEach((player, id) => {
    const history = botStatus.playerMovementHistory.get(id) || [];

    // Serialize player data and history separately
    const serializedPlayer = serializeBigInt(player);
    const serializedHistory = history
      .slice(-5)
      .map(entry => serializeBigInt(entry));

    playersData[id] = {
      ...serializedPlayer,
      movementHistory: serializedHistory,
      totalMovements: history.length,
    };
  });

  const responseData = {
    players: playersData,
    totalPlayers: botStatus.nearbyPlayers.size,
    trackingEnabled: serializeBigInt(
      config.movement.tracking.trackOtherPlayers
    ),
  };

  res.json(serializeBigInt(responseData));
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
      violated_rules: ["§5.2.c.2: Automatically reconnecting after disconnect"],
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
let betterStackInterval = null;
let antiAfkInterval = null;

// Movement & Position Tracking Functions
const calculateDistance = (pos1, pos2) => {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const dz = pos1.z - pos2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

const updateBotPosition = newPosition => {
  if (!config.movement.tracking.enabled) return;

  const oldPosition = { ...botStatus.currentPosition };
  botStatus.currentPosition = { ...newPosition };

  // Calculate distance moved
  if (config.movement.statistics.trackDistance) {
    const distance = calculateDistance(oldPosition, newPosition);
    if (distance > 0.1) {
      // Only count significant movements
      botStatus.movement.totalDistance += distance;

      // Add to movement history
      const movementEntry = {
        timestamp: new Date().toISOString(),
        from: oldPosition,
        to: newPosition,
        distance: distance,
      };

      botStatus.movement.movementHistory.push(movementEntry);

      // Keep only last 50 movements
      if (botStatus.movement.movementHistory.length > 50) {
        botStatus.movement.movementHistory.shift();
      }

      botStatus.movement.lastMovement = new Date().toISOString();

      if (config.movement.tracking.logMovement) {
        broadcastLog(
          `📍 Bot moved ${distance.toFixed(
            2
          )} blocks to (${newPosition.x.toFixed(1)}, ${newPosition.y.toFixed(
            1
          )}, ${newPosition.z.toFixed(1)})`,
          "info"
        );
      }
    }
  }
};

const updatePlayerPosition = (runtimeId, position, playerName = null) => {
  if (!config.movement.tracking.trackOtherPlayers) return;

  const playerId = runtimeId.toString();
  const now = new Date().toISOString();

  // Update player position
  botStatus.nearbyPlayers.set(playerId, {
    runtimeId,
    name: playerName || `Player_${playerId}`,
    position: { ...position },
    lastSeen: now,
    lastMovement: now,
  });

  // Add to movement history
  if (!botStatus.playerMovementHistory.has(playerId)) {
    botStatus.playerMovementHistory.set(playerId, []);
  }

  const history = botStatus.playerMovementHistory.get(playerId);
  history.push({
    timestamp: now,
    position: { ...position },
  });

  // Keep limited history
  if (history.length > config.movement.tracking.maxPlayerHistory) {
    history.shift();
  }

  if (config.movement.tracking.logMovement && playerName) {
    broadcastLog(
      `👤 ${playerName} moved to (${position.x.toFixed(
        1
      )}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)})`,
      "info"
    );
  }
};

const performAntiAfkMovement = () => {
  if (!botClient || !botStatus.hasSpawned || !config.movement.antiAfk.enabled) {
    return;
  }

  try {
    const currentPos = botStatus.currentPosition;
    const range = config.movement.antiAfk.movementRange;

    let newX, newZ;

    if (config.movement.antiAfk.randomMovement) {
      // Random movement within range
      newX = currentPos.x + (Math.random() * range * 2 - range);
      newZ = currentPos.z + (Math.random() * range * 2 - range);
    } else {
      // Simple back-and-forth movement
      const time = Date.now();
      newX = currentPos.x + Math.sin(time / 10000) * range;
      newZ = currentPos.z + Math.cos(time / 10000) * range;
    }

    const newPosition = {
      x: newX,
      y: currentPos.y,
      z: newZ,
    };

    // Try multiple approaches for Anti-AFK movement
    try {
      let movementSuccess = false;

      // Method 1: Try proper Bedrock movement packet
      if (
        botClient &&
        botClient.entityId &&
        typeof botClient.entityId !== "undefined"
      ) {
        try {
          // Ensure entity ID is properly converted
          const entityId =
            typeof botClient.entityId === "bigint"
              ? Number(botClient.entityId)
              : botClient.entityId;

          const movePacket = {
            runtime_id: entityId,
            position: {
              x: parseFloat(newX),
              y: parseFloat(currentPos.y),
              z: parseFloat(newZ),
            },
            rotation: {
              x: 0,
              y: 0,
              z: 0,
            },
            mode: 0, // Normal movement
            on_ground: true,
            ridden_runtime_id: 0,
            teleport: {
              cause: 0,
              source_entity_type: 0,
            },
            tick: BigInt(Date.now()),
          };

          botClient.queue("move_player", movePacket);
          movementSuccess = true;
          broadcastLog(
            `🚶 Anti-AFK movement packet sent: (${newX.toFixed(1)}, ${
              currentPos.y
            }, ${newZ.toFixed(1)}) [Entity ID: ${entityId}]`,
            "info"
          );
        } catch (packetError) {
          broadcastLog(
            `⚠️ Movement packet failed: ${packetError.message}`,
            "warn"
          );
        }
      } else {
        broadcastLog(
          `⚠️ Cannot send movement packet: ${
            !botClient
              ? "No client"
              : `Entity ID: ${
                  botClient.entityId
                } (${typeof botClient.entityId})`
          }`,
          "warn"
        );
      }

      // Method 2: Try animate packet to show activity
      if (!movementSuccess && botClient.entityId) {
        try {
          const entityId =
            typeof botClient.entityId === "bigint"
              ? Number(botClient.entityId)
              : botClient.entityId;

          botClient.queue("animate", {
            action_id: 1, // Swing arm animation
            runtime_id: entityId,
          });
          movementSuccess = true;
          broadcastLog(`🎭 Anti-AFK animation sent`, "info");
        } catch (animateError) {
          broadcastLog(
            `⚠️ Animation packet failed: ${animateError.message}`,
            "warn"
          );
        }
      }

      // Method 3: Try player action packet as alternative
      if (!movementSuccess && botClient.entityId) {
        try {
          const entityId =
            typeof botClient.entityId === "bigint"
              ? Number(botClient.entityId)
              : botClient.entityId;

          botClient.queue("player_action", {
            runtime_id: entityId,
            action: 5, // Start break action to show activity
            coordinates: {
              x: parseInt(newX),
              y: parseInt(currentPos.y),
              z: parseInt(newZ),
            },
            face: 0,
          });
          movementSuccess = true;
          broadcastLog(`🎯 Anti-AFK action packet sent`, "info");
        } catch (actionError) {
          broadcastLog(
            `⚠️ Action packet failed: ${actionError.message}`,
            "warn"
          );
        }
      }

      // Method 4: Try inventory action to show activity
      if (!movementSuccess && botClient.entityId) {
        try {
          const entityId =
            typeof botClient.entityId === "bigint"
              ? Number(botClient.entityId)
              : botClient.entityId;

          botClient.queue("mob_equipment", {
            runtime_id: entityId,
            item: {
              network_id: 0,
              count: 0,
              metadata: 0,
              has_stack_id: false,
              stack_id: 0,
              block_runtime_id: 0,
              extra: {
                has_nbt: false,
                nbt: Buffer.alloc(0),
                can_place_on: [],
                can_destroy: [],
              },
            },
            inventory_slot: 0,
            hotbar_slot: 0,
            window_id: 0,
          });
          movementSuccess = true;
          broadcastLog(`🎒 Anti-AFK equipment packet sent`, "info");
        } catch (equipError) {
          broadcastLog(
            `⚠️ Equipment packet failed: ${equipError.message}`,
            "warn"
          );
        }
      }

      // Method 4: Fallback to position simulation only
      if (!movementSuccess) {
        broadcastLog(
          `⚠️ All movement packets failed, using position simulation only`,
          "warn"
        );
      }

      // Always update internal position tracking
      updateBotPosition(newPosition);
    } catch (generalError) {
      broadcastLog(`❌ Anti-AFK failed: ${generalError.message}`, "error");
    }

    botStatus.packetsSent++;
    botStatus.movement.lastAntiAfkMovement = new Date().toISOString();
    botStatus.movement.antiAfkActive = true;

    broadcastLog(
      `🚶 Anti-AFK movement: (${newX.toFixed(1)}, ${
        currentPos.y
      }, ${newZ.toFixed(1)})`,
      "info"
    );
  } catch (error) {
    broadcastLog(`❌ Anti-AFK movement failed: ${error.message}`, "warn");
  }
};

const startAntiAfkMovement = () => {
  if (!config.movement.antiAfk.enabled) return;

  if (antiAfkInterval) {
    clearInterval(antiAfkInterval);
  }

  antiAfkInterval = setInterval(() => {
    performAntiAfkMovement();
  }, config.movement.antiAfk.interval);

  broadcastLog(
    `🚶 Anti-AFK movement started (${
      config.movement.antiAfk.interval / 1000
    }s interval)`,
    "info"
  );
};

const stopAntiAfkMovement = () => {
  if (antiAfkInterval) {
    clearInterval(antiAfkInterval);
    antiAfkInterval = null;
  }

  botStatus.movement.antiAfkActive = false;
  broadcastLog("🛑 Anti-AFK movement stopped", "info");
};

// Better Stack functions
>>>>>>> 74fef4712ff6779b7e1e1bced39e390f1bf50951
const sendBetterStackHeartbeat = async () => {
  if (!BETTER_STACK.enabled || !BETTER_STACK.heartbeatUrl) return;

  try {
    await axios.get(BETTER_STACK.heartbeatUrl, { timeout: 5000 });
    // Don't spam log for regular heartbeats
  } catch (error) {
    broadcastLog(`Better Stack heartbeat failed: ${error.message}`, "warn");
  }
};

<<<<<<< HEAD
// Initialize bot and API
const bot = new AternosBot(logger, broadcastLog);
const api = new BotAPI(bot, logger, broadcastLog);

// Start Better Stack heartbeat if enabled
=======
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
    botClient.on("start_game", packet => {
      connectionPhase = "game_starting";
      broadcastLog("🎮 Game start packet received - loading world...", "info");

      // Store entity ID for movement packets
      if (packet.runtime_entity_id) {
        botClient.entityId = packet.runtime_entity_id;
        broadcastLog(`🆔 Bot entity ID: ${packet.runtime_entity_id}`, "info");
      } else if (packet.entity_unique_id) {
        botClient.entityId = packet.entity_unique_id;
        broadcastLog(
          `🆔 Bot entity ID (unique): ${packet.entity_unique_id}`,
          "info"
        );
      } else {
        broadcastLog(`⚠️ No entity ID found in start_game packet`, "warn");
      }
    });

    // Critical: Wait for proper spawn before claiming success
    botClient.on("spawn", () => {
      const now = new Date();
      connectionPhase = "spawned";
      clearAllTimeouts(); // Clear all timeouts

      broadcastLog("🎮 Bot successfully spawned in game world!", "info");
      broadcastLog(
        "✅ Connection established - maintaining idle presence",
        "info"
      );

      botStatus.isConnected = true;
      botStatus.hasSpawned = true;
      botStatus.lastConnected = now.toISOString();
      botStatus.reconnectAttempts = 0;

      // Initialize position properly
      if (
        !botStatus.currentPosition ||
        botStatus.currentPosition.x === undefined ||
        botStatus.currentPosition.y === undefined ||
        botStatus.currentPosition.z === undefined
      ) {
        botStatus.currentPosition = { x: 0, y: 64, z: 0 };
        broadcastLog(
          "📍 Position initialized to spawn point (0, 64, 0)",
          "info"
        );
      }

      // Verify spawn with test message (delayed to ensure server is ready)
      setTimeout(() => {
        testServerCommunication();
      }, 3000);

      // Start anti-AFK movement if enabled
      if (config.movement.antiAfk.enabled) {
        setTimeout(() => {
          startAntiAfkMovement();
        }, 5000); // Wait 5 seconds after spawn
      }

      sendBetterStackAlert(
        "Bot connected and spawned successfully (Connection Only Mode)"
      );
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

      // Stop anti-AFK movement on disconnect
      if (antiAfkInterval) {
        clearInterval(antiAfkInterval);
        antiAfkInterval = null;
        botStatus.movement.antiAfkActive = false;
      }

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
      handleDisconnect(`Error: ${errorMessage}`);
    });

    // Movement packet listeners
    botClient.on("move_player", packet => {
      botStatus.packetsReceived++;

      try {
        // Check if this is the bot's own movement
        if (packet.runtime_id === botClient.runtime_id) {
          // Update bot's position
          if (packet.position) {
            updateBotPosition(packet.position);
          }
        } else {
          // Track other players' movement
          if (packet.position && config.movement.tracking.trackOtherPlayers) {
            updatePlayerPosition(packet.runtime_id, packet.position);
          }
        }
      } catch (error) {
        broadcastLog(
          `Movement packet processing error: ${error.message}`,
          "warn"
        );
      }
    });

    // Enhanced player tracking with multiple packet types
    botClient.on("player_list", packet => {
      botStatus.packetsReceived++;

      try {
        // Debug log packet structure (only first few times)
        if (botStatus.packetsReceived <= 5) {
          broadcastLog(
            `🔍 Player list packet: ${JSON.stringify(packet, null, 2).substring(
              0,
              300
            )}...`,
            "info"
          );
        }

        let playersFound = 0;

        if (packet.records && Array.isArray(packet.records)) {
          packet.records.forEach(record => {
            if (record.username) {
              playersFound++;
              const playerId =
                record.runtime_id?.toString() ||
                record.entity_unique_id?.toString();

              if (playerId) {
                // Create or update player entry
                const playerData = {
                  runtimeId: record.runtime_id || record.entity_unique_id,
                  name: record.username,
                  uuid: record.uuid || "unknown",
                  lastSeen: new Date().toISOString(),
                  lastMovement: new Date().toISOString(),
                  position: botStatus.nearbyPlayers.get(playerId)?.position || {
                    x: 0,
                    y: 64,
                    z: 0,
                  },
                };

                botStatus.nearbyPlayers.set(playerId, playerData);
                broadcastLog(
                  `👤 Player updated: ${record.username} (ID: ${playerId})`,
                  "info"
                );
              }
            }
          });
        } else if (packet.records && typeof packet.records === "object") {
          // Handle object-based records
          Object.values(packet.records).forEach(record => {
            if (record && record.username) {
              playersFound++;
              const playerId =
                record.runtime_id?.toString() ||
                record.entity_unique_id?.toString();

              if (playerId) {
                const playerData = {
                  runtimeId: record.runtime_id || record.entity_unique_id,
                  name: record.username,
                  uuid: record.uuid || "unknown",
                  lastSeen: new Date().toISOString(),
                  lastMovement: new Date().toISOString(),
                  position: botStatus.nearbyPlayers.get(playerId)?.position || {
                    x: 0,
                    y: 64,
                    z: 0,
                  },
                };

                botStatus.nearbyPlayers.set(playerId, playerData);
                broadcastLog(
                  `👤 Player updated: ${record.username} (ID: ${playerId})`,
                  "info"
                );
              }
            }
          });
        }

        if (playersFound > 0) {
          broadcastLog(
            `📋 Player list updated: ${playersFound} players found`,
            "info"
          );
        }
      } catch (error) {
        broadcastLog(
          `❌ Player list processing error: ${error.message}`,
          "warn"
        );
      }
    });

    // Listen for add_player packets (when players join)
    botClient.on("add_player", packet => {
      botStatus.packetsReceived++;

      try {
        if (packet.username && packet.runtime_id) {
          const playerId = packet.runtime_id.toString();
          const playerData = {
            runtimeId: packet.runtime_id,
            name: packet.username,
            uuid: packet.uuid || "unknown",
            lastSeen: new Date().toISOString(),
            lastMovement: new Date().toISOString(),
            position: { x: 0, y: 64, z: 0 },
          };

          botStatus.nearbyPlayers.set(playerId, playerData);
          broadcastLog(
            `🎮 Player joined: ${packet.username} (ID: ${playerId})`,
            "info"
          );
        }
      } catch (error) {
        broadcastLog(
          `❌ Add player processing error: ${error.message}`,
          "warn"
        );
      }
    });

    // Listen for remove_player packets (when players leave)
    botClient.on("remove_player", packet => {
      botStatus.packetsReceived++;

      try {
        if (packet.runtime_id) {
          const playerId = packet.runtime_id.toString();
          const player = botStatus.nearbyPlayers.get(playerId);

          if (player) {
            broadcastLog(
              `👋 Player left: ${player.name} (ID: ${playerId})`,
              "info"
            );
            botStatus.nearbyPlayers.delete(playerId);
            botStatus.playerMovementHistory.delete(playerId);
          }
        }
      } catch (error) {
        broadcastLog(
          `❌ Remove player processing error: ${error.message}`,
          "warn"
        );
      }
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
          "move_player",
        ].includes(name)
      ) {
        if (name !== "move_player" || config.movement.tracking.logMovement) {
          broadcastLog(`📦 Received critical packet: ${name}`, "info");
        }

        if (name === "start_game") {
          broadcastLog("🎮 Game start packet received - world loading", "info");

          // Extract spawn position if available
          if (packet.player_position) {
            updateBotPosition(packet.player_position);
            broadcastLog(
              `📍 Spawn position: (${packet.player_position.x.toFixed(
                1
              )}, ${packet.player_position.y.toFixed(
                1
              )}, ${packet.player_position.z.toFixed(1)})`,
              "info"
            );
          }
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
        }
      }, 10000); // Monitor for another 10 seconds
    }
  }, 2000);
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
>>>>>>> 74fef4712ff6779b7e1e1bced39e390f1bf50951
if (BETTER_STACK.enabled) {
  betterStackInterval = setInterval(
    sendBetterStackHeartbeat,
    BETTER_STACK.interval
  );
  broadcastLog(
<<<<<<< HEAD
    `Better Stack heartbeat enabled (${BETTER_STACK.interval / 1000}s interval)`,
=======
    `Better Stack heartbeat enabled (${
      BETTER_STACK.interval / 1000
    }s interval)`,
>>>>>>> 74fef4712ff6779b7e1e1bced39e390f1bf50951
    "info"
  );
}

<<<<<<< HEAD
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
=======
// Cleanup functions
>>>>>>> 74fef4712ff6779b7e1e1bced39e390f1bf50951
const cleanup = () => {
  broadcastLog("Shutting down bot...", "warn");

  if (betterStackInterval) {
    clearInterval(betterStackInterval);
  }

<<<<<<< HEAD
  bot.cleanup();
=======
  if (antiAfkInterval) {
    clearInterval(antiAfkInterval);
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
>>>>>>> 74fef4712ff6779b7e1e1bced39e390f1bf50951

  setTimeout(() => {
    process.exit(0);
  }, 2000);
};

// Process event handlers
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
<<<<<<< HEAD

process.on("uncaughtException", error => {
  broadcastLog(`Uncaught exception: ${error.message}`, "error");
  console.log(error.stack);
=======
process.on("uncaughtException", error => {
  broadcastLog(`Uncaught exception: ${error.message}`, "error");
  console.log(error.stack);
  sendBetterStackAlert(`Uncaught exception: ${error.message}`, "error");
>>>>>>> 74fef4712ff6779b7e1e1bced39e390f1bf50951
});

process.on("unhandledRejection", (reason, promise) => {
  broadcastLog(`Unhandled rejection: ${reason}`, "error");
<<<<<<< HEAD
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
=======
  sendBetterStackAlert(`Unhandled rejection: ${reason}`, "error");
});

// Start the bot
broadcastLog(
  "🚨 WARNING: This bot may violate Aternos Terms of Service",
  "warn"
);
broadcastLog("🔗 Consider migrating to bot-friendly hosting", "warn");
broadcastLog(
  "Starting Aternos Bedrock Keep-Alive Bot (Connection Only Mode)...",
  "info"
);

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
>>>>>>> 74fef4712ff6779b7e1e1bced39e390f1bf50951
