#!/bin/bash

# setup-render-betterstack.sh - Quick setup for Better Stack với URL Render cụ thể

echo "🚀 Setup Better Stack cho Render App"
echo "===================================="
echo ""

RENDER_URL="https://bot-aternos-6ltq.onrender.com"
API_KEY="qSKMsyh2kvpkE7azw334VFrF"

echo "🌐 Render URL: $RENDER_URL"
echo "🔑 API Key: ${API_KEY:0:8}...${API_KEY: -4}"
echo ""

# Test health endpoint
echo "🏥 Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" "$RENDER_URL/health" -o /tmp/health_response.json)

if [ "$HEALTH_RESPONSE" -eq 200 ]; then
    echo "✅ Health check passed!"
    cat /tmp/health_response.json | jq . 2>/dev/null || cat /tmp/health_response.json
else
    echo "⚠️ Health check failed with code: $HEALTH_RESPONSE"
fi

echo ""

# Test dashboard
echo "🎮 Testing dashboard..."
DASHBOARD_RESPONSE=$(curl -s -w "%{http_code}" "$RENDER_URL/dashboard" -o /dev/null)

if [ "$DASHBOARD_RESPONSE" -eq 200 ]; then
    echo "✅ Dashboard accessible!"
else
    echo "⚠️ Dashboard test failed with code: $DASHBOARD_RESPONSE"
fi

echo ""

# Setup Better Stack monitor
echo "📊 Setting up Better Stack monitor..."

# Create monitor using corrected API format
MONITOR_DATA='{
  "monitor_type": "expected_status_code",
  "url": "'$RENDER_URL'/health",
  "expected_status_codes": [200],
  "check_frequency": 60,
  "request_timeout": 30,
  "recovery_period": 60,
  "confirmation_period": 60,
  "pronounceable_name": "aternos-bedrock-bot"
}'

echo "$MONITOR_DATA" > /tmp/monitor_data.json

MONITOR_RESPONSE=$(curl -s -w "%{http_code}" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d @/tmp/monitor_data.json \
  "https://uptime.betterstack.com/api/v2/monitors" \
  -o /tmp/monitor_response.json)

echo "Monitor API Response Code: $MONITOR_RESPONSE"

if [ "$MONITOR_RESPONSE" -eq 201 ] || [ "$MONITOR_RESPONSE" -eq 200 ]; then
    echo "✅ Better Stack monitor created successfully!"
    echo ""
    echo "📋 Monitor Details:"
    cat /tmp/monitor_response.json | jq . 2>/dev/null || cat /tmp/monitor_response.json
    echo ""
elif [ "$MONITOR_RESPONSE" -eq 422 ]; then
    echo "⚠️ Monitor validation error (might already exist):"
    cat /tmp/monitor_response.json | jq . 2>/dev/null || cat /tmp/monitor_response.json
    echo ""
else
    echo "❌ Monitor creation failed:"
    cat /tmp/monitor_response.json | jq . 2>/dev/null || cat /tmp/monitor_response.json
    echo ""
fi

# Final instructions
echo "🎯 Next Steps:"
echo ""
echo "1. 📊 Access Better Stack Dashboard:"
echo "   https://betterstack.com/team/YOUR_TEAM_ID/monitors"
echo ""
echo "2. 🎮 Bot Dashboard:"
echo "   $RENDER_URL/dashboard"
echo ""
echo "3. ❤️ Health Check:"
echo "   $RENDER_URL/health"
echo ""
echo "4. 📈 Bot Statistics:"
echo "   $RENDER_URL/stats"
echo ""
echo "5. 🔧 Manual Control:"
echo "   $RENDER_URL/restart"
echo ""

if [ "$MONITOR_RESPONSE" -eq 201 ] || [ "$MONITOR_RESPONSE" -eq 200 ]; then
    echo "✅ Setup hoàn tất! Better Stack đang monitor bot của bạn!"
else
    echo "⚠️ Setup có vấn đề. Kiểm tra Better Stack dashboard manually."
fi

echo ""
echo "📋 Current Bot Status:"
curl -s "$RENDER_URL/" | jq . 2>/dev/null || curl -s "$RENDER_URL/"

# Cleanup
rm -f /tmp/health_response.json /tmp/monitor_data.json /tmp/monitor_response.json 