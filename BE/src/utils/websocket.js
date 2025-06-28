const jwt = require('jsonwebtoken');
const logger = require('./logger');

class WebSocketHandler {
  constructor(wss) {
    this.wss = wss;
    this.clients = new Map(); // Map to store client connections with user info
    this.activeConnections = 0;
    
    this.init();
  }
  
  init() {
    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });
    
    logger.info('WebSocket server initialized');
  }
  
  async handleConnection(ws, req) {
    try {
      // Extract token from query string or headers
      const url = new URL(req.url, 'http://localhost');
      const token = url.searchParams.get('token') || req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        ws.close(1008, 'Authentication required');
        return;
      }
      
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;
      
      // Store client connection
      this.clients.set(ws, {
        userId,
        email: decoded.email,
        connectedAt: new Date(),
        subscriptions: new Set()
      });
      
      this.activeConnections++;
      
      logger.info(`WebSocket client connected: ${userId} (${this.activeConnections} total)`);
      
      // Send welcome message
      this.sendToClient(ws, {
        type: 'connection_established',
        payload: {
          userId,
          timestamp: new Date().toISOString(),
          message: 'WebSocket connection established'
        }
      });
      
      // Handle incoming messages
      ws.on('message', (data) => {
        this.handleMessage(ws, data);
      });
      
      // Handle client disconnect
      ws.on('close', () => {
        this.handleDisconnect(ws);
      });
      
      // Handle errors
      ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
        this.handleDisconnect(ws);
      });
      
    } catch (error) {
      logger.error('WebSocket authentication failed:', error);
      ws.close(1008, 'Authentication failed');
    }
  }
  
  handleMessage(ws, data) {
    try {
      const message = JSON.parse(data);
      const client = this.clients.get(ws);
      
      if (!client) {
        return;
      }
      
      logger.info(`WebSocket message from ${client.userId}:`, message);
      
      switch (message.type) {
        case 'subscribe':
          this.handleSubscribe(ws, message.payload);
          break;
          
        case 'unsubscribe':
          this.handleUnsubscribe(ws, message.payload);
          break;
          
        case 'ping':
          this.sendToClient(ws, { type: 'pong', payload: { timestamp: new Date().toISOString() } });
          break;
          
        default:
          logger.warn(`Unknown WebSocket message type: ${message.type}`);
      }
      
    } catch (error) {
      logger.error('Error handling WebSocket message:', error);
    }
  }
  
  handleSubscribe(ws, payload) {
    const client = this.clients.get(ws);
    if (!client) return;
    
    const { channels = [] } = payload;
    
    channels.forEach(channel => {
      client.subscriptions.add(channel);
    });
    
    this.sendToClient(ws, {
      type: 'subscription_confirmed',
      payload: {
        channels: Array.from(client.subscriptions),
        timestamp: new Date().toISOString()
      }
    });
    
    logger.info(`Client ${client.userId} subscribed to: ${channels.join(', ')}`);
  }
  
  handleUnsubscribe(ws, payload) {
    const client = this.clients.get(ws);
    if (!client) return;
    
    const { channels = [] } = payload;
    
    channels.forEach(channel => {
      client.subscriptions.delete(channel);
    });
    
    this.sendToClient(ws, {
      type: 'unsubscription_confirmed',
      payload: {
        channels: Array.from(client.subscriptions),
        timestamp: new Date().toISOString()
      }
    });
    
    logger.info(`Client ${client.userId} unsubscribed from: ${channels.join(', ')}`);
  }
  
  handleDisconnect(ws) {
    const client = this.clients.get(ws);
    if (client) {
      logger.info(`WebSocket client disconnected: ${client.userId}`);
      this.clients.delete(ws);
      this.activeConnections--;
    }
  }
  
  sendToClient(ws, message) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }
  
  // Broadcast to all connected clients
  broadcast(message) {
    this.wss.clients.forEach(client => {
      if (client.readyState === client.OPEN) {
        this.sendToClient(client, message);
      }
    });
  }
  
  // Send to specific user
  sendToUser(userId, message) {
    this.wss.clients.forEach(client => {
      const clientInfo = this.clients.get(client);
      if (clientInfo && clientInfo.userId === userId && client.readyState === client.OPEN) {
        this.sendToClient(client, message);
      }
    });
  }
  
  // Send to users subscribed to specific channel
  sendToChannel(channel, message) {
    this.wss.clients.forEach(client => {
      const clientInfo = this.clients.get(client);
      if (clientInfo && clientInfo.subscriptions.has(channel) && client.readyState === client.OPEN) {
        this.sendToClient(client, message);
      }
    });
  }
  
  // Video processing updates
  sendVideoProcessingUpdate(videoId, userId, status, progress, message = null) {
    const updateMessage = {
      type: 'video_processing',
      payload: {
        videoId,
        status,
        progress,
        message,
        timestamp: new Date().toISOString()
      }
    };
    
    this.sendToUser(userId, updateMessage);
  }
  
  // AI narration updates
  sendNarrationUpdate(videoId, userId, narrationId, status, progress, audioUrl = null) {
    const updateMessage = {
      type: 'ai_narration',
      payload: {
        videoId,
        narrationId,
        status,
        progress,
        audioUrl,
        timestamp: new Date().toISOString()
      }
    };
    
    this.sendToUser(userId, updateMessage);
  }
  
  // Chat message updates
  sendChatMessage(messageId, videoId, userId, content, timestamp) {
    const chatMessage = {
      type: 'chat_message',
      payload: {
        messageId,
        videoId,
        userId,
        content,
        timestamp
      }
    };
    
    // Send to all users subscribed to the video's chat channel
    this.sendToChannel(`chat:${videoId}`, chatMessage);
  }
  
  // User activity updates
  sendUserActivity(userId, activity) {
    const activityMessage = {
      type: 'user_activity',
      payload: {
        userId,
        activity,
        timestamp: new Date().toISOString()
      }
    };
    
    this.sendToUser(userId, activityMessage);
  }
  
  // Get active connections count
  getActiveConnections() {
    return this.activeConnections;
  }
  
  // Get connected clients info
  getConnectedClients() {
    const clients = [];
    this.clients.forEach((clientInfo, ws) => {
      clients.push({
        userId: clientInfo.userId,
        email: clientInfo.email,
        connectedAt: clientInfo.connectedAt,
        subscriptions: Array.from(clientInfo.subscriptions),
        readyState: ws.readyState
      });
    });
    return clients;
  }
  
  // Close all connections
  closeAll() {
    this.wss.clients.forEach(client => {
      client.close(1000, 'Server shutdown');
    });
    this.clients.clear();
    this.activeConnections = 0;
  }
}

module.exports = WebSocketHandler; 