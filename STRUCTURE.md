# 📁 Project Structure

## 🏗️ **Clean Architecture Overview**

```
/
├── 📁 src/                     # Source code (MVC Architecture)
│   ├── 📁 core/               # Core business logic
│   │   ├── BotManager.js      # Multi-bot management system
│   │   ├── Bot.js             # Individual bot logic
│   │   ├── Logger.js          # Enhanced logging system
│   │   └── BetterStackMonitor.js # Better Stack integration
│   ├── 📁 api/                # API layer
│   │   ├── server.js          # Express server setup
│   │   └── 📁 routes/         # API endpoints
│   │       ├── bots.js        # Bot management endpoints
│   │       ├── logs.js        # Logging endpoints
│   │       ├── health.js      # Health check endpoints
│   │       └── betterstack.js # Better Stack endpoints
│   └── 📁 config/             # Configuration management
│       └── default.js         # Environment-based config
├── 📁 public/                 # Static files
│   └── dashboard.html         # Multi-bot dashboard
├── 📁 data/                   # Persistent data
│   ├── bots.json             # Bot configurations
│   └── betterstack-config.json # Better Stack settings
├── 📁 logs/                   # Log files
│   └── 📁 bots/              # Per-bot log files
├── 📁 backup-old-system/      # Legacy system backup
├── 📄 index-new.js           # Main entry point
├── 📄 index.js               # Legacy entry point
├── 📄 .env                   # Environment variables
├── 📄 package.json           # Dependencies and scripts
└── 📄 README.md              # Documentation
```

---

## 🎯 **Key Components**

### **🤖 Core System**
- **BotManager**: Central orchestrator for multiple bot instances
- **Bot**: Individual bot with connection, anti-AFK, and monitoring
- **Logger**: Per-bot file-based logging with rotation
- **BetterStackMonitor**: Professional monitoring integration

### **🌐 API Layer**
- **RESTful endpoints** for bot management
- **Real-time log streaming** via Server-Sent Events
- **Health monitoring** and system statistics
- **Better Stack integration** endpoints

### **🎨 Frontend**
- **Modern responsive dashboard** with dark theme
- **Real-time bot monitoring** and control
- **Live log streaming** from all bots
- **Bot creation and editing** interface

### **⚙️ Configuration**
- **Environment-based config** via .env file
- **Per-bot configurations** stored in JSON
- **Auto-validation** and error handling
- **Default values** for new bots

---

## 🚀 **Usage**

### **Start System**
```bash
npm start                    # Start multi-bot system
npm run dev                  # Development with auto-reload
npm run legacy               # Run legacy single-bot system
```

### **Management**
```bash
npm run logs                 # View all bot logs
npm run health               # Check system health
npm run fix-security         # Fix security vulnerabilities
```

### **Dashboard**
- **URL**: http://localhost:3000
- **Features**: Create, edit, start, stop, monitor bots
- **Real-time**: Live status updates and log streaming

---

## 📊 **Data Flow**

```
.env → Config → BotManager → Multiple Bots → Dashboard
  ↓        ↓         ↓           ↓            ↓
Better   Default   Bot       Per-bot      Real-time
Stack    Values   Storage    Logs         Updates
```

---

## 🔧 **Development**

### **Adding New Features**
1. **Core Logic**: Add to `src/core/`
2. **API Endpoints**: Add to `src/api/routes/`
3. **Frontend**: Update `public/dashboard.html`
4. **Configuration**: Update `src/config/default.js`

### **File Organization**
- **Single Responsibility**: Each file has one clear purpose
- **Modular Design**: Easy to test and maintain
- **Clean Separation**: Core, API, and UI layers separated
- **Environment Config**: All settings via .env file

---

## 🎉 **Benefits**

✅ **Scalable**: Support unlimited bots  
✅ **Maintainable**: Clean MVC architecture  
✅ **Configurable**: Environment-based setup  
✅ **Monitorable**: Professional logging and monitoring  
✅ **User-friendly**: Modern dashboard interface  
✅ **Production-ready**: Error handling and validation  

---

**🚀 Ready for production deployment and easy to extend!**
