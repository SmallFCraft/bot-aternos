// src/api/server.js - Express API Server for Multi-Bot System
const express = require("express");
const path = require("path");

class APIServer {
  constructor(botManager, port = 3000) {
    this.botManager = botManager;
    this.port = port;
    this.app = express();
    this.server = null;

    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    // Body parsing middleware
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true }));

    // CORS middleware
    this.app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
      );

      if (req.method === "OPTIONS") {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Static files middleware (serve dashboard)
    this.app.use(express.static(path.join(__dirname, "../../public")));

    // Request logging middleware
    this.app.use((req, res, next) => {
      const timestamp = new Date().toISOString();
      console.log(`📡 [${timestamp}] ${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    // Import route modules
    const botsRoutes = require("./routes/bots")(this.botManager);
    const logsRoutes = require("./routes/logs")(this.botManager);
    const healthRoutes = require("./routes/health")(this.botManager);
    const betterStackRoutes = require("./routes/betterstack")(this.botManager);
    const uptimeRoutes = require("./routes/uptime")(this.botManager);

    // API routes
    this.app.use("/api/bots", botsRoutes);
    this.app.use("/api/logs", logsRoutes);
    this.app.use("/api/health", healthRoutes);
    this.app.use("/api/betterstack", betterStackRoutes);
    this.app.use("/api/uptime", uptimeRoutes);

    // Legacy compatibility routes (for existing dashboard)
    this.setupLegacyRoutes();

    // Dashboard route
    this.app.get("/", (req, res) => {
      res.sendFile(path.join(__dirname, "../../public/dashboard.html"));
    });

    // Uptime status page route
    this.app.get("/uptime", (req, res) => {
      res.sendFile(path.join(__dirname, "../../public/uptime.html"));
    });

    // 404 handler
    this.app.use("*", (req, res) => {
      res.status(404).json({
        success: false,
        error: "Endpoint not found",
        message: `${req.method} ${req.originalUrl} is not a valid endpoint`,
      });
    });

    // Error handler
    this.app.use((error, req, res, next) => {
      console.error("API Error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: error.message,
      });
    });
  }

  // Legacy routes for backward compatibility with old dashboard
  setupLegacyRoutes() {
    // Legacy main status endpoint
    this.app.get("/status", (req, res) => {
      try {
        const bots = this.botManager.getAllBots();
        const stats = this.botManager.getStats();

        // Return data in old format for compatibility
        if (bots.length > 0) {
          const firstBot = bots[0];
          res.json({
            status: "Multi-Bot Aternos Keep-Alive System",
            server: `${firstBot.config.host}:${firstBot.config.port}`,
            botStatus: firstBot.status,
            serverInfo: firstBot.config,
            antiAfk: {
              enabled: firstBot.config.antiAfk.enabled,
              active: firstBot.status.antiAfkActive,
              interval: firstBot.config.antiAfk.interval / 1000 + "s",
              range: firstBot.config.antiAfk.movementRange + " blocks",
            },
            compliance: {
              aternosPolicy: "⚠️ WARNING: This bot may violate Aternos ToS",
              recommendation: "Consider switching to bot-friendly hosting",
              riskLevel: "MEDIUM",
            },
            multiBot: {
              totalBots: stats.totalBots,
              runningBots: stats.runningBots,
              stoppedBots: stats.stoppedBots,
            },
          });
        } else {
          res.json({
            status: "Multi-Bot Aternos Keep-Alive System",
            server: "No bots configured",
            botStatus: { connected: false },
            serverInfo: {},
            antiAfk: { enabled: false, active: false },
            compliance: {
              aternosPolicy: "⚠️ WARNING: This bot may violate Aternos ToS",
              recommendation: "Consider switching to bot-friendly hosting",
              riskLevel: "MEDIUM",
            },
            multiBot: {
              totalBots: 0,
              runningBots: 0,
              stoppedBots: 0,
            },
          });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Legacy health endpoint
    this.app.get("/health", (req, res) => {
      res.redirect("/api/health");
    });

    // Legacy stats endpoint
    this.app.get("/stats", (req, res) => {
      res.redirect("/api/health/stats");
    });

    // Legacy compliance endpoint
    this.app.get("/compliance", (req, res) => {
      res.redirect("/api/health/compliance");
    });

    // Legacy Better Stack endpoints
    this.app.get("/betterstack-status", (req, res) => {
      res.redirect("/api/betterstack/status");
    });

    this.app.post("/setup-betterstack", (req, res) => {
      res.redirect(307, "/api/betterstack/setup");
    });

    // Legacy logs endpoints
    this.app.get("/logs/recent", (req, res) => {
      res.redirect("/api/logs/recent");
    });

    this.app.get("/logs/stream", (req, res) => {
      res.redirect("/api/logs/stream");
    });

    this.app.post("/logs/clear", (req, res) => {
      res.redirect(307, "/api/logs/clear"); // 307 preserves POST method
    });

    // Legacy bot control endpoints (for first bot only)
    this.app.post("/anti-afk/start", async (req, res) => {
      try {
        const bots = this.botManager.getAllBots();
        if (bots.length === 0) {
          return res.status(400).json({ error: "No bots available" });
        }

        const firstBot = bots[0];
        const botInstance = this.botManager.bots.get(firstBot.id);

        if (!botInstance.status.hasSpawned) {
          return res.status(400).json({
            error: "Bot not spawned yet",
            message: "Wait for bot to spawn before starting anti-AFK",
          });
        }

        if (botInstance.status.antiAfk.active) {
          return res.json({
            message: "Anti-AFK already active",
            status: "already_running",
          });
        }

        botInstance.startAntiAfk();
        res.json({
          message: "Anti-AFK started",
          status: "started",
          interval: firstBot.config.antiAfk.interval / 1000 + "s",
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post("/anti-afk/stop", async (req, res) => {
      try {
        const bots = this.botManager.getAllBots();
        if (bots.length === 0) {
          return res.status(400).json({ error: "No bots available" });
        }

        const firstBot = bots[0];
        const botInstance = this.botManager.bots.get(firstBot.id);

        if (!botInstance.status.antiAfk.active) {
          return res.json({
            message: "Anti-AFK already inactive",
            status: "already_stopped",
          });
        }

        botInstance.stopAntiAfk();
        res.json({
          message: "Anti-AFK stopped",
          status: "stopped",
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post("/manual-move", async (req, res) => {
      try {
        const { x, y, z } = req.body;
        const bots = this.botManager.getAllBots();

        if (bots.length === 0) {
          return res.status(400).json({ error: "No bots available" });
        }

        const firstBot = bots[0];
        const botInstance = this.botManager.bots.get(firstBot.id);

        if (!botInstance.status.hasSpawned) {
          return res.status(400).json({
            error: "Bot not spawned yet",
            message: "Wait for bot to spawn before manual movement",
          });
        }

        if (
          typeof x !== "number" ||
          typeof y !== "number" ||
          typeof z !== "number"
        ) {
          return res.status(400).json({
            error: "Invalid coordinates",
            message: "x, y, z must be numbers",
            example: { x: 0, y: 64, z: 0 },
          });
        }

        const result = botInstance.manualMove(x, y, z);
        res.json({
          message: "Manual movement command sent",
          position: result.position,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        res.status(500).json({
          error: "Movement failed",
          message: error.message,
        });
      }
    });

    this.app.post("/restart", async (req, res) => {
      try {
        const bots = this.botManager.getAllBots();
        if (bots.length === 0) {
          return res.status(400).json({ error: "No bots available" });
        }

        const firstBot = bots[0];
        await this.botManager.restartBot(firstBot.id);

        res.json({
          message: "Bot restart initiated",
          status: "restarting",
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  // Start the server
  start() {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.port, () => {
          console.log(`🌐 API Server running on port ${this.port}`);
          console.log(`📊 Dashboard: http://localhost:${this.port}`);
          console.log(`🔗 API Base: http://localhost:${this.port}/api`);
          resolve();
        });

        this.server.on("error", error => {
          console.error("❌ Server error:", error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Stop the server
  stop() {
    return new Promise(resolve => {
      if (this.server) {
        this.server.close(() => {
          console.log("🛑 API Server stopped");
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = APIServer;
