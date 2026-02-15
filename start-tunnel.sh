#!/bin/bash

# Max-Dash + Ngrok Startup Script
# Make sure you have your ngrok authtoken configured first!

cd /Users/myindsound/Documents/discord/max-dash2

echo "🚀 Starting Max-Dash..."

# Start max-dash
pm2 restart max-dash

# Check if ngrok has authtoken
if ! ngrok config check 2>/dev/null; then
    echo "⚠️  Ngrok not configured! Run:"
    echo "   ngrok config add-authtoken YOUR_TOKEN"
    echo ""
    echo "Get your token from: https://dashboard.ngrok.com/auth"
    exit 1
fi

# Start ngrok
echo "🌐 Starting ngrok tunnel..."
ngrok start --all &

sleep 3

echo ""
echo "✅ Max-Dash is running!"
echo ""
echo "📡 Local: http://localhost:3000"
echo "🌐 Check ngrok for your public URL:"
echo "   curl localhost:4040/api/tunnels"
echo ""
echo "Or visit: http://localhost:4040 to see tunnels"
