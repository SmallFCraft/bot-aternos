# 🤖 Multi-Bot Management System

> **Professional Multi-Bot Management System for Minecraft Bedrock Servers**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![bedrock-protocol](https://img.shields.io/badge/bedrock--protocol-3.5.1-blue.svg)](https://www.npmjs.com/package/bedrock-protocol)
[![Better Stack](https://img.shields.io/badge/Better%20Stack-Integrated-blue.svg)](#monitoring)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](#license)

A production-ready multi-bot management system with modern web dashboard, professional monitoring, and comprehensive bot management for Minecraft Bedrock servers.

## ⚠️ **LEGAL NOTICE**

This bot **VIOLATES Aternos Terms of Service**. Use at your own risk.  
**Recommended:** Use bot-friendly hosting like Oracle Always Free, Minehut, or FreeMcServer.net.

## ✅ Requirements

- **Node.js:** v18 or newer
- **OS:** Linux, macOS, Windows
- **Minecraft Bedrock Server:** 1.21.90 supported (configurable)

## ✨ Features

- **🤖 Multi-Bot Management** - Unlimited bots with individual configuration
- **🎨 Modern Dashboard** - Responsive web UI with real-time updates
- **🔧 24/7 Keep-Alive** - Auto reconnect with anti-AFK movement
- **📊 Professional Monitoring** - Better Stack integration with health checks
- **📋 Real-time Logging** - File-based logging with live streaming
- **⚙️ Easy Configuration** - Environment-based settings

## 🚀 Quick Start

```bash
# Clone and install
git clone https://github.com/SmallFCraft/bot-aternos.git
cd bot-aternos
npm install

# Configure (optional)
cp .env.example .env
# Edit .env with your settings

# Start the system
npm start
```

**Dashboard:** [http://localhost:3000](http://localhost:3000)

## ⚙️ Configuration

Create a `.env` file (copy from `.env.example`):

```env
# Application
NODE_ENV=production
PORT=3000

# Server Settings
SERVER_HOST=your-server.aternos.me
SERVER_PORT=19132
MC_VERSION=1.21.90

# Bot Configuration
BOT_USERNAME=YourBotName
DEFAULT_OFFLINE_MODE=true
DEFAULT_ANTI_AFK_ENABLED=true

# Better Stack Monitoring
BETTER_STACK_ENABLED=true
BETTER_STACK_HEARTBEAT=https://uptime.betterstack.com/api/v1/heartbeat/YOUR_KEY
```

### Available Scripts

```bash
npm start      # Start system
npm run dev    # Development mode
npm run logs   # View bot logs
npm run health # Check system health
```

## 📖 Usage

**Dashboard:** [http://localhost:3000](http://localhost:3000)

1. Click "Create New Bot"
2. Configure: Name, Server Host, Port, Username
3. Click "Create Bot" → "Start"

**Features:** Multi-bot management, real-time stats, live logs, Better Stack integration.

## 🔌 API Documentation

**Base URL:** `http://localhost:3000/api`

### Key Endpoints

```bash
GET    /api/bots              # List all bots
POST   /api/bots              # Create new bot
POST   /api/bots/:id/start    # Start bot
POST   /api/bots/:id/stop     # Stop bot
GET    /api/health            # System health
GET    /api/logs/stream       # Live log stream (SSE)
```

## 📊 Monitoring

**Better Stack Integration:** Professional uptime monitoring with health checks
**Health Endpoint:** `/api/health`
**Status Page:** [https://aternos.betteruptime.com/](https://aternos.betteruptime.com/)

## 🏗️ Project Structure

```
📁 Bot-Aternos/
├── 📁 src/                    # Source code
│   ├── 📁 core/              # Bot logic, logging, monitoring
│   ├── 📁 api/               # Express server & routes
│   └── 📁 config/            # Environment configuration
├── 📁 public/                # Frontend files
│   ├── dashboard.html        # Main dashboard
│   ├── uptime.html          # Status page
│   ├── 📁 css/              # Styles
│   └── 📁 js/               # Frontend logic
├── 📁 data/                  # Bot configs & settings
├── 📁 logs/bots/            # Per-bot log files
├── 📄 index.js              # Main entry point
├── 📄 package.json          # Dependencies (optimized)
├── 📄 .env                  # Environment variables (improved)
├── 📄 .env.example          # Environment template
└── 📄 README.md             # Documentation (concise)
```

**Architecture:** MVC pattern with RESTful API, real-time updates, and file-based logging.

## 🚀 Deployment

**Production Example:** [https://bot-aternos-6ltq.onrender.com/](https://bot-aternos-6ltq.onrender.com/)
**Status Page:** [https://aternos.betteruptime.com/](https://aternos.betteruptime.com/)

### Environment Variables for Production

```env
NODE_ENV=production
BETTER_STACK_ENABLED=true
BETTER_STACK_HEARTBEAT=your_heartbeat_url
SERVER_HOST=your-server.aternos.me
BOT_USERNAME=YourBotName
```

## 🔒 Security Note

Never share your `.env` files or Minecraft account credentials publicly.

## ⚖️ Legal Alternatives

**Bot-friendly hosting options:**

- **Oracle Always Free** - 24/7, full control
- **Minehut** - Free, allows bots
- **AWS/GCP Free Tier** - Professional hosting (note: check updated TOS regarding bots)

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## 📜 License

MIT License – for educational purposes only. Use at your own risk.

**Developers are not responsible for any account suspensions or data loss.**
