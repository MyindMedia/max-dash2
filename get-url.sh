#!/bin/bash

# Get the public ngrok URL
echo "🌐 Fetching Max-Dash public URL..."

# Wait for ngrok to initialize
sleep 3

# Try to get the URL from ngrok API
URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    tunnels = data.get('tunnels', [])
    for t in tunnels:
        if t.get('name', '').startswith('max-dash'):
            print(t.get('public_url', 'Not found'))
            break
    else:
        print('No tunnel found')
except:
    print('Error fetching URL')
" 2>/dev/null)

if [ -n "$URL" ] && [ "$URL" != "No tunnel found" ] && [ "$URL" != "Error fetching URL" ]; then
    echo ""
    echo "🎉 Max-Dash is live!"
    echo ""
    echo "🌐 Public URL: $URL"
    echo ""
    echo "📱 Open this URL in your browser to access Max-Dash remotely!"
else
    echo ""
    echo "⚠️  Could not fetch tunnel URL."
    echo "   Make sure ngrok is running and check: http://localhost:4040"
fi
