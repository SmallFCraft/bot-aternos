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

  // Check if bot is in connecting state
  isConnecting() {
    return this.status.isConnecting;
  }

  // Check if bot is in reconnecting state
  isReconnecting() {
    return this.reconnectTimeout !== null;
  }

  // Set connecting state
  setConnecting(connecting) {
    this.status.isConnecting = connecting;
    this.log(`🔄 Bot connecting state: ${connecting}`, "info");
  }

  // Start bot connection
  async connect() {
    this.log(
      `🚀 Starting connection to ${this.config.host}:${this.config.port}...`,
      "info"
    );
    this.log(`👤 Username: ${this.config.username}`, "info");

    // Set connecting state
    this.setConnecting(true);

    this.createBotConnection();
  }

  // Disconnect bot
  async disconnect() {
    this.log("🛑 Disconnecting bot...", "info");

    // Clear intervals and timeouts
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
      this.log("🔄 Reconnect timeout cleared", "info");
    }

    if (this.antiAfkInterval) {
      clearInterval(this.antiAfkInterval);
      this.antiAfkInterval = null;
    }

    // Reset reconnect attempts to stop reconnection cycle
    this.status.reconnectAttempts = 0;

    // Disconnect client
    if (this.client) {
      try {
        this.client.disconnect();
      } catch (error) {
        // Ignore disconnect errors
      }
      this.client = null;
    }

    this.resetConnectionStatus(); // This will reset connecting state
    this.log("✅ Bot disconnected", "info");
  }

  // Force kill bot immediately (like kill terminal)
  async kill() {
    this.log("💀 Force killing bot...", "warn");

    // Immediately clear all timeouts and intervals
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.antiAfkInterval) {
      clearInterval(this.antiAfkInterval);
      this.antiAfkInterval = null;
    }

    // Reset reconnect attempts to stop reconnection cycle
    this.status.reconnectAttempts = 0;

    // Try graceful disconnect first, then force if needed
    if (this.client) {
      try {
        // Attempt graceful disconnect with timeout
        const disconnectPromise = new Promise(resolve => {
          try {
            this.client.disconnect();
            this.log("💀 Sent disconnect packet to server", "info");
            resolve();
          } catch (error) {
            this.log(`💀 Graceful disconnect failed: ${error.message}`, "warn");
            resolve();
          }
        });

        // Set a 2-second timeout for graceful disconnect
        const timeoutPromise = new Promise(resolve => {
          setTimeout(() => {
            this.log(
              "💀 Graceful disconnect timeout, forcing socket destruction",
              "warn"
            );
            resolve();
          }, 2000);
        });

        // Wait for either disconnect or timeout
        await Promise.race([disconnectPromise, timeoutPromise]);

        // Force destroy socket if it still exists
        if (
          this.client &&
          this.client.socket &&
          !this.client.socket.destroyed
        ) {
          this.client.socket.destroy();
          this.log("💀 Socket force destroyed", "warn");
        }

        this.client = null;
      } catch (error) {
        // Ignore any errors during force kill
        this.log(`💀 Error during kill: ${error.message}`, "warn");
        this.client = null;
      }
    }

    // Reset all status immediately
    this.status.isConnected = false;
    this.status.isConnecting = false;
    this.status.hasSpawned = false;
    this.status.reconnectAttempts = 0;
    this.status.lastDisconnected = new Date().toISOString();

    this.log("💀 Bot force killed", "warn");
  }

  // Validate host and port
  validateHostAndPort() {
    // Validate host
    if (!this.config.host || typeof this.config.host !== "string") {
      throw new Error("Invalid host: host must be a non-empty string");
    }

    // Trim whitespace from host
    const host = this.config.host.trim();
    if (host.length === 0) {
      throw new Error("Invalid host: host cannot be empty");
    }

    // Validate host format (basic validation)
    // Allow hostnames (with dots, hyphens) and IP addresses
    const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-\.]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-\.]*[a-zA-Z0-9])?)*$/;
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    
    if (!hostnameRegex.test(host) && !ipRegex.test(host)) {
      throw new Error(`Invalid host format: ${host}`);
    }

    // Validate port
    let port = this.config.port;
    
    // Convert port to integer if it's a string
    if (typeof port === "string") {
      port = parseInt(port, 10);
      if (isNaN(port)) {
        throw new Error(`Invalid port: ${this.config.port} is not a valid number`);
      }
    }

    // Ensure port is a number
    if (typeof port !== "number" || isNaN(port)) {
      throw new Error(`Invalid port: port must be a valid number`);
    }

    // Validate port range
    if (port < 1 || port > 65535) {
      throw new Error(`Invalid port: ${port} must be between 1 and 65535`);
    }

    return { host, port };
  }

  // Create bot connection
  createBotConnection() {
    try {
      // Check if bot should still be connecting (prevent reconnect after manual stop)
      if (!this.status.isConnecting) {
        this.log(
          "🛑 Connection attempt cancelled - bot no longer in connecting state",
          "info"
        );
        return;
      }

      // Validate host and port before attempting connection
      let validatedHost, validatedPort;
      try {
        const validated = this.validateHostAndPort();
        validatedHost = validated.host;
        validatedPort = validated.port;
      } catch (validationError) {
        this.log(`❌ Configuration validation failed: ${validationError.message}`, "error");
        this.status.isConnecting = false;
        this.handleDisconnect(`Validation error: ${validationError.message}`);
        return;
      }

      // Update config with validated values
      this.config.host = validatedHost;
      this.config.port = validatedPort;

      this.log(
        `🔗 Connecting to ${validatedHost}:${validatedPort}...`,
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

      // Reset connection status but keep connecting state
      this.resetConnectionStatus(false);

      // Create client options with validated values
      // Note: connectTimeout should match the connection timeout handler below
      const clientOptions = {
        host: validatedHost,
        port: validatedPort,
        username: this.config.username,
        version: this.config.version,
        offline: this.config.isOfflineMode,
        skipAuthentication: this.config.skipAuthentication,
        connectTimeout: 45000, // Increased timeout to match connection timeout handler
        keepAlive: true,
        conLog: () => {}, // Disable internal logging
      };

      // Wrap createClient in try-catch to handle native module errors
      try {
        this.client = bedrock.createClient(clientOptions);
        this.setupEventHandlers();
      } catch (createError) {
        // Handle errors from native module (Rust code)
        let errorMsg = createError.message || createError.toString();
        
        // Check for address parsing errors from Rust
        if (errorMsg.includes("AddrParseError") || 
            errorMsg.includes("Socket") ||
            errorMsg.includes("panicked") ||
            errorMsg.includes("unwrap")) {
          errorMsg = `Invalid server address format: ${validatedHost}:${validatedPort}. Please verify the host and port are correct.`;
        }
        
        throw new Error(errorMsg);
      }
    } catch (error) {
      // Handle specific address parsing errors
      let errorMessage = error.message;
      if (error.message && error.message.includes("AddrParseError")) {
        errorMessage = `Invalid server address format: ${this.config.host}:${this.config.port}. Please check host and port configuration.`;
      } else if (error.message && error.message.includes("Socket")) {
        errorMessage = `Socket error: Invalid address format for ${this.config.host}:${this.config.port}`;
      }

      this.log(`❌ Failed to create Bedrock client: ${errorMessage}`, "error");
      this.status.isConnecting = false;
      this.handleDisconnect(`Create error: ${errorMessage}`);
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
      this.status.isConnecting = false; // Clear connecting state
      this.status.hasSpawned = true;
      this.status.lastConnected = now.toISOString();
      this.status.reconnectAttempts = 0;
      this.status.currentPosition = { x: 0, y: 64, z: 0 };

      // Clear any pending reconnect timeout
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
        this.log("🔄 Cleared pending reconnect timeout", "info");
      }

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
      this.resetConnectionStatus(false); // Don't reset connecting state yet
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
        else if (err.message && err.message.includes("AddrParseError"))
          errorMessage = `Invalid server address format: ${this.config.host}:${this.config.port}`;
        else if (err.message && err.message.includes("Ping timed out"))
          errorMessage = "Ping timeout - server may be unreachable or slow";
        else if (err.message && err.message.includes("Socket"))
          errorMessage = `Socket error: ${err.message}`;
      } else if (typeof err === "string") {
        errorMessage = err;
        // Check for common error patterns in string format
        if (err.includes("AddrParseError") || err.includes("Socket"))
          errorMessage = `Address parsing error: Invalid format for ${this.config.host}:${this.config.port}`;
        if (err.includes("Ping timed out"))
          errorMessage = "Ping timeout - server may be unreachable or slow";
      }

      this.log(`❌ Connection error: ${errorMessage}`, "error");
      this.resetConnectionStatus(false); // Don't reset connecting state yet
      this.handleDisconnect(`Error: ${errorMessage}`);
    });

    // Packet counting
    this.client.on("packet", () => {
      this.status.packetsReceived++;
    });

    // Connection timeout - increased to 45s to account for slow servers
    connectionTimeout = setTimeout(() => {
      this.log("⏰ Connection timeout (45s)", "error");
      this.handleDisconnect("Connection timeout");
    }, 45000);
  }

  // Reset connection status
  resetConnectionStatus(resetConnecting = true) {
    this.status.isConnected = false;
    this.status.hasSpawned = false;
    this.status.lastDisconnected = new Date().toISOString();

    // Only reset connecting state if explicitly requested
    if (resetConnecting) {
      this.status.isConnecting = false;
    }

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
      // Clear connecting state when giving up
      this.status.isConnecting = false;
      return;
    }

    // Keep connecting state during reconnection attempts
    // This ensures UI shows bot as "connecting" during reconnect delays
    this.status.isConnecting = true;

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

      // Try alternative approach - use player_move instead of move_player
      try {
        this.client.write("player_move", {
          position: {
            x: parseFloat(x),
            y: parseFloat(y),
            z: parseFloat(z),
          },
        });
        this.log(`🔍 Sent player_move packet successfully`, "debug");
      } catch (altError) {
        this.log(
          `⚠️ player_move failed, trying move_player: ${altError.message}`,
          "warn"
        );

        // Fallback to original method with string conversion
        const packet = {
          runtime_id: entityId.toString(), // Convert BigInt to string
          position: {
            x: parseFloat(x),
            y: parseFloat(y),
            z: parseFloat(z),
          },
          pitch: 0,
          yaw: 0,
          head_yaw: 0,
          mode: 0,
          on_ground: true,
        };

        this.log(`🔍 Fallback packet: ${JSON.stringify(packet)}`, "debug");
        this.client.write("move_player", packet);
      }

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
    // Calculate uptime only when connected
    let uptime = 0;
    if (this.isConnected() && this.status.lastConnected) {
      uptime = Math.floor(
        (Date.now() - new Date(this.status.lastConnected).getTime()) / 1000
      );
    }

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
