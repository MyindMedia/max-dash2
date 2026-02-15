# Max-Dash | OpenClaw Mission Control

A Tony Stark-inspired real-time dashboard for monitoring and managing OpenClaw agents and processes.

![Max-Dash Loading Screen](https://via.placeholder.com/800x400/0a0a0f/00ffff?text=MAX-DASH)

## ✨ Features

- 🌀 **Tony Stark Loading Screen** - Arc reactor animation with MAX-DASH glow
- 🖥️ **System Overview** - CPU, memory, disk usage, uptime, load averages
- 🤖 **OpenClaw Status** - Version, gateway state, quick actions
- 📡 **Active Sessions** - View all agent sessions with token tracking
- ⚡ **PM2 Processes** - Monitor and manage Node.js processes
- ⏰ **Cron Jobs** - Enable/disable/run scheduled jobs
- 📁 **File Manager** - Upload/download files, browse workspace
- 📜 **Live Logs** - Real-time log viewing with filtering
- 🎮 **Quick Actions** - Restart gateway, open terminal, notifications
- 📊 **Activity Feed** - Track all dashboard activities

## 🚀 Remote Access Setup (ngrok)

Your MacBook runs Max-Dash locally. Use ngrok to expose it to the internet.

### Step 1: Configure ngrok

```bash
# Add your ngrok authtoken (get it from https://dashboard.ngrok.com/auth)
ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
```

### Step 2: Start Max-Dash with Tunnel

```bash
cd /Users/myindsound/Documents/discord/max-dash2

# Option A: Use the startup script
./start.sh

# Option B: Start manually
pm2 start ecosystem.config.js
```

### Step 3: Get Your Public URL

```bash
./get-url.sh
```

This will output something like:
```
🌐 Public URL: https://abcd-1234.ngrok-free.app
```

Open that URL on any device to access Max-Dash remotely!

### Alternative: Start Services Separately

```bash
# Start just the dashboard
pm2 start server.js --name max-dash

# Start ngrok tunnel
ngrok start --all --config=/Users/myindsound/.ngrok2/max-dash.yml

# Check tunnel URL
curl localhost:4040/api/tunnels
```

## 🔧 Management Commands

```bash
# View all services
pm2 status

# View logs
pm2 logs max-dash
pm2 logs ngrok

# Restart both
pm2 restart max-dash && pm2 restart ngrok

# Stop everything
pm2 stop all

# Auto-start on boot (already configured)
pm2 save
```

## 🌐 URLs

- **Local**: http://localhost:3000
- **Remote**: Check ngrok URL (changes each restart)
- **Tunnel Status**: http://localhost:4040

## 📁 Project Structure

```
max-dash2/
├── server.js              # Express + Socket.io server
├── ecosystem.config.js     # PM2 config (dashboard + ngrok)
├── start.sh              # Startup script
├── get-url.sh            # Get public URL
├── public/
│   ├── index.html        # Dashboard UI with Tony Stark loading
│   ├── css/
│   │   └── styles.css    # Dark purple theme
│   └── js/
│       └── app.js        # Real-time application logic
├── Dockerfile            # Container deployment
├── netlify.toml         # Netlify static deploy
└── package.json
```

## 🎨 Design

- **Theme**: Dark purple with cyan accents
- **Font**: System fonts with monospace for code
- **Animations**: Smooth transitions, glowing effects
- **Loading Screen**: Arc reactor animation with MAX-DASH hologram

## 🔗 Links

- **GitHub**: https://github.com/MyindMedia/max-dash2
- **Local**: http://localhost:3000
- **ngrok Dashboard**: http://localhost:4040

## 📝 Notes

- WebSocket connection required for real-time updates
- ngrok URL changes each time you restart the tunnel
- For a permanent URL, upgrade to ngrok paid plan or use a reverse proxy with DNS
- OpenClaw gateway must be running on your MacBook for full functionality
