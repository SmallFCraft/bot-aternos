#!/usr/bin/env node
// scripts/cleanup.js - Cleanup and maintenance script for the bot system

const fs = require('fs');
const path = require('path');

class SystemCleanup {
  constructor() {
    this.rootDir = path.join(__dirname, '..');
    this.logsDir = path.join(this.rootDir, 'logs', 'bots');
    this.dataDir = path.join(this.rootDir, 'data');
  }

  // Clean old log files (older than 7 days)
  cleanOldLogs(daysOld = 7) {
    console.log('🧹 Cleaning old log files...');
    
    if (!fs.existsSync(this.logsDir)) {
      console.log('📁 Logs directory does not exist');
      return;
    }

    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    const files = fs.readdirSync(this.logsDir);
    let cleanedCount = 0;

    for (const file of files) {
      if (!file.endsWith('.log')) continue;
      
      const filePath = path.join(this.logsDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime.getTime() < cutoffTime) {
        try {
          fs.unlinkSync(filePath);
          console.log(`🗑️  Removed old log: ${file}`);
          cleanedCount++;
        } catch (error) {
          console.error(`❌ Failed to remove ${file}:`, error.message);
        }
      }
    }

    console.log(`✅ Cleaned ${cleanedCount} old log files`);
  }

  // Clean large log files (larger than 10MB)
  cleanLargeLogs(maxSizeMB = 10) {
    console.log('🧹 Cleaning large log files...');
    
    if (!fs.existsSync(this.logsDir)) {
      return;
    }

    const maxSize = maxSizeMB * 1024 * 1024;
    const files = fs.readdirSync(this.logsDir);
    let cleanedCount = 0;

    for (const file of files) {
      if (!file.endsWith('.log')) continue;
      
      const filePath = path.join(this.logsDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.size > maxSize) {
        try {
          // Keep only the last 1000 lines
          const content = fs.readFileSync(filePath, 'utf8');
          const lines = content.split('\n');
          const keepLines = lines.slice(-1000);
          
          fs.writeFileSync(filePath, keepLines.join('\n'));
          console.log(`✂️  Truncated large log: ${file} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
          cleanedCount++;
        } catch (error) {
          console.error(`❌ Failed to truncate ${file}:`, error.message);
        }
      }
    }

    console.log(`✅ Truncated ${cleanedCount} large log files`);
  }

  // Validate and clean bot configuration
  cleanBotConfig() {
    console.log('🧹 Cleaning bot configuration...');
    
    const configFile = path.join(this.dataDir, 'bots.json');
    
    if (!fs.existsSync(configFile)) {
      console.log('📁 Bot config file does not exist');
      return;
    }

    try {
      const data = fs.readFileSync(configFile, 'utf8');
      const config = JSON.parse(data);
      
      // Remove invalid or corrupted entries
      const validConfig = {};
      let removedCount = 0;
      
      for (const [botId, botConfig] of Object.entries(config)) {
        if (this.isValidBotConfig(botConfig)) {
          validConfig[botId] = botConfig;
        } else {
          console.log(`🗑️  Removed invalid bot config: ${botId}`);
          removedCount++;
        }
      }
      
      if (removedCount > 0) {
        fs.writeFileSync(configFile, JSON.stringify(validConfig, null, 2));
        console.log(`✅ Cleaned ${removedCount} invalid bot configurations`);
      } else {
        console.log('✅ All bot configurations are valid');
      }
    } catch (error) {
      console.error('❌ Failed to clean bot config:', error.message);
    }
  }

  // Validate bot configuration
  isValidBotConfig(config) {
    return config && 
           typeof config.name === 'string' &&
           typeof config.host === 'string' &&
           typeof config.port === 'number' &&
           typeof config.username === 'string';
  }

  // Generate system report
  generateReport() {
    console.log('\n📊 System Report:');
    console.log('================');
    
    // Log files info
    if (fs.existsSync(this.logsDir)) {
      const logFiles = fs.readdirSync(this.logsDir).filter(f => f.endsWith('.log'));
      console.log(`📁 Log files: ${logFiles.length}`);
      
      let totalLogSize = 0;
      for (const file of logFiles) {
        const filePath = path.join(this.logsDir, file);
        const stats = fs.statSync(filePath);
        totalLogSize += stats.size;
      }
      console.log(`💾 Total log size: ${(totalLogSize / 1024 / 1024).toFixed(2)} MB`);
    }
    
    // Bot config info
    const configFile = path.join(this.dataDir, 'bots.json');
    if (fs.existsSync(configFile)) {
      try {
        const data = fs.readFileSync(configFile, 'utf8');
        const config = JSON.parse(data);
        console.log(`🤖 Configured bots: ${Object.keys(config).length}`);
      } catch (error) {
        console.log('❌ Bot config file is corrupted');
      }
    }
    
    console.log('================\n');
  }

  // Run all cleanup tasks
  runAll() {
    console.log('🚀 Starting system cleanup...\n');
    
    this.generateReport();
    this.cleanOldLogs();
    this.cleanLargeLogs();
    this.cleanBotConfig();
    
    console.log('\n✅ System cleanup completed!');
    this.generateReport();
  }
}

// Run cleanup if called directly
if (require.main === module) {
  const cleanup = new SystemCleanup();
  
  const args = process.argv.slice(2);
  const command = args[0] || 'all';
  
  switch (command) {
    case 'logs':
      cleanup.cleanOldLogs();
      cleanup.cleanLargeLogs();
      break;
    case 'config':
      cleanup.cleanBotConfig();
      break;
    case 'report':
      cleanup.generateReport();
      break;
    case 'all':
    default:
      cleanup.runAll();
      break;
  }
}

module.exports = SystemCleanup;
