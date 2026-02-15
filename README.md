# OpenClaw Mission Control Dashboard

A comprehensive real-time dashboard for monitoring and managing OpenClaw agents and processes.

## Features

- **System Overview**: CPU, memory, disk usage, uptime
- **OpenClaw Status**: Version, gateway state, quick actions
- **Active Sessions**: View all agent sessions with tokens, models, channels
- **PM2 Processes**: Monitor and manage Node.js processes
- **Cron Jobs**: Enable/disable/run scheduled jobs
- **File Manager**: Upload/download files, browse workspace
- **Live Logs**: Real-time log viewing with filtering
- **Quick Actions**: Restart gateway, open terminal, test notifications
- **Activity Feed**: Track all dashboard activities

## Access

Open your browser to: **http://localhost:3000**

## Management

```bash
# View logs
pm2 logs mission-control

# Restart
pm2 restart mission-control

# Stop
pm2 stop mission-control

# Status
pm2 status mission-control
```

## Auto-Start

PM2 is configured to auto-start on boot. If needed:
```bash
# Setup startup script
pm2 startup

# Save current state
pm2 save
```

## Files

- `/Users/myindsound/Documents/discord/mission-control/`
  - `server.js` - Main server
  - `public/` - Dashboard UI
  - `uploads/` - Uploaded files
