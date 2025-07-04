// bot.js - Core Bot Connection Logic (Ultra Simplified)
const bedrock = require("bedrock-protocol");
const config = require("./config");

class AternosBot {
  constructor(logger, broadcastLog) {
    this.logger = logger;
    this.broadcastLog = broadcastLog;
    this.client = null;
    this.reconnectTimeout = null;
    this.antiAfkInterval = null;
    this.entityId = null; // Store entity ID separately

    // Ultra simplified bot status
    this.status = {
      isConnected: false,
      lastConnected: null,
      lastDisconnected: null,
      reconnectAttempts: 0,
      startTime: new Date(),
      hasSpawned: false,
      packetsSent: 0,
      packetsReceived: 0,
      currentPosition: { x: 0, y: 64, z: 0 },

      // Basic anti-AFK status
      antiAfk: {
        active: false,
        lastMovement: null,
      },
    };

    // Server configuration
    this.serverConfig = {
      host: config.server.host,
      port: config.server.port,
      username: config.bot.username,
      version: config.server.version,
      maxReconnectAttempts: config.bot.maxReconnectAttempts,
      isOfflineMode: config.bot.isOfflineMode,
      skipAuthentication: config.bot.skipAuthentication,
    };
  }

  // Start bot connection
  connect() {
    this.broadcastLog("Starting Aternos Bedrock Keep-Alive Bot...", "info");
    this.broadcastLog(
      `Server: ${this.serverConfig.host}:${this.serverConfig.port}`,
      "info"
    );
    this.broadcastLog(`Username: ${this.serverConfig.username}`, "info");
    this.createBotConnection();
  }

  // Create bot connection with ultra simplified logic
  createBotConnection() {
    try {
      this.broadcastLog(
        `Connecting to ${this.serverConfig.host}:${this.serverConfig.port}...`,
        "info"
      );

      // Cleanup previous connection
      if (this.client) {
        try {
          this.client.disconnect();
        } catch (e) {
          // Ignore cleanup errors
        }
      }

      // Reset connection status
      this.resetConnectionStatus();

      // Always use latest config
      const clientOptions = {
        host: this.serverConfig.host,
        port: this.serverConfig.port,
        username: this.serverConfig.username,
        version: this.serverConfig.version,
        offline: this.serverConfig.isOfflineMode,
        skipAuthentication: this.serverConfig.skipAuthentication,
        connectTimeout: 30000,
        keepAlive: true,
        conLog: () => {}, // Disable internal logging
      };

      this.client = bedrock.createClient(clientOptions);
      this.setupEventHandlers();
    } catch (error) {
      this.broadcastLog(
        `Failed to create Bedrock client: ${error.message}`,
        "error"
      );
      this.handleDisconnect(`Create error: ${error.message}`);
    }
  }

  // Setup ultra simplified event handlers
  setupEventHandlers() {
    let connectionTimeout = null;

    // Basic connection events only
    this.client.on("connect", () => {
      if (connectionTimeout) clearTimeout(connectionTimeout);
      this.broadcastLog("🔗 Connected to Bedrock server", "info");
    });

    this.client.on("login", () => {
      this.broadcastLog("🔐 Login successful", "info");
    });

    this.client.on("start_game", packet => {
      this.broadcastLog("🎮 Game start packet received", "info");

      // Store entity ID safely without setting on client
      if (packet.runtime_entity_id) {
        this.entityId = packet.runtime_entity_id;
        this.broadcastLog(`🆔 Bot entity ID: ${this.entityId}`, "info");
      } else if (packet.entity_unique_id) {
        this.entityId = packet.entity_unique_id;
        this.broadcastLog(`🆔 Bot entity ID: ${this.entityId}`, "info");
      }
    });

    this.client.on("spawn", () => {
      const now = new Date();
      if (connectionTimeout) clearTimeout(connectionTimeout);

      this.broadcastLog("🎮 Bot spawned successfully!", "info");
      this.status.isConnected = true;
      this.status.hasSpawned = true;
      this.status.lastConnected = now.toISOString();
      this.status.reconnectAttempts = 0;
      this.status.currentPosition = { x: 0, y: 64, z: 0 };

      // Start anti-AFK if enabled
      if (config.antiAfk.enabled) {
        setTimeout(() => this.startAntiAfk(), 5000);
      }
    });

    // Minimal packet handling
    this.client.on("text", packet => {
      this.status.packetsReceived++;
      // Just count packets, no complex processing
    });

    // Error and disconnect handling
    this.client.on("disconnect", reason => {
      if (connectionTimeout) clearTimeout(connectionTimeout);

      const disconnectReason =
        typeof reason === "string"
          ? reason
          : reason && typeof reason === "object"
          ? reason.reason || reason.message || "Connection lost"
          : "Unknown";

      this.broadcastLog(`🔌 Disconnected: ${disconnectReason}`, "error");
      this.resetConnectionStatus();
      this.handleDisconnect(disconnectReason);
    });

    this.client.on("error", err => {
      if (connectionTimeout) clearTimeout(connectionTimeout);

      let errorMessage = "Unknown error";
      if (err && typeof err === "object") {
        errorMessage = err.message || err.code || err.toString();

        // Common error types
        if (err.code === "ECONNREFUSED")
          errorMessage = "Server offline or not accessible";
        else if (err.code === "ETIMEDOUT") errorMessage = "Connection timeout";
        else if (err.code === "ENOTFOUND")
          errorMessage = "Server address not found";
      }

      this.broadcastLog(`❌ Connection error: ${errorMessage}`, "error");
      this.resetConnectionStatus();
      this.handleDisconnect(`Error: ${errorMessage}`);
    });

    // Minimal packet counting
    this.client.on("packet", () => {
      this.status.packetsReceived++;
    });

    // Connection timeout
    connectionTimeout = setTimeout(() => {
      this.broadcastLog(
        "⏰ Connection timeout - server may be offline",
        "error"
      );
      if (this.client) this.client.disconnect();
    }, 30000);
  }

  // Ultra simplified anti-AFK movement
  startAntiAfk() {
    if (!config.antiAfk.enabled || this.antiAfkInterval) return;

    this.antiAfkInterval = setInterval(() => {
      this.performAntiAfkMovement();
    }, config.antiAfk.interval);

    this.status.antiAfk.active = true;
    this.broadcastLog("🚶 Anti-AFK started", "info");
  }

  stopAntiAfk() {
    if (this.antiAfkInterval) {
      clearInterval(this.antiAfkInterval);
      this.antiAfkInterval = null;
    }
    this.status.antiAfk.active = false;
    this.broadcastLog("🛑 Anti-AFK stopped", "info");
  }

  performAntiAfkMovement() {
    if (
      !this.client ||
      !this.status.hasSpawned ||
      !config.antiAfk.enabled ||
      !this.entityId
    )
      return;

    try {
      const currentPos = this.status.currentPosition;
      const range = config.antiAfk.movementRange;

      // Ultra simple random movement
      const newX = currentPos.x + (Math.random() * range * 2 - range);
      const newZ = currentPos.z + (Math.random() * range * 2 - range);

      // Try to send movement packet with stored entity ID
      try {
        const entityId =
          typeof this.entityId === "bigint"
            ? Number(this.entityId)
            : this.entityId;

        this.client.queue("move_player", {
          runtime_id: entityId,
          position: {
            x: parseFloat(newX),
            y: parseFloat(currentPos.y),
            z: parseFloat(newZ),
          },
          rotation: { x: 0, y: 0, z: 0 },
          mode: 0,
          on_ground: true,
          ridden_runtime_id: 0,
          teleport: { cause: 0, source_entity_type: 0 },
          tick: BigInt(Date.now()),
        });

        this.status.currentPosition = { x: newX, y: currentPos.y, z: newZ };
        this.status.antiAfk.lastMovement = new Date().toISOString();
        this.status.packetsSent++;

        this.broadcastLog(
          `🚶 Anti-AFK: (${newX.toFixed(1)}, ${currentPos.y}, ${newZ.toFixed(
            1
          )})`,
          "info"
        );
      } catch (packetError) {
        this.broadcastLog(`⚠️ Movement failed: ${packetError.message}`, "warn");
      }
    } catch (error) {
      this.broadcastLog(`❌ Anti-AFK error: ${error.message}`, "warn");
    }
  }

  // Simple manual movement
  manualMove(x, y, z) {
    if (!this.status.hasSpawned) {
      throw new Error("Bot not spawned yet");
    }

    const newPosition = { x, y, z };
    this.status.currentPosition = newPosition;
    this.broadcastLog(`🎮 Manual move to (${x}, ${y}, ${z})`, "info");

    return { success: true, position: newPosition };
  }

  // Handle disconnect with exponential backoff
  handleDisconnect(reason = "Unknown") {
    this.status.reconnectAttempts++;

    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);

    // Exponential backoff: 5s, 10s, 20s, 40s, max 2 minutes
    const baseDelay = 5000;
    const maxDelay = 120000;
    const delay = Math.min(
      baseDelay * Math.pow(2, Math.min(this.status.reconnectAttempts - 1, 5)),
      maxDelay
    );

    this.broadcastLog(
      `Reconnecting in ${delay / 1000}s... (Attempt ${
        this.status.reconnectAttempts
      }/${this.serverConfig.maxReconnectAttempts})`,
      "warn"
    );

    // Give up after max attempts
    if (
      this.status.reconnectAttempts >= this.serverConfig.maxReconnectAttempts
    ) {
      this.broadcastLog(
        "Max reconnect attempts reached. Stopping bot.",
        "error"
      );
      return;
    }

    this.reconnectTimeout = setTimeout(() => {
      this.createBotConnection();
    }, delay);
  }

  // Reset connection status
  resetConnectionStatus() {
    this.status.isConnected = false;
    this.status.hasSpawned = false;
    this.status.lastDisconnected = new Date().toISOString();
    this.entityId = null;

    // Stop anti-AFK
    if (this.antiAfkInterval) {
      clearInterval(this.antiAfkInterval);
      this.antiAfkInterval = null;
      this.status.antiAfk.active = false;
    }
  }

  // Manual restart
  restart() {
    this.broadcastLog("Manual restart triggered", "warn");

    if (this.client) {
      try {
        this.client.disconnect();
      } catch (error) {
        this.broadcastLog(`Disconnect error: ${error.message}`, "error");
      }
    }

    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.status.reconnectAttempts = 0;

    setTimeout(() => this.createBotConnection(), 3000);
  }

  // Cleanup
  cleanup() {
    this.broadcastLog("Shutting down bot...", "warn");

    if (this.antiAfkInterval) clearInterval(this.antiAfkInterval);
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);

    if (this.client) {
      try {
        this.client.disconnect();
      } catch (error) {
        this.broadcastLog(
          `Cleanup disconnect error: ${error.message}`,
          "error"
        );
      }
    }
  }

  // Get bot status for API (simplified)
  getStatus() {
    return {
      connected: this.status.isConnected,
      hasSpawned: this.status.hasSpawned,
      lastConnected: this.status.lastConnected,
      lastDisconnected: this.status.lastDisconnected,
      reconnectAttempts: this.status.reconnectAttempts,
      uptime: Math.floor((Date.now() - this.status.startTime.getTime()) / 1000),
      packetsSent: this.status.packetsSent,
      packetsReceived: this.status.packetsReceived,
      currentPosition: this.status.currentPosition,
      antiAfkActive: this.status.antiAfk.active,
      lastAntiAfkMovement: this.status.antiAfk.lastMovement,
    };
  }
}

module.exports = AternosBot;
