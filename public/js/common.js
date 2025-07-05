// Common JavaScript functions for Dashboard and Uptime pages

// ===== UTILITY FUNCTIONS =====

// Format uptime duration
function formatUptime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
}

// Format duration from seconds
function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
}

// Format relative time
function formatRelativeTime(date) {
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
}

// Update last refresh time
function updateLastRefreshTime() {
  const element = document.getElementById("lastUpdated");
  if (element) {
    element.textContent = new Date().toLocaleTimeString();
  }
}

// Show error message using SweetAlert2
function showError(message) {
  Swal.fire({
    icon: 'error',
    title: 'Error',
    text: message,
    background: '#1a1a1a',
    color: '#fff',
    confirmButtonColor: '#667eea'
  });
}

// Show success message using SweetAlert2
function showSuccess(message) {
  Swal.fire({
    icon: 'success',
    title: 'Success',
    text: message,
    background: '#1a1a1a',
    color: '#fff',
    confirmButtonColor: '#00ff88',
    timer: 3000,
    timerProgressBar: true
  });
}

// Show loading indicator
function showLoading(title = 'Loading...', text = 'Please wait') {
  Swal.fire({
    title: title,
    text: text,
    background: '#1a1a1a',
    color: '#fff',
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
}

// Hide loading indicator
function hideLoading() {
  Swal.close();
}

// ===== TIMELINE FUNCTIONS =====

// Generate timeline visualization from real data
function generateTimelineFromData(elementId, timelineData) {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.innerHTML = timelineData
    .map(
      status =>
        `<div class="timeline-segment ${status}" style="flex: 1;" title="${
          status === "up" ? "Online" : "Offline"
        }"></div>`
    )
    .join("");
}

// Generate timeline visualization (fallback for percentage-based)
function generateTimeline(elementId, uptimePercentage) {
  const element = document.getElementById(elementId);
  if (!element) return;

  // Generate 24 segments for 24 hours
  const segments = [];
  for (let i = 0; i < 24; i++) {
    const isUp = Math.random() * 100 < uptimePercentage;
    segments.push(isUp ? "up" : "down");
  }

  element.innerHTML = segments
    .map(
      status =>
        `<div class="timeline-segment ${status}" style="flex: 1;" title="${
          status === "up" ? "Online" : "Offline"
        }"></div>`
    )
    .join("");
}

// Calculate overall timeline from bot details
function calculateOverallTimeline(botDetails) {
  // Calculate overall timeline by combining all bot timelines
  const overallTimeline = [];
  
  for (let i = 0; i < 24; i++) {
    let upCount = 0;
    let totalBots = 0;
    
    for (const bot of botDetails) {
      if (bot.timeline && bot.timeline[i]) {
        totalBots++;
        if (bot.timeline[i] === 'up') {
          upCount++;
        }
      }
    }
    
    // Consider segment "up" if more than 50% of bots are up
    const upPercentage = totalBots > 0 ? (upCount / totalBots) : 1;
    overallTimeline.push(upPercentage > 0.5 ? 'up' : 'down');
  }
  
  return overallTimeline;
}

// ===== API HELPER FUNCTIONS =====

// Generic API call function
async function apiCall(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API call failed for ${url}:`, error);
    throw error;
  }
}

// ===== REFRESH INDICATOR FUNCTIONS =====

// Set refresh indicator to updating state
function setRefreshIndicatorUpdating(updating = true) {
  const refreshIndicator = document.getElementById('refreshIndicator');
  if (refreshIndicator) {
    if (updating) {
      refreshIndicator.classList.add('updating');
    } else {
      refreshIndicator.classList.remove('updating');
    }
  }
}

// ===== NAVIGATION FUNCTIONS =====

// Update navigation active state
function updateNavigationActive(currentPage) {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });
}

// ===== STATUS FUNCTIONS =====

// Get status color based on value
function getStatusColor(status, type = 'bot') {
  if (type === 'bot') {
    switch (status) {
      case 'connected':
      case 'online':
        return '#00ff88';
      case 'connecting':
        return '#ffa726';
      case 'disconnected':
      case 'offline':
      default:
        return '#ff4757';
    }
  } else if (type === 'uptime') {
    if (status >= 95) return '#00ff88';
    if (status >= 80) return '#ffa726';
    return '#ff4757';
  }
  return '#888';
}

// Format bot status for display
function formatBotStatus(bot) {
  if (bot.isConnected) return 'connected';
  if (bot.isConnecting) return 'connecting';
  return 'disconnected';
}

// ===== INITIALIZATION =====

// Initialize common functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Common JavaScript initialized');
  
  // Update navigation active state based on current page
  const currentPath = window.location.pathname;
  updateNavigationActive(currentPath);
  
  // Add hover effects to cards
  const cards = document.querySelectorAll('.stat-card, .uptime-card, .bot-card, .bot-uptime-card');
  cards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-5px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0) scale(1)';
    });
  });
});

// ===== EXPORT FOR MODULE USAGE =====
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    formatUptime,
    formatDuration,
    formatRelativeTime,
    updateLastRefreshTime,
    showError,
    showSuccess,
    showLoading,
    hideLoading,
    generateTimelineFromData,
    generateTimeline,
    calculateOverallTimeline,
    apiCall,
    setRefreshIndicatorUpdating,
    updateNavigationActive,
    getStatusColor,
    formatBotStatus
  };
}
