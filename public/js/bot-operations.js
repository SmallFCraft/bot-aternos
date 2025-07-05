// Bot Operations JavaScript

// Start a bot
async function startBot(botId) {
  // Check if bot is already running
  const bot = bots.find(b => b.id === botId);
  if (bot && (bot.isConnected || (bot.status && bot.status.isConnected))) {
    Swal.fire({
      icon: "warning",
      title: "Bot Already Running",
      text: "This bot is already connected and running!",
      confirmButtonColor: "#4CAF50",
    });
    return;
  }

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
      Swal.fire({
        icon: "error",
        title: "Failed to Start Bot",
        text: data.error,
        confirmButtonColor: "#4CAF50",
      });
    }
  } catch (error) {
    addLocalLog(`❌ Error starting bot: ${error.message}`, "error");
    Swal.fire({
      icon: "error",
      title: "Error Starting Bot",
      text: error.message,
      confirmButtonColor: "#4CAF50",
    });
  } finally {
    // Don't remove loading state here - let polling mechanism handle button state
    // The button state will be updated when bot status changes through loadBots()
  }
}

// Stop a bot
async function stopBot(botId) {
  // Check if bot is already stopped
  const bot = bots.find(b => b.id === botId);
  if (bot) {
    const isConnected =
      bot.isConnected || (bot.status && bot.status.isConnected) || false;
    const isConnecting = bot.isConnecting || false;
    const isReconnecting = bot.isReconnecting || false;

    // Only show "already stopped" if bot is neither connected nor connecting nor reconnecting
    if (!isConnected && !isConnecting && !isReconnecting) {
      Swal.fire({
        icon: "info",
        title: "Bot Already Stopped",
        text: "This bot is already disconnected!",
        confirmButtonColor: "#4CAF50",
      });
      return;
    }
  }

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
      Swal.fire({
        icon: "error",
        title: "Failed to Stop Bot",
        text: data.error,
        confirmButtonColor: "#4CAF50",
      });
    }
  } catch (error) {
    addLocalLog(`❌ Error stopping bot: ${error.message}`, "error");
    Swal.fire({
      icon: "error",
      title: "Error Stopping Bot",
      text: error.message,
      confirmButtonColor: "#4CAF50",
    });
  }
}

// Kill bot (force terminate)
async function killBot(botId) {
  const result = await Swal.fire({
    title: "Force Kill Bot?",
    text: "This will immediately terminate the bot without graceful shutdown. Are you sure?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#f44336",
    cancelButtonColor: "#4CAF50",
    confirmButtonText: "Yes, kill it!",
    cancelButtonText: "Cancel",
  });

  if (!result.isConfirmed) return;

  try {
    addLocalLog(`💀 Force killing bot ${botId.slice(0, 8)}...`);

    const response = await fetch(`/api/bots/${botId}/kill`, {
      method: "POST",
    });

    const data = await response.json();

    if (data.success) {
      addLocalLog(`💀 Bot force killed successfully`);
      loadBots(); // Refresh bot list
      Swal.fire({
        icon: "success",
        title: "Bot Killed",
        text: "Bot has been force terminated!",
        confirmButtonColor: "#4CAF50",
      });
    } else {
      addLocalLog(`❌ Failed to kill bot: ${data.error}`, "error");
      Swal.fire({
        icon: "error",
        title: "Failed to Kill Bot",
        text: data.error,
        confirmButtonColor: "#4CAF50",
      });
    }
  } catch (error) {
    addLocalLog(`❌ Error killing bot: ${error.message}`, "error");
    Swal.fire({
      icon: "error",
      title: "Error Killing Bot",
      text: error.message,
      confirmButtonColor: "#4CAF50",
    });
  }
}

// Restart a bot
async function restartBot(botId) {
  const result = await Swal.fire({
    title: "Restart Bot?",
    text: "Are you sure you want to restart this bot?",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#4CAF50",
    cancelButtonColor: "#f44336",
    confirmButtonText: "Yes, restart it!",
  });

  if (!result.isConfirmed) return;

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
      Swal.fire({
        icon: "error",
        title: "Failed to Restart Bot",
        text: data.error,
        confirmButtonColor: "#4CAF50",
      });
    }
  } catch (error) {
    addLocalLog(`❌ Error restarting bot: ${error.message}`, "error");
    Swal.fire({
      icon: "error",
      title: "Error Restarting Bot",
      text: error.message,
      confirmButtonColor: "#4CAF50",
    });
  }
}

// Delete a bot
async function deleteBot(botId) {
  const bot = bots.find(b => b.id === botId);
  if (!bot) {
    Swal.fire({
      icon: "error",
      title: "Bot Not Found",
      text: "Bot not found!",
      confirmButtonColor: "#4CAF50",
    });
    return;
  }

  const result = await Swal.fire({
    title: "Delete Bot?",
    text: `Are you sure you want to delete "${bot.config.name}"? This action cannot be undone.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#f44336",
    cancelButtonColor: "#4CAF50",
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "Cancel",
  });

  if (!result.isConfirmed) return;

  try {
    addLocalLog(`🗑️ Deleting bot ${bot.config.name}...`);

    const response = await fetch(`/api/bots/${botId}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (data.success) {
      addLocalLog(`✅ Bot deleted successfully`);
      loadBots(); // Refresh bot list
      Swal.fire({
        icon: "success",
        title: "Bot Deleted",
        text: "Bot deleted successfully!",
        confirmButtonColor: "#4CAF50",
      });
    } else {
      addLocalLog(`❌ Failed to delete bot: ${data.error}`, "error");
      Swal.fire({
        icon: "error",
        title: "Failed to Delete Bot",
        text: data.error,
        confirmButtonColor: "#4CAF50",
      });
    }
  } catch (error) {
    addLocalLog(`❌ Error deleting bot: ${error.message}`, "error");
    Swal.fire({
      icon: "error",
      title: "Error Deleting Bot",
      text: error.message,
      confirmButtonColor: "#4CAF50",
    });
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
      Swal.fire({
        icon: "error",
        title: "Failed to Toggle Anti-AFK",
        text: data.error,
        confirmButtonColor: "#4CAF50",
      });
    }
  } catch (error) {
    addLocalLog(`❌ Error toggling Anti-AFK: ${error.message}`, "error");
    Swal.fire({
      icon: "error",
      title: "Error Toggling Anti-AFK",
      text: error.message,
      confirmButtonColor: "#4CAF50",
    });
  }
}

// Bulk operations
async function startAllBots() {
  const result = await Swal.fire({
    title: "Start All Bots?",
    text: "Start all stopped bots?",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#4CAF50",
    cancelButtonColor: "#f44336",
    confirmButtonText: "Yes, start all!",
  });

  if (!result.isConfirmed) return;

  addLocalLog("🚀 Starting all stopped bots...");

  // Fix: Use proper status detection - exclude connecting/reconnecting bots
  const stoppedBots = bots.filter(bot => {
    const isConnected =
      bot.isConnected || (bot.status && bot.status.isConnected) || false;
    const isConnecting = bot.isConnecting || false;
    const isReconnecting = bot.isReconnecting || false;
    // Only consider truly stopped bots (not connected AND not connecting AND not reconnecting)
    return !isConnected && !isConnecting && !isReconnecting;
  });

  if (stoppedBots.length === 0) {
    Swal.fire({
      icon: "info",
      title: "No Stopped Bots",
      text: "No stopped bots to start!",
      confirmButtonColor: "#4CAF50",
    });
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
  const result = await Swal.fire({
    title: "Stop All Bots?",
    text: "Stop all running bots?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#4CAF50",
    cancelButtonColor: "#f44336",
    confirmButtonText: "Yes, stop all!",
  });

  if (!result.isConfirmed) return;

  addLocalLog("🛑 Stopping all running/connecting bots...");

  // Fix: Use proper status detection - include connecting/reconnecting bots
  const runningBots = bots.filter(bot => {
    const isConnected =
      bot.isConnected || (bot.status && bot.status.isConnected) || false;
    const isConnecting = bot.isConnecting || false;
    const isReconnecting = bot.isReconnecting || false;
    // Consider bot as "running" if it's connected OR connecting OR reconnecting
    return isConnected || isConnecting || isReconnecting;
  });

  if (runningBots.length === 0) {
    Swal.fire({
      icon: "info",
      title: "No Running Bots",
      text: "No running or connecting bots to stop!",
      confirmButtonColor: "#4CAF50",
    });
    return;
  }

  addLocalLog(`📋 Found ${runningBots.length} running/connecting bots to stop`);

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

// Kill all bots (force terminate)
async function killAllBots() {
  const result = await Swal.fire({
    title: "Force Kill All Bots?",
    text: "This will immediately terminate ALL bots without graceful shutdown. Are you sure?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#f44336",
    cancelButtonColor: "#4CAF50",
    confirmButtonText: "Yes, kill all!",
    cancelButtonText: "Cancel",
  });

  if (!result.isConfirmed) return;

  addLocalLog("💀 Force killing all bots...");

  if (bots.length === 0) {
    Swal.fire({
      icon: "info",
      title: "No Bots",
      text: "No bots to kill!",
      confirmButtonColor: "#4CAF50",
    });
    return;
  }

  addLocalLog(`📋 Found ${bots.length} bots to kill`);

  let successCount = 0;
  let failCount = 0;

  for (const bot of bots) {
    try {
      const response = await fetch(`/api/bots/${bot.id}/kill`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        successCount++;
        addLocalLog(`💀 Killed bot: ${bot.config.name}`);
      } else {
        failCount++;
        addLocalLog(
          `❌ Failed to kill bot ${bot.config.name}: ${data.error}`,
          "error"
        );
      }
    } catch (error) {
      failCount++;
      addLocalLog(
        `❌ Error killing bot ${bot.config.name}: ${error.message}`,
        "error"
      );
    }
  }

  // Refresh bot list
  loadBots();

  // Show summary
  if (failCount === 0) {
    addLocalLog(`💀 All ${successCount} bots killed successfully`);
    Swal.fire({
      icon: "success",
      title: "All Bots Killed",
      text: `Successfully killed ${successCount} bots!`,
      confirmButtonColor: "#4CAF50",
    });
  } else {
    addLocalLog(`⚠️ Killed ${successCount} bots, ${failCount} failed`);
    Swal.fire({
      icon: "warning",
      title: "Partial Success",
      text: `Killed ${successCount} bots successfully, but ${failCount} failed.`,
      confirmButtonColor: "#4CAF50",
    });
  }
}

// View bot logs
function viewBotLogs(botId) {
  const bot = bots.find(b => b.id === botId);
  if (!bot) {
    Swal.fire({
      icon: "error",
      title: "Bot Not Found",
      text: "Bot not found!",
      confirmButtonColor: "#4CAF50",
    });
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
    const response = await fetch(`/api/bots/${botId}/logs`);
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
  const result = await Swal.fire({
    title: "Clear Bot Logs?",
    text: "Are you sure you want to clear all logs for this bot?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#f44336",
    cancelButtonColor: "#4CAF50",
    confirmButtonText: "Yes, clear logs!",
    cancelButtonText: "Cancel",
  });

  if (!result.isConfirmed) return;

  try {
    const response = await fetch(`/api/bots/${botId}/logs`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (data.success) {
      addLocalLog("✅ Bot logs cleared");
      loadBotLogs(botId); // Refresh logs display
    } else {
      Swal.fire({
        icon: "error",
        title: "Failed to Clear Logs",
        text: data.error,
        confirmButtonColor: "#4CAF50",
      });
    }
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Error Clearing Logs",
      text: error.message,
      confirmButtonColor: "#4CAF50",
    });
  }
}

// Close bot logs modal
function closeBotLogsModal() {
  closeModal("botLogsModal");
}
