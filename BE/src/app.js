require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');

// Import routes
const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/videos');
const aiRoutes = require('./routes/ai');
const chatRoutes = require('./routes/chat');

// Import database
const database = require('./database/connection');

// Import logger
const logger = require('./utils/logger');

// Import WebSocket handler
const WebSocketHandler = require('./utils/websocket');

// Import queue system
const { videoQueue, aiQueue } = require('./utils/queue');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;
const WS_PORT = process.env.WS_PORT || 3002;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      mediaSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compression
app.use(compression());

// Logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Rate limiting with specific limits for different endpoints
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 99999999999999999999999, // 999999999999999 attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  }
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: {
    success: false,
    message: 'Upload limit exceeded, please try again later.'
  }
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 AI requests per minute
  message: {
    success: false,
    message: 'AI service rate limit exceeded, please try again later.'
  }
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/videos/upload', uploadLimiter);
app.use('/api/ai/chat', aiLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Enhanced health check endpoint
app.get('/health', async (req, res) => {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        database: 'up',
        websocket: 'up',
        storage: 'up',
        ai_services: 'up'
      },
      metrics: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        activeConnections: wsHandler ? wsHandler.getActiveConnections() : 0,
        queues: {
          video: videoQueue ? videoQueue.getStats() : { waiting: 0, active: 0 },
          ai: aiQueue ? aiQueue.getStats() : { waiting: 0, active: 0 }
        }
      }
    };

    // Check database connection
    try {
      await database.ping();
    } catch (error) {
      healthData.status = 'unhealthy';
      healthData.services.database = 'down';
    }

    const statusCode = healthData.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthData);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// API health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const healthData = {
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        database: 'up',
        websocket: 'up',
        storage: 'up',
        ai_services: 'up'
      }
    };

    // Check database connection
    try {
      await database.ping();
    } catch (error) {
      healthData.status = 'unhealthy';
      healthData.services.database = 'down';
      healthData.success = false;
    }

    const statusCode = healthData.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthData);
  } catch (error) {
    logger.error('API health check failed:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    success: true,
    message: 'AI Video Hub API Documentation',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register new user',
        'POST /api/auth/login': 'Login user',
        'POST /api/auth/refresh': 'Refresh JWT token',
        'GET /api/auth/me': 'Get current user info',
        'PUT /api/auth/profile': 'Update user profile',
        'POST /api/auth/logout': 'Logout user'
      },
      videos: {
        'GET /api/videos': 'Get user videos',
        'POST /api/videos/upload': 'Upload video file',
        'POST /api/videos/youtube': 'Add YouTube video',
        'GET /api/videos/:id': 'Get video details',
        'PUT /api/videos/:id': 'Update video',
        'DELETE /api/videos/:id': 'Delete video',
        'GET /api/videos/:id/status': 'Get processing status'
      },
      ai: {
        'POST /api/ai/summarize/:videoId': 'Generate AI summary',
        'POST /api/ai/narrate/:videoId': 'Generate AI narration',
        'GET /api/ai/narrate/:videoId/status': 'Get narration status',
        'GET /api/ai/summary/:videoId': 'Get AI summary'
      },
      chat: {
        'POST /api/chat': 'Send chat message',
        'GET /api/chat/video/:videoId': 'Get video chat history',
        'GET /api/chat/history': 'Get user chat history'
      }
    },
    websocket: {
      url: `ws://localhost:${WS_PORT}`,
      events: {
        'video_processing': 'Video processing updates',
        'ai_narration': 'AI narration updates',
        'chat_message': 'Real-time chat messages',
        'user_activity': 'User activity updates'
      }
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chat', chatRoutes);

// Demo video serving (for development)
if (process.env.DEMO_MODE === 'true') {
  const demoVideosPath = process.env.DEMO_VIDEOS_PATH || './demo-videos';
  if (fs.existsSync(demoVideosPath)) {
    app.use('/demo-videos', express.static(path.join(__dirname, '..', demoVideosPath)));
  }
}

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: 'File upload error: ' + err.message,
      code: 'FILE_UPLOAD_ERROR'
    });
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error: ' + err.message,
      code: 'VALIDATION_ERROR'
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      code: 'TOKEN_EXPIRED'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    code: 'ROUTE_NOT_FOUND'
  });
});

// Initialize WebSocket server
const wss = new WebSocket.Server({ 
  server,
  path: '/ws'
});

// Initialize WebSocket handler
const wsHandler = new WebSocketHandler(wss);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await database.close();
  wss.close();
  server.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await database.close();
  wss.close();
  server.close();
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    // Connect to database
    await database.connect();
    logger.info('Connected to database');
    
    // Create necessary directories
    const dirs = [
      'uploads',
      'uploads/videos',
      'uploads/thumbnails',
      'uploads/audio',
      'uploads/narrations',
      'uploads/temp',
      'logs'
    ];
    
    for (const dir of dirs) {
      const dirPath = path.join(__dirname, '..', dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        logger.info(`Created directory: ${dir}`);
      }
    }
    
    // Start server
    server.listen(PORT, () => {
      logger.info(`AI Video Hub Backend server running on port ${PORT}`);
      logger.info(`WebSocket server running on port ${WS_PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`API docs: http://localhost:${PORT}/api/docs`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = { app, server, wsHandler }; 