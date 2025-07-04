// src/core/Logger.js - Enhanced File-based logging system for Multi-Bot
const fs = require('fs');
const path = require('path');

class Logger {
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
      if (!fs.existsSync(this.logFilePath)) return;
      
      const stats = fs.statSync(this.logFilePath);
      if (stats.size > this.maxLogSize) {
        // Create backup filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = this.logFilePath.replace('.log', `_${timestamp}.log`);
        
        // Move current log to backup
        fs.renameSync(this.logFilePath, backupPath);
        
        // Create new log file
        const initialLog = {
          timestamp: new Date().toISOString(),
          message: `Log rotated. Previous log saved as: ${path.basename(backupPath)}`,
          type: 'info',
          source: 'system'
        };
        fs.writeFileSync(this.logFilePath, JSON.stringify(initialLog) + '\n');
        
        console.log(`📁 Log rotated: ${backupPath}`);
      }
    } catch (error) {
      console.error('Failed to rotate log:', error.message);
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
  
  // Clear log file
  clearLogs() {
    try {
      const initialLog = {
        timestamp: new Date().toISOString(),
        message: 'Logs cleared by user',
        type: 'info',
        source: 'system'
      };
      fs.writeFileSync(this.logFilePath, JSON.stringify(initialLog) + '\n');
      return true;
    } catch (error) {
      console.error('Failed to clear logs:', error.message);
      return false;
    }
  }
  
  // Get log file stats
  getLogStats() {
    try {
      if (!fs.existsSync(this.logFilePath)) {
        return {
          exists: false,
          size: 0,
          lines: 0,
          lastModified: null
        };
      }
      
      const stats = fs.statSync(this.logFilePath);
      const content = fs.readFileSync(this.logFilePath, 'utf8');
      const lines = content.trim().split('\n').filter(line => line.trim()).length;
      
      return {
        exists: true,
        size: stats.size,
        lines: lines,
        lastModified: stats.mtime.toISOString(),
        path: this.logFilePath
      };
      
    } catch (error) {
      console.error('Failed to get log stats:', error.message);
      return {
        exists: false,
        size: 0,
        lines: 0,
        lastModified: null,
        error: error.message
      };
    }
  }
}

module.exports = Logger;
