# Database Migration Guide

Hướng dẫn chuyển đổi từ SQLite sang PostgreSQL hoặc MySQL cho AI Video Hub Backend.

## 📋 Tổng quan

AI Video Hub hiện tại sử dụng SQLite cho môi trường demo. Để triển khai production, bạn nên chuyển sang PostgreSQL hoặc MySQL để có hiệu suất và khả năng mở rộng tốt hơn.

## 🗄️ PostgreSQL Migration

### 1. Cài đặt PostgreSQL

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### macOS
```bash
brew install postgresql
brew services start postgresql
```

#### Windows
Tải và cài đặt từ: https://www.postgresql.org/download/windows/

### 2. Tạo Database và User

```bash
# Đăng nhập vào PostgreSQL
sudo -u postgres psql

# Tạo database
CREATE DATABASE ai_video_hub;

# Tạo user
CREATE USER ai_video_user WITH PASSWORD 'your_secure_password';

# Cấp quyền
GRANT ALL PRIVILEGES ON DATABASE ai_video_hub TO ai_video_user;

# Thoát
\q
```

### 3. Cài đặt Dependencies

```bash
npm uninstall sqlite3
npm install pg
```

### 4. Cập nhật Environment Variables

```env
# Thay đổi từ SQLite sang PostgreSQL
DATABASE_URL=postgresql://ai_video_user:your_secure_password@localhost:5432/ai_video_hub
```

### 5. PostgreSQL Schema

Tạo file `src/database/schema-postgresql.sql`:

```sql
-- AI Video Hub PostgreSQL Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    subscription_type VARCHAR(50) DEFAULT 'free',
    subscription_expires_at TIMESTAMP,
    ai_usage_count INTEGER DEFAULT 0,
    ai_usage_limit INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Summaries table
CREATE TABLE IF NOT EXISTS ai_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    overview TEXT NOT NULL,
    key_points JSONB, -- array of key points
    timestamps JSONB, -- array of {time, content}
    language VARCHAR(10) DEFAULT 'vi',
    model_used VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat Messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    message_type VARCHAR(20) NOT NULL, -- user, ai, system
    content TEXT NOT NULL,
    metadata JSONB, -- attachments, reactions, etc.
    parent_message_id UUID REFERENCES chat_messages(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Narrations table
CREATE TABLE IF NOT EXISTS ai_narrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    language VARCHAR(10) DEFAULT 'vi',
    voice_type VARCHAR(50) DEFAULT 'female',
    speed DECIMAL(3,2) DEFAULT 1.0,
    audio_url TEXT,
    transcript JSONB, -- array of {start_time, end_time, text}
    status VARCHAR(50) DEFAULT 'processing',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Processing Jobs table
CREATE TABLE IF NOT EXISTS processing_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    job_type VARCHAR(50) NOT NULL, -- download, extract_audio, generate_summary, generate_narration
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    progress INTEGER DEFAULT 0,
    result JSONB, -- job result
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_video_id ON chat_messages(video_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_video_id ON processing_jobs(video_id);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token ON user_sessions(refresh_token);

-- Partial indexes for active videos
CREATE INDEX IF NOT EXISTS idx_videos_active ON videos(user_id, created_at) 
WHERE status = 'processed';

-- GIN indexes for JSONB fields
CREATE INDEX IF NOT EXISTS idx_videos_metadata ON videos USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_ai_summaries_key_points ON ai_summaries USING GIN (key_points);
CREATE INDEX IF NOT EXISTS idx_ai_summaries_timestamps ON ai_summaries USING GIN (timestamps);
CREATE INDEX IF NOT EXISTS idx_chat_messages_metadata ON chat_messages USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_ai_narrations_transcript ON ai_narrations USING GIN (transcript);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_result ON processing_jobs USING GIN (result);

-- Update triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processing_jobs_updated_at BEFORE UPDATE ON processing_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 6. Cập nhật Database Connection

Tạo file `src/database/connection-postgresql.js`:

```javascript
const { Pool } = require('pg');

class PostgreSQLDatabase {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }

  async connect() {
    try {
      const client = await this.pool.connect();
      console.log('Connected to PostgreSQL database');
      client.release();
    } catch (error) {
      console.error('Error connecting to PostgreSQL:', error);
      throw error;
    }
  }

  async ping() {
    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT 1 as ping');
      client.release();
      return result.rows[0].ping === 1;
    } catch (error) {
      throw error;
    }
  }

  async run(sql, params = []) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return { id: result.rows[0]?.id, changes: result.rowCount };
    } finally {
      client.release();
    }
  }

  async get(sql, params = []) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async all(sql, params = []) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
    console.log('PostgreSQL connection pool closed');
  }

  // Helper method to parse JSON fields (not needed for PostgreSQL JSONB)
  parseJsonField(field) {
    return field;
  }

  // Helper method to stringify JSON fields (not needed for PostgreSQL JSONB)
  stringifyJsonField(field) {
    return field;
  }
}

module.exports = PostgreSQLDatabase;
```

## 🗄️ MySQL Migration

### 1. Cài đặt MySQL

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

#### macOS
```bash
brew install mysql
brew services start mysql
```

#### Windows
Tải và cài đặt từ: https://dev.mysql.com/downloads/mysql/

### 2. Tạo Database và User

```sql
-- Đăng nhập vào MySQL
mysql -u root -p

-- Tạo database
CREATE DATABASE ai_video_hub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tạo user
CREATE USER 'ai_video_user'@'localhost' IDENTIFIED BY 'your_secure_password';

-- Cấp quyền
GRANT ALL PRIVILEGES ON ai_video_hub.* TO 'ai_video_user'@'localhost';
FLUSH PRIVILEGES;

-- Thoát
EXIT;
```

### 3. Cài đặt Dependencies

```bash
npm uninstall sqlite3
npm install mysql2
```

### 4. Cập nhật Environment Variables

```env
# Thay đổi từ SQLite sang MySQL
DATABASE_URL=mysql://ai_video_user:your_secure_password@localhost:3306/ai_video_hub
```

### 5. MySQL Schema

Tạo file `src/database/schema-mysql.sql`:

```sql
-- AI Video Hub MySQL Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    subscription_type VARCHAR(50) DEFAULT 'free',
    subscription_expires_at TIMESTAMP NULL,
    ai_usage_count INT DEFAULT 0,
    ai_usage_limit INT DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    youtube_url TEXT,
    file_url TEXT,
    thumbnail_url TEXT,
    duration INT, -- seconds
    file_size BIGINT, -- bytes
    status VARCHAR(50) DEFAULT 'processing', -- processing, processed, error
    processing_progress INT DEFAULT 0,
    metadata JSON, -- video metadata, resolution, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- AI Summaries table
CREATE TABLE IF NOT EXISTS ai_summaries (
    id CHAR(36) PRIMARY KEY,
    video_id CHAR(36) NOT NULL,
    overview TEXT NOT NULL,
    key_points JSON, -- array of key points
    timestamps JSON, -- array of {time, content}
    language VARCHAR(10) DEFAULT 'vi',
    model_used VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);

-- Chat Messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    video_id CHAR(36),
    message_type VARCHAR(20) NOT NULL, -- user, ai, system
    content TEXT NOT NULL,
    metadata JSON, -- attachments, reactions, etc.
    parent_message_id CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_message_id) REFERENCES chat_messages(id)
);

-- AI Narrations table
CREATE TABLE IF NOT EXISTS ai_narrations (
    id CHAR(36) PRIMARY KEY,
    video_id CHAR(36) NOT NULL,
    language VARCHAR(10) DEFAULT 'vi',
    voice_type VARCHAR(50) DEFAULT 'female',
    speed DECIMAL(3,2) DEFAULT 1.0,
    audio_url TEXT,
    transcript JSON, -- array of {start_time, end_time, text}
    status VARCHAR(50) DEFAULT 'processing',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);

-- Processing Jobs table
CREATE TABLE IF NOT EXISTS processing_jobs (
    id CHAR(36) PRIMARY KEY,
    video_id CHAR(36) NOT NULL,
    job_type VARCHAR(50) NOT NULL, -- download, extract_audio, generate_summary, generate_narration
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    progress INT DEFAULT 0,
    result JSON, -- job result
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);

-- User Sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX idx_chat_messages_video_id ON chat_messages(video_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX idx_processing_jobs_video_id ON processing_jobs(video_id);
CREATE INDEX idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_refresh_token ON user_sessions(refresh_token);

-- Partial indexes for active videos (MySQL 8.0+)
CREATE INDEX idx_videos_active ON videos(user_id, created_at) 
WHERE status = 'processed';

-- JSON indexes for MySQL 8.0+
CREATE INDEX idx_videos_metadata ON videos((CAST(metadata->>'$.resolution' AS CHAR(20))));
CREATE INDEX idx_ai_summaries_key_points ON ai_summaries((CAST(key_points->>'$[0]' AS CHAR(100))));
```

### 6. Cập nhật Database Connection

Tạo file `src/database/connection-mysql.js`:

```javascript
const mysql = require('mysql2/promise');

class MySQLDatabase {
  constructor() {
    this.pool = mysql.createPool({
      uri: process.env.DATABASE_URL,
      connectionLimit: 20,
      acquireTimeout: 60000,
      timeout: 60000,
      charset: 'utf8mb4'
    });
  }

  async connect() {
    try {
      const connection = await this.pool.getConnection();
      console.log('Connected to MySQL database');
      connection.release();
    } catch (error) {
      console.error('Error connecting to MySQL:', error);
      throw error;
    }
  }

  async ping() {
    try {
      const connection = await this.pool.getConnection();
      const [rows] = await connection.execute('SELECT 1 as ping');
      connection.release();
      return rows[0].ping === 1;
    } catch (error) {
      throw error;
    }
  }

  async run(sql, params = []) {
    const connection = await this.pool.getConnection();
    try {
      const [result] = await connection.execute(sql, params);
      return { id: result.insertId, changes: result.affectedRows };
    } finally {
      connection.release();
    }
  }

  async get(sql, params = []) {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.execute(sql, params);
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  async all(sql, params = []) {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.execute(sql, params);
      return rows;
    } finally {
      connection.release();
    }
  }

  async close() {
    await this.pool.end();
    console.log('MySQL connection pool closed');
  }

  // Helper method to parse JSON fields
  parseJsonField(field) {
    if (!field) return null;
    try {
      return typeof field === 'string' ? JSON.parse(field) : field;
    } catch (error) {
      console.warn('Failed to parse JSON field:', field);
      return null;
    }
  }

  // Helper method to stringify JSON fields
  stringifyJsonField(field) {
    if (!field) return null;
    try {
      return typeof field === 'string' ? field : JSON.stringify(field);
    } catch (error) {
      console.warn('Failed to stringify JSON field:', field);
      return null;
    }
  }
}

module.exports = MySQLDatabase;
```

## 🔄 Migration Script

Tạo file `src/database/migrate-to-production.js`:

```javascript
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Import database connections
const SQLiteDatabase = require('./connection');
const PostgreSQLDatabase = require('./connection-postgresql');
const MySQLDatabase = require('./connection-mysql');

class DatabaseMigrator {
  constructor() {
    this.sourceDb = new SQLiteDatabase();
    this.targetDb = null;
  }

  async migrateToPostgreSQL() {
    console.log('Starting migration to PostgreSQL...');
    this.targetDb = new PostgreSQLDatabase();
    await this.performMigration();
  }

  async migrateToMySQL() {
    console.log('Starting migration to MySQL...');
    this.targetDb = new MySQLDatabase();
    await this.performMigration();
  }

  async performMigration() {
    try {
      // Connect to both databases
      await this.sourceDb.connect();
      await this.targetDb.connect();

      // Migrate data
      await this.migrateUsers();
      await this.migrateVideos();
      await this.migrateAISummaries();
      await this.migrateChatMessages();
      await this.migrateAINarrations();
      await this.migrateProcessingJobs();
      await this.migrateUserSessions();

      console.log('Migration completed successfully!');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    } finally {
      await this.sourceDb.close();
      await this.targetDb.close();
    }
  }

  async migrateUsers() {
    console.log('Migrating users...');
    const users = await this.sourceDb.all('SELECT * FROM users');
    
    for (const user of users) {
      const newId = uuidv4();
      await this.targetDb.run(
        'INSERT INTO users (id, email, password_hash, full_name, avatar_url, subscription_type, subscription_expires_at, ai_usage_count, ai_usage_limit, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [newId, user.email, user.password_hash, user.full_name, user.avatar_url, user.subscription_type, user.subscription_expires_at, user.ai_usage_count, user.ai_usage_limit, user.created_at, user.updated_at]
      );
    }
    console.log(`Migrated ${users.length} users`);
  }

  async migrateVideos() {
    console.log('Migrating videos...');
    const videos = await this.sourceDb.all('SELECT * FROM videos');
    
    for (const video of videos) {
      const newId = uuidv4();
      const newUserId = await this.getNewUserId(video.user_id);
      
      await this.targetDb.run(
        'INSERT INTO videos (id, user_id, title, description, youtube_url, file_url, thumbnail_url, duration, file_size, status, processing_progress, metadata, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [newId, newUserId, video.title, video.description, video.youtube_url, video.file_url, video.thumbnail_url, video.duration, video.file_size, video.status, video.processing_progress, video.metadata, video.created_at, video.updated_at]
      );
    }
    console.log(`Migrated ${videos.length} videos`);
  }

  async migrateAISummaries() {
    console.log('Migrating AI summaries...');
    const summaries = await this.sourceDb.all('SELECT * FROM ai_summaries');
    
    for (const summary of summaries) {
      const newId = uuidv4();
      const newVideoId = await this.getNewVideoId(summary.video_id);
      
      await this.targetDb.run(
        'INSERT INTO ai_summaries (id, video_id, overview, key_points, timestamps, language, model_used, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [newId, newVideoId, summary.overview, summary.key_points, summary.timestamps, summary.language, summary.model_used, summary.created_at]
      );
    }
    console.log(`Migrated ${summaries.length} AI summaries`);
  }

  async migrateChatMessages() {
    console.log('Migrating chat messages...');
    const messages = await this.sourceDb.all('SELECT * FROM chat_messages');
    
    for (const message of messages) {
      const newId = uuidv4();
      const newUserId = await this.getNewUserId(message.user_id);
      const newVideoId = message.video_id ? await this.getNewVideoId(message.video_id) : null;
      const newParentMessageId = message.parent_message_id ? await this.getNewMessageId(message.parent_message_id) : null;
      
      await this.targetDb.run(
        'INSERT INTO chat_messages (id, user_id, video_id, message_type, content, metadata, parent_message_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [newId, newUserId, newVideoId, message.message_type, message.content, message.metadata, newParentMessageId, message.created_at]
      );
    }
    console.log(`Migrated ${messages.length} chat messages`);
  }

  async migrateAINarrations() {
    console.log('Migrating AI narrations...');
    const narrations = await this.sourceDb.all('SELECT * FROM ai_narrations');
    
    for (const narration of narrations) {
      const newId = uuidv4();
      const newVideoId = await this.getNewVideoId(narration.video_id);
      
      await this.targetDb.run(
        'INSERT INTO ai_narrations (id, video_id, language, voice_type, speed, audio_url, transcript, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [newId, newVideoId, narration.language, narration.voice_type, narration.speed, narration.audio_url, narration.transcript, narration.status, narration.created_at]
      );
    }
    console.log(`Migrated ${narrations.length} AI narrations`);
  }

  async migrateProcessingJobs() {
    console.log('Migrating processing jobs...');
    const jobs = await this.sourceDb.all('SELECT * FROM processing_jobs');
    
    for (const job of jobs) {
      const newId = uuidv4();
      const newVideoId = await this.getNewVideoId(job.video_id);
      
      await this.targetDb.run(
        'INSERT INTO processing_jobs (id, video_id, job_type, status, progress, result, error_message, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [newId, newVideoId, job.job_type, job.status, job.progress, job.result, job.error_message, job.created_at, job.updated_at]
      );
    }
    console.log(`Migrated ${jobs.length} processing jobs`);
  }

  async migrateUserSessions() {
    console.log('Migrating user sessions...');
    const sessions = await this.sourceDb.all('SELECT * FROM user_sessions');
    
    for (const session of sessions) {
      const newId = uuidv4();
      const newUserId = await this.getNewUserId(session.user_id);
      
      await this.targetDb.run(
        'INSERT INTO user_sessions (id, user_id, refresh_token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)',
        [newId, newUserId, session.refresh_token, session.expires_at, session.created_at]
      );
    }
    console.log(`Migrated ${sessions.length} user sessions`);
  }

  // Helper methods for ID mapping
  async getNewUserId(oldUserId) {
    // Implementation depends on your ID mapping strategy
    // For simplicity, we'll assume the first user in the target DB
    const user = await this.targetDb.get('SELECT id FROM users LIMIT 1');
    return user ? user.id : null;
  }

  async getNewVideoId(oldVideoId) {
    // Implementation depends on your ID mapping strategy
    const video = await this.targetDb.get('SELECT id FROM videos LIMIT 1');
    return video ? video.id : null;
  }

  async getNewMessageId(oldMessageId) {
    // Implementation depends on your ID mapping strategy
    const message = await this.targetDb.get('SELECT id FROM chat_messages LIMIT 1');
    return message ? message.id : null;
  }
}

// CLI usage
if (require.main === module) {
  const migrator = new DatabaseMigrator();
  const target = process.argv[2];

  if (target === 'postgresql') {
    migrator.migrateToPostgreSQL();
  } else if (target === 'mysql') {
    migrator.migrateToMySQL();
  } else {
    console.log('Usage: node migrate-to-production.js [postgresql|mysql]');
  }
}

module.exports = DatabaseMigrator;
```

## 🚀 Deployment Considerations

### Performance Optimization

#### PostgreSQL
```sql
-- Analyze tables for better query planning
ANALYZE users;
ANALYZE videos;
ANALYZE ai_summaries;
ANALYZE chat_messages;

-- Set work_mem for complex queries
SET work_mem = '256MB';

-- Enable parallel query execution
SET max_parallel_workers_per_gather = 4;
```

#### MySQL
```sql
-- Optimize tables
OPTIMIZE TABLE users;
OPTIMIZE TABLE videos;
OPTIMIZE TABLE ai_summaries;
OPTIMIZE TABLE chat_messages;

-- Set buffer pool size (adjust based on available RAM)
SET GLOBAL innodb_buffer_pool_size = 1073741824; -- 1GB
```

### Backup Strategy

#### PostgreSQL
```bash
# Create backup
pg_dump -h localhost -U ai_video_user -d ai_video_hub > backup.sql

# Restore backup
psql -h localhost -U ai_video_user -d ai_video_hub < backup.sql
```

#### MySQL
```bash
# Create backup
mysqldump -u ai_video_user -p ai_video_hub > backup.sql

# Restore backup
mysql -u ai_video_user -p ai_video_hub < backup.sql
```

### Monitoring

#### PostgreSQL
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

#### MySQL
```sql
-- Check active connections
SHOW PROCESSLIST;

-- Check slow queries
SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 10;
```

## 📋 Migration Checklist

- [ ] Backup existing SQLite database
- [ ] Choose target database (PostgreSQL or MySQL)
- [ ] Install and configure target database
- [ ] Update environment variables
- [ ] Run migration script
- [ ] Verify data integrity
- [ ] Update application code if needed
- [ ] Test all functionality
- [ ] Update deployment scripts
- [ ] Monitor performance
- [ ] Set up backup strategy

## 🔧 Troubleshooting

### Common Issues

1. **Connection Timeout**: Increase connection timeout settings
2. **Memory Issues**: Adjust buffer pool and work memory settings
3. **Character Encoding**: Ensure UTF-8 encoding is used
4. **JSON Field Issues**: Verify JSON syntax and parsing
5. **Index Performance**: Monitor and optimize indexes

### Performance Tips

1. **Use Connection Pooling**: Implement proper connection pooling
2. **Optimize Queries**: Use EXPLAIN to analyze query performance
3. **Index Strategy**: Create appropriate indexes for your query patterns
4. **Partitioning**: Consider table partitioning for large datasets
5. **Caching**: Implement Redis caching for frequently accessed data

---

**Note**: Always test the migration process in a staging environment before applying to production. Keep backups of your original SQLite database and verify data integrity after migration. 