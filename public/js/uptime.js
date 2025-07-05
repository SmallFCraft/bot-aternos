// Uptime Status Dashboard JavaScript
let updateInterval;
let systemStartTime;
let incidents = [];

// Initialize dashboard when page loads
document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 Uptime Dashboard initializing...");

  // Load initial data
  loadUptimeData();

  // Set up auto-refresh every 30 seconds
  updateInterval = setInterval(loadUptimeData, 30000);

  console.log("✅ Uptime Dashboard initialized");
});

// Load all uptime data
async function loadUptimeData() {
  setRefreshIndicatorUpdating(true);

  try {
    // Load comprehensive uptime data from new API
    const data = await apiCall("/api/uptime");

    if (data.success) {
      updateSystemUptime(data.system.uptime);
      updateOverallStats(data);
      updateBotStats(data.bots);
      renderBotUptimeCards(data.bots.details);
      updateBetterStackStatus(data.betterStack);
    }

    // Load incidents separately
    await loadIncidents();

    updateLastRefreshTime();
  } catch (error) {
    console.error("Error loading uptime data:", error);
    showError("Failed to load uptime data");
  } finally {
    setRefreshIndicatorUpdating(false);
  }
}

// Update system uptime display
function updateSystemUptime(uptimeSeconds) {
  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);

  document.getElementById(
    "systemUptime"
  ).textContent = `${days}d ${hours}h ${minutes}m`;
}

// Update overall statistics
function updateOverallStats(data) {
  // Use the calculated uptime percentage from API
  const uptime = data.system.overallUptimePercentage;
  document.getElementById("overallUptime").textContent =
    uptime.toFixed(1) + "%";

  // Update system start time
  if (data.system.startTime) {
    const startTime = new Date(data.system.startTime);
    document.getElementById("systemStartTime").textContent =
      startTime.toLocaleString();
  }

  // Generate timeline visualization using real data if available
  if (data.bots && data.bots.details && data.bots.details.length > 0) {
    // Calculate overall timeline from all bots
    const overallTimeline = calculateOverallTimeline(data.bots.details);
    generateTimelineFromData("overallTimeline", overallTimeline);
  } else {
    generateTimeline("overallTimeline", uptime);
  }
}

// Update bot statistics
function updateBotStats(botsData) {
  const activeBots = botsData.active;
  const totalBots = botsData.total;
  const successRate = botsData.successRate;

  document.getElementById(
    "activeBotsCount"
  ).textContent = `${activeBots}/${totalBots}`;
  document.getElementById("botSuccessRate").textContent = `${successRate}%`;

  // Update color based on success rate
  const element = document.getElementById("activeBotsCount");
  if (successRate >= 80) {
    element.style.color = "#00ff88";
  } else if (successRate >= 50) {
    element.style.color = "#ffa726";
  } else {
    element.style.color = "#ff4757";
  }
}

// Update Better Stack status
function updateBetterStackStatus(betterStackData) {
  const statusElement = document.getElementById("betterStackStatus");
  const heartbeatElement = document.getElementById("lastHeartbeat");

  if (betterStackData.enabled && betterStackData.lastHeartbeat) {
    statusElement.textContent = "Active";
    statusElement.style.color = "#00ff88";

    const lastHeartbeat = new Date(betterStackData.lastHeartbeat);
    heartbeatElement.textContent = formatRelativeTime(lastHeartbeat);
  } else {
    statusElement.textContent = "Inactive";
    statusElement.style.color = "#ff4757";
    heartbeatElement.textContent = "Never";
  }
}

// Render bot uptime cards
function renderBotUptimeCards(bots) {
  const container = document.getElementById("botUptimeGrid");

  if (bots.length === 0) {
    container.innerHTML =
      '<p style="color: #888; text-align: center; grid-column: 1/-1;">No bots configured</p>';
    return;
  }

  container.innerHTML = bots
    .map(
      bot => `
        <div class="bot-uptime-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h4 style="margin: 0;">${bot.config?.name || bot.id}</h4>
                <div class="bot-status-indicator ${
                  bot.connected ? "online" : "offline"
                }">
                    <i class="bi bi-${
                      bot.connected ? "check-circle" : "x-circle"
                    }"></i>
                    ${bot.connected ? "Online" : "Offline"}
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div>
                    <div style="color: #888; font-size: 0.85rem;">Current Uptime</div>
                    <div style="font-size: 1.2rem; font-weight: bold; color: ${
                      bot.connected ? "#00ff88" : "#888"
                    };">
                        ${formatUptime(bot.uptime || 0)}
                    </div>
                </div>
                <div>
                    <div style="color: #888; font-size: 0.85rem;">Server</div>
                    <div style="font-size: 0.9rem;">${
                      bot.config?.host || "Unknown"
                    }:${bot.config?.port || "Unknown"}</div>
                </div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <div style="color: #888; font-size: 0.85rem; margin-bottom: 5px;">Status Timeline (24h)</div>
                <div class="status-timeline" id="timeline-${bot.id}"></div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.85rem; color: #888;">
                <div>Last Connected: ${
                  bot.lastConnected
                    ? formatRelativeTime(new Date(bot.lastConnected))
                    : "Never"
                }</div>
                <div>Reconnects: ${bot.reconnectAttempts || 0}</div>
            </div>
        </div>
    `
    )
    .join("");

  // Generate timelines for each bot using real data
  bots.forEach(bot => {
    if (bot.timeline) {
      generateTimelineFromData(`timeline-${bot.id}`, bot.timeline);
    } else {
      // Fallback to calculated percentage
      const uptimePercentage =
        bot.uptimePercentage || (bot.connected ? 95 : 30);
      generateTimeline(`timeline-${bot.id}`, uptimePercentage);
    }
  });
}

// Note: Timeline functions (generateTimelineFromData, generateTimeline) are now in common.js

// Load incidents from API
async function loadIncidents() {
  try {
    const data = await apiCall("/api/uptime/incidents?limit=5");

    if (data.success) {
      renderIncidents(data.incidents);
    } else {
      // Show empty state
      const container = document.getElementById("incidentList");
      container.innerHTML =
        '<p style="color: #888; text-align: center; padding: 20px;">No incidents found</p>';
    }
  } catch (error) {
    console.error("Error loading incidents:", error);
    // Show empty state on error
    const container = document.getElementById("incidentList");
    container.innerHTML =
      '<p style="color: #888; text-align: center; padding: 20px;">Failed to load incidents</p>';
  }
}

// Render incidents
function renderIncidents(incidents) {
  const container = document.getElementById("incidentList");

  if (incidents.length === 0) {
    container.innerHTML =
      '<p style="color: #888; text-align: center; padding: 20px;">No recent incidents</p>';
    return;
  }

  container.innerHTML = incidents
    .map(
      incident => `
        <div class="incident-item ${
          incident.status === "resolved" ? "resolved" : ""
        }">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                <h4 style="margin: 0; color: ${
                  incident.status === "resolved" ? "#00ff88" : "#ff4757"
                };">
                    <i class="bi bi-${
                      incident.status === "resolved"
                        ? "check-circle"
                        : "exclamation-triangle"
                    }"></i>
                    ${incident.title}
                </h4>
                <span class="incident-time">${formatRelativeTime(
                  new Date(incident.startTime)
                )}</span>
            </div>
            <p style="margin: 0 0 8px 0; color: #ccc;">${
              incident.description
            }</p>
            <div style="font-size: 0.85rem; color: #888;">
                Duration: ${formatDuration(incident.duration)} • Status: ${
        incident.status === "resolved" ? "Resolved" : "Ongoing"
      }
            </div>
        </div>
    `
    )
    .join("");
}

// Note: Utility functions (formatUptime, formatRelativeTime, calculateOverallTimeline) are now in common.js

// Note: formatDuration, updateLastRefreshTime, and showError are now in common.js

// Cleanup on page unload
window.addEventListener("beforeunload", function () {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
});
