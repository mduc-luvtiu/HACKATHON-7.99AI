# AI Video Hub - Backend Integration Guide

## 📋 Tổng quan hệ thống

AI Video Hub là một nền tảng video thông minh với các tính năng AI như thuyết minh real-time, tóm tắt nội dung, và chat đa phương tiện. Document này mô tả chi tiết các yêu cầu backend và API integration.

## 🏗️ Kiến trúc hệ thống

\`\`\`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   AI Services   │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   (Python/ML)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │    Database     │              │
         │              │   (PostgreSQL)  │              │
         │              └─────────────────┘              │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   File Storage  │    │   Redis Cache   │    │   Message Queue │
│   (AWS S3/CDN)  │    │   (Sessions)    │    │   (Bull/Redis)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
\`\`\`

## 🔧 Tech Stack Requirements

### Backend Core
- **Runtime**: Node.js 18+ hoặc Python 3.9+
- **Framework**: Express.js/Fastify hoặc FastAPI/Django
- **Database**: PostgreSQL 14+ (primary), Redis 6+ (cache/sessions)
- **File Storage**: AWS S3, Google Cloud Storage, hoặc MinIO
- **Message Queue**: Redis Bull, RabbitMQ, hoặc AWS SQS

### AI/ML Services
- **Speech Synthesis**: OpenAI TTS, Google Text-to-Speech, Azure Cognitive Services
- **Video Processing**: FFmpeg, OpenCV
- **NLP**: OpenAI GPT-4, Google Gemini, hoặc local models
- **Embedding**: OpenAI Embeddings, Sentence Transformers

## 📊 Database Schema

### Users Table
\`\`\`sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    subscription_type VARCHAR(50) DEFAULT 'free',
    subscription_expires_at TIMESTAMP,
    ai_usage_count INTEGER DEFAULT 0,
    ai_usage_limit INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

### Videos Table
\`\`\`sql
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    youtube_url TEXT,
    file_url TEXT,
    thumbnail_url TEXT,
    duration INTEGER, -- seconds
    file_size BIGINT, -- bytes
    status VARCHAR(50) DEFAULT 'processing', -- processing, processed, error
    processing_progress INTEGER DEFAULT 0,
    metadata JSONB, -- video metadata, resolution, etc.
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

### AI Summaries Table
\`\`\`sql
CREATE TABLE ai_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    overview TEXT NOT NULL,
    key_points JSONB, -- array of key points
    timestamps JSONB, -- array of {time, content}
    language VARCHAR(10) DEFAULT 'vi',
    model_used VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

### Chat Messages Table
\`\`\`sql
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    message_type VARCHAR(20) NOT NULL, -- user, ai, system
    content TEXT NOT NULL,
    metadata JSONB, -- attachments, reactions, etc.
    parent_message_id UUID REFERENCES chat_messages(id),
    created_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

### AI Narrations Table
\`\`\`sql
CREATE TABLE ai_narrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    language VARCHAR(10) DEFAULT 'vi',
    voice_type VARCHAR(50) DEFAULT 'female',
    speed DECIMAL(3,2) DEFAULT 1.0,
    audio_url TEXT,
    transcript JSONB, -- array of {start_time, end_time, text}
    status VARCHAR(50) DEFAULT 'processing',
    created_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

## 🔌 API Endpoints

### Authentication
\`\`\`typescript
// POST /api/auth/register
interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// POST /api/auth/login
interface LoginRequest {
  email: string;
  password: string;
}

// POST /api/auth/refresh
interface RefreshRequest {
  refreshToken: string;
}

// POST /api/auth/logout
// Headers: Authorization: Bearer <token>
\`\`\`

### Video Management
\`\`\`typescript
// GET /api/videos
interface GetVideosQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'processing' | 'processed' | 'error';
  sortBy?: 'created_at' | 'title' | 'duration';
  sortOrder?: 'asc' | 'desc';
}

interface GetVideosResponse {
  videos: Video[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// POST /api/videos/youtube
interface AddYouTubeVideoRequest {
  url: string;
  title?: string;
  description?: string;
}

interface AddVideoResponse {
  video: Video;
  jobId: string; // for tracking processing status
}

// POST /api/videos/upload
// Content-Type: multipart/form-data
interface UploadVideoRequest {
  file: File;
  title: string;
  description?: string;
}

// GET /api/videos/:id
interface GetVideoResponse {
  video: Video;
  aiSummary?: AISummary;
  narrations: AINarration[];
}

// PUT /api/videos/:id
interface UpdateVideoRequest {
  title?: string;
  description?: string;
}

// DELETE /api/videos/:id
\`\`\`

### YouTube Integration
\`\`\`typescript
// Backend cần implement YouTube Data API v3
interface YouTubeVideoInfo {
  id: string;
  title: string;
  description: string;
  duration: string; // ISO 8601 format
  thumbnails: {
    default: { url: string; width: number; height: number };
    medium: { url: string; width: number; height: number };
    high: { url: string; width: number; height: number };
  };
  channelTitle: string;
  publishedAt: string;
}

// GET /api/youtube/info?url=<youtube_url>
interface GetYouTubeInfoResponse {
  videoInfo: YouTubeVideoInfo;
  downloadUrl: string; // temporary URL for downloading
}
\`\`\`

### AI Features
\`\`\`typescript
// POST /api/ai/summarize/:videoId
interface SummarizeRequest {
  language?: string;
  includeTimestamps?: boolean;
}

interface SummarizeResponse {
  summary: AISummary;
  jobId: string;
}

// POST /api/ai/narrate/:videoId
interface NarrateRequest {
  language: string;
  voiceType: 'male' | 'female';
  speed: number; // 0.5 - 2.0
}

interface NarrateResponse {
  narration: AINarration;
  jobId: string;
}

// GET /api/ai/narrate/:videoId/status
interface NarrationStatusResponse {
  status: 'processing' | 'completed' | 'error';
  progress: number; // 0-100
  audioUrl?: string;
  transcript?: Array<{
    startTime: number;
    endTime: number;
    text: string;
  }>;
}

// POST /api/ai/chat
interface ChatRequest {
  videoId?: string;
  message: string;
  messageType: 'text' | 'image' | 'audio';
  context?: {
    currentTime?: number; // video timestamp
    emotion?: string;
    previousMessages?: string[];
  };
}

interface ChatResponse {
  message: string;
  suggestions?: string[];
  videoSuggestions?: Array<{
    videoId: string;
    title: string;
    reason: string;
    thumbnail: string;
  }>;
  metadata?: {
    confidence: number;
    sources: string[];
  };
}
\`\`\`

### Real-time Features (WebSocket)
\`\`\`typescript
// WebSocket connection: /ws?token=<jwt_token>

interface WebSocketMessage {
  type: 'video_processing' | 'ai_narration' | 'chat_message' | 'user_activity';
  payload: any;
}

// Video processing updates
interface VideoProcessingUpdate {
  type: 'video_processing';
  payload: {
    videoId: string;
    status: 'processing' | 'completed' | 'error';
    progress: number;
    message?: string;
  };
}

// AI narration updates
interface NarrationUpdate {
  type: 'ai_narration';
  payload: {
    videoId: string;
    narrationId: string;
    status: 'processing' | 'completed' | 'error';
    progress: number;
    audioUrl?: string;
  };
}

// Real-time chat
interface ChatMessage {
  type: 'chat_message';
  payload: {
    messageId: string;
    videoId?: string;
    userId: string;
    content: string;
    timestamp: string;
  };
}
\`\`\`

## 🎥 Video Processing Pipeline

### 1. YouTube Video Processing
\`\`\`javascript
// Backend workflow for YouTube videos
async function processYouTubeVideo(url, userId) {
  try {
    // 1. Extract video info using YouTube API
    const videoInfo = await getYouTubeVideoInfo(url);
    
    // 2. Create video record in database
    const video = await createVideo({
      userId,
      title: videoInfo.title,
      description: videoInfo.description,
      youtubeUrl: url,
      thumbnailUrl: videoInfo.thumbnails.high.url,
      duration: parseDuration(videoInfo.duration),
      status: 'processing'
    });
    
    // 3. Download video using yt-dlp or similar
    const downloadJob = await downloadQueue.add('download-youtube', {
      videoId: video.id,
      url: url,
      quality: 'best[height<=720]' // Optimize for processing
    });
    
    // 4. Extract audio for AI processing
    const audioJob = await processingQueue.add('extract-audio', {
      videoId: video.id,
      inputPath: downloadJob.result.filePath
    });
    
    // 5. Generate AI summary
    const summaryJob = await aiQueue.add('generate-summary', {
      videoId: video.id,
      audioPath: audioJob.result.audioPath,
      transcript: audioJob.result.transcript
    });
    
    return { video, jobId: downloadJob.id };
  } catch (error) {
    await updateVideoStatus(video.id, 'error', error.message);
    throw error;
  }
}
\`\`\`

### 2. File Upload Processing
\`\`\`javascript
async function processUploadedVideo(file, metadata, userId) {
  try {
    // 1. Validate file
    const validation = await validateVideoFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    // 2. Upload to storage
    const uploadResult = await uploadToStorage(file, {
      bucket: 'videos',
      path: `users/${userId}/videos/`,
      contentType: file.mimetype
    });
    
    // 3. Create video record
    const video = await createVideo({
      userId,
      title: metadata.title,
      description: metadata.description,
      fileUrl: uploadResult.url,
      fileSize: file.size,
      status: 'processing'
    });
    
    // 4. Generate thumbnail
    const thumbnailJob = await processingQueue.add('generate-thumbnail', {
      videoId: video.id,
      videoUrl: uploadResult.url
    });
    
    // 5. Extract metadata
    const metadataJob = await processingQueue.add('extract-metadata', {
      videoId: video.id,
      videoUrl: uploadResult.url
    });
    
    return { video, jobId: thumbnailJob.id };
  } catch (error) {
    await updateVideoStatus(video.id, 'error', error.message);
    throw error;
  }
}
\`\`\`

## 🤖 AI Integration Requirements

### 1. Text-to-Speech (Narration)
\`\`\`javascript
// Example using OpenAI TTS
async function generateNarration(videoId, text, options) {
  const { language, voiceType, speed } = options;
  
  try {
    // 1. Split text into chunks for better processing
    const chunks = splitTextIntoChunks(text, 4000);
    
    // 2. Generate audio for each chunk
    const audioChunks = [];
    for (const chunk of chunks) {
      const response = await openai.audio.speech.create({
        model: "tts-1",
        voice: voiceType === 'female' ? 'nova' : 'onyx',
        input: chunk,
        speed: speed
      });
      
      audioChunks.push(await response.arrayBuffer());
    }
    
    // 3. Merge audio chunks
    const mergedAudio = await mergeAudioChunks(audioChunks);
    
    // 4. Upload to storage
    const audioUrl = await uploadAudioToStorage(mergedAudio, videoId);
    
    // 5. Update database
    await updateNarration(videoId, {
      audioUrl,
      status: 'completed'
    });
    
    return { audioUrl };
  } catch (error) {
    await updateNarration(videoId, { status: 'error' });
    throw error;
  }
}
\`\`\`

### 2. Video Summarization
\`\`\`javascript
// Example using OpenAI GPT-4
async function generateVideoSummary(videoId, transcript) {
  try {
    const prompt = `
    Analyze this video transcript and provide:
    1. A comprehensive overview (2-3 sentences)
    2. Key points (4-6 bullet points)
    3. Important timestamps with descriptions
    
    Transcript: ${transcript}
    
    Respond in Vietnamese and format as JSON:
    {
      "overview": "...",
      "keyPoints": ["...", "..."],
      "timestamps": [{"time": "MM:SS", "content": "..."}]
    }
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3
    });
    
    const summary = JSON.parse(response.choices[0].message.content);
    
    // Save to database
    await createAISummary({
      videoId,
      overview: summary.overview,
      keyPoints: summary.keyPoints,
      timestamps: summary.timestamps,
      modelUsed: 'gpt-4'
    });
    
    return summary;
  } catch (error) {
    console.error('Summary generation failed:', error);
    throw error;
  }
}
\`\`\`

### 3. Intelligent Chat
\`\`\`javascript
// Example chat with context awareness
async function processAIChat(message, context) {
  try {
    const { videoId, currentTime, emotion, previousMessages } = context;
    
    // 1. Get video context
    const video = await getVideoWithSummary(videoId);
    const relevantTimestamp = findRelevantTimestamp(video.summary.timestamps, currentTime);
    
    // 2. Build context prompt
    const systemPrompt = `
    You are an AI assistant helping users understand video content.
    
    Video: ${video.title}
    Current context: ${relevantTimestamp?.content || 'General discussion'}
    User emotion: ${emotion || 'neutral'}
    
    Provide helpful, contextual responses about the video content.
    Suggest related videos when appropriate.
    `;
    
    // 3. Generate response
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        ...previousMessages.slice(-5), // Last 5 messages for context
        { role: "user", content: message }
      ],
      temperature: 0.7
    });
    
    // 4. Generate suggestions if needed
    const suggestions = await generateSuggestions(message, video, emotion);
    
    return {
      message: response.choices[0].message.content,
      suggestions: suggestions.textSuggestions,
      videoSuggestions: suggestions.videoSuggestions
    };
  } catch (error) {
    console.error('Chat processing failed:', error);
    throw error;
  }
}
\`\`\`

## 🔐 Security Requirements

### Authentication & Authorization
\`\`\`javascript
// JWT token structure
interface JWTPayload {
  userId: string;
  email: string;
  subscriptionType: string;
  iat: number;
  exp: number;
}

// Rate limiting
const rateLimits = {
  '/api/auth/login': { windowMs: 15 * 60 * 1000, max: 5 }, // 5 attempts per 15 minutes
  '/api/videos/upload': { windowMs: 60 * 60 * 1000, max: 10 }, // 10 uploads per hour
  '/api/ai/chat': { windowMs: 60 * 1000, max: 30 }, // 30 messages per minute
  '/api/ai/summarize': { windowMs: 60 * 60 * 1000, max: 5 } // 5 summaries per hour
};

// Subscription-based access control
function checkSubscriptionAccess(feature, user) {
  const limits = {
    free: {
      videosPerMonth: 5,
      aiSummariesPerMonth: 10,
      narrationMinutesPerMonth: 30,
      chatMessagesPerDay: 50
    },
    premium: {
      videosPerMonth: Infinity,
      aiSummariesPerMonth: Infinity,
      narrationMinutesPerMonth: Infinity,
      chatMessagesPerDay: Infinity
    }
  };
  
  return user.subscriptionType === 'premium' || 
         user.usage[feature] < limits[user.subscriptionType][feature];
}
\`\`\`

### File Upload Security
\`\`\`javascript
// File validation
const allowedVideoTypes = [
  'video/mp4',
  'video/avi',
  'video/mov',
  'video/wmv',
  'video/flv',
  'video/webm'
];

const maxFileSize = 2 * 1024 * 1024 * 1024; // 2GB

function validateVideoFile(file) {
  if (!allowedVideoTypes.includes(file.mimetype)) {
    return { valid: false, error: 'Invalid file type' };
  }
  
  if (file.size > maxFileSize) {
    return { valid: false, error: 'File too large' };
  }
  
  return { valid: true };
}

// Virus scanning (optional)
async function scanFileForVirus(filePath) {
  // Integrate with ClamAV or similar
  const result = await clamAV.scanFile(filePath);
  return result.isClean;
}
\`\`\`

## 🚀 Deployment Configuration

### Environment Variables
\`\`\`bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ai_video_hub
REDIS_URL=redis://localhost:6379

# File Storage
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=ai-video-hub-storage
AWS_REGION=us-east-1

# YouTube API
YOUTUBE_API_KEY=your_youtube_api_key

# AI Services
OPENAI_API_KEY=your_openai_api_key
GOOGLE_CLOUD_API_KEY=your_google_api_key

# Authentication
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Application
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com

# WebSocket
WS_PORT=3002

# Processing
MAX_CONCURRENT_JOBS=5
VIDEO_PROCESSING_TIMEOUT=3600000 # 1 hour
\`\`\`

### Docker Configuration
\`\`\`dockerfile
# Dockerfile
FROM node:18-alpine

# Install FFmpeg for video processing
RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001 3002

CMD ["npm", "start"]
\`\`\`

### Docker Compose
\`\`\`yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3001:3001"
      - "3002:3002"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/ai_video_hub
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    volumes:
      - ./uploads:/app/uploads

  db:
    image: postgres:14
    environment:
      POSTGRES_DB: ai_video_hub
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"

  worker:
    build: .
    command: npm run worker
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/ai_video_hub
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

volumes:
  postgres_data:
\`\`\`

## 📊 Monitoring & Analytics

### Health Checks
\`\`\`javascript
// GET /api/health
interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'up' | 'down';
    redis: 'up' | 'down';
    storage: 'up' | 'down';
    ai_services: 'up' | 'down';
  };
  metrics: {
    activeUsers: number;
    processingJobs: number;
    queueSize: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}
\`\`\`

### Logging Requirements
\`\`\`javascript
// Structured logging with Winston or similar
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'ai-video-hub' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console()
  ]
});

// Log important events
logger.info('Video processing started', { 
  videoId, 
  userId, 
  processingType: 'youtube_download' 
});

logger.error('AI service failed', { 
  error: error.message, 
  videoId, 
  service: 'openai_tts' 
});
\`\`\`

## 🔄 Queue Management

### Job Processing
\`\`\`javascript
// Bull Queue setup
const videoQueue = new Bull('video processing', {
  redis: { host: 'localhost', port: 6379 }
});

const aiQueue = new Bull('ai processing', {
  redis: { host: 'localhost', port: 6379 }
});

// Job types
videoQueue.process('download-youtube', 5, async (job) => {
  const { videoId, url } = job.data;
  
  try {
    await job.progress(10);
    const downloadResult = await downloadYouTubeVideo(url);
    
    await job.progress(50);
    const audioResult = await extractAudio(downloadResult.filePath);
    
    await job.progress(80);
    const transcriptResult = await generateTranscript(audioResult.audioPath);
    
    await job.progress(100);
    
    return {
      filePath: downloadResult.filePath,
      audioPath: audioResult.audioPath,
      transcript: transcriptResult.transcript
    };
  } catch (error) {
    await updateVideoStatus(videoId, 'error', error.message);
    throw error;
  }
});

aiQueue.process('generate-summary', 3, async (job) => {
  const { videoId, transcript } = job.data;
  
  try {
    await job.progress(20);
    const summary = await generateVideoSummary(videoId, transcript);
    
    await job.progress(100);
    await updateVideoStatus(videoId, 'processed');
    
    return summary;
  } catch (error) {
    await updateVideoStatus(videoId, 'error', error.message);
    throw error;
  }
});
\`\`\`

## 📱 Mobile API Considerations

### Optimized Endpoints
\`\`\`typescript
// Mobile-optimized video list
// GET /api/mobile/videos
interface MobileVideoResponse {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  status: string;
  aiSummary?: {
    overview: string;
    keyPoints: string[]; // Limited to 3 points
  };
}

// Compressed chat responses
// POST /api/mobile/chat
interface MobileChatResponse {
  message: string;
  suggestions?: string[]; // Max 3 suggestions
  isTyping?: boolean;
}
\`\`\`

## 🧪 Testing Requirements

### API Testing
\`\`\`javascript
// Jest + Supertest example
describe('Video API', () => {
  test('should upload video successfully', async () => {
    const response = await request(app)
      .post('/api/videos/upload')
      .set('Authorization', `Bearer ${userToken}`)
      .attach('file', 'test-video.mp4')
      .field('title', 'Test Video')
      .expect(201);
      
    expect(response.body.video.title).toBe('Test Video');
    expect(response.body.jobId).toBeDefined();
  });
  
  test('should generate AI summary', async () => {
    const response = await request(app)
      .post(`/api/ai/summarize/${videoId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ language: 'vi' })
      .expect(200);
      
    expect(response.body.summary.overview).toBeDefined();
    expect(response.body.summary.keyPoints).toBeInstanceOf(Array);
  });
});
\`\`\`

## 📈 Performance Optimization

### Caching Strategy
\`\`\`javascript
// Redis caching for frequently accessed data
const cacheKeys = {
  videoSummary: (videoId) => `video:summary:${videoId}`,
  userVideos: (userId) => `user:videos:${userId}`,
  chatHistory: (videoId) => `chat:history:${videoId}`
};

// Cache video summaries for 1 hour
async function getCachedSummary(videoId) {
  const cached = await redis.get(cacheKeys.videoSummary(videoId));
  if (cached) return JSON.parse(cached);
  
  const summary = await generateVideoSummary(videoId);
  await redis.setex(cacheKeys.videoSummary(videoId), 3600, JSON.stringify(summary));
  
  return summary;
}
\`\`\`

### Database Optimization
\`\`\`sql
-- Indexes for performance
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX idx_chat_messages_video_id ON chat_messages(video_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- Partial indexes for active videos
CREATE INDEX idx_videos_active ON videos(user_id, created_at) 
WHERE status = 'processed';
\`\`\`

---

## 🚀 Getting Started

1. **Clone and setup backend repository**
2. **Install dependencies**: `npm install`
3. **Setup environment variables** from `.env.example`
4. **Run database migrations**: `npm run migrate`
5. **Start Redis and PostgreSQL**
6. **Start the application**: `npm run dev`
7. **Start worker processes**: `npm run worker`

## 📞 Support

For technical questions or integration support, please refer to:
- API Documentation: `/api/docs` (Swagger/OpenAPI)
- WebSocket Events: `/docs/websocket.md`
- Database Schema: `/docs/database.md`
- Deployment Guide: `/docs/deployment.md`

---

**Note**: This document provides the complete backend requirements for AI Video Hub. All endpoints should implement proper error handling, validation, and logging as described in the security and monitoring sections.
