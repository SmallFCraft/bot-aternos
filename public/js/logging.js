// Logging and Monitoring JavaScript

// Load recent logs
async function loadRecentLogs() {
  try {
    const response = await fetch("/api/logs/recent");
    const data = await response.json();

    if (data.success && data.logs) {
      logEntries = data.logs;
      renderLogs();
    }
  } catch (error) {
    console.error("Error loading recent logs:", error);
  }
}

// Connect to log stream
function connectLogStream() {
  if (eventSource) {
    eventSource.close();
  }

  eventSource = new EventSource("/api/logs/stream");

  eventSource.onopen = function () {
    console.log("📡 Log stream connected");
    addLocalLog("📡 Live log stream connected", "info");
  };

  eventSource.onmessage = function (event) {
    try {
      const logEntry = JSON.parse(event.data);
      if (logStreamActive) {
        addLogEntry(logEntry);
      }
    } catch (error) {
      console.error("Error parsing log entry:", error);
    }
  };

  eventSource.onerror = function (error) {
    console.error("Log stream error:", error);
    addLocalLog("❌ Log stream disconnected", "error");

    // Attempt to reconnect after 5 seconds
    setTimeout(() => {
      if (logStreamActive) {
        console.log("🔄 Attempting to reconnect log stream...");
        connectLogStream();
      }
    }, 5000);
  };
}

// Add log entry to the display
function addLogEntry(logEntry) {
  logEntries.unshift(logEntry);

  // Keep only last 100 entries for performance
  if (logEntries.length > 100) {
    logEntries = logEntries.slice(0, 100);
  }

  renderLogs();
}

// Add local log entry (for UI actions)
function addLocalLog(message, type = "info") {
  const logEntry = {
    timestamp: new Date().toISOString(),
    message: message,
    type: type,
    source: "Dashboard",
  };

  addLogEntry(logEntry);
}

// Render logs in the container
function renderLogs() {
  const logContainer = document.getElementById("logContainer");
  if (!logContainer) return;

  if (logEntries.length === 0) {
    logContainer.innerHTML = `
            <div style="text-align: center; color: #666; padding: 20px;">
                <i class="bi bi-journal-text" style="font-size: 2em; margin-bottom: 10px; display: block;"></i>
                <p>No logs available</p>
                <p style="font-size: 0.8em;">Logs will appear here as bots operate</p>
            </div>
        `;
    return;
  }

  logContainer.innerHTML = logEntries
    .map(log => {
      const time = new Date(log.timestamp).toLocaleTimeString();
      const typeClass = `log-${log.type || "info"}`;
      const icon = getLogIcon(log.type || "info");

      return `
            <div class="log-entry ${typeClass}">
                <span class="log-icon">${icon}</span>
                <span class="log-time">${time}</span>
                <span class="log-message">${escapeHtml(log.message)}</span>
                ${
                  log.source
                    ? `<span class="log-source">${log.source}</span>`
                    : ""
                }
            </div>
        `;
    })
    .join("");

  // Auto-scroll to top for newest logs
  logContainer.scrollTop = 0;
}

// Get icon for log type
function getLogIcon(type) {
  switch (type) {
    case "error":
      return "❌";
    case "warn":
      return "⚠️";
    case "info":
      return "ℹ️";
    case "success":
      return "✅";
    default:
      return "📝";
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Toggle log stream
function toggleLogStream() {
  logStreamActive = !logStreamActive;

  const button = document.querySelector('[onclick="toggleLogStream()"]');
  if (button) {
    if (logStreamActive) {
      button.innerHTML = '<i class="bi bi-pause"></i> Pause Stream';
      button.className = "btn btn-warning";
      addLocalLog("▶️ Log stream resumed", "info");
    } else {
      button.innerHTML = '<i class="bi bi-play"></i> Resume Stream';
      button.className = "btn";
      addLocalLog("⏸️ Log stream paused", "info");
    }
  }
}

// Clear logs
async function clearLogs() {
  const result = await Swal.fire({
    title: "Clear All Logs?",
    text: "Are you sure you want to clear all logs?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#f44336",
    cancelButtonColor: "#4CAF50",
    confirmButtonText: "Yes, clear all!",
    cancelButtonText: "Cancel",
  });

  if (!result.isConfirmed) return;

  logEntries = [];
  renderLogs();
  addLocalLog("🗑️ Logs cleared", "info");
}

// Better Stack monitoring functions
async function loadBetterStackStatus() {
  try {
    const response = await fetch("/api/betterstack/status");
    const data = await response.json();

    updateBetterStackUI(data);
  } catch (error) {
    console.error("Error loading Better Stack status:", error);
    updateBetterStackUI({ enabled: false, error: "Failed to load status" });
  }
}

// Update Better Stack UI
function updateBetterStackUI(data) {
  const statusElement = document.getElementById("betterStackStatus");
  const contentElement = document.getElementById("betterStackContent");

  if (!statusElement || !contentElement) return;

  // Update status indicator
  const statusDot = statusElement.querySelector(".status-dot");
  const statusText = statusElement.querySelector(".status-text");

  if (data.enabled && !data.error) {
    statusDot.className = "status-dot online";
    statusText.textContent = "Active";
  } else {
    statusDot.className = "status-dot offline";
    statusText.textContent = data.error ? "Error" : "Disabled";
  }

  // Update content
  if (data.enabled) {
    contentElement.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
                <div class="stat-card">
                    <div class="stat-number">${
                      data.statistics?.totalRequests || 0
                    }</div>
                    <div class="stat-label">Total Requests</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${
                      data.statistics?.successfulRequests || 0
                    }</div>
                    <div class="stat-label">Successful</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${
                      data.statistics?.failedRequests || 0
                    }</div>
                    <div class="stat-label">Failed</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${
                      data.statistics?.successRate || 0
                    }%</div>
                    <div class="stat-label">Success Rate</div>
                </div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <strong>Last Heartbeat:</strong> ${
                  data.lastHeartbeat
                    ? new Date(data.lastHeartbeat).toLocaleString()
                    : "Never"
                }
            </div>
            
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button class="btn btn-secondary" onclick="testBetterStackHeartbeat()">
                    <i class="bi bi-heart-pulse"></i> Test Heartbeat
                </button>
                <button class="btn btn-secondary" onclick="showBetterStackSetup()">
                    <i class="bi bi-gear"></i> Configure
                </button>
            </div>
        `;
  } else {
    contentElement.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #666;">
                <i class="bi bi-heart-pulse" style="font-size: 2em; margin-bottom: 10px; display: block;"></i>
                <h4>Better Stack Monitoring Disabled</h4>
                <p>Configure Better Stack to enable professional monitoring</p>
                <button class="btn" onclick="showBetterStackSetup()">
                    <i class="bi bi-gear"></i> Setup Better Stack
                </button>
            </div>
        `;
  }
}

// Test Better Stack heartbeat
async function testBetterStackHeartbeat() {
  try {
    addLocalLog("💓 Testing Better Stack heartbeat...");

    const response = await fetch("/api/betterstack/test", {
      method: "POST",
    });

    const data = await response.json();

    if (data.success) {
      addLocalLog("✅ Better Stack heartbeat test successful");
      Swal.fire({
        icon: "success",
        title: "Heartbeat Test Successful",
        text: "Better Stack heartbeat test successful!",
        confirmButtonColor: "#4CAF50",
      });
      loadBetterStackStatus(); // Refresh status
    } else {
      addLocalLog(
        `❌ Better Stack heartbeat test failed: ${data.error}`,
        "error"
      );
      Swal.fire({
        icon: "error",
        title: "Heartbeat Test Failed",
        text: data.error,
        confirmButtonColor: "#4CAF50",
      });
    }
  } catch (error) {
    addLocalLog(
      `❌ Better Stack heartbeat test error: ${error.message}`,
      "error"
    );
    Swal.fire({
      icon: "error",
      title: "Heartbeat Test Error",
      text: error.message,
      confirmButtonColor: "#4CAF50",
    });
  }
}

// Show Better Stack setup
async function showBetterStackSetup() {
  // Load current Better Stack configuration
  let currentConfig = {
    heartbeatUrl: "",
    interval: 60,
    enabled: true,
  };

  try {
    const response = await fetch("/api/betterstack/status");
    const data = await response.json();
    if (data.success && data.config) {
      currentConfig = {
        heartbeatUrl: data.config.heartbeatUrl || "",
        interval: Math.floor((data.config.interval || 60000) / 1000),
        enabled: data.enabled !== false,
      };
    }
  } catch (error) {
    console.error("Error loading Better Stack config:", error);
  }

  const modalContent = `
        <div class="modal-header">
            <h2 class="modal-title">⚙️ Better Stack Configuration</h2>
            <span class="close" onclick="closeBetterStackSetup()">&times;</span>
        </div>

        <!-- Quick Actions -->
        <div style="padding: 0 20px; margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
                <button type="button" class="btn btn-secondary" onclick="testBetterStackHeartbeat()" style="padding: 8px 12px; font-size: 0.9em;">
                    <i class="bi bi-heart-pulse"></i> Test Heartbeat
                </button>
                <button type="button" class="btn btn-secondary" onclick="copyHeartbeatTemplate()" style="padding: 8px 12px; font-size: 0.9em;">
                    <i class="bi bi-clipboard"></i> Copy Template
                </button>
                <button type="button" class="btn btn-secondary" onclick="openBetterStack()" style="padding: 8px 12px; font-size: 0.9em;">
                    <i class="bi bi-box-arrow-up-right"></i> Open Dashboard
                </button>
            </div>
        </div>

        <form id="betterStackForm">
            <!-- Heartbeat URL Section -->
            <div style="background: #1a1a1a; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <h4 style="color: #4CAF50; margin-top: 0; display: flex; align-items: center;">
                    <i class="bi bi-heart-pulse" style="margin-right: 8px;"></i>
                    Heartbeat Configuration
                </h4>

                <div class="form-group">
                    <label class="form-label">Heartbeat URL</label>
                    <div style="position: relative;">
                        <input type="url" id="heartbeatUrl" class="form-input" required
                               value="${currentConfig.heartbeatUrl}"
                               placeholder="https://uptime.betterstack.com/api/v1/heartbeat/YOUR_KEY"
                               style="padding-right: 40px;">
                        <button type="button" onclick="copyHeartbeatUrl()"
                                style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #4CAF50; cursor: pointer;">
                            <i class="bi bi-clipboard"></i>
                        </button>
                    </div>
                    <small style="color: #666; font-size: 0.85em; display: block; margin-top: 5px;">
                        <i class="bi bi-info-circle"></i> Get this URL from Better Stack → Heartbeat monitors → Create monitor
                    </small>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Check Interval</label>
                        <select id="checkInterval" class="form-input">
                            <option value="30" ${
                              currentConfig.interval === 30 ? "selected" : ""
                            }>30 seconds</option>
                            <option value="60" ${
                              currentConfig.interval === 60 ? "selected" : ""
                            }>1 minute (recommended)</option>
                            <option value="120" ${
                              currentConfig.interval === 120 ? "selected" : ""
                            }>2 minutes</option>
                            <option value="300" ${
                              currentConfig.interval === 300 ? "selected" : ""
                            }>5 minutes</option>
                            <option value="600" ${
                              currentConfig.interval === 600 ? "selected" : ""
                            }>10 minutes</option>
                        </select>
                        <small style="color: #666; font-size: 0.85em; display: block; margin-top: 5px;">
                            How often to send heartbeat signals
                        </small>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Status</label>
                        <div style="display: flex; align-items: center; margin-top: 8px; padding: 10px; background: #2a2a2a; border-radius: 6px;">
                            <input type="checkbox" id="enableBetterStack" class="checkbox"
                                   ${currentConfig.enabled ? "checked" : ""}>
                            <label for="enableBetterStack" class="form-label" style="margin-left: 10px; margin-bottom: 0;">
                                Enable Better Stack monitoring
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Help Section -->
            <div style="background: linear-gradient(135deg, #1a3a5c, #2a4a6c); padding: 20px; border-radius: 10px; border: 1px solid #2196F3; margin-bottom: 20px;">
                <h4 style="color: #2196F3; margin-top: 0; display: flex; align-items: center;">
                    <i class="bi bi-question-circle" style="margin-right: 8px;"></i>
                    How to get Heartbeat URL?
                </h4>
                <ol style="color: #ccc; margin-bottom: 15px; padding-left: 20px;">
                    <li>Go to <a href="https://betterstack.com/" target="_blank" style="color: #2196F3;">Better Stack Dashboard</a></li>
                    <li>Navigate to <strong>Uptime</strong> → <strong>Heartbeat monitors</strong></li>
                    <li>Click <strong>"Create heartbeat monitor"</strong></li>
                    <li>Set name as <code style="background: #333; padding: 2px 4px; border-radius: 3px;">Aternos Bot System</code></li>
                    <li>Copy the generated heartbeat URL</li>
                </ol>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button type="button" class="btn btn-sm" onclick="openBetterStack()" style="background: #2196F3; color: #000;">
                        <i class="bi bi-box-arrow-up-right"></i> Open Better Stack
                    </button>
                    <button type="button" class="btn btn-sm" onclick="showMonitorSetupGuide()" style="background: transparent; border: 1px solid #2196F3; color: #2196F3;">
                        <i class="bi bi-book"></i> Setup Guide
                    </button>
                </div>
            </div>

            <div style="margin-top: 25px; text-align: right; display: flex; gap: 10px; justify-content: flex-end;">
                <button type="button" class="btn btn-secondary" onclick="closeBetterStackSetup()">Cancel</button>
                <button type="button" class="btn btn-secondary" onclick="testBetterStackHeartbeat()">
                    <i class="bi bi-heart-pulse"></i> Test First
                </button>
                <button type="submit" class="btn" style="background: #4CAF50; color: #000;">
                    <i class="bi bi-check-circle"></i> Save Configuration
                </button>
            </div>
        </form>
    `;

  showModal("betterStackSetupModal", modalContent);

  // Handle form submission
  document
    .getElementById("betterStackForm")
    .addEventListener("submit", handleBetterStackSetup);

  addLocalLog("⚙️ Better Stack setup opened");
}

function closeBetterStackSetup() {
  closeModal("betterStackSetupModal");
}

// New utility functions for Better Stack Configuration
function copyHeartbeatTemplate() {
  const template =
    "https://uptime.betterstack.com/api/v1/heartbeat/YOUR_KEY_HERE";
  navigator.clipboard
    .writeText(template)
    .then(() => {
      addLocalLog("📋 Heartbeat URL template copied to clipboard");
      Swal.fire({
        icon: "success",
        title: "Template Copied!",
        text: "Heartbeat URL template copied. Replace YOUR_KEY_HERE with your actual key.",
        timer: 3000,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
    })
    .catch(err => {
      addLocalLog("❌ Failed to copy template", "error");
      Swal.fire({
        icon: "info",
        title: "Heartbeat URL Template",
        text: template,
        confirmButtonColor: "#4CAF50",
      });
    });
}

function copyHeartbeatUrl() {
  const urlInput = document.getElementById("heartbeatUrl");
  if (urlInput && urlInput.value) {
    navigator.clipboard
      .writeText(urlInput.value)
      .then(() => {
        addLocalLog("📋 Heartbeat URL copied to clipboard");
        Swal.fire({
          icon: "success",
          title: "URL Copied!",
          text: "Current heartbeat URL copied to clipboard",
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });
      })
      .catch(err => {
        addLocalLog("❌ Failed to copy URL", "error");
      });
  } else {
    Swal.fire({
      icon: "warning",
      title: "No URL to Copy",
      text: "Please enter a heartbeat URL first",
      confirmButtonColor: "#4CAF50",
    });
  }
}

// Handle Better Stack setup
async function handleBetterStackSetup(e) {
  e.preventDefault();

  const formData = {
    heartbeatUrl: document.getElementById("heartbeatUrl").value,
    interval: parseInt(document.getElementById("checkInterval").value) * 1000,
    enabled: document.getElementById("enableBetterStack").checked,
  };

  try {
    addLocalLog("⚙️ Configuring Better Stack...");

    const response = await fetch("/api/betterstack/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    // Always close modal first
    closeBetterStackSetup();

    if (data.success) {
      addLocalLog("✅ Better Stack configured successfully");
      loadBetterStackStatus(); // Refresh status
      Swal.fire({
        icon: "success",
        title: "Better Stack Configured",
        text: "Better Stack configured successfully!",
        confirmButtonColor: "#4CAF50",
      });
    } else {
      addLocalLog(
        `❌ Failed to configure Better Stack: ${data.error}`,
        "error"
      );
      Swal.fire({
        icon: "error",
        title: "Configuration Failed",
        text: `Failed to configure Better Stack: ${data.error}`,
        confirmButtonColor: "#4CAF50",
      });
    }
  } catch (error) {
    // Always close modal on error too
    closeBetterStackSetup();

    addLocalLog(`❌ Error configuring Better Stack: ${error.message}`, "error");
    Swal.fire({
      icon: "error",
      title: "Configuration Error",
      text: `Error configuring Better Stack: ${error.message}`,
      confirmButtonColor: "#4CAF50",
    });
  }
}
