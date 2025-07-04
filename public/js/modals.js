// Modals and UI JavaScript

// Generic modal functions
function showModal(modalId, content) {
    let modal = document.getElementById(modalId);
    
    if (!modal) {
        // Create modal if it doesn't exist
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = `<div class="modal-content">${content}</div>`;
    modal.style.display = 'block';
    
    // Close modal when clicking outside
    modal.onclick = function(event) {
        if (event.target === modal) {
            closeModal(modalId);
        }
    };
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
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

    showModal('createBotModal', modalContent);
    
    // Handle form submission
    document.getElementById('createBotForm').addEventListener('submit', handleCreateBot);
    
    addLocalLog('📝 Create bot form opened');
}

function closeCreateBotModal() {
    closeModal('createBotModal');
}

// Handle create bot form submission
async function handleCreateBot(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('botName').value,
        username: document.getElementById('botUsername').value,
        host: document.getElementById('botHost').value,
        port: parseInt(document.getElementById('botPort').value),
        version: document.getElementById('botVersion').value || '1.21.90',
        isOfflineMode: document.getElementById('isOfflineMode').checked,
        antiAfkEnabled: document.getElementById('antiAfkEnabled').checked,
        antiAfkInterval: parseInt(document.getElementById('antiAfkInterval').value) || 30000,
        movementRange: parseFloat(document.getElementById('movementRange').value) || 2.0,
        maxReconnectAttempts: parseInt(document.getElementById('maxReconnectAttempts').value) || 50,
        autoStart: document.getElementById('autoStart').checked
    };

    try {
        addLocalLog(`🤖 Creating bot: ${formData.name}...`);
        
        const response = await fetch('/api/bots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            addLocalLog(`✅ Bot created: ${formData.name}`);
            closeCreateBotModal();
            loadBots(); // Refresh bot list
            alert('✅ Bot created successfully!');
        } else {
            addLocalLog(`❌ Failed to create bot: ${data.error}`, 'error');
            alert(`Failed to create bot: ${data.error}`);
        }
    } catch (error) {
        addLocalLog(`❌ Error creating bot: ${error.message}`, 'error');
        alert(`Error creating bot: ${error.message}`);
    }
}

// Edit bot functions
function editBot(botId) {
    const bot = bots.find(b => b.id === botId);
    if (!bot) {
        alert('Bot not found!');
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
                    <input type="text" id="editBotName" class="form-input" required value="${bot.config.name}">
                </div>
                <div class="form-group">
                    <label class="form-label">Username</label>
                    <input type="text" id="editBotUsername" class="form-input" required value="${bot.config.username}">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Server Host</label>
                    <input type="text" id="editBotHost" class="form-input" required value="${bot.config.host}">
                </div>
                <div class="form-group">
                    <label class="form-label">Port</label>
                    <input type="number" id="editBotPort" class="form-input" min="1" max="65535" required value="${bot.config.port}">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Minecraft Version</label>
                    <input type="text" id="editBotVersion" class="form-input" value="${bot.config.version || '1.21.90'}">
                </div>
                <div class="form-group">
                    <label class="form-label">Anti-AFK Interval (ms)</label>
                    <input type="number" id="editAntiAfkInterval" class="form-input" value="${bot.config.antiAfk?.interval || 30000}">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Movement Range</label>
                    <input type="number" id="editMovementRange" class="form-input" step="0.1" min="0.1" max="10" value="${bot.config.antiAfk?.movementRange || 2.0}">
                </div>
                <div class="form-group">
                    <label class="form-label">Max Reconnect Attempts</label>
                    <input type="number" id="editMaxReconnectAttempts" class="form-input" min="1" max="100" value="${bot.config.maxReconnectAttempts || 50}">
                </div>
            </div>

            <div class="checkbox-group">
                <input type="checkbox" id="editIsOfflineMode" class="checkbox" ${bot.config.isOfflineMode ? 'checked' : ''}>
                <label for="editIsOfflineMode" class="form-label">Offline Mode (Cracked Server)</label>
            </div>

            <div class="checkbox-group">
                <input type="checkbox" id="editAntiAfkEnabled" class="checkbox" ${bot.config.antiAfk?.enabled !== false ? 'checked' : ''}>
                <label for="editAntiAfkEnabled" class="form-label">Enable Anti-AFK</label>
            </div>

            <div class="checkbox-group">
                <input type="checkbox" id="editAutoStart" class="checkbox" ${bot.config.autoStart ? 'checked' : ''}>
                <label for="editAutoStart" class="form-label">Auto-start bot after restart</label>
            </div>

            <div style="margin-top: 20px; text-align: right;">
                <button type="button" class="btn btn-secondary" onclick="closeEditBotModal()">Cancel</button>
                <button type="submit" class="btn">Save Changes</button>
            </div>
        </form>
    `;

    showModal('editBotModal', modalContent);
    
    // Handle form submission
    document.getElementById('editBotForm').addEventListener('submit', handleEditBot);
    
    addLocalLog(`📝 Editing bot: ${bot.config.name}`);
}

function closeEditBotModal() {
    closeModal('editBotModal');
}

// Handle edit bot form submission
async function handleEditBot(e) {
    e.preventDefault();
    
    const botId = document.getElementById('editBotId').value;
    const formData = {
        name: document.getElementById('editBotName').value,
        username: document.getElementById('editBotUsername').value,
        host: document.getElementById('editBotHost').value,
        port: parseInt(document.getElementById('editBotPort').value),
        version: document.getElementById('editBotVersion').value,
        isOfflineMode: document.getElementById('editIsOfflineMode').checked,
        antiAfk: {
            enabled: document.getElementById('editAntiAfkEnabled').checked,
            interval: parseInt(document.getElementById('editAntiAfkInterval').value),
            movementRange: parseFloat(document.getElementById('editMovementRange').value)
        },
        maxReconnectAttempts: parseInt(document.getElementById('editMaxReconnectAttempts').value),
        autoStart: document.getElementById('editAutoStart').checked
    };

    try {
        addLocalLog(`✏️ Updating bot: ${formData.name}...`);
        
        const response = await fetch(`/api/bots/${botId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            addLocalLog(`✅ Bot updated: ${formData.name}`);
            closeEditBotModal();
            loadBots(); // Refresh bot list
            alert('✅ Bot configuration updated successfully!');
        } else {
            addLocalLog(`❌ Failed to update bot: ${data.error}`, 'error');
            alert(`Failed to update bot: ${data.error}`);
        }
    } catch (error) {
        addLocalLog(`❌ Error updating bot: ${error.message}`, 'error');
        alert(`Error updating bot: ${error.message}`);
    }
}
