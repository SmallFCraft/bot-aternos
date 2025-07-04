# 🤖 Aternos Bedrock Keep-Alive Bot

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![bedrock-protocol](https://img.shields.io/badge/bedrock--protocol-3.46.0-blue.svg)](https://www.npmjs.com/package/bedrock-protocol)
[![Security](https://img.shields.io/badge/Security-Fixed-brightgreen.svg)](#security-fixes)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](#license)

**Advanced Minecraft Bedrock Edition bot với dashboard web, monitoring, và nhiều tính năng mở rộng.**

## ⚠️ **IMPORTANT DISCLAIMER**
This bot **VIOLATES Aternos Terms of Service** and may result in account suspension or permanent ban. Use at your own risk.

**Recommended:** Migrate to bot-friendly hosting platforms like Oracle Always Free, Minehut, or FreeMcServer.net.

---

## � **Key Features**

### 🎯 **Core Bot Features**
- ✅ **24/7 Keep-Alive** - Duy trì server Aternos hoạt động
- ✅ **Auto Reconnect** - Tự động kết nối lại khi mất kết nối
- ✅ **Multi-Version Support** - Hỗ trợ Minecraft Bedrock 1.16 → 1.21.90
- ✅ **Crack/Premium Mode** - Hỗ trợ cả server crack và premium
- ✅ **Real-time Dashboard** - Web interface với live monitoring

### 🛠️ **Advanced Features (bedrock-protocol)**
- 🔐 **Authentication & Encryption** - Xbox Live authentication
- 📦 **Packet Management** - Parse/serialize packets as JavaScript objects
- 🔄 **Auto Keep-Alive** - Tự động respond keep-alive packets
- 🌐 **Proxy Support** - MITM connections và proxy
- 📊 **Server Ping** - Kiểm tra status server
- 💬 **Chat Integration** - Gửi/nhận chat messages
- 🎮 **Game Events** - Listen game events và player actions

### 🚶 **Movement & Position Tracking**
- 📍 **Real-time Position Tracking** - Track bot's current position and movement
- 🚶 **Anti-AFK Movement** - Automatic movement to prevent AFK detection
- 👥 **Player Tracking** - Monitor nearby players and their positions
- 📊 **Movement Statistics** - Distance traveled, movement history
- 🎮 **Manual Movement** - Control bot movement via dashboard
- ⚙️ **Configurable Settings** - Customizable movement patterns and intervals

## 🚀 **Quick Start**

### Prerequisites

- Node.js 18+
- NPM/Yarn

### Installation

```bash
git clone [your-repo]
cd Bot
npm install
```

### Configuration

Edit `config.js` hoặc sử dụng environment variables:

```bash
# Server Settings
SERVER_HOST=Meo_MC403-IFBX.aternos.me
SERVER_PORT=33122
BOT_USERNAME=LOADING99_71
OFFLINE_MODE=true

# Monitoring (Optional)
BETTER_STACK_HEARTBEAT_URL=https://betterstack.com/api/v1/heartbeat/YOUR_KEY

# Movement & Position Tracking
ANTI_AFK_ENABLED=true
ANTI_AFK_INTERVAL=30000
MOVEMENT_RANGE=2.0
POSITION_TRACKING_ENABLED=true
TRACK_OTHER_PLAYERS=true
```

### Run Bot

```bash
# Start bot
npm start

# Development mode với auto-restart
npm run dev

# Crack server preset
npm run crack

# Premium server preset
npm run premium
```

### Access Dashboard

- **Web Dashboard:** http://localhost:3000/dashboard
- **Health Check:** http://localhost:3000/health
- **API Status:** http://localhost:3000/stats
- **Movement Status:** http://localhost:3000/movement/status
- **Players Data:** http://localhost:3000/movement/players

### Movement API Endpoints

```bash
# Get movement status
GET /movement/status

# Start/Stop Anti-AFK movement
POST /movement/anti-afk/start
POST /movement/anti-afk/stop

# Manual movement control
POST /movement/manual-move
Content-Type: application/json
{"x": 10, "y": 64, "z": 5}

# Get nearby players data
GET /movement/players
```

---

## 🔧 **Security Fixes**

✅ **All security vulnerabilities have been resolved!**

### Fixed Issues

- **6 Security Vulnerabilities** → 0 vulnerabilities ✅
- **Deprecated Warnings** → Suppressed via `.npmrc` ✅
- **Dependencies Updated** → Latest secure versions ✅

### Security Tools

```bash
# Run security fix script
npm run fix-security

# Clean install
npm run clean-install

# Check security status
npm audit
```

---

## 🎛️ **Advanced Configuration**

---

## 📊 **Dashboard Features**

Access dashboard at: <http://localhost:3000/dashboard>

### Features

- 🔴🟢 **Real-time bot status**
- 📋 **Live server logs** (SSE stream)
- 📈 **Statistics tracking**
- ⚙️ **Method switching** via API
- 💗 **Better Stack setup**
- ⚠️ **Compliance warnings**

### API Endpoints

```bash
GET  /                    # Bot status
GET  /health             # Health check
GET  /stats              # Detailed statistics
GET  /restart            # Restart bot
GET  /compliance         # Policy violation info
POST /setup-betterstack  # Configure monitoring
```

### bedrock-protocol Extended Features

```javascript
// Chat integration
client.on('text', (packet) => {
  console.log(`${packet.source_name}: ${packet.message}`)
})

// Send chat message
client.queue('text', {
  type: 'chat',
  needs_translation: false,
  source_name: client.username,
  message: 'Hello from bot!'
})

// Movement packets (experimental)
client.queue('move_player', {
  runtime_id: client.runtime_id,
  position: { x: 0, y: 64, z: 0 },
  rotation: { x: 0, y: 0, z: 0 }
})

// Inventory management
client.on('inventory_transaction', (packet) => {
  // Handle inventory changes
})

// Server ping
const { ping } = require('bedrock-protocol')
ping({ host: 'server.com', port: 19132 }).then(console.log)
```

---

## 🐛 **Troubleshooting**

### Bot Not Working?
1. **Check server status** on Aternos dashboard
2. **Verify credentials** (username, server address)
4. **Check live logs** in dashboard for error details

### Common Issues:
- **"Movement ignored"** → Use `chat_keepalive` or `command_keepalive`
- **Connection refused** → Server may be offline
- **Authentication failed** → Set `OFFLINE_MODE=true` for cracked servers

---

## ⚖️ **Legal Alternatives**

Instead of violating Aternos ToS, consider these **bot-friendly** platforms:

### 🆓 **Free Options:**
- **Minehut** - Free, allows bots, good uptime
- **FreeMcServer.net** - Free, bot-friendly
- **Server.pro** - Free tier, automation allowed

### 🏆 **Recommended:**
- **Oracle Always Free** - 24/7, full control, truly free forever
- **AWS Free Tier** - 12 months free, professional hosting
- **Google Cloud Free** - $300 credit, enterprise-grade

### Migration Benefits:
- ✅ No policy violations
- ✅ Better performance
- ✅ More control
- ✅ No risk of account suspension

---

## 📦 **Deployment**

### Render.com (Current)

```yaml
# render.yaml
services:
  - type: web
    name: aternos-bot
    env: node
    buildCommand: npm install --production
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ gcc

# Copy package files
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["npm", "start"]
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aternos-bot
spec:
  replicas: 1
  selector:
    matchLabels:
      app: aternos-bot
  template:
    metadata:
      labels:
        app: aternos-bot
    spec:
      containers:
      - name: bot
        image: aternos-bot:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
```

---

## 🔧 **Development**

### Project Structure

```
Bot/
├── index.js              # Main bot logic (782 lines)
├── config.js             # Server configuration
├── monitor.html          # Dashboard UI
├── package.json          # Dependencies & scripts
├── fix-security.js       # Security fix tool
├── .npmrc               # npm configuration
├── Dockerfile           # Docker container
├── render.yaml          # Render.com deployment
├── SECURITY-FIX.md      # Security documentation
└── README.md            # This file
```

### Available Scripts

```bash
npm start              # Start bot
npm run dev           # Development mode
npm run crack         # Crack server preset
npm run premium       # Premium server preset
npm run fix-security  # Fix security issues
npm run clean-install # Clean npm install
```

### Contributing

1. Fork the repository
2. Create feature branch
3. Test thoroughly
4. Submit pull request

---

## ⚠️ **Warnings & Disclaimers**

### Aternos Policy Violations:
- **§5.2.c.1:** Using fake players (bots) ❌
- **§5.2.c.2:** Automatically reconnecting after disconnect ❌
- **§5.2.c.3:** Faking player activity ❌

### Consequences:
- Account suspension
- Server deletion
- Permanent ban
- Loss of all data

### Recommendation:
**Migrate to bot-friendly hosting** to avoid these risks entirely.

---

## 📞 **Support**

- 🐛 **Issues:** Create GitHub issue
- 💬 **Questions:** Check troubleshooting section
- 🔄 **Updates:** Watch repository for improvements

---

## 🆕 **Possible Extensions với bedrock-protocol**

### Chat Bot Features

```javascript
// Auto-responder
client.on('text', (packet) => {
  if (packet.message.includes('!help')) {
    client.queue('text', {
      type: 'chat',
      message: 'Available commands: !time, !players, !status'
    })
  }
})

// Command system
const commands = {
  '!time': () => new Date().toLocaleString(),
  '!players': () => `Players online: ${server.players.length}`,
  '!status': () => 'Bot is running!'
}
```

### Advanced Monitoring

```javascript
// Player tracking
client.on('add_player', (packet) => {
  console.log(`Player joined: ${packet.username}`)
})

// Block changes
client.on('update_block', (packet) => {
  console.log(`Block changed at ${packet.coordinates}`)
})

// Inventory monitoring
client.on('inventory_transaction', (packet) => {
  // Track item movements
})
```

### Server Management

```javascript
// Auto-restart on crash
client.on('disconnect', (reason) => {
  console.log(`Disconnected: ${reason}`)
  setTimeout(() => reconnect(), 5000)
})

// Performance monitoring
setInterval(() => {
  const stats = client.getStats()
  console.log(`Ping: ${stats.ping}ms, Packets: ${stats.packets}`)
}, 30000)
```

---

## 📄 **License**

MIT License - This project is for educational purposes only. Use at your own risk.

**The developers are not responsible for any account suspensions, bans, or data loss resulting from using this bot.**

---

## 🔗 **Links & Resources**

- **bedrock-protocol:** <https://www.npmjs.com/package/bedrock-protocol>
- **PrismarineJS:** <https://github.com/PrismarineJS>
- **Minecraft Protocol Docs:** <https://prismarinejs.github.io/minecraft-data/>
- **Better Stack Monitoring:** <https://betterstack.com>
- **Oracle Always Free:** <https://www.oracle.com/cloud/free/>

---

## ⭐ Star this repo if it helped you! ⭐