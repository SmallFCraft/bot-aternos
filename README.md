# 🤖 Advanced Multi-Bot Management System

**Professional Multi-Bot Management System for Aternos Bedrock Servers**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![bedrock-protocol](https://img.shields.io/badge/bedrock--protocol-3.5.1-blue.svg)](https://www.npmjs.com/package/bedrock-protocol)
[![Multi-Bot](https://img.shields.io/badge/Multi--Bot-Unlimited-brightgreen.svg)](#features)
[![Better Stack](https://img.shields.io/badge/Better%20Stack-Integrated-blue.svg)](#monitoring)
[![Production Ready](https://img.shields.io/badge/Production-Ready-success.svg)](#deployment)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](#license)

**🚀 Production-ready multi-bot system với modern dashboard, professional monitoring, và comprehensive management features.**

## ⚠️ **IMPORTANT DISCLAIMER**

This bot **VIOLATES Aternos Terms of Service** and may result in account suspension or permanent ban. Use at your own risk.

**Recommended:** Migrate to bot-friendly hosting platforms like Oracle Always Free, Minehut, or FreeMcServer.net.

---

## 🎯 **Key Features**

### 🤖 **Multi-Bot Management**

- ✅ **Unlimited Bots** - Manage multiple bots across different servers
- ✅ **Individual Configuration** - Per-bot settings and customization
- ✅ **Bulk Operations** - Start/stop all bots with one click
- ✅ **Real-time Monitoring** - Live status updates for all bots
- ✅ **Per-bot Logging** - Separate log files for each bot

### 🎨 **Modern Dashboard**

- ✅ **Responsive Web UI** - Professional dark theme interface
- ✅ **Real-time Updates** - Live bot status and log streaming
- ✅ **Bot Creation/Editing** - Easy bot management through web interface
- ✅ **Statistics Dashboard** - Comprehensive system and bot statistics
- ✅ **Better Stack Integration** - Professional monitoring setup

### 🔧 **Core Bot Features**

- ✅ **24/7 Keep-Alive** - Maintain Aternos server activity
- ✅ **Auto Reconnect** - Intelligent reconnection with exponential backoff
- ✅ **Anti-AFK Movement** - Configurable movement patterns
- ✅ **Multi-Version Support** - Minecraft Bedrock 1.16 → 1.21.90
- ✅ **Offline/Online Mode** - Support for both cracked and premium servers

### 📊 **Professional Monitoring**

- ✅ **Better Stack Integration** - Professional uptime monitoring
- ✅ **Health Check Endpoints** - Production-ready health monitoring
- ✅ **Real-time Logging** - File-based logging with live streaming
- ✅ **Error Handling** - Comprehensive error tracking and recovery
- ✅ **Performance Metrics** - System and bot performance monitoring

## 🚀 **Quick Start**

### **Prerequisites**

- Node.js 18+
- NPM/Yarn

### **Installation**

```bash
# Clone repository
git clone https://github.com/SmallFCraft/bot-aternos.git
cd bot-aternos

# Install dependencies
npm install

# Configure environment (optional)
cp .env.example .env
# Edit .env with your settings

# Start multi-bot system
npm start
```

### **Access Dashboard**

Open your browser and navigate to: **http://localhost:3000**

🎯 **Create your first bot through the web dashboard!**

### **Environment Configuration**

Create a `.env` file in the root directory:

```env
# Environment
NODE_ENV=production

# Better Stack Monitoring
BETTER_STACK_ENABLED=true
BETTER_STACK_API_KEY=your_api_key_here
BETTER_STACK_HEARTBEAT=https://uptime.betterstack.com/api/v1/heartbeat/YOUR_KEY

# Default Server Settings
SERVER_HOST=your-server.aternos.me
SERVER_PORT=19132
MC_VERSION=1.21.90

# Default Bot Settings
BOT_USERNAME=YourBotName
DEFAULT_OFFLINE_MODE=true
DEFAULT_ANTI_AFK_ENABLED=true
DEFAULT_ANTI_AFK_INTERVAL=30000
DEFAULT_MOVEMENT_RANGE=2.0
DEFAULT_MAX_RECONNECT_ATTEMPTS=50

# API Server
PORT=3000
```

### **Available Scripts**

```bash
npm start              # Start multi-bot system
npm run dev           # Development mode with auto-reload
npm run legacy        # Run legacy single-bot system
npm test              # Test the system
npm run logs          # View all bot logs
npm run health        # Check system health
npm run fix-security  # Fix security vulnerabilities
npm run clean-install # Clean npm install
```

---

## 🎨 **Dashboard Features**

Access the modern web dashboard at: **http://localhost:3000**

### 🎯 **Main Features**

- 🤖 **Multi-Bot Management** - Create, edit, start, stop, and delete bots
- 📊 **Real-time Statistics** - System uptime, bot count, performance metrics
- 📋 **Live Log Streaming** - Real-time logs from all bots via Server-Sent Events
- 💓 **Better Stack Integration** - Professional monitoring setup and status
- 🔄 **Bulk Operations** - Start/stop all bots with one click

### 🔧 **Bot Controls**

- ▶️ **Start/Stop** - Individual bot control
- 🔄 **Restart** - Restart specific bots
- ✏️ **Edit** - Modify bot configuration
- � **Anti-AFK Toggle** - Enable/disable movement
- 📝 **View Logs** - Per-bot log viewing
- 🗑️ **Delete** - Remove bots

### 📊 **Monitoring Dashboard**

- 🟢 **Real-time Status** - Live bot connection status
- 📈 **Performance Metrics** - Packets sent/received, uptime
- 🔍 **Health Checks** - System and individual bot health
- � **Responsive Design** - Works on desktop and mobile

---

## 🔌 **API Endpoints**

### **Bot Management**

```bash
GET    /api/bots                    # List all bots
POST   /api/bots                    # Create new bot
GET    /api/bots/:id                # Get bot details
PUT    /api/bots/:id                # Update bot configuration
DELETE /api/bots/:id                # Delete bot
POST   /api/bots/:id/start          # Start bot
POST   /api/bots/:id/stop           # Stop bot
POST   /api/bots/:id/restart        # Restart bot
POST   /api/bots/start-all          # Start all bots
POST   /api/bots/stop-all           # Stop all bots
```

### **System & Monitoring**

```bash
GET    /api/health                  # System health check
GET    /api/logs/stream             # Live log stream (SSE)
GET    /api/logs/recent             # Recent log entries
GET    /api/betterstack/status      # Better Stack status
POST   /api/betterstack/setup       # Configure Better Stack
POST   /api/betterstack/test        # Test heartbeat
```

---

## 📊 **Better Stack Monitoring**

### **Setup Guide**

1. **Access Dashboard** - Click "Monitor Setup Guide" in the dashboard
2. **Create Monitor** - Follow step-by-step instructions
3. **Configure Alerts** - Set up email/SMS notifications
4. **Status Page** - Create public status page

### **Production Monitoring**

- **Health Endpoint**: `https://your-app.onrender.com/api/health`
- **Check Frequency**: Every 1 minute
- **Timeout**: 30-60 seconds
- **Expected Status**: 200 OK

### **Health Check Response**

```json
{
  "status": "healthy",
  "timestamp": "2025-07-04T08:37:25.566Z",
  "uptime": "12m 30s",
  "bots": {
    "total": 2,
    "running": 1,
    "stopped": 1
  },
  "system": {
    "memory": "45MB",
    "nodeVersion": "v20.19.3",
    "platform": "linux"
  },
  "betterStack": {
    "enabled": true,
    "lastHeartbeat": "2025-07-04T08:37:25.566Z"
  }
}
```

---

## 🏗️ **Project Structure**

```
📁 Multi-Bot System/
├── 📁 src/                     # Source code (MVC Architecture)
│   ├── 📁 core/               # Core business logic
│   │   ├── BotManager.js      # Multi-bot orchestrator
│   │   ├── Bot.js             # Individual bot logic
│   │   ├── Logger.js          # Enhanced logging system
│   │   └── BetterStackMonitor.js # Professional monitoring
│   ├── 📁 api/                # API layer
│   │   ├── server.js          # Express server
│   │   └── 📁 routes/         # RESTful endpoints
│   └── 📁 config/             # Configuration management
│       └── default.js         # Environment-based config
├── 📁 public/                 # Static files
│   └── dashboard.html         # Modern multi-bot dashboard
├── 📁 data/                   # Persistent storage
│   ├── bots.json             # Bot configurations
│   └── betterstack-config.json # Monitoring settings
├── 📁 logs/                   # Log files
│   └── 📁 bots/              # Per-bot log files
├── 📄 index.js               # Main entry point
├── 📄 index-legacy.js        # Legacy single-bot system
├── 📄 .env                   # Environment variables
├── 📄 package.json           # Dependencies and scripts
└── 📄 README.md              # This documentation
```

---

## 🐛 **Troubleshooting**

### **Common Issues**

1. **Bot won't connect**

   - ✅ Check server status on Aternos dashboard
   - ✅ Verify server address and port
   - ✅ Check if server is online and accepting connections

2. **Movement packet errors**

   - ✅ Wait for bot to fully spawn before movement
   - ✅ Check entity ID is properly captured
   - ✅ Verify anti-AFK settings in bot configuration

3. **Dashboard not loading**

   - ✅ Ensure port 3000 is not in use
   - ✅ Check firewall settings
   - ✅ Verify all dependencies are installed

4. **Better Stack not working**
   - ✅ Check .env configuration
   - ✅ Verify heartbeat URL is correct
   - ✅ Test production endpoint manually

### **Debug Commands**

```bash
# Check system health
npm run health

# View all logs
npm run logs

# Test production endpoint
curl https://your-app.onrender.com/api/health

# Check for errors
npm audit
```

---

## ⚖️ **Legal Alternatives**

Instead of violating Aternos ToS, consider these **bot-friendly** platforms:

### 🆓 **Free Options**

- **Minehut** - Free, allows bots, good uptime
- **FreeMcServer.net** - Free, bot-friendly
- **Server.pro** - Free tier, automation allowed

### 🏆 **Recommended**

- **Oracle Always Free** - 24/7, full control, truly free forever
- **AWS Free Tier** - 12 months free, professional hosting
- **Google Cloud Free** - $300 credit, enterprise-grade

### **Migration Benefits**

- ✅ No policy violations
- ✅ Better performance
- ✅ More control
- ✅ No risk of account suspension

---

## 📦 **Deployment**

### **Render.com (Recommended)**

Your app is currently deployed at: **https://bot-aternos-6ltq.onrender.com/**

```yaml
# render.yaml
services:
  - type: web
    name: aternos-bot-system
    env: node
    buildCommand: npm install --production
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: BETTER_STACK_ENABLED
        value: true
      - key: BETTER_STACK_HEARTBEAT
        value: https://uptime.betterstack.com/api/v1/heartbeat/YOUR_KEY
```

### **Environment Variables for Production**

```env
NODE_ENV=production
PORT=3000
BETTER_STACK_ENABLED=true
BETTER_STACK_HEARTBEAT=https://uptime.betterstack.com/api/v1/heartbeat/YOUR_KEY
SERVER_HOST=your-server.aternos.me
SERVER_PORT=19132
MC_VERSION=1.21.90
BOT_USERNAME=YourBotName
DEFAULT_OFFLINE_MODE=true
```

### **Docker Deployment**

```dockerfile
FROM node:18-alpine
WORKDIR /app

# Install dependencies
RUN apk add --no-cache python3 make g++ gcc curl

# Copy package files
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY . .

# Create directories
RUN mkdir -p logs/bots data

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["npm", "start"]
```

### **Production Checklist**

- ✅ Environment variables configured
- ✅ Better Stack monitoring setup
- ✅ Health check endpoint working
- ✅ Logs directory created
- ✅ Data persistence configured
- ✅ Security headers enabled
- ✅ Error handling implemented

---

## 🔧 **Development**

### **Contributing**

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### **Development Setup**

```bash
# Clone and setup
git clone https://github.com/SmallFCraft/bot-aternos.git
cd bot-aternos
npm install

# Development mode
npm run dev

# Run tests
npm test

# Check security
npm audit
```

### **Code Style**

- Use ES6+ features
- Follow MVC architecture
- Add comprehensive error handling
- Include JSDoc comments
- Write unit tests for new features

---

## ⚠️ **Warnings & Disclaimers**

### **Aternos Policy Violations**

- **§5.2.c.1:** Using fake players (bots) ❌
- **§5.2.c.2:** Automatically reconnecting after disconnect ❌
- **§5.2.c.3:** Faking player activity ❌

### **Potential Consequences**

- Account suspension
- Server deletion
- Permanent ban
- Loss of all data

### **Recommendation**

**Migrate to bot-friendly hosting** to avoid these risks entirely.

---

## 📞 **Support & Resources**

### **Getting Help**

- 🐛 **Issues:** [Create GitHub Issue](https://github.com/SmallFCraft/bot-aternos/issues)
- 💬 **Discussions:** Check troubleshooting section first
- � **Documentation:** Read this README thoroughly
- �🔄 **Updates:** Watch repository for improvements

### **Useful Links**

- **bedrock-protocol:** https://www.npmjs.com/package/bedrock-protocol
- **Better Stack:** https://betterstack.com
- **Render.com:** https://render.com
- **Oracle Always Free:** https://www.oracle.com/cloud/free/

### **Production Deployment**

- **Live App:** https://bot-aternos-6ltq.onrender.com/
- **Status Page:** https://aternos.betteruptime.com/
- **Health Check:** https://bot-aternos-6ltq.onrender.com/api/health

---

## 📄 **License**

MIT License - This project is for educational purposes only. Use at your own risk.

**The developers are not responsible for any account suspensions, bans, or data loss resulting from using this bot.**

---

## 🎉 **Acknowledgments**

- **PrismarineJS** - For the excellent bedrock-protocol library
- **Better Stack** - For professional monitoring solutions
- **Render.com** - For reliable hosting platform
- **Community** - For feedback and contributions

---

## ⭐ **Star this repo if it helped you!** ⭐

**🚀 Ready to manage multiple bots like a pro? Get started now!**
