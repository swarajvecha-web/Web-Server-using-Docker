const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const os = require('os');
const Task = require('./models/Task');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/merndb';

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Initial seed tasks to showcase Docker setup immediately
const defaultTasks = [
  {
    title: 'Containerize React Frontend with Nginx',
    description: 'Use multi-stage Docker build to package Vite React app into lightweight Nginx web server.',
    category: 'Docker',
    priority: 'Urgent',
    status: 'Completed',
  },
  {
    title: 'Configure Node.js Express API & Dockerfile',
    description: 'Create production Node container with non-root user and automated health checks.',
    category: 'Backend',
    priority: 'High',
    status: 'Completed',
  },
  {
    title: 'Deploy MongoDB with Persistent Volume',
    description: 'Mount named volume mongo_data to persist collections across container restarts.',
    category: 'Database',
    priority: 'High',
    status: 'Completed',
  },
  {
    title: 'Inspect Container Lifecycle & Health Monitoring',
    description: 'Execute docker stats, inspect, and logs to verify multi-container orchestration.',
    category: 'Docker',
    priority: 'Medium',
    status: 'In Progress',
  },
];

async function seedInitialData() {
  try {
    const count = await Task.countDocuments();
    if (count === 0) {
      await Task.insertMany(defaultTasks);
      console.log('🌱 Seeded initial tasks successfully into MongoDB.');
    }
  } catch (err) {
    console.error('Error seeding initial tasks:', err.message);
  }
}

// Connect to MongoDB with retry logic
const connectWithRetry = () => {
  console.log(`Connecting to MongoDB at: ${MONGO_URI}...`);
  mongoose
    .connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    })
    .then(() => {
      console.log(' Connected to MongoDB database successfully!');
      seedInitialData();
    })
    .catch((err) => {
      console.error(' MongoDB connection failed:', err.message);
      console.log('Retrying MongoDB connection in 5 seconds...');
      setTimeout(connectWithRetry, 5000);
    });
};

connectWithRetry();

// Routes

// 1. Healthcheck Endpoint (Used by Docker HEALTHCHECK and Frontend)
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting',
  };

  const isHealthy = dbState === 1;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      status: states[dbState] || 'Unknown',
      connected: isHealthy,
    },
    container: {
      hostname: os.hostname(),
      platform: os.platform(),
      nodeVersion: process.version,
      memoryUsage: {
        totalMemMb: (os.totalmem() / 1024 / 1024).toFixed(1),
        freeMemMb: (os.freemem() / 1024 / 1024).toFixed(1),
        processHeapMb: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1),
      },
    },
  });
});

// 2. System / Container Info Endpoint
app.get('/api/info', (req, res) => {
  res.json({
    service: 'Docker MERN Backend API',
    containerHostname: os.hostname(),
    environment: process.env.NODE_ENV || 'production',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// 3. Task REST Endpoints (CRUD)
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks', details: err.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, category, priority, status } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Task title is required' });
    }
    const newTask = new Task({
      title,
      description,
      category: category || 'Docker',
      priority: priority || 'Medium',
      status: status || 'Pending',
    });
    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create task', details: err.message });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const updated = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update task', details: err.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const deleted = await Task.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task', details: err.message });
  }
});

// Start Express Server
const server = app.listen(PORT, () => {
  console.log(`🚀 Express backend listening on port ${PORT} inside container [${os.hostname()}]`);
});

// Graceful Shutdown Handling
const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed.');
      process.exit(0);
    } catch (err) {
      console.error('Error closing MongoDB connection:', err);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
