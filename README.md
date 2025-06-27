# 🤖 Aternos Bedrock Keep-Alive Bot

Bot tự động giữ server Aternos Bedrock online 24/7 với monitoring Better Stack.

## 📋 Thông Tin Server

- **Server:** Meo_MC403-IFBX.aternos.me:33122
- **Type:** Bedrock Edition  
- **Version:** 1.21.71.01
- **Aternos Link:** [add.aternos.org/Meo_MC403-IFBX](https://add.aternos.org/Meo_MC403-IFBX)

## 🚀 Setup trên Replit

### Bước 1: Tạo Repl mới
1. Truy cập [replit.com](https://replit.com)
2. Click **"Create Repl"** → Chọn **"Node.js"**
3. Đặt tên: `aternos-bedrock-keepalive`
4. Upload tất cả files trong thư mục này

### Bước 2: Cài đặt Dependencies
```bash
npm install
```

### Bước 3: Setup Better Stack (Tùy chọn)
1. Đăng ký tài khoản [Better Stack](https://betterstack.com)
2. Tạo heartbeat monitor mới
3. Copy heartbeat URL
4. Trong Replit, vào **Secrets** tab và thêm:
   - `BETTER_STACK_HEARTBEAT`: URL heartbeat của bạn
   - `BETTER_STACK_ENABLED`: `true`
   - `BETTER_STACK_API_KEY`: API key (nếu muốn alerts)

### Bước 4: Chạy Bot
```bash
npm start
```

### ⚠️ **GẶP LỖI AUTHENTICATION?**
Nếu thấy lỗi Microsoft authentication, server của bạn là **crack mode**:

**Quick Fix:**
1. Mở file `config.js`
2. Tìm dòng: `// useCrackServerPreset();`
3. Bỏ `//` để thành: `useCrackServerPreset();`
4. Save và restart bot

**Hoặc đọc chi tiết: `SETUP_GUIDE.md`**

### 🛡️ **GẶP LỖI ANTI-AFK BigInt?**
Nếu thấy lỗi "Cannot mix BigInt and other types":

**Quick Fix:**
- Bot tự động dùng **Simple Method** (safest)
- Hoặc thay đổi qua Dashboard: `/dashboard` → Anti-AFK Configuration
- **Đọc chi tiết: `ANTI_AFK_FIX.md`**

### Bước 5: Enable Always-On
1. Upgrade Replit lên **Hacker Plan** ($7/tháng)
2. Hoặc enable **Always-On** cho repl này ($2/tháng)
3. Vào Settings → Bật **"Always On"**

## 📊 Dashboard & Monitoring

### Web Dashboard
- **URL:** `https://your-repl-name.username.repl.co/dashboard`
- **Health Check:** `https://your-repl-name.username.repl.co/health`
- **Raw Stats:** `https://your-repl-name.username.repl.co/stats`

### API Endpoints
```
GET /          - Bot status overview
GET /health    - Health check cho Better Stack
GET /restart   - Manual restart bot
GET /stats     - Detailed statistics  
GET /dashboard - Web dashboard
```

## ⚙️ Tính Năng

### 🤖 Bot Functions
- ✅ Tự động connect tới Bedrock server
- ✅ Anti-AFK system (movement mỗi 25s)
- ✅ Auto-reconnect với exponential backoff
- ✅ Scheduled restart mỗi 6 tiếng
- ✅ Error handling & logging

### 📊 Monitoring
- ✅ Real-time web dashboard
- ✅ Better Stack integration
- ✅ Health checks
- ✅ Packet statistics
- ✅ Uptime tracking

### 🔧 Configuration
```javascript
// Trong index.js, bạn có thể chỉnh:
const SERVER_CONFIG = {
  host: 'Meo_MC403-IFBX.aternos.me',
  port: 33122,
  username: `KeepBot_${Math.floor(Math.random() * 999)}`,
  version: '1.21.71',
  maxReconnectAttempts: 10
};
```

## 💡 Better Stack Setup Chi Tiết

### 1. Tạo Heartbeat Monitor
```
Monitor Type: Heartbeat
URL: https://your-repl.username.repl.co/health
Frequency: Every 1 minute
Timeout: 30 seconds
```

### 2. Environment Variables
```bash
BETTER_STACK_HEARTBEAT=https://betterstack.com/api/v1/heartbeat/your-key
BETTER_STACK_ENABLED=true
BETTER_STACK_API_KEY=your-api-key-here
```

### 3. Alerts Setup
Bot sẽ tự động gửi alerts khi:
- ❌ Bot disconnect
- ⚠️ Nhiều reconnect attempts
- 🔄 Manual restart
- 💥 Critical errors

## 🛠️ Troubleshooting

### Bot không connect được?
1. Check server Aternos có online không
2. Verify IP/port trong `SERVER_CONFIG`
3. Check Repl console logs
4. Restart manual qua `/restart` endpoint

### Better Stack không hoạt động?
1. Verify heartbeat URL trong Secrets
2. Check `BETTER_STACK_ENABLED=true`
3. Test health endpoint: `/health`

### Bot bị AFK kick?
- Anti-AFK system tự động chạy mỗi 25s
- Nếu vẫn bị kick, giảm interval xuống 20s

## 📈 Performance Tips

1. **Memory Usage:** Bot sử dụng ~50-100MB RAM
2. **CPU Usage:** Rất thấp, chỉ spike khi send packets
3. **Network:** ~1-2KB/minute traffic
4. **Uptime:** 99.9% với Always-On enabled

## 🔐 Security

- ✅ Không lưu passwords/tokens sensitive
- ✅ Chỉ connect tới server được config
- ✅ Error handling không leak info
- ✅ Rate limiting cho API endpoints

## 📞 Support

Nếu có vấn đề:
1. Check console logs trong Replit
2. Test health endpoint
3. Verify server Aternos status
4. Check Better Stack dashboard

## 📜 License

MIT License - Free to use và modify!

---

**🎉 Enjoy your 24/7 Bedrock server!** 🎮 