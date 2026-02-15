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

## 🚀 Deploy to Railway (Permanent URL)

### Option 1: Quick Deploy (Recommended)

1. **Click the button below:**

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new?template=https://github.com/MyindMedia/max-dash2)

2. **Or deploy manually:**
   - Go to https://railway.app
   - Click "New Project" → "Deploy from GitHub repo"
   - Select: `MyindMedia/max-dash2`
   - Configure:
     - **Root Directory:** `.`
     - **Start Command:** `node server.js`
     - **Port:** `3000`

3. **Done!** 🎉 Your URL will be something like:
   - `https://max-dash.up.railway.app`

### Option 2: Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway init
railway up
```

## 🔧 Configuration

### Environment Variables (Optional)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port to listen on | `3000` |
| `NODE_ENV` | Environment | `production` |

### Build Settings

```
Build Command: (leave empty)
Start Command: node server.js
Root Directory: .
```

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
├── server.js              # Express + Socket.io server
├── railway.json          # Railway deployment config
├── ecosystem.config.js    # PM2 config for local
├── public/
│   ├── index.html        # Dashboard UI with Tony Stark loading
│   ├── css/
│   │   └── styles.css   # Dark purple theme
│   └── js/
│       └── app.js       # Real-time application logic
├── Dockerfile            # Docker deployment
├── netlify.toml         # Netlify static deploy
└── package.json
```

## 🎨 Design

- **Theme**: Dark purple with cyan accents
- **Font**: System fonts with monospace for code
- **Animations**: Smooth transitions, glowing effects
- **Loading Screen**: Arc reactor animation with MAX-DASH hologram

## 📝 Notes

- WebSocket connection required for real-time updates
- System monitoring shows the server's stats (not your local Mac when deployed on Railway)
- For local Mac monitoring, use the ngrok tunnel setup instead

## 🔗 Links

- **GitHub**: https://github.com/MyindMedia/max-dash2
- **Local**: http://localhost:3000
- **Railway**: https://railway.app
