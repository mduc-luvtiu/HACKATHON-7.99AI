import sqlite3
import json
from datetime import datetime
from pathlib import Path
from utils.config import get_config_value

def get_db_connection():
    """Get database connection"""
    db_path = get_config_value("database.path", "data/app.db")
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    return sqlite3.connect(db_path)

def init_database():
    """Initialize database with required tables"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_admin BOOLEAN DEFAULT FALSE
        )
    ''')
    
    # Videos table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS videos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            source_type TEXT NOT NULL, -- 'youtube', 'upload', 'url'
            source_url TEXT,
            file_path TEXT,
            thumbnail_path TEXT,
            duration INTEGER, -- in seconds
            status TEXT DEFAULT 'processing', -- 'processing', 'ready', 'error'
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Chat messages table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            video_id INTEGER,
            message_type TEXT NOT NULL, -- 'user', 'ai', 'system'
            content TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            metadata TEXT, -- JSON for additional data
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (video_id) REFERENCES videos (id)
        )
    ''')
    
    # Video summaries table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS video_summaries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            video_id INTEGER NOT NULL,
            summary_text TEXT NOT NULL,
            timestamp_start INTEGER,
            timestamp_end INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (video_id) REFERENCES videos (id)
        )
    ''')
    
    # User activity log
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_activity (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            activity_type TEXT NOT NULL, -- 'login', 'video_view', 'chat', 'upload'
            description TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            metadata TEXT, -- JSON for additional data
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Video annotations table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS video_annotations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            video_id INTEGER NOT NULL,
            timestamp INTEGER NOT NULL, -- in seconds
            annotation_type TEXT NOT NULL, -- 'highlight', 'note', 'question'
            content TEXT NOT NULL,
            user_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (video_id) REFERENCES videos (id),
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()

def create_user(username, email, password_hash, is_admin=False):
    """Create a new user"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO users (username, email, password_hash, is_admin)
            VALUES (?, ?, ?, ?)
        ''', (username, email, password_hash, is_admin))
        
        user_id = cursor.lastrowid
        conn.commit()
        return user_id
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()

def get_user_by_username(username):
    """Get user by username"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
    user = cursor.fetchone()
    
    conn.close()
    return user

def get_user_by_id(user_id):
    """Get user by ID"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    
    conn.close()
    return user

def add_video(user_id, title, description, source_type, source_url=None, file_path=None):
    """Add a new video"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO videos (user_id, title, description, source_type, source_url, file_path)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (user_id, title, description, source_type, source_url, file_path))
    
    video_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return video_id

def get_user_videos(user_id):
    """Get all videos for a user"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM videos WHERE user_id = ? ORDER BY created_at DESC
    ''', (user_id,))
    
    videos = cursor.fetchall()
    conn.close()
    return videos

def get_video_by_id(video_id):
    """Get video by ID"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM videos WHERE id = ?', (video_id,))
    video = cursor.fetchone()
    
    conn.close()
    return video

def update_video_status(video_id, status, thumbnail_path=None, duration=None):
    """Update video status and metadata"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if thumbnail_path and duration:
        cursor.execute('''
            UPDATE videos SET status = ?, thumbnail_path = ?, duration = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (status, thumbnail_path, duration, video_id))
    else:
        cursor.execute('''
            UPDATE videos SET status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (status, video_id))
    
    conn.commit()
    conn.close()

def add_chat_message(user_id, message_type, content, video_id=None, metadata=None):
    """Add a chat message"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    metadata_json = json.dumps(metadata) if metadata else None
    
    cursor.execute('''
        INSERT INTO chat_messages (user_id, video_id, message_type, content, metadata)
        VALUES (?, ?, ?, ?, ?)
    ''', (user_id, video_id, message_type, content, metadata_json))
    
    message_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return message_id

def get_chat_history(user_id, video_id=None, limit=50):
    """Get chat history for a user"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if video_id:
        cursor.execute('''
            SELECT * FROM chat_messages 
            WHERE user_id = ? AND video_id = ?
            ORDER BY timestamp DESC LIMIT ?
        ''', (user_id, video_id, limit))
    else:
        cursor.execute('''
            SELECT * FROM chat_messages 
            WHERE user_id = ?
            ORDER BY timestamp DESC LIMIT ?
        ''', (user_id, limit))
    
    messages = cursor.fetchall()
    conn.close()
    return messages

def add_video_summary(video_id, summary_text, timestamp_start=None, timestamp_end=None):
    """Add a video summary"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO video_summaries (video_id, summary_text, timestamp_start, timestamp_end)
        VALUES (?, ?, ?, ?)
    ''', (video_id, summary_text, timestamp_start, timestamp_end))
    
    summary_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return summary_id

def get_video_summaries(video_id):
    """Get all summaries for a video"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM video_summaries WHERE video_id = ? ORDER BY created_at DESC
    ''', (video_id,))
    
    summaries = cursor.fetchall()
    conn.close()
    return summaries

def log_user_activity(user_id, activity_type, description=None, metadata=None):
    """Log user activity"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    metadata_json = json.dumps(metadata) if metadata else None
    
    cursor.execute('''
        INSERT INTO user_activity (user_id, activity_type, description, metadata)
        VALUES (?, ?, ?, ?)
    ''', (user_id, activity_type, description, metadata_json))
    
    conn.commit()
    conn.close()

def get_user_activity(user_id, limit=20):
    """Get user activity history"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM user_activity 
        WHERE user_id = ? 
        ORDER BY timestamp DESC LIMIT ?
    ''', (user_id, limit))
    
    activities = cursor.fetchall()
    conn.close()
    return activities 