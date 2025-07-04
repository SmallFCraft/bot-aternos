// index-new.js - Multi-Bot System Main Entry Point
require("dotenv").config();

const path = require("path");
const BotManager = require("./src/core/BotManager");
const APIServer = require("./src/api/server");
const config = require("./src/config/default");

// Configuration
const PORT = process.env.PORT || 3000;

class MultiBotSystem {
  constructor() {
    this.botManager = null;
    this.apiServer = null;
    this.isShuttingDown = false;
  }

  async initialize() {
    try {
      console.log("🚀 Initializing Multi-Bot Aternos System...");
      console.log("📅 Start time:", new Date().toLocaleString());

      // Validate and display configuration
      const validation = config.validate();
      if (!validation.isValid) {
        console.error("❌ Configuration validation failed:");
        validation.errors.forEach(error => console.error(`   • ${error}`));
        process.exit(1);
      }

      config.displaySummary();

      // Display warnings
      this.displayWarnings();

      // Initialize BotManager
      console.log("🤖 Initializing Bot Manager...");
      this.botManager = new BotManager();

      // Initialize API Server
      console.log("🌐 Initializing API Server...");
      this.apiServer = new APIServer(this.botManager, PORT);

      // Start API Server
      await this.apiServer.start();

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      console.log("✅ Multi-Bot System initialized successfully!");
      console.log(`📊 Dashboard: http://localhost:${PORT}`);
      console.log(`🔗 API: http://localhost:${PORT}/api`);
      console.log("");
      console.log("🎯 Ready to manage multiple bots!");

      // Display initial statistics
      this.displayStats();
    } catch (error) {
      console.error("❌ Failed to initialize Multi-Bot System:", error);
      process.exit(1);
    }
  }

  displayWarnings() {
    console.log("");
    console.log("⚠️  ==================== WARNING ====================");
    console.log("🚨 This bot may violate Aternos Terms of Service");
    console.log("📋 Aternos prohibits automated keep-alive systems");
    console.log("⚖️  Risk Level: MEDIUM");
    console.log("");
    console.log("💡 RECOMMENDED ALTERNATIVES:");
    console.log("   • Oracle Cloud Always Free (24/7 support)");
    console.log("   • Google Cloud Platform Free Tier");
    console.log("   • AWS Free Tier");
    console.log("   • Self-hosted VPS solutions");
    console.log("   • Dedicated Minecraft hosting services");
    console.log("");
    console.log("🔗 Consider migrating to bot-friendly hosting");
    console.log("====================================================");
    console.log("");
  }

  displayStats() {
    const stats = this.botManager.getStats();
    console.log("📊 SYSTEM STATISTICS:");
    console.log(`   • Total Bots: ${stats.totalBots}`);
    console.log(`   • Running Bots: ${stats.runningBots}`);
    console.log(`   • Stopped Bots: ${stats.stoppedBots}`);
    console.log(
      `   • Memory Usage: ${Math.round(
        stats.memoryUsage.heapUsed / 1024 / 1024
      )}MB`
    );
    console.log(`   • Node.js Version: ${process.version}`);
    console.log(`   • Platform: ${process.platform}`);
    console.log("");
  }

  setupGracefulShutdown() {
    const shutdown = async signal => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;

      console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);

      try {
        // Stop all bots
        if (this.botManager) {
          console.log("🤖 Shutting down all bots...");
          await this.botManager.shutdown();
        }

        // Stop API server
        if (this.apiServer) {
          console.log("🌐 Stopping API server...");
          await this.apiServer.stop();
        }

        console.log("✅ Graceful shutdown completed");
        process.exit(0);
      } catch (error) {
        console.error("❌ Error during shutdown:", error);
        process.exit(1);
      }
    };

    // Handle different shutdown signals
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGQUIT", () => shutdown("SIGQUIT"));

    // Handle uncaught exceptions
    process.on("uncaughtException", error => {
      console.error("💥 Uncaught Exception:", error);
      shutdown("uncaughtException");
    });

    process.on("unhandledRejection", (reason, promise) => {
      console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
      shutdown("unhandledRejection");
    });
  }
}

// Check if this file is being run directly
if (require.main === module) {
  const system = new MultiBotSystem();
  system.initialize().catch(error => {
    console.error("💥 Fatal error during initialization:", error);
    process.exit(1);
  });
}

module.exports = MultiBotSystem;
