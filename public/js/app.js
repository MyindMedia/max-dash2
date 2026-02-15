// Mission Control Dashboard - Main Application
class MissionControl {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.currentPath = '/Users/myindsound/.openclaw/workspace';
    
    this.init();
  }

  init() {
    this.connectSocket();
    this.setupEventListeners();
    this.loadInitialData();
  }

  connectSocket() {
    this.socket = io({
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: this.maxReconnectAttempts
    });

    this.socket.on('connect', () => {
      this.updateConnectionStatus(true);
      this.addActivity('Connected to Mission Control', 'success');
    });

    this.socket.on('disconnect', () => {
      this.updateConnectionStatus(false);
      this.addActivity('Disconnected from server', 'error');
    });

    this.socket.on('status', (data) => {
      this.renderSystemStatus(data.system);
      this.renderOpenClawStatus(data.openclaw);
    });

    this.socket.on('processes', (data) => {
      this.renderPM2Processes(data.pm2);
      this.renderSessions(data.sessions);
    });

    this.socket.on('connect_error', (error) => {
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.updateConnectionStatus(false);
        this.showToast('Cannot connect to server. Please ensure the dashboard is running.', 'error');
      }
    });
  }

  updateConnectionStatus(connected) {
    const statusDot = document.getElementById('connectionStatus');
    const statusText = document.getElementById('connectionText');
    
    if (connected) {
      statusDot.className = 'status-dot online';
      statusText.textContent = 'Connected';
    } else {
      statusDot.className = 'status-dot offline';
      statusText.textContent = 'Disconnected';
    }
  }

  setupEventListeners() {
    // File upload
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');

    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = 'var(--purple-primary)';
    });
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.style.borderColor = 'var(--border-color)';
    });
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = 'var(--border-color)';
      this.handleFiles(e.dataTransfer.files);
    });
    fileInput.addEventListener('change', (e) => {
      this.handleFiles(e.target.files);
    });
  }

  handleFiles(files) {
    if (files.length === 0) return;

    Array.from(files).forEach(file => {
      const formData = new FormData();
      formData.append('file', file);

      fetch('/api/files/upload', {
        method: 'POST',
        body: formData
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          this.showToast(`Uploaded: ${file.name}`, 'success');
          this.loadFiles(this.currentPath);
        } else {
          this.showToast(`Failed to upload: ${file.name}`, 'error');
        }
      })
      .catch(err => {
        this.showToast(`Error uploading ${file.name}: ${err.message}`, 'error');
      });
    });
  }

  async loadInitialData() {
    await Promise.all([
      this.loadSystemStatus(),
      this.loadSessions(),
      this.loadCronJobs(),
      this.loadFiles(this.currentPath),
      this.fetchLogs()
    ]);
  }

  // System Status
  async loadSystemStatus() {
    try {
      const response = await fetch('/api/status');
      const data = await response.json();
      this.renderSystemStatus(data.system);
      this.renderOpenClawStatus(data.openclaw);
    } catch (error) {
      console.error('Failed to load system status:', error);
    }
  }

  renderSystemStatus(system) {
    if (!system) return;

    const statsContainer = document.getElementById('systemStats');
    const cpu = system.cpu?.cores || '--';
    const memUsed = this.formatBytes(system.memory?.used || 0);
    const memTotal = this.formatBytes(system.memory?.total || 0);
    const uptime = this.formatUptime(system.uptime || 0);
    const load1 = (system.loadavg?.['1min'] || 0).toFixed(2);

    statsContainer.innerHTML = `
      <div class="stat-item">
        <div class="stat-value">${cpu}</div>
        <div class="stat-label">CPU Cores</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${memUsed}</div>
        <div class="stat-label">Memory (${memTotal})</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${uptime}</div>
        <div class="stat-label">Uptime</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${load1}</div>
        <div class="stat-label">Load Avg (1m)</div>
      </div>
    `;

    // Memory bar
    const memPercent = system.memory?.total 
      ? Math.round((system.memory.used / system.memory.total) * 100) 
      : 0;
    document.getElementById('memoryPercent').textContent = `${memPercent}%`;
    document.getElementById('memoryBar').style.width = `${memPercent}%`;

    // Disk bar
    const diskPercent = system.disk?.total 
      ? Math.round((system.disk.used / system.disk.total) * 100) 
      : 0;
    document.getElementById('diskPercent').textContent = `${diskPercent}%`;
    document.getElementById('diskBar').style.width = `${diskPercent}%`;
  }

  renderOpenClawStatus(openclaw) {
    if (!openclaw) return;

    document.getElementById('openClawVersion').textContent = `v${openclaw.version || 'Unknown'}`;
    document.getElementById('gatewayStatus').textContent = `Gateway: ${openclaw.gateway || 'unknown'}`;
    document.getElementById('gatewayState').textContent = openclaw.gateway === 'running' ? '● Running' : '○ Stopped';
    document.getElementById('gatewayState').style.color = openclaw.gateway === 'running' ? 'var(--success)' : 'var(--error)';
  }

  // Sessions
  async loadSessions() {
    try {
      const response = await fetch('/api/processes');
      const data = await response.json();
      this.renderSessions(data.sessions);
      this.renderPM2Processes(data.pm2);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  }

  renderSessions(sessions) {
    const container = document.getElementById('sessionsGrid');
    
    if (!sessions || sessions.length === 0) {
      container.innerHTML = `
        <div class="session-card" style="text-align: center; color: var(--text-muted);">
          No active sessions
        </div>
      `;
      return;
    }

    const sessionCards = sessions.map((session, index) => {
      const name = session.displayName || session.name || 'Unknown';
      const channel = session.lastChannel || session.channel || 'N/A';
      const tokens = session.totalTokens || 0;
      const model = session.model || 'Unknown';
      const updated = session.updatedAt 
        ? new Date(session.updatedAt).toLocaleString() 
        : 'Unknown';
      const sessionId = session.sessionId || session.sessionKey || '';
      const shortId = sessionId.slice(0, 8);

      return `
        <div class="session-card">
          <div class="session-header">
            <div>
              <div class="session-name">${this.escapeHtml(name)}</div>
              <div class="session-channel">${this.escapeHtml(channel)}</div>
            </div>
            <span class="status-badge online">Active</span>
          </div>
          <div class="session-meta">
            <span class="session-badge">${this.escapeHtml(model)}</span>
            <span class="session-badge">${this.formatNumber(tokens)} tokens</span>
            <span class="session-tokens">ID: ${shortId}</span>
          </div>
          <div style="margin-top: 0.75rem; font-size: 0.7rem; color: var(--text-muted);">
            Updated: ${updated}
          </div>
          <div class="btn-group" style="margin-top: 0.75rem;">
            <button class="btn btn-sm btn-secondary" onclick="mc.sendMessage('${sessionId}')">Send</button>
            <button class="btn btn-sm btn-secondary" onclick="mc.viewSessionLogs('${sessionId}')">Logs</button>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = sessionCards;
  }

  // PM2 Processes
  renderPM2Processes(processes) {
    const container = document.getElementById('pm2List');
    
    if (!processes || processes.length === 0) {
      container.innerHTML = `
        <div style="color: var(--text-muted); text-align: center; padding: 1rem;">
          No PM2 processes running
        </div>
      `;
      return;
    }

    const processItems = processes.map((proc, index) => {
      const name = proc.name || `Process ${index + 1}`;
      const status = proc.pm2_env?.status || proc.status || 'unknown';
      const pid = proc.pid || 'N/A';
      const restarts = proc.pm2_env?.restart_time || 0;
      const uptime = proc.pm_uptime 
        ? this.formatUptime(Math.floor((Date.now() - proc.pm_uptime) / 1000))
        : 'N/A';

      return `
        <div class="process-item">
          <div>
            <div class="process-name">${this.escapeHtml(name)}</div>
            <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.25rem;">
              PID: ${pid} | Restarts: ${restarts} | Uptime: ${uptime}
            </div>
          </div>
          <div class="process-status">
            <span class="status-badge ${status === 'online' ? 'running' : 'stopped'}">
              ${status}
            </span>
            <div class="btn-group">
              <button class="btn btn-sm btn-secondary" onclick="mc.restartPM2('${this.escapeHtml(name)}')">
                ↻
              </button>
              ${status === 'online' 
                ? `<button class="btn btn-sm btn-danger" onclick="mc.stopPM2('${this.escapeHtml(name)}')">■</button>`
                : ''
              }
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = processItems;
  }

  // Cron Jobs
  async loadCronJobs() {
    try {
      const response = await fetch('/api/cron');
      const data = await response.json();
      this.renderCronJobs(data.jobs);
    } catch (error) {
      console.error('Failed to load cron jobs:', error);
    }
  }

  renderCronJobs(jobs) {
    const container = document.getElementById('cronList');
    
    if (!jobs || jobs.length === 0) {
      container.innerHTML = `
        <div style="color: var(--text-muted); text-align: center; padding: 1rem;">
          No cron jobs configured
        </div>
      `;
      return;
    }

    const cronItems = jobs.map((job, index) => {
      const name = job.name || `Job ${index + 1}`;
      const schedule = job.schedule || job.cron || 'N/A';
      const enabled = job.enabled !== false;
      const nextRun = job.nextRun || 'N/A';

      return `
        <div class="cron-item">
          <div class="cron-info">
            <div class="cron-name">${this.escapeHtml(name)}</div>
            <div class="cron-schedule">${this.escapeHtml(schedule)}</div>
            <div class="cron-next">Next: ${this.escapeHtml(nextRun)}</div>
          </div>
          <div class="btn-group">
            ${enabled 
              ? `<button class="btn btn-sm btn-secondary" onclick="mc.disableCron('${job.id || index}')">Disable</button>`
              : `<button class="btn btn-sm btn-primary" onclick="mc.enableCron('${job.id || index}')">Enable</button>`
            }
            <button class="btn btn-sm btn-primary" onclick="mc.runCron('${job.id || index}')">Run Now</button>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = cronItems;
  }

  // File Manager
  async loadFiles(path) {
    this.currentPath = path;
    document.getElementById('currentPath').textContent = path;

    try {
      const response = await fetch(`/api/files?path=${encodeURIComponent(path)}`);
      const data = await response.json();
      this.renderFiles(data.files);
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  }

  renderFiles(files) {
    const container = document.getElementById('fileList');
    
    if (!files || files.length === 0) {
      container.innerHTML = `
        <div style="color: var(--text-muted); text-align: center; padding: 2rem;">
          Empty directory or access denied
        </div>
      `;
      return;
    }

    const fileItems = files.map(file => {
      const icon = file.isDirectory ? '📁' : this.getFileIcon(file.name);
      const name = file.name.length > 15 
        ? file.name.substring(0, 12) + '...' 
        : file.name;

      return `
        <div class="file-item ${file.isDirectory ? 'folder' : 'file'}" 
             onclick="${file.isDirectory 
               ? `mc.loadFiles('${this.escapeHtml(file.path)}')` 
               : `mc.downloadFile('${this.escapeHtml(file.path)}')`}">
          <div class="file-icon">${icon}</div>
          <div class="file-name" title="${this.escapeHtml(file.name)}">${this.escapeHtml(name)}</div>
        </div>
      `;
    }).join('');

    container.innerHTML = fileItems;
  }

  getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
      'js': '📜', 'ts': '📘', 'json': '📋', 'md': '📝',
      'html': '🌐', 'css': '🎨', 'png': '🖼️', 'jpg': '🖼️',
      'gif': '🖼️', 'mp3': '🎵', 'wav': '🎵', 'mp4': '🎬',
      'pdf': '📄', 'zip': '📦', 'gz': '📦',
      'txt': '📃', 'log': '📋', 'yml': '⚙️', 'yaml': '⚙️'
    };
    return icons[ext] || '📄';
  }

  // Logs
  async fetchLogs() {
    try {
      const response = await fetch('/api/logs?lines=100');
      const data = await response.json();
      this.renderLogs(data.logs);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  }

  renderLogs(logs) {
    const container = document.getElementById('logContainer');
    
    if (!logs || logs.length === 0) {
      container.innerHTML = `
        <div class="log-line" style="color: var(--text-muted);">No logs available</div>
      `;
      return;
    }

    const logLines = logs.map(line => {
      let className = 'log-line';
      if (line.includes('[ERROR]') || line.includes('error')) className += ' error';
      else if (line.includes('[WARN]') || line.includes('warn')) className += ' warn';
      else if (line.includes('[INFO]') || line.includes('info')) className += ' info';

      return `<div class="${className}">${this.escapeHtml(line)}</div>`;
    }).join('');

    container.innerHTML = logLines;
    container.scrollTop = container.scrollHeight;
  }

  // Actions
  async restartGateway() {
    try {
      const response = await fetch('/api/gateway/restart', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        this.showToast('Gateway restart initiated...', 'success');
        this.addActivity('Gateway restart initiated', 'warning');
        setTimeout(() => this.loadSystemStatus(), 5000);
      } else {
        this.showToast('Failed to restart gateway', 'error');
      }
    } catch (error) {
      this.showToast(`Error: ${error.message}`, 'error');
    }
  }

  async restartPM2(name) {
    try {
      const response = await fetch(`/api/pm2/restart/${encodeURIComponent(name)}`, { method: 'POST' });
      if (response.ok) {
        this.showToast(`Restarting ${name}...`, 'success');
        this.addActivity(`PM2 process ${name} restarted`, 'success');
        setTimeout(() => this.loadSessions(), 2000);
      }
    } catch (error) {
      this.showToast(`Error: ${error.message}`, 'error');
    }
  }

  async stopPM2(name) {
    try {
      const response = await fetch(`/api/pm2/stop/${encodeURIComponent(name)}`, { method: 'POST' });
      if (response.ok) {
        this.showToast(`Stopping ${name}...`, 'success');
        setTimeout(() => this.loadSessions(), 2000);
      }
    } catch (error) {
      this.showToast(`Error: ${error.message}`, 'error');
    }
  }

  async enableCron(id) {
    try {
      const response = await fetch(`/api/cron/enable/${encodeURIComponent(id)}`, { method: 'POST' });
      if (response.ok) {
        this.showToast('Cron job enabled', 'success');
        this.loadCronJobs();
      }
    } catch (error) {
      this.showToast(`Error: ${error.message}`, 'error');
    }
  }

  async disableCron(id) {
    try {
      const response = await fetch(`/api/cron/disable/${encodeURIComponent(id)}`, { method: 'POST' });
      if (response.ok) {
        this.showToast('Cron job disabled', 'success');
        this.loadCronJobs();
      }
    } catch (error) {
      this.showToast(`Error: ${error.message}`, 'error');
    }
  }

  async runCron(id) {
    try {
      const response = await fetch(`/api/cron/run/${encodeURIComponent(id)}`, { method: 'POST' });
      if (response.ok) {
        this.showToast('Cron job triggered', 'success');
        this.addActivity('Cron job executed manually', 'event');
      }
    } catch (error) {
      this.showToast(`Error: ${error.message}`, 'error');
    }
  }

  sendMessage(sessionKey) {
    this.showModal('Send Message', `
      <div class="form-group">
        <label class="form-label">Session Key</label>
        <input type="text" class="form-input" id="sendSessionKey" value="${sessionKey}" readonly>
      </div>
      <div class="form-group">
        <label class="form-label">Message</label>
        <textarea class="form-input" id="sendMessage" rows="4" placeholder="Enter your message..."></textarea>
      </div>
      <button class="btn btn-primary" onclick="mc.submitMessage()">Send Message</button>
    `);
  }

  async submitMessage() {
    const sessionKey = document.getElementById('sendSessionKey').value;
    const message = document.getElementById('sendMessage').value;

    if (!message.trim()) {
      this.showToast('Please enter a message', 'warning');
      return;
    }

    try {
      const response = await fetch(`/api/session/send/${encodeURIComponent(sessionKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });

      if (response.ok) {
        this.showToast('Message sent!', 'success');
        this.closeModal();
      } else {
        this.showToast('Failed to send message', 'error');
      }
    } catch (error) {
      this.showToast(`Error: ${error.message}`, 'error');
    }
  }

  viewSessionLogs(sessionKey) {
    this.showModal('Session Logs', `
      <div class="log-container" style="max-height: 400px;">
        <div id="sessionLogs">Loading...</div>
      </div>
    `);

    fetch(`/api/logs/session/${encodeURIComponent(sessionKey)}`)
      .then(res => res.json())
      .then(data => {
        const container = document.getElementById('sessionLogs');
        if (data.history && data.history.length > 0) {
          container.innerHTML = data.history.map(h => 
            `<div class="log-line">${this.escapeHtml(JSON.stringify(h))}</div>`
          ).join('');
        } else {
          container.innerHTML = `<div class="log-line" style="color: var(--text-muted);">No logs available</div>`;
        }
      })
      .catch(err => {
        document.getElementById('sessionLogs').innerHTML = 
          `<div class="log-line error">Error loading logs: ${err.message}</div>`;
      });
  }

  downloadFile(filePath) {
    window.open(`/api/files/download${filePath}`, '_blank');
  }

  // Utility methods
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatUptime(seconds) {
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

  formatNumber(num) {
    return new Intl.NumberFormat().format(num);
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
      <span>${this.escapeHtml(message)}</span>
    `;
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  showModal(title, content) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalContent').innerHTML = content;
    document.getElementById('modalOverlay').classList.add('active');
  }

  closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
  }

  addActivity(text, type = 'event') {
    const feed = document.getElementById('activityFeed');
    const item = document.createElement('div');
    item.className = 'activity-item';
    item.innerHTML = `
      <div class="activity-icon ${type}"></div>
      <div>
        <div class="activity-text">${this.escapeHtml(text)}</div>
        <div class="activity-time">${new Date().toLocaleTimeString()}</div>
      </div>
    `;
    feed.insertBefore(item, feed.firstChild);
    
    // Keep only last 20 items
    while (feed.children.length > 20) {
      feed.removeChild(feed.lastChild);
    }
  }

  // Button handlers
  refreshSystem() {
    this.loadSystemStatus();
    this.showToast('System status refreshed', 'success');
  }

  refreshSessions() {
    this.loadSessions();
    this.showToast('Sessions refreshed', 'success');
  }

  refreshCron() {
    this.loadCronJobs();
    this.showToast('Cron jobs refreshed', 'success');
  }

  openLogs() {
    this.fetchLogs();
    this.showToast('Logs refreshed', 'success');
  }

  clearLogs() {
    document.getElementById('logContainer').innerHTML = 
      '<div class="log-line" style="color: var(--text-muted);">Logs cleared</div>';
  }

  openTerminal() {
    const terminalPath = '/Applications/Utilities/Terminal.app';
    window.open(`file://${terminalPath}`, '_blank');
  }

  openWorkspace() {
    window.open(`file:///Users/myindsound/.openclaw/workspace`, '_blank');
  }

  testNotification() {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Mission Control', { body: 'Test notification working!' });
      this.showToast('Notification sent!', 'success');
    } else if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('Mission Control', { body: 'Test notification working!' });
          this.showToast('Notification permission granted!', 'success');
        } else {
          this.showToast('Notification permission denied', 'warning');
        }
      });
    } else {
      this.showToast('Notifications not supported', 'warning');
    }
  }
}

// Global instance
const mc = new MissionControl();

// Global click handler for modal overlay
document.getElementById('modalOverlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    mc.closeModal();
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    mc.closeModal();
  }
});
