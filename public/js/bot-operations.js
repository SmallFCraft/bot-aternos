// Bot Operations JavaScript

// Start a bot
async function startBot(botId) {
  const botCard = document.querySelector(`[data-bot-id="${botId}"]`);
  const startBtn = botCard?.querySelector('button[onclick*="startBot"]');

  try {
    // Add loading state
    if (startBtn) {
      startBtn.classList.add("loading");
      startBtn.disabled = true;
      startBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Starting...';
    }

    addLocalLog(`🚀 Starting bot ${botId.slice(0, 8)}...`);

    const response = await fetch(`/api/bots/${botId}/start`, {
      method: "POST",
    });

    const data = await response.json();

    if (data.success) {
      addLocalLog(`✅ Bot started successfully`);
      loadBots(); // Refresh bot list
    } else {
      addLocalLog(`❌ Failed to start bot: ${data.error}`, "error");
      alert(`Failed to start bot: ${data.error}`);
    }
  } catch (error) {
    addLocalLog(`❌ Error starting bot: ${error.message}`, "error");
    alert(`Error starting bot: ${error.message}`);
  } finally {
    // Remove loading state
    if (startBtn) {
      startBtn.classList.remove("loading");
      startBtn.disabled = false;
      startBtn.innerHTML = '<i class="bi bi-play"></i> Start';
    }
  }
}

// Stop a bot
async function stopBot(botId) {
  try {
    addLocalLog(`🛑 Stopping bot ${botId.slice(0, 8)}...`);

    const response = await fetch(`/api/bots/${botId}/stop`, {
      method: "POST",
    });

    const data = await response.json();

    if (data.success) {
      addLocalLog(`✅ Bot stopped successfully`);
      loadBots(); // Refresh bot list
    } else {
      addLocalLog(`❌ Failed to stop bot: ${data.error}`, "error");
      alert(`Failed to stop bot: ${data.error}`);
    }
  } catch (error) {
    addLocalLog(`❌ Error stopping bot: ${error.message}`, "error");
    alert(`Error stopping bot: ${error.message}`);
  }
}

// Restart a bot
async function restartBot(botId) {
  if (!confirm("Are you sure you want to restart this bot?")) return;

  try {
    addLocalLog(`🔄 Restarting bot ${botId.slice(0, 8)}...`);

    const response = await fetch(`/api/bots/${botId}/restart`, {
      method: "POST",
    });

    const data = await response.json();

    if (data.success) {
      addLocalLog(`✅ Bot restarted successfully`);
      loadBots(); // Refresh bot list
    } else {
      addLocalLog(`❌ Failed to restart bot: ${data.error}`, "error");
      alert(`Failed to restart bot: ${data.error}`);
    }
  } catch (error) {
    addLocalLog(`❌ Error restarting bot: ${error.message}`, "error");
    alert(`Error restarting bot: ${error.message}`);
  }
}

// Delete a bot
async function deleteBot(botId) {
  const bot = bots.find(b => b.id === botId);
  if (!bot) {
    alert("Bot not found!");
    return;
  }

  if (
    !confirm(
      `Are you sure you want to delete "${bot.config.name}"?\n\nThis action cannot be undone.`
    )
  ) {
    return;
  }

  try {
    addLocalLog(`🗑️ Deleting bot ${bot.config.name}...`);

    const response = await fetch(`/api/bots/${botId}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (data.success) {
      addLocalLog(`✅ Bot deleted successfully`);
      loadBots(); // Refresh bot list
      alert("✅ Bot deleted successfully!");
    } else {
      addLocalLog(`❌ Failed to delete bot: ${data.error}`, "error");
      alert(`Failed to delete bot: ${data.error}`);
    }
  } catch (error) {
    addLocalLog(`❌ Error deleting bot: ${error.message}`, "error");
    alert(`Error deleting bot: ${error.message}`);
  }
}

// Toggle Anti-AFK for a bot
async function toggleAntiAfk(botId) {
  try {
    addLocalLog(`🚶 Toggling Anti-AFK for bot ${botId.slice(0, 8)}...`);

    const response = await fetch(`/api/bots/${botId}/anti-afk/toggle`, {
      method: "POST",
    });

    const data = await response.json();

    if (data.success) {
      const status = data.active ? "enabled" : "disabled";
      addLocalLog(`✅ Anti-AFK ${status} for bot`);
      loadBots(); // Refresh bot list
    } else {
      addLocalLog(`❌ Failed to toggle Anti-AFK: ${data.error}`, "error");
      alert(`Failed to toggle Anti-AFK: ${data.error}`);
    }
  } catch (error) {
    addLocalLog(`❌ Error toggling Anti-AFK: ${error.message}`, "error");
    alert(`Error toggling Anti-AFK: ${error.message}`);
  }
}

// Bulk operations
async function startAllBots() {
  if (!confirm("Start all stopped bots?")) return;

  addLocalLog("🚀 Starting all stopped bots...");

  // Fix: Use proper status detection
  const stoppedBots = bots.filter(bot => {
    const isConnected =
      bot.isConnected || (bot.status && bot.status.isConnected) || false;
    return !isConnected;
  });

  if (stoppedBots.length === 0) {
    alert("No stopped bots to start!");
    return;
  }

  addLocalLog(`📋 Found ${stoppedBots.length} stopped bots to start`);

  for (const bot of stoppedBots) {
    try {
      await startBot(bot.id);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Delay between starts
    } catch (error) {
      addLocalLog(
        `❌ Failed to start ${bot.config.name}: ${error.message}`,
        "error"
      );
    }
  }

  addLocalLog("✅ Bulk start operation completed");
}

async function stopAllBots() {
  if (!confirm("Stop all running bots?")) return;

  addLocalLog("🛑 Stopping all running bots...");

  // Fix: Use proper status detection
  const runningBots = bots.filter(bot => {
    const isConnected =
      bot.isConnected || (bot.status && bot.status.isConnected) || false;
    return isConnected;
  });

  if (runningBots.length === 0) {
    alert("No running bots to stop!");
    return;
  }

  addLocalLog(`📋 Found ${runningBots.length} running bots to stop`);

  for (const bot of runningBots) {
    try {
      await stopBot(bot.id);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay
    } catch (error) {
      addLocalLog(
        `❌ Failed to stop ${bot.config.name}: ${error.message}`,
        "error"
      );
    }
  }

  addLocalLog("✅ Bulk stop operation completed");
}

// View bot logs
function viewBotLogs(botId) {
  const bot = bots.find(b => b.id === botId);
  if (!bot) {
    alert("Bot not found!");
    return;
  }

  // Create modal content
  const modalContent = `
        <div class="modal-header">
            <h2 class="modal-title">📝 Bot Logs: ${bot.config.name}</h2>
            <span class="close" onclick="closeBotLogsModal()">&times;</span>
        </div>
        <div style="padding: 20px;">
            <div style="margin-bottom: 15px;">
                <button class="btn btn-secondary" onclick="refreshBotLogs('${botId}')">
                    <i class="bi bi-arrow-clockwise"></i> Refresh
                </button>
                <button class="btn btn-warning" onclick="clearBotLogs('${botId}')">
                    <i class="bi bi-trash"></i> Clear Logs
                </button>
            </div>
            <div id="botLogsContainer" style="background: #1a1a1a; border-radius: 8px; padding: 15px; max-height: 400px; overflow-y: auto; font-family: monospace; font-size: 12px;">
                <div style="text-align: center; color: #666; padding: 20px;">
                    Loading logs...
                </div>
            </div>
        </div>
    `;

  // Show modal
  showModal("botLogsModal", modalContent);

  // Load logs
  loadBotLogs(botId);

  addLocalLog(`📖 Viewing logs for bot: ${bot.config.name}`);
}

// Load bot logs
async function loadBotLogs(botId) {
  try {
    const response = await fetch(`/api/logs/bot/${botId}`);
    const data = await response.json();

    const container = document.getElementById("botLogsContainer");
    if (!container) return;

    if (data.success && data.logs && data.logs.length > 0) {
      container.innerHTML = data.logs
        .map(
          log => `
                <div style="margin-bottom: 5px; padding: 5px; border-left: 2px solid #333;">
                    <span style="color: #666; font-size: 10px;">${log.timestamp}</span>
                    <span style="margin-left: 10px;">${log.message}</span>
                </div>
            `
        )
        .join("");
    } else {
      container.innerHTML =
        '<div style="text-align: center; color: #666; padding: 20px;">No logs available</div>';
    }

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
  } catch (error) {
    console.error("Error loading bot logs:", error);
    const container = document.getElementById("botLogsContainer");
    if (container) {
      container.innerHTML =
        '<div style="text-align: center; color: #f56565; padding: 20px;">Error loading logs</div>';
    }
  }
}

// Refresh bot logs
function refreshBotLogs(botId) {
  loadBotLogs(botId);
  addLocalLog("🔄 Bot logs refreshed");
}

// Clear bot logs
async function clearBotLogs(botId) {
  if (!confirm("Are you sure you want to clear all logs for this bot?")) return;

  try {
    const response = await fetch(`/api/logs/bot/${botId}/clear`, {
      method: "POST",
    });

    const data = await response.json();

    if (data.success) {
      addLocalLog("✅ Bot logs cleared");
      loadBotLogs(botId); // Refresh logs display
    } else {
      alert(`Failed to clear logs: ${data.error}`);
    }
  } catch (error) {
    alert(`Error clearing logs: ${error.message}`);
  }
}

// Close bot logs modal
function closeBotLogsModal() {
  closeModal("botLogsModal");
}
