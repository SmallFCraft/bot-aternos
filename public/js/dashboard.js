// Multi-Bot Dashboard JavaScript

// Global variables
let bots = [];
let logEntries = [];
let eventSource = null;
let logStreamActive = true;
let updateInterval = null;
let fastUpdateInterval = null;
let systemUptimeStartTime = Date.now();
let clientUptimeInterval = null;

// Initialize dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 Initializing Multi-Bot Dashboard...");

  // Load initial data
  loadBots();
  loadBetterStackStatus();
  loadRecentLogs();
  connectLogStream();

  // Set update intervals - optimized for better performance
  updateInterval = setInterval(() => {
    loadBots();
    loadBetterStackStatus();
  }, 10000); // Update every 10 seconds (reduced from 5s)

  // Additional fast refresh for bot status only
  fastUpdateInterval = setInterval(() => {
    // Quick status update without full reload
    updateBotStatusOnly();
  }, 30000); // Update bot status every 30 seconds (reduced from 15s)

  // Client-side uptime counter for smooth display
  clientUptimeInterval = setInterval(() => {
    updateClientSideUptimes();
  }, 1000); // Update every second for smooth counting

  console.log("✅ Dashboard initialized");
});

// Load Better Stack status
async function loadBetterStackStatus() {
  try {
    const response = await fetch("/api/betterstack/status");
    const data = await response.json();

    // Call updateBetterStackUI if it exists (defined in logging.js)
    if (typeof updateBetterStackUI === "function") {
      updateBetterStackUI(data);
    }
  } catch (error) {
    console.error("Error loading Better Stack status:", error);
    if (typeof updateBetterStackUI === "function") {
      updateBetterStackUI({ enabled: false, error: "Failed to load status" });
    }
  }
}

// Load all bots
async function loadBots() {
  try {
    const response = await fetch("/api/bots");
    const data = await response.json();

    if (data.success) {
      const previousBotsCount = bots.length;
      bots = data.bots;

      // Only re-render if bot count changed, otherwise just update status
      if (bots.length !== previousBotsCount) {
        renderBots();
      } else {
        // Just update existing bot cards
        bots.forEach(bot => {
          updateBotCardStatus(bot.id, bot);
        });
      }

      updateStats();
    } else {
      console.error("Failed to load bots:", data.error);
    }
  } catch (error) {
    console.error("Error loading bots:", error);
  }
}

// Quick status update without full reload
async function updateBotStatusOnly() {
  try {
    const response = await fetch("/api/bots");
    const data = await response.json();

    if (data.success && data.bots) {
      // Update existing bot status without full re-render
      data.bots.forEach(updatedBot => {
        const existingBotIndex = bots.findIndex(
          bot => bot.id === updatedBot.id
        );
        if (existingBotIndex !== -1) {
          // Update only status-related fields
          bots[existingBotIndex].status = updatedBot.status;
          bots[existingBotIndex].isConnected = updatedBot.isConnected;

          // Update the specific bot card in DOM
          updateBotCardStatus(updatedBot.id, updatedBot);
        }
      });

      // Update stats (skip system uptime to reduce API calls)
      updateStats(true);
    }
  } catch (error) {
    // Silently fail for quick updates to avoid spam
    console.debug("Quick status update failed:", error);
  }
}

// Update client-side uptimes for smooth counting
function updateClientSideUptimes() {
  // Update system uptime
  const systemUptimeSeconds = Math.floor(
    (Date.now() - systemUptimeStartTime) / 1000
  );
  const systemUptimeElement = document.getElementById("systemUptime");
  if (systemUptimeElement) {
    systemUptimeElement.textContent = formatUptime(systemUptimeSeconds);
  }

  // Update bot uptimes
  bots.forEach(bot => {
    const botCard = document.querySelector(`[data-bot-id="${bot.id}"]`);
    if (botCard && bot.status && bot.status.lastConnected && bot.isConnected) {
      const uptimeSeconds = Math.floor(
        (Date.now() - new Date(bot.status.lastConnected).getTime()) / 1000
      );
      // Find the uptime element specifically
      const uptimeItems = botCard.querySelectorAll(".bot-info-item");
      const uptimeItem = Array.from(uptimeItems).find(
        item => item.querySelector(".bot-info-label")?.textContent === "Uptime:"
      );
      if (uptimeItem) {
        const uptimeValue = uptimeItem.querySelector(".bot-info-value");
        if (uptimeValue) {
          uptimeValue.textContent = formatUptime(uptimeSeconds);
        }
      }
    }
  });
}

// Update individual bot card status
function updateBotCardStatus(botId, botData) {
  const botCard = document.querySelector(`[data-bot-id="${botId}"]`);
  if (!botCard) return;

  const isConnected =
    botData.isConnected ||
    (botData.status && botData.status.isConnected) ||
    false;

  // Update status indicator
  const statusDot = botCard.querySelector(".status-dot");
  const statusText = botCard.querySelector(".bot-status span:last-child");

  if (statusDot) {
    statusDot.className = `status-dot ${isConnected ? "online" : "offline"}`;
  }
  if (statusText) {
    statusText.textContent = isConnected ? "Online" : "Offline";
  }

  // Update bot card class
  botCard.className = `bot-card ${isConnected ? "connected" : "disconnected"}`;

  // Update bot controls - ensure all buttons are visible
  const controls = botCard.querySelector(".bot-controls");
  if (controls) {
    const startBtn = controls.querySelector('button[onclick*="startBot"]');
    const stopBtn = controls.querySelector('button[onclick*="stopBot"]');
    const restartBtn = controls.querySelector('button[onclick*="restartBot"]');

    if (startBtn && stopBtn) {
      if (isConnected) {
        startBtn.style.display = "none";
        stopBtn.style.display = "inline-block";
      } else {
        startBtn.style.display = "inline-block";
        stopBtn.style.display = "none";
      }
    }

    // Ensure restart button is always visible
    if (restartBtn) {
      restartBtn.style.display = "inline-block";
    }
  }

  // Don't update uptime here - let client-side counter handle it
  // Only update uptime when bot connects/disconnects
  if (botData.status && botData.status.lastConnected) {
    // Update the bot's lastConnected time in global bots array
    const botIndex = bots.findIndex(b => b.id === botId);
    if (botIndex !== -1) {
      bots[botIndex].status.lastConnected = botData.status.lastConnected;
    }
  }

  // Update stats if available
  if (botData.status) {
    const statsElements = botCard.querySelectorAll(".bot-stat-value");
    if (statsElements.length >= 2) {
      statsElements[0].textContent = botData.status.packetsSent || 0;
      statsElements[1].textContent = botData.status.packetsReceived || 0;
    }
  }
}

// Render bots in the grid
function renderBots() {
  const botGrid = document.getElementById("botGrid");
  if (!botGrid) return;

  if (bots.length === 0) {
    botGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #666;">
                <i class="bi bi-robot" style="font-size: 3em; margin-bottom: 20px; display: block;"></i>
                <h3>No bots created yet</h3>
                <p>Click "Create New Bot" to get started!</p>
            </div>
        `;
    return;
  }

  botGrid.innerHTML = bots
    .map(bot => {
      const isConnected =
        bot.isConnected || (bot.status && bot.status.isConnected) || false;
      const statusClass = isConnected ? "connected" : "disconnected";
      const uptime = formatUptime(bot.status?.uptime || 0);
      const position = bot.status?.currentPosition || { x: 0, y: 0, z: 0 };
      const shortId = bot.id.slice(0, 8);

      return `
            <div class="bot-card ${statusClass}" data-bot-id="${bot.id}">
                <div class="bot-header">
                    <div class="bot-name">
                        ${bot.config.name}
                        <div style="font-size: 0.7em; color: #9ca3af; margin-top: 2px;">
                            ID: ${shortId}
                        </div>
                    </div>
                    <div class="bot-status">
                        <span class="status-dot ${
                          isConnected ? "online" : "offline"
                        }"></span>
                        <span>${isConnected ? "Online" : "Offline"}</span>
                    </div>
                </div>

                <div class="bot-info">
                    <div class="bot-info-item">
                        <span class="bot-info-label">Server:</span>
                        <span class="bot-info-value">${bot.config.host}:${
        bot.config.port
      }</span>
                    </div>
                    <div class="bot-info-item">
                        <span class="bot-info-label">Username:</span>
                        <span class="bot-info-value">${
                          bot.config.username
                        }</span>
                    </div>
                    <div class="bot-info-item">
                        <span class="bot-info-label">Uptime:</span>
                        <span class="bot-info-value">${uptime}</span>
                    </div>
                    <div class="bot-info-item">
                        <span class="bot-info-label">Position:</span>
                        <span class="bot-info-value">${position.x.toFixed(
                          1
                        )}, ${position.y.toFixed(1)}, ${position.z.toFixed(
        1
      )}</span>
                    </div>
                    <div class="bot-info-item">
                        <span class="bot-info-label">Packets:</span>
                        <span class="bot-info-value">
                            <span class="bot-stat-value">${
                              bot.status?.packetsSent || 0
                            }</span> / 
                            <span class="bot-stat-value">${
                              bot.status?.packetsReceived || 0
                            }</span>
                        </span>
                    </div>
                </div>

                <div class="bot-controls">
                    ${
                      isConnected
                        ? `<button class="btn btn-danger" onclick="stopBot('${bot.id}')">
                            <i class="bi bi-stop"></i> Stop
                        </button>`
                        : `<button class="btn" onclick="startBot('${bot.id}')">
                            <i class="bi bi-play"></i> Start
                        </button>`
                    }
                    <button class="btn btn-warning" onclick="restartBot('${
                      bot.id
                    }')">
                        <i class="bi bi-arrow-repeat"></i> Restart
                    </button>
                    <button class="btn btn-secondary" onclick="toggleAntiAfk('${
                      bot.id
                    }')">
                        <i class="bi bi-person-walking"></i> Anti-AFK
                    </button>
                    <button class="btn btn-secondary" onclick="editBot('${
                      bot.id
                    }')">
                        <i class="bi bi-pencil-square"></i> Edit
                    </button>
                    <button class="btn btn-secondary" onclick="viewBotLogs('${
                      bot.id
                    }')">
                        <i class="bi bi-file-text"></i> Logs
                    </button>
                    <button class="btn btn-danger" onclick="deleteBot('${
                      bot.id
                    }')">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    })
    .join("");
}

// Update statistics
async function updateStats(skipSystemUptime = false) {
  const totalBots = bots.length;
  const runningBots = bots.filter(
    bot => bot.isConnected || (bot.status && bot.status.isConnected)
  ).length;
  const stoppedBots = totalBots - runningBots;

  // Update stat cards
  document.getElementById("totalBots").textContent = totalBots;
  document.getElementById("runningBots").textContent = runningBots;
  document.getElementById("stoppedBots").textContent = stoppedBots;

  // Only fetch system uptime occasionally to reduce API calls
  if (!skipSystemUptime) {
    try {
      const response = await fetch("/api/health/system");
      const data = await response.json();
      if (data.success && data.system.node.uptime) {
        systemUptimeStartTime = Date.now() - data.system.node.uptime * 1000;
      }
    } catch (error) {
      console.debug("Failed to get system uptime:", error);
    }
  }
}

// Format uptime
function formatUptime(seconds) {
  if (!seconds || seconds < 0) return "0s";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  if (updateInterval) clearInterval(updateInterval);
  if (fastUpdateInterval) clearInterval(fastUpdateInterval);
  if (clientUptimeInterval) clearInterval(clientUptimeInterval);
  if (eventSource) eventSource.close();
});
