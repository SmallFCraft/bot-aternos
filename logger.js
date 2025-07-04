// logger.js - File-based logging system
const fs = require('fs');
const path = require('path');

class FileLogger {
  constructor(logFilePath = './logs/bot.log', maxLogSize = 5 * 1024 * 1024) { // 5MB max
    this.logFilePath = logFilePath;
    this.maxLogSize = maxLogSize;
    this.logDir = path.dirname(logFilePath);
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    
    // Initialize log file
    this.initLogFile();
  }
  
  initLogFile() {
    // Create log file if it doesn't exist
    if (!fs.existsSync(this.logFilePath)) {
      const initialLog = {
        timestamp: new Date().toISOString(),
        message: 'Log system initialized',
        type: 'info',
        source: 'system'
      };
      fs.writeFileSync(this.logFilePath, JSON.stringify(initialLog) + '\n');
    }
    
    // Check file size and rotate if needed
    this.rotateLogIfNeeded();
  }
  
  rotateLogIfNeeded() {
    try {
      const stats = fs.statSync(this.logFilePath);
      if (stats.size > this.maxLogSize) {
        const backupPath = this.logFilePath.replace('.log', '.backup.log');
        
        // Keep only one backup
        if (fs.existsSync(backupPath)) {
          fs.unlinkSync(backupPath);
        }
        
        // Move current log to backup
        fs.renameSync(this.logFilePath, backupPath);
        
        // Create new log file
        const rotationLog = {
          timestamp: new Date().toISOString(),
          message: 'Log file rotated - previous log backed up',
          type: 'info',
          source: 'system'
        };
        fs.writeFileSync(this.logFilePath, JSON.stringify(rotationLog) + '\n');
      }
    } catch (error) {
      console.error('Log rotation failed:', error.message);
    }
  }
  
  log(message, type = 'info', source = 'bot') {
    const logEntry = {
      timestamp: new Date().toISOString(),
      message: message,
      type: type,
      source: source
    };
    
    try {
      // Append to log file
      fs.appendFileSync(this.logFilePath, JSON.stringify(logEntry) + '\n');
      
      // Also log to console with formatting
      const timeStr = new Date().toLocaleTimeString();
      const icon = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : 'ℹ️';
      console.log(`${icon} [${timeStr}] ${message}`);
      
      // Check if rotation is needed after each log
      this.rotateLogIfNeeded();
      
    } catch (error) {
      console.error('Failed to write log:', error.message);
      // Fallback to console only
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }
  
  info(message, source = 'bot') {
    this.log(message, 'info', source);
  }
  
  warn(message, source = 'bot') {
    this.log(message, 'warn', source);
  }
  
  error(message, source = 'bot') {
    this.log(message, 'error', source);
  }
  
  // Read recent logs from file
  getRecentLogs(maxLines = 100) {
    try {
      if (!fs.existsSync(this.logFilePath)) {
        return [];
      }
      
      const content = fs.readFileSync(this.logFilePath, 'utf8');
      const lines = content.trim().split('\n').filter(line => line.trim());
      
      // Get last N lines
      const recentLines = lines.slice(-maxLines);
      
      // Parse JSON logs
      const logs = recentLines.map(line => {
        try {
          return JSON.parse(line);
        } catch (parseError) {
          // Handle malformed log lines
          return {
            timestamp: new Date().toISOString(),
            message: line,
            type: 'info',
            source: 'unknown'
          };
        }
      });
      
      return logs;
      
    } catch (error) {
      console.error('Failed to read logs:', error.message);
      return [];
    }
  }
  
  // Watch log file for changes (for live updates)
  watchLogs(callback, maxLines = 50) {
    let lastSize = 0;
    
    try {
      // Get initial size
      if (fs.existsSync(this.logFilePath)) {
        lastSize = fs.statSync(this.logFilePath).size;
      }
      
      // Watch for file changes
      const watcher = fs.watchFile(this.logFilePath, { interval: 1000 }, (curr, prev) => {
        if (curr.size > lastSize) {
          // File has grown, read new content
          const logs = this.getRecentLogs(maxLines);
          callback(logs);
          lastSize = curr.size;
        }
      });
      
      return watcher;
      
    } catch (error) {
      console.error('Failed to watch logs:', error.message);
      return null;
    }
  }
  
  // Clear log file
  clearLogs() {
    try {
      const clearLog = {
        timestamp: new Date().toISOString(),
        message: 'Log file cleared by user',
        type: 'info',
        source: 'system'
      };
      fs.writeFileSync(this.logFilePath, JSON.stringify(clearLog) + '\n');
      return true;
    } catch (error) {
      console.error('Failed to clear logs:', error.message);
      return false;
    }
  }
}

module.exports = FileLogger;
