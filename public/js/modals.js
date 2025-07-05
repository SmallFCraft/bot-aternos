// Modals and UI JavaScript

// Generic modal functions
function showModal(modalId, content) {
  let modal = document.getElementById(modalId);

  if (!modal) {
    // Create modal if it doesn't exist
    modal = document.createElement("div");
    modal.id = modalId;
    modal.className = "modal";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `<div class="modal-content">${content}</div>`;
  modal.style.display = "block";
  modal.setAttribute("aria-hidden", "false");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");

  // Prevent body scroll when modal is open
  document.body.style.overflow = "hidden";

  // Close modal when clicking outside
  modal.onclick = function (event) {
    if (event.target === modal) {
      closeModal(modalId);
    }
  };

  // Close modal with Escape key
  const handleEscape = function (event) {
    if (event.key === "Escape") {
      closeModal(modalId);
    }
  };

  document.addEventListener("keydown", handleEscape);
  modal.setAttribute("data-escape-handler", "true");

  // Focus first input for better accessibility
  setTimeout(() => {
    const firstInput = modal.querySelector("input, select, textarea");
    if (firstInput) {
      firstInput.focus();
    }
  }, 100);
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    // Add closing animation
    modal.classList.add("closing");

    // Remove escape key handler
    if (modal.getAttribute("data-escape-handler")) {
      document.removeEventListener("keydown", handleEscape);
      modal.removeAttribute("data-escape-handler");
    }

    // Restore body scroll
    document.body.style.overflow = "";

    // Wait for animation to complete before hiding
    setTimeout(() => {
      modal.style.display = "none";
      modal.classList.remove("closing");
      modal.setAttribute("aria-hidden", "true");
    }, 200);
  }
}

// Global escape handler function
function handleEscape(event) {
  if (event.key === "Escape") {
    // Find the currently open modal
    const openModal = document.querySelector(".modal[style*='block']");
    if (openModal) {
      closeModal(openModal.id);
    }
  }
}

// Create bot modal functions
function showCreateBotModal() {
  const modalContent = `
        <div class="modal-header">
            <h2 class="modal-title">🤖 Create New Bot</h2>
            <span class="close" onclick="closeCreateBotModal()">&times;</span>
        </div>
        <form id="createBotForm">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Bot Name</label>
                    <input type="text" id="botName" class="form-input" required placeholder="My Bot">
                </div>
                <div class="form-group">
                    <label class="form-label">Username</label>
                    <input type="text" id="botUsername" class="form-input" required placeholder="BotPlayer">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Server Host</label>
                    <input type="text" id="botHost" class="form-input" required placeholder="server.aternos.me">
                </div>
                <div class="form-group">
                    <label class="form-label">Port</label>
                    <input type="number" id="botPort" class="form-input" min="1" max="65535" required placeholder="19132">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Minecraft Version</label>
                    <input type="text" id="botVersion" class="form-input" placeholder="1.21.90">
                </div>
                <div class="form-group">
                    <label class="form-label">Anti-AFK Interval (ms)</label>
                    <input type="number" id="antiAfkInterval" class="form-input" placeholder="30000">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Movement Range</label>
                    <input type="number" id="movementRange" class="form-input" step="0.1" min="0.1" max="10" placeholder="2.0">
                </div>
                <div class="form-group">
                    <label class="form-label">Max Reconnect Attempts</label>
                    <input type="number" id="maxReconnectAttempts" class="form-input" min="1" max="100" placeholder="50">
                </div>
            </div>

            <div class="checkbox-group">
                <input type="checkbox" id="isOfflineMode" class="checkbox" checked>
                <label for="isOfflineMode" class="form-label">Offline Mode (Cracked Server)</label>
            </div>

            <div class="checkbox-group">
                <input type="checkbox" id="antiAfkEnabled" class="checkbox" checked>
                <label for="antiAfkEnabled" class="form-label">Enable Anti-AFK</label>
            </div>

            <div class="checkbox-group">
                <input type="checkbox" id="autoStart" class="checkbox">
                <label for="autoStart" class="form-label">Auto-start bot after restart</label>
            </div>

            <div style="margin-top: 20px; text-align: right;">
                <button type="button" class="btn btn-secondary" onclick="closeCreateBotModal()">Cancel</button>
                <button type="submit" class="btn">Create Bot</button>
            </div>
        </form>
    `;

  showModal("createBotModal", modalContent);

  // Handle form submission
  document
    .getElementById("createBotForm")
    .addEventListener("submit", handleCreateBot);

  addLocalLog("📝 Create bot form opened");
}

function closeCreateBotModal() {
  const modal = document.getElementById("createBotModal");
  if (modal) {
    // Force close immediately without animation
    modal.style.display = "none";
    modal.classList.remove("closing");
    modal.setAttribute("aria-hidden", "true");

    // Restore body scroll
    document.body.style.overflow = "";

    // Remove escape key handler
    if (modal.getAttribute("data-escape-handler")) {
      document.removeEventListener("keydown", handleEscape);
      modal.removeAttribute("data-escape-handler");
    }
  } else {
    // Try to find any modal that might be open and close it
    const anyModal = document.querySelector(".modal[style*='block']");
    if (anyModal) {
      anyModal.style.display = "none";
      document.body.style.overflow = "";
    }
  }
}

// Handle create bot form submission
async function handleCreateBot(e) {
  e.preventDefault();

  const formData = {
    name: document.getElementById("botName").value,
    username: document.getElementById("botUsername").value,
    host: document.getElementById("botHost").value,
    port: parseInt(document.getElementById("botPort").value),
    version: document.getElementById("botVersion").value || "1.21.90",
    isOfflineMode: document.getElementById("isOfflineMode").checked,
    antiAfkEnabled: document.getElementById("antiAfkEnabled").checked,
    antiAfkInterval:
      parseInt(document.getElementById("antiAfkInterval").value) || 30000,
    movementRange:
      parseFloat(document.getElementById("movementRange").value) || 2.0,
    maxReconnectAttempts:
      parseInt(document.getElementById("maxReconnectAttempts").value) || 50,
    autoStart: document.getElementById("autoStart").checked,
  };

  try {
    addLocalLog(`🤖 Creating bot: ${formData.name}...`);

    const response = await fetch("/api/bots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    // ALWAYS close modal immediately, regardless of success/failure
    closeCreateBotModal();

    if (data.success) {
      addLocalLog(`✅ Bot created: ${formData.name}`);

      // Refresh bot list and show success
      loadBots();
      Swal.fire({
        icon: "success",
        title: "Bot Created",
        text: "Bot created successfully!",
        confirmButtonColor: "#4CAF50",
      });
    } else {
      addLocalLog(`❌ Failed to create bot: ${data.error}`, "error");

      Swal.fire({
        icon: "error",
        title: "Failed to Create Bot",
        text: `Failed to create bot: ${data.error}`,
        confirmButtonColor: "#4CAF50",
      });
    }
  } catch (error) {
    // ALWAYS close modal immediately on error too
    closeCreateBotModal();

    addLocalLog(`❌ Error creating bot: ${error.message}`, "error");
    Swal.fire({
      icon: "error",
      title: "Error Creating Bot",
      text: `Error creating bot: ${error.message}`,
      confirmButtonColor: "#4CAF50",
    });
  }
}

// Edit bot functions
function editBot(botId) {
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

  const modalContent = `
        <div class="modal-header">
            <h2 class="modal-title">✏️ Edit Bot Configuration</h2>
            <span class="close" onclick="closeEditBotModal()">&times;</span>
        </div>
        <form id="editBotForm">
            <input type="hidden" id="editBotId" value="${bot.id}">
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Bot Name</label>
                    <input type="text" id="editBotName" class="form-input" required value="${
                      bot.config.name
                    }">
                </div>
                <div class="form-group">
                    <label class="form-label">Username</label>
                    <input type="text" id="editBotUsername" class="form-input" required value="${
                      bot.config.username
                    }">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Server Host</label>
                    <input type="text" id="editBotHost" class="form-input" required value="${
                      bot.config.host
                    }">
                </div>
                <div class="form-group">
                    <label class="form-label">Port</label>
                    <input type="number" id="editBotPort" class="form-input" min="1" max="65535" required value="${
                      bot.config.port
                    }">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Minecraft Version</label>
                    <input type="text" id="editBotVersion" class="form-input" value="${
                      bot.config.version || "1.21.90"
                    }">
                </div>
                <div class="form-group">
                    <label class="form-label">Anti-AFK Interval (ms)</label>
                    <input type="number" id="editAntiAfkInterval" class="form-input" value="${
                      bot.config.antiAfk?.interval || 30000
                    }">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Movement Range</label>
                    <input type="number" id="editMovementRange" class="form-input" step="0.1" min="0.1" max="10" value="${
                      bot.config.antiAfk?.movementRange || 2.0
                    }">
                </div>
                <div class="form-group">
                    <label class="form-label">Max Reconnect Attempts</label>
                    <input type="number" id="editMaxReconnectAttempts" class="form-input" min="1" max="100" value="${
                      bot.config.maxReconnectAttempts || 50
                    }">
                </div>
            </div>

            <div class="checkbox-group">
                <input type="checkbox" id="editIsOfflineMode" class="checkbox" ${
                  bot.config.isOfflineMode ? "checked" : ""
                }>
                <label for="editIsOfflineMode" class="form-label">Offline Mode (Cracked Server)</label>
            </div>

            <div class="checkbox-group">
                <input type="checkbox" id="editAntiAfkEnabled" class="checkbox" ${
                  bot.config.antiAfk?.enabled !== false ? "checked" : ""
                }>
                <label for="editAntiAfkEnabled" class="form-label">Enable Anti-AFK</label>
            </div>

            <div class="checkbox-group">
                <input type="checkbox" id="editAutoStart" class="checkbox" ${
                  bot.config.autoStart ? "checked" : ""
                }>
                <label for="editAutoStart" class="form-label">Auto-start bot after restart</label>
            </div>

            <div style="margin-top: 20px; text-align: right;">
                <button type="button" class="btn btn-secondary" onclick="closeEditBotModal()">Cancel</button>
                <button type="submit" class="btn">Save Changes</button>
            </div>
        </form>
    `;

  showModal("editBotModal", modalContent);

  // Handle form submission
  document
    .getElementById("editBotForm")
    .addEventListener("submit", handleEditBot);

  addLocalLog(`📝 Editing bot: ${bot.config.name}`);
}

function closeEditBotModal() {
  closeModal("editBotModal");
}

// Handle edit bot form submission
async function handleEditBot(e) {
  e.preventDefault();

  const botId = document.getElementById("editBotId").value;
  const formData = {
    name: document.getElementById("editBotName").value,
    username: document.getElementById("editBotUsername").value,
    host: document.getElementById("editBotHost").value,
    port: parseInt(document.getElementById("editBotPort").value),
    version: document.getElementById("editBotVersion").value,
    isOfflineMode: document.getElementById("editIsOfflineMode").checked,
    antiAfk: {
      enabled: document.getElementById("editAntiAfkEnabled").checked,
      interval: parseInt(document.getElementById("editAntiAfkInterval").value),
      movementRange: parseFloat(
        document.getElementById("editMovementRange").value
      ),
    },
    maxReconnectAttempts: parseInt(
      document.getElementById("editMaxReconnectAttempts").value
    ),
    autoStart: document.getElementById("editAutoStart").checked,
  };

  try {
    addLocalLog(`✏️ Updating bot: ${formData.name}...`);

    const response = await fetch(`/api/bots/${botId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (data.success) {
      addLocalLog(`✅ Bot updated: ${formData.name}`);
      closeEditBotModal();
      loadBots(); // Refresh bot list
      Swal.fire({
        icon: "success",
        title: "Bot Updated",
        text: "Bot configuration updated successfully!",
        confirmButtonColor: "#4CAF50",
      });
    } else {
      addLocalLog(`❌ Failed to update bot: ${data.error}`, "error");
      Swal.fire({
        icon: "error",
        title: "Failed to Update Bot",
        text: `Failed to update bot: ${data.error}`,
        confirmButtonColor: "#4CAF50",
      });
    }
  } catch (error) {
    addLocalLog(`❌ Error updating bot: ${error.message}`, "error");
    Swal.fire({
      icon: "error",
      title: "Error Updating Bot",
      text: `Error updating bot: ${error.message}`,
      confirmButtonColor: "#4CAF50",
    });
  }
}
