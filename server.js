const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const si = require('systeminformation');
const cron = require('node-cron');
const cors = require('cors');
const compression = require('compression');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// Utility functions
async function getOpenClawStatus() {
  return new Promise((resolve) => {
    exec('openclaw --version 2>/dev/null || echo "not found"', (err, stdout) => {
      const version = stdout.trim() || 'Unknown';
      exec('openclaw gateway status 2>/dev/null || echo "stopped"', (err2, status) => {
        resolve({
          version,
          gateway: status.includes('running') ? 'running' : 'stopped',
          rawStatus: status.trim()
        });
      });
    });
  });
}

async function getPM2Processes() {
  return new Promise((resolve) => {
    exec('pm2 jlist 2>/dev/null', (err, stdout) => {
      try {
        const processes = JSON.parse(stdout || '[]');
        resolve(processures || []);
      } catch {
        resolve([]);
      }
    });
  });
}

async function getOpenClawSessions() {
  return new Promise((resolve) => {
    exec('openclaw sessions list 2>/dev/null', (err, stdout) => {
      try {
        const sessions = JSON.parse(stdout || '[]');
        resolve(sessions);
      } catch {
        // Fallback: try to parse human-readable output
        const lines = stdout.split('\n').filter(l => l.trim());
        resolve(lines.map(l => ({ name: l.trim(), status: 'unknown' })));
      }
    });
  });
}

async function getCronJobs() {
  return new Promise((resolve) => {
    exec('openclaw cron list 2>/dev/null', (err, stdout) => {
      try {
        const jobs = JSON.parse(stdout || '[]');
        resolve(jobs);
      } catch {
        resolve([]);
      }
    });
  });
}

async function getSystemInfo() {
  const [cpu, mem, disk, uptime] = await Promise.all([
    si.cpu(),
    si.mem(),
    si.fsSize(),
    si.time()
  ]);
  
  return {
    cpu: {
      cores: cpu.cores,
      model: cpu.brand,
      speed: cpu.speed
    },
    memory: {
      total: mem.total,
      used: mem.used,
      free: mem.free
    },
    disk: {
      total: disk[0]?.size || 0,
      used: disk[0]?.used || 0,
      free: disk[0]?.available || 0
    },
    uptime: uptime.uptime,
    loadavg: loadavg()
  };
}

function loadavg() {
  const os = require('os');
  const load = os.loadavg();
  return {
    '1min': load[0],
    '5min': load[1],
    '15min': load[2]
  };
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  let result = [];
  if (days > 0) result.push(`${days}d`);
  if (hours > 0) result.push(`${hours}h`);
  if (mins > 0) result.push(`${mins}m`);
  result.push(`${secs}s`);
  
  return result.join(' ');
}

// API Routes
app.get('/api/status', async (req, res) => {
  try {
    const [system, openclaw] = await Promise.all([
      getSystemInfo(),
      getOpenClawStatus()
    ]);
    res.json({ system, openclaw });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/processes', async (req, res) => {
  try {
    const [pm2, sessions] = await Promise.all([
      getPM2Processes(),
      getOpenClawSessions()
    ]);
    res.json({ pm2, sessions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/cron', async (req, res) => {
  try {
    const jobs = await getCronJobs();
    res.json({ jobs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/files', (req, res) => {
  const basePath = req.query.path || process.cwd();
  
  fs.readdir(basePath, { withFileTypes: true }, (err, entries) => {
    if (err) {
      // Try workspace as fallback
      fs.readdir('/Users/myindsound/.openclaw/workspace', { withFileTypes: true }, (err2, entries2) => {
        if (err2) return res.status(500).json({ error: 'Cannot read directory' });
        
        const files = entries2.map(e => ({
          name: e.name,
          isDirectory: e.isDirectory(),
          path: `/Users/myindsound/.openclaw/workspace/${e.name}`
        }));
        res.json({ files, currentPath: '/Users/myindsound/.openclaw/workspace' });
      });
      return;
    }
    
    const files = entries.map(e => ({
      name: e.name,
      isDirectory: e.isDirectory(),
      path: path.join(basePath, e.name)
    }));
    res.json({ files, currentPath: basePath });
  });
});

app.post('/api/files/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ 
    success: true, 
    file: {
      name: req.file.originalname,
      path: req.file.path,
      size: req.file.size
    }
  });
});

app.get('/api/files/download/*', (req, res) => {
  const filePath = decodeURIComponent(req.path.replace('/api/files/download/', ''));
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  res.download(filePath);
});

app.post('/api/pm2/restart/:name', (req, res) => {
  exec(`pm2 restart ${req.params.name}`, (err, stdout) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, output: stdout });
  });
});

app.post('/api/pm2/stop/:name', (req, res) => {
  exec(`pm2 stop ${req.params.name}`, (err, stdout) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, output: stdout });
  });
});

app.post('/api/cron/enable/:id', (req, res) => {
  exec(`openclaw cron enable ${req.params.id}`, (err, stdout) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.post('/api/cron/disable/:id', (req, res) => {
  exec(`openclaw cron disable ${req.params.id}`, (err, stdout) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.post('/api/cron/run/:id', (req, res) => {
  exec(`openclaw cron run ${req.params.id}`, (err, stdout) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.get('/api/logs', (req, res) => {
  const lines = parseInt(req.query.lines) || 100;
  exec(`openclaw logs --local-time --lines ${lines} 2>/dev/null | tail -${lines}`, (err, stdout) => {
    const logs = stdout.split('\n').filter(l => l.trim());
    res.json({ logs: logs.slice(-lines) });
  });
});

app.get('/api/logs/session/:sessionKey', (req, res) => {
  exec(`openclaw sessions history ${req.params.sessionKey} 2>/dev/null`, (err, stdout) => {
    try {
      const history = JSON.parse(stdout || '[]');
      res.json({ history });
    } catch {
      res.json({ history: [], raw: stdout });
    }
  });
});

// Quick action endpoints
app.post('/api/gateway/restart', (req, res) => {
  exec('openclaw gateway restart', (err, stdout) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: 'Gateway restarting...' });
  });
});

app.post('/api/session/send/:sessionKey', (req, res) => {
  const { message } = req.body;
  exec(`echo '${message.replace(/'/g, "\\'")}' | openclaw sessions send ${req.params.sessionKey}`, (err, stdout) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Dashboard connected');
  
  // Send initial data
  Promise.all([
    getSystemInfo(),
    getOpenClawStatus(),
    getPM2Processes(),
    getOpenClawSessions()
  ]).then(([system, openclaw, pm2, sessions]) => {
    socket.emit('status', { system, openclaw });
    socket.emit('processes', { pm2, sessions });
  });
  
  // Handle real-time update requests
  socket.on('requestStatus', async () => {
    const [system, openclaw] = await Promise.all([
      getSystemInfo(),
      getOpenClawStatus()
    ]);
    socket.emit('status', { system, openclaw });
  });
  
  socket.on('requestProcesses', async () => {
    const [pm2, sessions] = await Promise.all([
      getPM2Processes(),
      getOpenClawSessions()
    ]);
    socket.emit('processes', { pm2, sessions });
  });
  
  socket.on('disconnect', () => {
    console.log('Dashboard disconnected');
  });
});

// Real-time update interval (every 5 seconds)
setInterval(async () => {
  try {
    const [system, openclaw] = await Promise.all([
      getSystemInfo(),
      getOpenClawStatus()
    ]);
    io.emit('status', { system, openclaw });
  } catch (e) {
    console.error('Update error:', e);
  }
}, 5000);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Mission Control Dashboard running on http://localhost:${PORT}`);
});
