// src/core/Bot.js - Individual Bot Instance (Refactored for Multi-Bot)
const bedrock = require("bedrock-protocol");

class Bot {
  constructor(config, logger, broadcastLog) {
    this.config = config;
    this.logger = logger;
    this.broadcastLog = broadcastLog;
    this.client = null;
    this.reconnectTimeout = null;
    this.antiAfkInterval = null;
    this.entityId = null;

    // Bot status
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
      antiAfk: {
        active: false,
        lastMovement: null,
      },
    };

    this.log(`🤖 Bot initialized: ${this.config.name}`, "info");
  }

  // Logging helper
  log(message, type = "info") {
    this.logger.log(message, type, `bot-${this.config.id}`);
    if (this.broadcastLog) {
      this.broadcastLog(message, type);
    }
  }

  // Check if bot is connected
  isConnected() {
    // Primary check: status flag
    if (!this.status.isConnected) return false;

    // Secondary check: client exists and socket is valid
    if (!this.client) return false;

    // Tertiary check: socket exists and is not destroyed
    if (this.client.socket && this.client.socket.destroyed) {
      // Socket is destroyed, update status
      this.status.isConnected = false;
      return false;
    }

    return true;
  }

  // Start bot connection
  async connect() {
    this.log(
      `🚀 Starting connection to ${this.config.host}:${this.config.port}...`,
      "info"
    );
    this.log(`👤 Username: ${this.config.username}`, "info");
    this.createBotConnection();
  }

  // Disconnect bot
  async disconnect() {
    this.log("🛑 Disconnecting bot...", "info");

    // Clear intervals
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.antiAfkInterval) {
      clearInterval(this.antiAfkInterval);
      this.antiAfkInterval = null;
    }

    // Disconnect client
    if (this.client) {
      try {
        this.client.disconnect();
      } catch (error) {
        // Ignore disconnect errors
      }
      this.client = null;
    }

    this.resetConnectionStatus();
    this.log("✅ Bot disconnected", "info");
  }

  // Create bot connection
  createBotConnection() {
    try {
      this.log(
        `🔗 Connecting to ${this.config.host}:${this.config.port}...`,
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

      // Create client options
      const clientOptions = {
        host: this.config.host,
        port: this.config.port,
        username: this.config.username,
        version: this.config.version,
        offline: this.config.isOfflineMode,
        skipAuthentication: this.config.skipAuthentication,
        connectTimeout: 30000,
        keepAlive: true,
        conLog: () => {}, // Disable internal logging
      };

      this.client = bedrock.createClient(clientOptions);
      this.setupEventHandlers();
    } catch (error) {
      this.log(`❌ Failed to create Bedrock client: ${error.message}`, "error");
      this.handleDisconnect(`Create error: ${error.message}`);
    }
  }

  // Setup event handlers
  setupEventHandlers() {
    let connectionTimeout = null;

    // Connection events
    this.client.on("connect", () => {
      if (connectionTimeout) clearTimeout(connectionTimeout);
      this.log("🔗 Connected to Bedrock server", "info");
    });

    this.client.on("login", () => {
      this.log("🔐 Login successful", "info");
    });

    this.client.on("spawn", () => {
      const now = new Date();
      if (connectionTimeout) clearTimeout(connectionTimeout);

      this.log("🎮 Bot spawned successfully!", "info");
      this.status.isConnected = true;
      this.status.hasSpawned = true;
      this.status.lastConnected = now.toISOString();
      this.status.reconnectAttempts = 0;
      this.status.currentPosition = { x: 0, y: 64, z: 0 };

      // Start anti-AFK if enabled
      if (this.config.antiAfk.enabled) {
        setTimeout(() => this.startAntiAfk(), 5000);
      }
    });

    // Capture entity ID from start_game packet
    this.client.on("start_game", packet => {
      if (packet.runtime_entity_id) {
        this.entityId = packet.runtime_entity_id;
        this.log(
          `🆔 Entity ID captured from start_game: ${this.entityId}`,
          "info"
        );
      }
    });

    // Alternative: capture from add_player packet
    this.client.on("add_player", packet => {
      if (packet.username === this.config.username && packet.runtime_id) {
        this.entityId = packet.runtime_id;
        this.log(
          `🆔 Entity ID captured from add_player: ${this.entityId}`,
          "info"
        );
      }
    });

    // Fallback: try to get entity ID from client properties
    this.client.on("packet", packet => {
      if (
        !this.entityId &&
        packet.name === "move_player" &&
        packet.params?.runtime_id
      ) {
        this.entityId = packet.params.runtime_id;
        this.log(
          `🆔 Entity ID captured from move_player: ${this.entityId}`,
          "info"
        );
      }
    });

    // Packet handling
    this.client.on("text", packet => {
      this.status.packetsReceived++;
    });

    this.client.on("move_player", packet => {
      this.status.packetsReceived++;
      if (packet.position) {
        this.status.currentPosition = {
          x: packet.position.x,
          y: packet.position.y,
          z: packet.position.z,
        };
      }
    });

    this.client.on("disconnect", packet => {
      if (connectionTimeout) clearTimeout(connectionTimeout);

      const reason = packet?.reason || "Unknown reason";
      this.log(`🔌 Disconnected: ${reason}`, "warn");
      this.resetConnectionStatus();
      this.handleDisconnect(`Disconnect: ${reason}`);
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

      this.log(`❌ Connection error: ${errorMessage}`, "error");
      this.resetConnectionStatus();
      this.handleDisconnect(`Error: ${errorMessage}`);
    });

    // Packet counting
    this.client.on("packet", () => {
      this.status.packetsReceived++;
    });

    // Connection timeout
    connectionTimeout = setTimeout(() => {
      this.log("⏰ Connection timeout (30s)", "error");
      this.handleDisconnect("Connection timeout");
    }, 30000);
  }

  // Reset connection status
  resetConnectionStatus() {
    this.status.isConnected = false;
    this.status.hasSpawned = false;
    this.status.lastDisconnected = new Date().toISOString();
    this.stopAntiAfk();
  }

  // Handle disconnect with reconnection logic
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

    this.log(
      `🔄 Reconnecting in ${delay / 1000}s... (Attempt ${
        this.status.reconnectAttempts
      }/${this.config.maxReconnectAttempts})`,
      "warn"
    );

    // Give up after max attempts
    if (this.status.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.log("❌ Max reconnect attempts reached. Stopping bot.", "error");
      return;
    }

    // Schedule reconnection
    this.reconnectTimeout = setTimeout(() => {
      this.createBotConnection();
    }, delay);
  }

  // Start Anti-AFK system
  startAntiAfk() {
    if (this.status.antiAfk.active || !this.status.hasSpawned) return;

    this.log("🚶 Starting Anti-AFK system", "info");
    this.status.antiAfk.active = true;

    this.antiAfkInterval = setInterval(() => {
      this.performAntiAfkMovement();
    }, this.config.antiAfk.interval);
  }

  // Stop Anti-AFK system
  stopAntiAfk() {
    if (!this.status.antiAfk.active) return;

    this.log("🛑 Stopping Anti-AFK system", "info");
    this.status.antiAfk.active = false;

    if (this.antiAfkInterval) {
      clearInterval(this.antiAfkInterval);
      this.antiAfkInterval = null;
    }
  }

  // Perform Anti-AFK movement
  performAntiAfkMovement() {
    if (!this.isConnected() || !this.status.hasSpawned) return;

    try {
      const range = this.config.antiAfk.movementRange;
      const randomX = (Math.random() - 0.5) * range;
      const randomZ = (Math.random() - 0.5) * range;

      const newPosition = {
        x: this.status.currentPosition.x + randomX,
        y: this.status.currentPosition.y,
        z: this.status.currentPosition.z + randomZ,
      };

      this.moveToPosition(newPosition.x, newPosition.y, newPosition.z);
      this.status.antiAfk.lastMovement = new Date().toISOString();

      this.log(
        `🚶 Anti-AFK movement: (${newPosition.x.toFixed(
          2
        )}, ${newPosition.y.toFixed(2)}, ${newPosition.z.toFixed(2)})`,
        "info"
      );
    } catch (error) {
      this.log(`❌ Anti-AFK movement failed: ${error.message}`, "error");
    }
  }

  // Manual movement
  manualMove(x, y, z) {
    if (!this.isConnected() || !this.status.hasSpawned) {
      throw new Error("Bot not connected or spawned");
    }

    this.moveToPosition(x, y, z);
    this.log(`🎮 Manual movement to (${x}, ${y}, ${z})`, "info");

    return {
      success: true,
      position: { x, y, z },
      timestamp: new Date().toISOString(),
    };
  }

  // Move to position
  moveToPosition(x, y, z) {
    if (!this.client || !this.isConnected()) return;

    // Ensure entityId is valid before sending movement packet
    if (!this.entityId || this.entityId === undefined) {
      this.log(`⚠️ Cannot move: Entity ID not available yet`, "warn");
      return;
    }

    try {
      // Ensure entityId is properly converted to BigInt
      const entityId =
        typeof this.entityId === "bigint"
          ? this.entityId
          : BigInt(this.entityId);

      this.client.write("move_player", {
        runtime_id: entityId,
        position: {
          x: Number(parseFloat(x)),
          y: Number(parseFloat(y)),
          z: Number(parseFloat(z)),
        },
        pitch: Number(0),
        yaw: Number(0),
        head_yaw: Number(0),
        mode: Number(0),
        on_ground: true,
        ridden_runtime_id: BigInt(0),
        teleport_cause: Number(0),
        teleport_item: Number(0),
      });

      this.status.currentPosition = { x, y, z };
      this.status.packetsSent++;
    } catch (error) {
      this.log(`❌ Movement packet failed: ${error.message}`, "error");
      this.log(
        `🔍 Debug info - EntityID: ${this.entityId} (type: ${typeof this
          .entityId})`,
        "debug"
      );
      this.log(`🔍 Debug info - Position: x=${x}, y=${y}, z=${z}`, "debug");
    }
  }

  // Get bot status
  getStatus() {
    const uptime = Math.floor(
      (Date.now() - new Date(this.status.startTime).getTime()) / 1000
    );

    return {
      ...this.status,
      uptime,
      config: this.config,
      connected: this.isConnected(),
      antiAfkActive: this.status.antiAfk.active,
      lastAntiAfkMovement: this.status.antiAfk.lastMovement,
    };
  }
}

module.exports = Bot;
