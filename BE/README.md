# AI Video Hub Backend

Backend API cho hệ thống AI Video Hub với các tính năng AI như thuyết minh real-time, tóm tắt nội dung, và chat đa phương tiện.

## 🚀 Tính năng chính

- **Quản lý video**: Upload, xử lý, và quản lý video từ file hoặc YouTube
- **AI Summary**: Tự động tóm tắt nội dung video bằng AI
- **AI Narration**: Tạo thuyết minh audio từ nội dung video
- **Chatbot AI**: Chat thông minh với context về video
- **Real-time Updates**: WebSocket cho cập nhật real-time
- **Background Processing**: Queue system cho xử lý video và AI
- **Authentication**: Hệ thống xác thực JWT với refresh tokens
- **Rate Limiting**: Giới hạn tần suất request theo endpoint
- **File Processing**: Xử lý video với FFmpeg
- **Health Monitoring**: Monitoring chi tiết hệ thống
- **Comprehensive Logging**: Logging với Winston

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: SQLite (demo) / PostgreSQL/MySQL (production)
- **AI Services**: OpenAI GPT-4, TTS
- **Video Processing**: FFmpeg, ytdl-core
- **Real-time**: WebSocket (ws)
- **Queue System**: Custom job queue với EventEmitter
- **Authentication**: JWT, bcryptjs
- **Validation**: express-validator
- **Logging**: Winston
- **File Upload**: Multer
- **Security**: Helmet, CORS, Rate limiting

## 📋 Yêu cầu hệ thống

- Node.js 18+
- FFmpeg (cho xử lý video)
- 2GB RAM tối thiểu
- 10GB disk space
- OpenAI API key

## 🚀 Cài đặt

### 1. Clone repository
```bash
git clone <repository-url>
cd BE
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Cấu hình environment
```bash
cp env.example .env
```

Chỉnh sửa file `.env` với các thông tin cần thiết:
```env
# Database
DATABASE_URL=sqlite:./database/ai_video_hub.db

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# AI Services
OPENAI_API_KEY=your-openai-api-key

# Server
PORT=3001
WS_PORT=3002
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Video Processing
FFMPEG_PATH=/usr/bin/ffmpeg
MAX_CONCURRENT_JOBS=3
VIDEO_PROCESSING_TIMEOUT=3600000

# Demo Mode
DEMO_MODE=true
DEMO_VIDEOS_PATH=./demo-videos
```

### 4. Khởi tạo database
```bash
npm run migrate
npm run seed
```

### 5. Chạy server
```bash
# Development
npm run dev

# Production
npm start
```

## 📁 Cấu trúc project

```
BE/
├── src/
│   ├── app.js                 # Entry point với WebSocket
│   ├── database/
│   │   ├── connection.js      # SQLite connection
│   │   ├── connection-postgresql.js  # PostgreSQL connection
│   │   ├── connection-mysql.js       # MySQL connection
│   │   ├── migrate.js         # Database migration
│   │   ├── seed.js           # Seed data
│   │   └── schema.sql        # Database schema
│   ├── models/
│   │   ├── User.js           # User model
│   │   ├── Video.js          # Video model
│   │   ├── AISummary.js      # AI Summary model
│   │   └── ChatMessage.js    # Chat message model
│   ├── routes/
│   │   ├── auth.js           # Authentication routes
│   │   ├── videos.js         # Video management routes
│   │   ├── ai.js             # AI features routes
│   │   └── chat.js           # Chat routes
│   ├── services/
│   │   ├── aiService.js      # AI processing service
│   │   └── videoService.js   # Video processing service
│   ├── middleware/
│   │   └── auth.js           # Authentication middleware
│   └── utils/
│       ├── logger.js         # Logging utility
│       ├── websocket.js      # WebSocket handler
│       └── queue.js          # Job queue system
├── docs/
│   └── database-migration.md # Migration guide
├── demo-videos/              # Demo video files
├── uploads/                  # Uploaded files
├── logs/                     # Log files
├── package.json
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Thông tin user
- `PUT /api/auth/profile` - Cập nhật profile
- `PUT /api/auth/password` - Đổi mật khẩu
- `POST /api/auth/logout` - Đăng xuất

### Video Management
- `GET /api/videos` - Danh sách video
- `GET /api/videos/:id` - Chi tiết video
- `POST /api/videos/upload` - Upload video file
- `POST /api/videos/youtube` - Thêm video YouTube
- `PUT /api/videos/:id` - Cập nhật video
- `DELETE /api/videos/:id` - Xóa video
- `GET /api/videos/:id/status` - Trạng thái xử lý
- `GET /api/videos/:id/stream` - Stream video

### AI Features
- `POST /api/ai/summarize/:videoId` - Tạo tóm tắt AI
- `POST /api/ai/narrate/:videoId` - Tạo thuyết minh AI
- `GET /api/ai/narrate/:videoId/status` - Trạng thái narration
- `GET /api/ai/summary/:videoId` - Lấy tóm tắt AI
- `GET /api/ai/stats` - Thống kê AI

### Chat
- `POST /api/chat` - Gửi tin nhắn chat
- `GET /api/chat/video/:videoId` - Tin nhắn theo video
- `GET /api/chat/history` - Lịch sử chat
- `GET /api/chat/search` - Tìm kiếm tin nhắn
- `GET /api/chat/stats` - Thống kê chat
- `DELETE /api/chat/:messageId` - Xóa tin nhắn

### System
- `GET /health` - Health check với metrics
- `GET /api/docs` - API documentation

## 🔌 WebSocket Events

### Connection
```javascript
// Connect với JWT token
const ws = new WebSocket('ws://localhost:3002/ws?token=your-jwt-token');

// Subscribe to channels
ws.send(JSON.stringify({
  type: 'subscribe',
  payload: { channels: ['chat:videoId', 'video_processing'] }
}));
```

### Event Types

#### Video Processing Updates
```javascript
{
  type: 'video_processing',
  payload: {
    videoId: 'uuid',
    status: 'processing|completed|error',
    progress: 75,
    message: 'Extracting audio...',
    timestamp: '2024-01-01T00:00:00.000Z'
  }
}
```

#### AI Narration Updates
```javascript
{
  type: 'ai_narration',
  payload: {
    videoId: 'uuid',
    narrationId: 'uuid',
    status: 'processing|completed|error',
    progress: 50,
    audioUrl: '/uploads/narrations/file.mp3',
    timestamp: '2024-01-01T00:00:00.000Z'
  }
}
```

#### Chat Messages
```javascript
{
  type: 'chat_message',
  payload: {
    messageId: 'uuid',
    videoId: 'uuid',
    userId: 'uuid',
    content: 'Hello AI!',
    timestamp: '2024-01-01T00:00:00.000Z'
  }
}
```

#### User Activity
```javascript
{
  type: 'user_activity',
  payload: {
    userId: 'uuid',
    activity: 'video_upload|ai_summary|chat_message',
    timestamp: '2024-01-01T00:00:00.000Z'
  }
}
```

## 🔧 Cấu hình AI Models

### OpenAI Integration
```javascript
// Trong aiService.js
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// GPT-4 cho tóm tắt
const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: prompt }],
  temperature: 0.3
});

// TTS cho narration
const audio = await openai.audio.speech.create({
  model: "tts-1",
  voice: "nova",
  input: text
});
```

### Tích hợp Model AI khác

Để tích hợp các model AI khác, chỉnh sửa `aiService.js`:

```javascript
// Ví dụ với Google Gemini
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function generateSummaryWithGemini(videoId, transcript) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const result = await model.generateContent(prompt);
  return result.response.text();
}
```

## 🔄 Queue Management

### Job Types

#### Video Processing Queue
- `download-youtube`: Tải video từ YouTube
- `extract-audio`: Trích xuất audio từ video
- `generate-thumbnail`: Tạo thumbnail
- `extract-metadata`: Trích xuất metadata
- `generate-transcript`: Tạo transcript

#### AI Processing Queue
- `generate-summary`: Tạo tóm tắt AI
- `generate-narration`: Tạo narration AI
- `process-chat`: Xử lý chat AI

### Queue Monitoring
```javascript
// Lấy thống kê queue
const videoStats = videoQueue.getStats();
const aiStats = aiQueue.getStats();

// Theo dõi job
videoQueue.on('jobStart', (job) => {
  console.log(`Job started: ${job.id}`);
});

videoQueue.on('jobComplete', (job) => {
  console.log(`Job completed: ${job.id}`);
});
```

## 🗄️ Database Migration

### Từ SQLite sang PostgreSQL/MySQL

Xem hướng dẫn chi tiết trong `docs/database-migration.md`

```bash
# PostgreSQL
npm install pg
# MySQL
npm install mysql2

# Cập nhật DATABASE_URL trong .env
DATABASE_URL=postgresql://user:password@localhost:5432/ai_video_hub
# hoặc
DATABASE_URL=mysql://user:password@localhost:3306/ai_video_hub
```

## 🔐 Security Features

### Rate Limiting
- **General**: 100 requests per 15 minutes
- **Auth**: 5 attempts per 15 minutes
- **Upload**: 10 uploads per hour
- **AI Chat**: 30 messages per minute

### Authentication
- JWT tokens với expiration
- Refresh tokens
- Password hashing với bcrypt
- Session management

### File Upload Security
- File type validation
- File size limits
- Virus scanning (optional)
- Secure file storage

## 📊 Monitoring & Health Check

### Health Check Endpoint
```bash
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "services": {
    "database": "up",
    "websocket": "up",
    "storage": "up",
    "ai_services": "up"
  },
  "metrics": {
    "uptime": 3600,
    "memoryUsage": { "rss": 123456, "heapUsed": 98765 },
    "cpuUsage": { "user": 1000, "system": 500 },
    "activeConnections": 5,
    "queues": {
      "video": { "total": 10, "completed": 8, "failed": 1, "pending": 1 },
      "ai": { "total": 5, "completed": 4, "failed": 0, "pending": 1 }
    }
  }
}
```

### Logging
```javascript
// Structured logging với Winston
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
```

## 🚀 Deployment

### Docker
```dockerfile
FROM node:18-alpine
RUN apk add --no-cache ffmpeg
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001 3002
CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3001:3001"
      - "3002:3002"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/ai_video_hub
    depends_on:
      - db
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
```

### Environment Variables Production
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/db
OPENAI_API_KEY=your-openai-key
JWT_SECRET=your-super-secret-key
FRONTEND_URL=https://your-frontend.com
```

## 🧪 Testing

### API Testing
```bash
npm test
```

### Manual Testing
```bash
# Health check
curl http://localhost:3001/health

# API docs
curl http://localhost:3001/api/docs

# Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","full_name":"Test User"}'
```

## 📈 Performance Optimization

### Database
- Indexes cho các trường thường query
- Connection pooling
- Query optimization

### Caching
- Redis caching cho frequently accessed data
- Memory caching cho session data

### File Processing
- Background job processing
- Parallel processing
- Progress tracking

## 🔧 Troubleshooting

### Common Issues

1. **FFmpeg not found**: Cài đặt FFmpeg và set FFMPEG_PATH
2. **Database connection failed**: Kiểm tra DATABASE_URL
3. **OpenAI API errors**: Kiểm tra OPENAI_API_KEY
4. **File upload fails**: Kiểm tra upload directory permissions

### Logs
```bash
# View logs
tail -f logs/app.log

# Error logs
tail -f logs/error.log
```

## 📞 Support

- **API Documentation**: `/api/docs`
- **Health Check**: `/health`
- **Logs**: `logs/` directory
- **Database Migration**: `docs/database-migration.md`

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details

---

**Note**: Đây là backend hoàn chỉnh cho AI Video Hub với tất cả tính năng cần thiết cho production deployment. 