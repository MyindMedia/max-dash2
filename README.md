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

## 🚀 Deployment Options

### Option 1: Railway (Recommended - Full App)

Railway supports WebSockets and long-running Node.js processes.

1. **Push to GitHub**
   ```bash
   cd /Users/myindsound/Documents/discord/max-dash2
   git add -A
   git commit -m "Ready for deployment"
   git push
   ```

2. **Deploy on Railway**
   - Go to https://railway.app
   - Connect your GitHub repository
   - Set start command: `node server.js`
   - Set port: `3000`

3. **Your URL will be**: `https://max-dash.up.railway.app`

### Option 2: Render (Free Tier Available)

1. **Push to GitHub** (already done ✓)

2. **Deploy on Render**
   - Go to https://render.com
   - Create new Web Service
   - Connect your repository
   - Build Command: `(empty)`
   - Start Command: `node server.js`
   - Plan: Free

3. **Your URL will be**: `https://max-dash.onrender.com`

### Option 3: Netlify (Frontend Only)

Netlify can only deploy the static frontend. System monitoring won't work.

1. **Deploy frontend only**
   ```bash
   cd public
   netlify deploy --prod --dir=.
   ```

2. **Connect to local server** - Set API endpoint to your server URL

## 🏠 Local Development

```bash
cd /Users/myindsound/Documents/discord/max-dash2

# Install dependencies
npm install

# Start server
npm start

# Open http://localhost:3000
```

## 📁 Project Structure

```
max-dash2/
├── server.js          # Express + Socket.io server
├── public/
│   ├── index.html     # Dashboard UI with Tony Stark loading
│   ├── css/
│   │   └── styles.css # Dark purple theme
│   └── js/
│       └── app.js     # Real-time application logic
├── Dockerfile         # Container deployment
├── netlify.toml      # Netlify static deploy
└── package.json
```

## 🔧 PM2 Management (Local)

```bash
# Start with PM2
pm2 start server.js --name max-dash

# View logs
pm2 logs max-dash

# Restart
pm2 restart max-dash

# Auto-start on boot
pm2 startup
pm2 save
```

## 🎨 Design

- **Theme**: Dark purple with cyan accents
- **Font**: System fonts with monospace for code
- **Animations**: Smooth transitions, glowing effects
- **Loading Screen**: Arc reactor animation with MAX-DASH hologram

## 🔗 Links

- **GitHub**: https://github.com/MyindMedia/max-dash2
- **Local**: http://localhost:3000

## 📝 Notes

- WebSocket connection required for real-time updates
- System monitoring only works when running locally or on a Linux server
- PM2 management only available when running on the same machine as PM2
