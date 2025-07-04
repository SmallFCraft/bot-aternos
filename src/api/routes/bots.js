// src/api/routes/bots.js - Bot Management API Routes
const express = require('express');
const router = express.Router();

module.exports = (botManager) => {
  // Get all bots
  router.get('/', (req, res) => {
    try {
      const bots = botManager.getAllBots();
      res.json({
        success: true,
        bots: bots,
        total: bots.length,
        running: bots.filter(bot => bot.isConnected).length,
        stopped: bots.filter(bot => !bot.isConnected).length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get specific bot
  router.get('/:id', (req, res) => {
    try {
      const bot = botManager.getBot(req.params.id);
      if (!bot) {
        return res.status(404).json({
          success: false,
          error: 'Bot not found'
        });
      }

      res.json({
        success: true,
        bot: bot
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Create new bot
  router.post('/', async (req, res) => {
    try {
      const { name, host, port, username, version, isOfflineMode, skipAuthentication, antiAfkEnabled, antiAfkInterval, movementRange, maxReconnectAttempts, autoStart } = req.body;

      // Validate required fields
      if (!host || !port || !username) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: host, port, username'
        });
      }

      const config = {
        name,
        host,
        port: parseInt(port),
        username,
        version: version || '1.21.90',
        isOfflineMode: isOfflineMode || false,
        skipAuthentication: skipAuthentication || false,
        antiAfkEnabled: antiAfkEnabled !== false, // Default true
        antiAfkInterval: parseInt(antiAfkInterval) || 30000,
        movementRange: parseFloat(movementRange) || 2.0,
        maxReconnectAttempts: parseInt(maxReconnectAttempts) || 50,
        autoStart: autoStart || false
      };

      const result = await botManager.createBot(config);

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Update bot configuration
  router.put('/:id', async (req, res) => {
    try {
      const botId = req.params.id;
      const updates = req.body;

      const result = await botManager.updateBotConfig(botId, updates);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Delete bot
  router.delete('/:id', async (req, res) => {
    try {
      const result = await botManager.deleteBot(req.params.id);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Start bot
  router.post('/:id/start', async (req, res) => {
    try {
      const result = await botManager.startBot(req.params.id);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Stop bot
  router.post('/:id/stop', async (req, res) => {
    try {
      const result = await botManager.stopBot(req.params.id);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Restart bot
  router.post('/:id/restart', async (req, res) => {
    try {
      const result = await botManager.restartBot(req.params.id);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Toggle Anti-AFK for specific bot
  router.post('/:id/anti-afk/toggle', async (req, res) => {
    try {
      const bot = botManager.getBot(req.params.id);
      if (!bot) {
        return res.status(404).json({
          success: false,
          error: 'Bot not found'
        });
      }

      const botInstance = botManager.bots.get(req.params.id);
      if (!botInstance) {
        return res.status(404).json({
          success: false,
          error: 'Bot instance not found'
        });
      }

      if (!botInstance.status.hasSpawned) {
        return res.status(400).json({
          success: false,
          error: 'Bot not spawned yet'
        });
      }

      if (botInstance.status.antiAfk.active) {
        botInstance.stopAntiAfk();
        res.json({
          success: true,
          message: 'Anti-AFK stopped',
          active: false
        });
      } else {
        botInstance.startAntiAfk();
        res.json({
          success: true,
          message: 'Anti-AFK started',
          active: true
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Manual movement for specific bot
  router.post('/:id/move', async (req, res) => {
    try {
      const { x, y, z } = req.body;

      if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') {
        return res.status(400).json({
          success: false,
          error: 'Invalid coordinates. x, y, z must be numbers'
        });
      }

      const botInstance = botManager.bots.get(req.params.id);
      if (!botInstance) {
        return res.status(404).json({
          success: false,
          error: 'Bot not found'
        });
      }

      if (!botInstance.status.hasSpawned) {
        return res.status(400).json({
          success: false,
          error: 'Bot not spawned yet'
        });
      }

      const result = botInstance.manualMove(x, y, z);
      res.json({
        success: true,
        message: 'Movement command sent',
        position: result.position,
        timestamp: result.timestamp
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get bot logs
  router.get('/:id/logs', (req, res) => {
    try {
      const botInstance = botManager.bots.get(req.params.id);
      if (!botInstance) {
        return res.status(404).json({
          success: false,
          error: 'Bot not found'
        });
      }

      const maxLines = parseInt(req.query.lines) || 100;
      const logs = botInstance.logger.getRecentLogs(maxLines);

      res.json({
        success: true,
        logs: logs,
        total: logs.length,
        botId: req.params.id
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Clear bot logs
  router.delete('/:id/logs', (req, res) => {
    try {
      const botInstance = botManager.bots.get(req.params.id);
      if (!botInstance) {
        return res.status(404).json({
          success: false,
          error: 'Bot not found'
        });
      }

      const success = botInstance.logger.clearLogs();

      if (success) {
        res.json({
          success: true,
          message: 'Bot logs cleared'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to clear logs'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  return router;
};
