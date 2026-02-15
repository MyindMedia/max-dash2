#!/bin/bash

# Max-Dash Startup Script with Ngrok Tunnel
# This starts both the dashboard and exposes it to the internet

DASH_DIR="/Users/myindsound/Documents/discord/max-dash2"
NGROK_CONFIG="/Users/myindsound/.ngrok2/max-dash.yml"

# Create ngrok config directory
mkdir -p "$(dirname "$NGROK_CONFIG")"

# Create ngrok config
cat > "$NGROK_CONFIG" << 'EOF'
authtoken: YOUR_NGROK_AUTHTOKEN
tunnels:
  max-dash:
    addr: 3000
    proto: http
    host_header: localhost
  max-dash-websocket:
    addr: 3000
    proto: tcp
    inspect: false
EOF

echo "📝 Ngrok config created at: $NGROK_CONFIG"
echo ""
echo "⚠️  IMPORTANT: You need to add your ngrok authtoken!"
echo "   Get it from: https://dashboard.ngrok.com/auth"
echo "   Then run: ngrok config add-authtoken YOUR_TOKEN"
echo ""
echo "🚀 Starting Max-Dash with ngrok tunnel..."

# Start dashboard in background
cd "$DASH_DIR"
pm2 start server.js --name max-dash

# Wait a moment then start ngrok
sleep 2

# Start ngrok tunnel
ngrok start --all --config "$NGROK_CONFIG" &

echo ""
echo "✅ Max-Dash is starting..."
echo "📡 Local URL: http://localhost:3000"
echo "🌐 Remote URL: Check ngrok dashboard or wait for tunnel to initialize"
echo ""
echo "To see your public URL, run: curl localhost:4040/api/tunnels"
