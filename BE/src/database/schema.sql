-- AI Video Hub Database Schema
-- SQLite compatible schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    subscription_type TEXT DEFAULT 'free',
    subscription_expires_at TEXT,
    ai_usage_count INTEGER DEFAULT 0,
    ai_usage_limit INTEGER DEFAULT 10,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    youtube_url TEXT,
    file_url TEXT,
    thumbnail_url TEXT,
    duration INTEGER, -- seconds
    file_size INTEGER, -- bytes
    status TEXT DEFAULT 'processing', -- processing, processed, error
    processing_progress INTEGER DEFAULT 0,
    processing_started_at TEXT,
    estimated_finish_at TEXT,
    metadata TEXT, -- JSON string for video metadata
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- AI Summaries table
CREATE TABLE IF NOT EXISTS ai_summaries (
    id TEXT PRIMARY KEY,
    video_id TEXT NOT NULL,
    overview TEXT NOT NULL,
    key_points TEXT, -- JSON string array of key points
    timestamps TEXT, -- JSON string array of {time, content}
    language TEXT DEFAULT 'vi',
    model_used TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);

-- Chat Messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    video_id TEXT,
    message_type TEXT NOT NULL, -- user, ai, system
    content TEXT NOT NULL,
    metadata TEXT, -- JSON string for attachments, reactions, etc.
    parent_message_id TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_message_id) REFERENCES chat_messages(id)
);

-- AI Narrations table
CREATE TABLE IF NOT EXISTS ai_narrations (
    id TEXT PRIMARY KEY,
    video_id TEXT NOT NULL,
    language TEXT DEFAULT 'vi',
    voice_type TEXT DEFAULT 'female',
    speed REAL DEFAULT 1.0,
    audio_url TEXT,
    transcript TEXT, -- JSON string array of {start_time, end_time, text}
    status TEXT DEFAULT 'processing',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);

-- Processing Jobs table
CREATE TABLE IF NOT EXISTS processing_jobs (
    id TEXT PRIMARY KEY,
    video_id TEXT NOT NULL,
    job_type TEXT NOT NULL, -- download, extract_audio, generate_summary, generate_narration
    status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
    progress INTEGER DEFAULT 0,
    result TEXT, -- JSON string for job result
    error_message TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);

-- User Sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_video_id ON chat_messages(video_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_video_id ON processing_jobs(video_id);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token ON user_sessions(refresh_token); 