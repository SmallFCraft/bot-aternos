#!/usr/bin/env node

// setup-betterstack.js - Auto setup Better Stack với Render URL
const axios = require("axios");
const fs = require("fs");

console.log("🔧 Better Stack Auto Setup Script");
console.log("====================================");

// Get Render URL from environment or prompt
const RENDER_URL = process.env.RENDER_EXTERNAL_URL || process.argv[2];

if (!RENDER_URL) {
  console.log("❌ Cần cung cấp Render URL!");
  console.log("");
  console.log("Cách 1: Environment variable");
  console.log("export RENDER_EXTERNAL_URL=https://your-app.onrender.com");
  console.log("node setup-betterstack.js");
  console.log("");
  console.log("Cách 2: Command line argument");
  console.log("node setup-betterstack.js https://your-app.onrender.com");
  process.exit(1);
}

const BETTER_STACK_API_KEY =
  process.env.BETTER_STACK_API_KEY || "qSKMsyh2kvpkE7azw334VFrF";

async function setupBetterStack() {
  try {
    console.log(`🌐 Render URL: ${RENDER_URL}`);
    console.log(`🔑 API Key: ${BETTER_STACK_API_KEY.substring(0, 8)}...`);
    console.log("");

    // Test health endpoint first
    console.log("🏥 Testing health endpoint...");
    try {
      const healthResponse = await axios.get(`${RENDER_URL}/health`, {
        timeout: 10000,
      });
      console.log(`✅ Health check passed: ${healthResponse.data.status}`);
    } catch (error) {
      console.log(`⚠️ Health check failed: ${error.message}`);
      console.log("   (This is normal if bot is starting up)");
    }

    // Create Better Stack monitor
    console.log("");
    console.log("📊 Creating Better Stack monitor...");

    const monitorData = {
      monitor_type: "expected_status_code",
      url: `${RENDER_URL}/health`,
      expected_status_codes: [200],
      check_frequency: 60, // Every 1 minute
      request_timeout: 30,
      recovery_period: 60,
      confirmation_period: 60,
      pronounceable_name: "aternos-bedrock-bot",
    };

    try {
      const response = await axios.post(
        "https://uptime.betterstack.com/api/v2/monitors",
        monitorData,
        {
          headers: {
            Authorization: `Bearer ${BETTER_STACK_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        }
      );

      const monitor = response.data.data;
      console.log(`✅ Monitor created successfully!`);
      console.log(`📋 Monitor ID: ${monitor.id}`);
      console.log(
        `🌐 Monitor URL: https://betterstack.com/team/${monitor.attributes.team_id}/monitors/${monitor.id}`
      );

      // Generate heartbeat URL (if supported)
      const heartbeatUrl = `https://betterstack.com/api/v1/heartbeat/${
        monitor.attributes.pronounceable_name || monitor.id
      }`;
      console.log(`💗 Estimated Heartbeat URL: ${heartbeatUrl}`);

      // Save config
      const config = {
        monitorId: monitor.id,
        monitorUrl: `https://betterstack.com/team/${monitor.attributes.team_id}/monitors/${monitor.id}`,
        healthCheckUrl: `${RENDER_URL}/health`,
        dashboardUrl: `${RENDER_URL}/dashboard`,
        heartbeatUrl: heartbeatUrl,
        setupDate: new Date().toISOString(),
      };

      fs.writeFileSync(
        "betterstack-config.json",
        JSON.stringify(config, null, 2)
      );
      console.log("💾 Config saved to betterstack-config.json");
    } catch (error) {
      if (error.response?.status === 422) {
        console.log("⚠️ Monitor might already exist or validation error");
        console.log("   Error details:", error.response.data);
      } else if (error.response?.status === 401) {
        console.log("❌ Authentication failed - check API key");
      } else {
        console.log(`❌ API Error: ${error.message}`);
        if (error.response?.data) {
          console.log("   Details:", error.response.data);
        }
      }
    }

    // Test dashboard
    console.log("");
    console.log("🎮 Testing dashboard...");
    try {
      const dashboardResponse = await axios.get(`${RENDER_URL}/dashboard`, {
        timeout: 10000,
      });
      if (dashboardResponse.status === 200) {
        console.log(`✅ Dashboard accessible: ${RENDER_URL}/dashboard`);
      }
    } catch (error) {
      console.log(`⚠️ Dashboard test failed: ${error.message}`);
    }

    // Final instructions
    console.log("");
    console.log("🎯 Next Steps:");
    console.log("");
    console.log("1. 🌐 Access Better Stack Dashboard:");
    console.log("   https://betterstack.com/team/YOUR_TEAM_ID/monitors");
    console.log("");
    console.log("2. 📊 Bot Dashboard:");
    console.log(`   ${RENDER_URL}/dashboard`);
    console.log("");
    console.log("3. ❤️ Health Check:");
    console.log(`   ${RENDER_URL}/health`);
    console.log("");
    console.log("4. 🔧 Manual Control:");
    console.log(`   ${RENDER_URL}/restart - Restart bot`);
    console.log(`   ${RENDER_URL}/stats - View detailed stats`);
    console.log("");
    console.log("5. 💗 Add Heartbeat URL to Render Environment:");
    console.log(
      "   BETTER_STACK_HEARTBEAT = [Get from Better Stack dashboard]"
    );
    console.log("");
    console.log("✅ Setup complete! Your Aternos server will be online 24/7!");
  } catch (error) {
    console.error("❌ Setup failed:", error.message);
    process.exit(1);
  }
}

// Run setup
setupBetterStack();
