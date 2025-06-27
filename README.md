# 🤖 Aternos Bedrock Keep-Alive Bot

## ⚠️ **IMPORTANT DISCLAIMER**
This bot **VIOLATES Aternos Terms of Service** and may result in account suspension or permanent ban. Use at your own risk.

**Recommended:** Migrate to bot-friendly hosting platforms like Oracle Always Free, Minehut, or FreeMcServer.net.

---

## 🔍 **Critical Bot Limitation Discovery**

### ❌ **The Movement Problem**
Bots that join Minecraft Bedrock servers **without manual player interaction** enter a "ghost player" state where:
- Movement packets are **ignored by the server**
- Anti-AFK movement becomes **completely ineffective**
- Bot appears online but is treated as inactive
- Server will still kick the bot for "inactivity"

### ✅ **Effective Solutions Implemented**

Our new anti-AFK system uses **player interactions** instead of movement:

| Method | Effectiveness | Description |
|--------|---------------|-------------|
| `chat_keepalive` | 🟢 **High** | Sends chat messages periodically |
| `command_keepalive` | 🟢 **High** | Executes server commands |
| `player_action` | 🟡 **Medium** | Simulates block interactions |
| `inventory_action` | 🟡 **Medium** | Opens/closes inventory |
| `realistic_walk` | 🔴 **Low** | Movement (may be ignored) |
| `ping` | 🟡 **Basic** | Socket keepalive only |

---

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
```bash
# Required
export BOT_USERNAME="YourBotName"
export SERVER_HOST="your-server.aternos.me"
export SERVER_PORT="33122"

# Optional
export ANTI_AFK_METHOD="chat_keepalive"
export ANTI_AFK_INTERVAL="45000"
export OFFLINE_MODE="true"
```

### Run
```bash
npm start
# or
node index.js
```

---

## 🎛️ **Configuration**

### Anti-AFK Methods
```javascript
// Available methods (in order of effectiveness)
const methods = [
  "chat_keepalive",      // 🟢 Sends random chat messages
  "command_keepalive",   // 🟢 Executes commands like /help
  "player_action",       // 🟡 Block interaction simulation
  "inventory_action",    // 🟡 Inventory open/close
  "realistic_walk",      // 🔴 Movement (limited effectiveness)
  "look_around",         // 🔴 Head rotation (limited)
  "ping",                // 🟡 Connection keepalive
  "simple"               // 🟡 Fallback method
];
```

### Environment Variables
```bash
# Server Settings
SERVER_HOST=your-server.aternos.me
SERVER_PORT=33122
BOT_USERNAME=KeepBot_403
OFFLINE_MODE=true

# Anti-AFK Settings  
ANTI_AFK_METHOD=chat_keepalive
ANTI_AFK_INTERVAL=45000
FALLBACK_ENABLED=true

# Monitoring
BETTER_STACK_HEARTBEAT_URL=https://betterstack.com/api/v1/heartbeat/YOUR_KEY
```

---

## 📊 **Dashboard Features**

Access dashboard at: `http://localhost:3000/dashboard`

### Features:
- 🔴🟢 **Real-time bot status**
- 📋 **Live server logs** (SSE stream)
- 📈 **Statistics tracking**
- ⚙️ **Method switching** via API
- 💗 **Better Stack setup**
- ⚠️ **Compliance warnings**

### API Endpoints:
```bash
GET  /                    # Bot status
GET  /health             # Health check
GET  /stats              # Detailed statistics
GET  /restart            # Restart bot
GET  /compliance         # Policy violation info
GET  /change-antiafk/:method  # Switch anti-AFK method
POST /setup-betterstack  # Configure monitoring
```

---

## 🐛 **Troubleshooting**

### Bot Not Working?
1. **Check server status** on Aternos dashboard
2. **Verify credentials** (username, server address)
3. **Try different anti-AFK method**:
   ```bash
   curl http://localhost:3000/change-antiafk/chat_keepalive
   ```
4. **Check live logs** in dashboard for error details

### Common Issues:
- **"Movement ignored"** → Use `chat_keepalive` or `command_keepalive`
- **Connection refused** → Server may be offline
- **Authentication failed** → Set `OFFLINE_MODE=true` for cracked servers
- **Spam detection** → Increase `ANTI_AFK_INTERVAL`

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
    buildCommand: npm install
    startCommand: node index.js
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]
```

---

## 🔧 **Development**

### Project Structure:
```
Bot/
├── index.js          # Main bot logic
├── config.js         # Configuration
├── monitor.html      # Dashboard UI
├── package.json      # Dependencies
└── README.md         # This file
```

### Contributing:
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

## 📄 **License**

This project is for educational purposes only. Use at your own risk.

**The developers are not responsible for any account suspensions, bans, or data loss resulting from using this bot.** 