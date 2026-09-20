import React, { useState, useEffect } from 'react';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [healthData, setHealthData] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState(null);

  // Tasks State
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('All');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'Docker',
    priority: 'Medium',
    status: 'Pending',
  });
  const [copiedCmd, setCopiedCmd] = useState('');

  // Fetch Health Status from API
  const fetchHealth = async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setHealthData(data);
    } catch (err) {
      console.error('Health fetch failed:', err);
      setHealthError(err.message || 'Unable to reach backend API');
    } finally {
      setHealthLoading(false);
    }
  };

  // Fetch Tasks from API
  const fetchTasks = async () => {
    setTasksLoading(true);
    try {
      const res = await fetch('/api/tasks');
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error('Task fetch failed:', err);
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchTasks();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  // Handle Task Creation
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      });
      if (res.ok) {
        const created = await res.json();
        setTasks([created, ...tasks]);
        setNewTask({
          title: '',
          description: '',
          category: 'Docker',
          priority: 'Medium',
          status: 'Pending',
        });
        setIsAddingTask(false);
      }
    } catch (err) {
      alert('Error creating task: ' + err.message);
    }
  };

  // Handle Task Status Update
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTasks(tasks.map((t) => (t._id === id ? updated : t)));
      }
    } catch (err) {
      alert('Error updating task: ' + err.message);
    }
  };

  // Handle Task Deletion
  const handleDeleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTasks(tasks.filter((t) => t._id !== id));
      }
    } catch (err) {
      alert('Error deleting task: ' + err.message);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(''), 2000);
  };

  const filteredTasks = filterCategory === 'All'
    ? tasks
    : tasks.filter((t) => t.category === filterCategory);

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
              <line x1="6" y1="6" x2="6.01" y2="6"></line>
              <line x1="6" y1="18" x2="6.01" y2="18"></line>
            </svg>
          </div>
          <div className="brand-title">
            <h1>Docker MERN Web Server</h1>
            <p>Task 4 Containerization, Health Monitoring & Reverse Proxy Architecture</p>
          </div>
        </div>

        {/* Live Service Indicators */}
        <div className="status-pill-group">
          <div className="status-pill" title="Serving React build on port 80 via Nginx">
            <span className="status-dot healthy"></span>
            <span>Nginx Web Server</span>
          </div>

          <div className="status-pill" title="Node Express API Container">
            <span className={`status-dot ${healthData ? 'healthy' : healthLoading ? 'degraded' : 'error'}`}></span>
            <span>Express API ({healthData ? 'Port 5000' : 'Checking...'})</span>
          </div>

          <div className="status-pill" title="MongoDB Persistent Volume Container">
            <span className={`status-dot ${healthData?.database?.connected ? 'healthy' : 'error'}`}></span>
            <span>MongoDB ({healthData?.database?.connected ? 'Port 27017' : 'Offline'})</span>
          </div>

          <button className="btn-secondary" onClick={fetchHealth} title="Refresh Live State">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6"></path>
              <path d="M1 20v-6h6"></path>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            Sync
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
          </svg>
          Health & Metrics
        </button>

        <button
          className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 11l3 3L22 4"></path>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
          CRUD App ({tasks.length})
        </button>

        <button
          className={`tab-btn ${activeTab === 'commands' ? 'active' : ''}`}
          onClick={() => setActiveTab('commands')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="4 17 10 11 4 5"></polyline>
            <line x1="12" y1="19" x2="20" y2="19"></line>
          </svg>
          Lifecycle Commands
        </button>

        <button
          className={`tab-btn ${activeTab === 'architecture' ? 'active' : ''}`}
          onClick={() => setActiveTab('architecture')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            <polyline points="2 17 12 22 22 17"></polyline>
            <polyline points="2 12 12 17 22 12"></polyline>
          </svg>
          Architecture & Best Practices
        </button>
      </nav>

      {/* TAB 1: OVERVIEW & HEALTH */}
      {activeTab === 'overview' && (
        <div>
          <div className="grid-cards">
            {/* Card 1: Nginx Web Server */}
            <div className="glass-card">
              <div className="card-title-row">
                <h3>Nginx Web Server</h3>
                <span className="badge badge-docker">Container: client</span>
              </div>
              <div className="stat-value">HTTP 200 OK</div>
              <p className="stat-meta">Reverse Proxy routing /api/* to Express</p>
              <div style={{ marginTop: '1rem' }}>
                <ul className="sys-list">
                  <li className="sys-item">
                    <span className="sys-label">Web Engine:</span>
                    <span className="sys-code">nginx/alpine</span>
                  </li>
                  <li className="sys-item">
                    <span className="sys-label">Exposed Host Port:</span>
                    <span className="sys-code">8080:80</span>
                  </li>
                  <li className="sys-item">
                    <span className="sys-label">Health Check URL:</span>
                    <span className="sys-code">/nginx-health</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Card 2: Express Backend Health */}
            <div className="glass-card">
              <div className="card-title-row">
                <h3>Express Backend API</h3>
                <span className="badge badge-backend">Container: server</span>
              </div>
              <div className="stat-value" style={{ color: healthData ? '#10b981' : '#f43f5e' }}>
                {healthLoading ? 'Querying...' : healthData ? 'Healthy' : 'Degraded'}
              </div>
              <p className="stat-meta">
                {healthData ? `Uptime: ${Math.floor(healthData.uptime)}s` : 'Waiting for connection'}
              </p>
              <div style={{ marginTop: '1rem' }}>
                <ul className="sys-list">
                  <li className="sys-item">
                    <span className="sys-label">Container Hostname:</span>
                    <span className="sys-code">{healthData?.container?.hostname || 'mern-server'}</span>
                  </li>
                  <li className="sys-item">
                    <span className="sys-label">Node Runtime:</span>
                    <span className="sys-code">{healthData?.container?.nodeVersion || 'v20.x'}</span>
                  </li>
                  <li className="sys-item">
                    <span className="sys-label">Process Heap:</span>
                    <span className="sys-code">{healthData?.container?.memoryUsage?.processHeapMb || '0'} MB</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Card 3: MongoDB Database */}
            <div className="glass-card">
              <div className="card-title-row">
                <h3>MongoDB Database</h3>
                <span className="badge badge-database">Container: mongodb</span>
              </div>
              <div className="stat-value" style={{ color: '#10b981' }}>
                {healthData?.database?.connected ? 'Connected' : 'Offline'}
              </div>
              <p className="stat-meta">State: {healthData?.database?.status || 'Active'}</p>
              <div style={{ marginTop: '1rem' }}>
                <ul className="sys-list">
                  <li className="sys-item">
                    <span className="sys-label">Storage Volume:</span>
                    <span className="sys-code">mongo_data (Persistent)</span>
                  </li>
                  <li className="sys-item">
                    <span className="sys-label">Database Name:</span>
                    <span className="sys-code">merndb</span>
                  </li>
                  <li className="sys-item">
                    <span className="sys-label">Tasks Seeded:</span>
                    <span className="sys-code">{tasks.length} documents</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Healthcheck Payload Preview */}
          <div className="glass-card">
            <div className="card-title-row">
              <h3>Live Docker Healthcheck API Response (/api/health)</h3>
              <span className="sys-code">HTTP 200</span>
            </div>
            <pre style={{
              background: '#0d1117',
              padding: '1rem',
              borderRadius: '8px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              color: '#58a6ff',
              overflowX: 'auto',
            }}>
              {JSON.stringify(healthData || { message: 'Fetching healthcheck...' }, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 2: CRUD TASK MANAGEMENT */}
      {activeTab === 'tasks' && (
        <div>
          <div className="tasks-toolbar">
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Filter Category:</span>
              <select
                className="status-select"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="All">All Categories ({tasks.length})</option>
                <option value="Docker">Docker</option>
                <option value="Backend">Backend</option>
                <option value="Frontend">Frontend</option>
                <option value="Database">Database</option>
              </select>
            </div>

            <button
              className="btn-primary"
              onClick={() => setIsAddingTask(!isAddingTask)}
            >
              {isAddingTask ? 'Cancel' : '+ Add New Task'}
            </button>
          </div>

          {/* New Task Form */}
          {isAddingTask && (
            <form className="form-card" onSubmit={handleCreateTask}>
              <h3 style={{ marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>Create Container Task</h3>
              <div className="form-grid">
                <div className="input-group">
                  <label>Task Title *</label>
                  <input
                    type="text"
                    required
                    className="input-control"
                    placeholder="e.g. Set up Docker volume backup"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label>Category</label>
                  <select
                    className="input-control"
                    value={newTask.category}
                    onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                  >
                    <option value="Docker">Docker</option>
                    <option value="Backend">Backend</option>
                    <option value="Frontend">Frontend</option>
                    <option value="Database">Database</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Priority</label>
                  <select
                    className="input-control"
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <label>Description</label>
                <textarea
                  rows="2"
                  className="input-control"
                  placeholder="Task details or Docker instructions..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsAddingTask(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save to MongoDB</button>
              </div>
            </form>
          )}

          {/* Tasks List */}
          {tasksLoading ? (
            <div className="empty-state">Loading tasks from MongoDB container...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="empty-state">No tasks found. Create one to test database persistence!</div>
          ) : (
            <div className="task-grid">
              {filteredTasks.map((t) => (
                <div key={t._id} className="task-item">
                  <div>
                    <div className="task-header">
                      <h4 className="task-title">{t.title}</h4>
                      <span className={`badge badge-${t.category.toLowerCase()}`}>{t.category}</span>
                    </div>
                    {t.description && <p className="task-desc" style={{ marginTop: '0.5rem' }}>{t.description}</p>}
                  </div>

                  <div className="task-footer">
                    <div>
                      <select
                        className="status-select"
                        value={t.status}
                        onChange={(e) => handleUpdateStatus(t._id, e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>

                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteTask(t._id)}
                      title="Delete Task"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LIFECYCLE COMMANDS */}
      {activeTab === 'commands' && (
        <div>
          <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>Essential Docker Lifecycle Commands</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Click the Copy button to quickly run any command in your PowerShell terminal to monitor or control your MERN containers.
            </p>

            <div>
              <div className="cmd-box">
                <div className="cmd-text">docker compose ps</div>
                <button className="copy-btn" onClick={() => copyToClipboard('docker compose ps')}>
                  {copiedCmd === 'docker compose ps' ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div className="cmd-box">
                <div className="cmd-text">docker stats --no-stream</div>
                <button className="copy-btn" onClick={() => copyToClipboard('docker stats --no-stream')}>
                  {copiedCmd === 'docker stats --no-stream' ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div className="cmd-box">
                <div className="cmd-text">docker compose logs -f client</div>
                <button className="copy-btn" onClick={() => copyToClipboard('docker compose logs -f client')}>
                  {copiedCmd === 'docker compose logs -f client' ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div className="cmd-box">
                <div className="cmd-text">docker compose logs -f server</div>
                <button className="copy-btn" onClick={() => copyToClipboard('docker compose logs -f server')}>
                  {copiedCmd === 'docker compose logs -f server' ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div className="cmd-box">
                <div className="cmd-text">docker exec -it intenship_project_1-server-1 sh</div>
                <button className="copy-btn" onClick={() => copyToClipboard('docker exec -it intenship_project_1-server-1 sh')}>
                  {copiedCmd === 'docker exec -it intenship_project_1-server-1 sh' ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div className="cmd-box">
                <div className="cmd-text">docker compose restart server</div>
                <button className="copy-btn" onClick={() => copyToClipboard('docker compose restart server')}>
                  {copiedCmd === 'docker compose restart server' ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div className="cmd-box">
                <div className="cmd-text">docker compose down</div>
                <button className="copy-btn" onClick={() => copyToClipboard('docker compose down')}>
                  {copiedCmd === 'docker compose down' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ARCHITECTURE & BEST PRACTICES */}
      {activeTab === 'architecture' && (
        <div className="architecture-container">
          <div className="glass-card">
            <h3 style={{ marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>Multi-Tier Container Architecture</h3>
            <div className="arch-node-group">
              <div className="arch-node highlight">
                <div className="arch-node-header">
                  <span className="badge badge-docker">Tier 1: Web Server</span>
                </div>
                <h4>Nginx (client)</h4>
                <p className="task-desc">
                  Listens on host port <strong>8080</strong>. Serves compiled React assets directly with Gzip and caching. Reverse-proxies all <code>/api/*</code> requests to the backend.
                </p>
              </div>

              <div className="arch-node highlight">
                <div className="arch-node-header">
                  <span className="badge badge-backend">Tier 2: API Gateway</span>
                </div>
                <h4>Node / Express (server)</h4>
                <p className="task-desc">
                  Internal port <strong>5000</strong>. Handles business logic and REST requests. Runs under least-privilege <code>USER node</code> with automated health checks.
                </p>
              </div>

              <div className="arch-node highlight">
                <div className="arch-node-header">
                  <span className="badge badge-database">Tier 3: Persistence</span>
                </div>
                <h4>MongoDB (mongodb)</h4>
                <p className="task-desc">
                  Internal port <strong>27017</strong>. Stores documents with persistent volume <code>mongo_data</code>. Not exposed directly to host machine for security.
                </p>
              </div>
            </div>
          </div>

          <div className="grid-cards">
            <div className="glass-card">
              <h4 style={{ fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>Multi-Stage Builds</h4>
              <p className="task-desc">
                The React Vite app compiles inside a temporary <code>node:20-alpine</code> stage, and only the static <code>dist/</code> files are copied to <code>nginx:alpine</code>. This reduces final image size from 800MB+ to under 25MB!
              </p>
            </div>

            <div className="glass-card">
              <h4 style={{ fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>Health Monitoring</h4>
              <p className="task-desc">
                Both Nginx and Node containers feature native Docker <code>HEALTHCHECK</code> probes. Docker continuously monitors readiness and marks failing services automatically.
              </p>
            </div>

            <div className="glass-card">
              <h4 style={{ fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>Volume Safety</h4>
              <p className="task-desc">
                Named volume <code>mongo_data</code> persists across container updates, rebuilds, and restarts. Run <code>docker compose down</code> safely without losing your tasks.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
