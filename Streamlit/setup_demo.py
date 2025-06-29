#!/usr/bin/env python3
"""
Setup script for AI Video Assistant
Creates demo account and sample data
"""

import bcrypt
import sqlite3
from pathlib import Path
from utils.database import init_database, create_user, add_video, add_chat_message
from utils.config import get_config_value

def setup_demo_data():
    """Setup demo account and sample data"""
    print("🚀 Setting up AI Video Assistant demo data...")
    
    # Initialize database
    init_database()
    
    # Create demo user
    demo_password = "demo123"
    password_hash = bcrypt.hashpw(demo_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    demo_user_id = create_user(
        username="demo",
        email="demo@example.com",
        password_hash=password_hash,
        is_admin=False
    )
    
    if demo_user_id:
        print(f"✅ Created demo user (ID: {demo_user_id})")
        
        # Create sample videos
        sample_videos = [
            {
                "title": "Hướng dẫn AI cơ bản",
                "description": "Video giới thiệu về trí tuệ nhân tạo và các ứng dụng thực tế",
                "source_type": "youtube",
                "source_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            },
            {
                "title": "Machine Learning cho người mới bắt đầu",
                "description": "Khóa học cơ bản về machine learning và deep learning",
                "source_type": "youtube",
                "source_url": "https://www.youtube.com/watch?v=aircAruvnKk"
            },
            {
                "title": "Computer Vision với Python",
                "description": "Hướng dẫn xử lý hình ảnh và nhận diện đối tượng",
                "source_type": "youtube",
                "source_url": "https://www.youtube.com/watch?v=oXlwWbU8l2o"
            }
        ]
        
        for video_data in sample_videos:
            video_id = add_video(
                user_id=demo_user_id,
                title=video_data["title"],
                description=video_data["description"],
                source_type=video_data["source_type"],
                source_url=video_data["source_url"]
            )
            
            if video_id:
                print(f"✅ Added sample video: {video_data['title']}")
                
                # Add sample chat messages
                sample_messages = [
                    ("user", f"Video {video_data['title']} rất hay!"),
                    ("ai", f"Cảm ơn bạn! Video này thực sự rất hữu ích về {video_data['description'][:50]}..."),
                    ("user", "Có thể giải thích thêm về chủ đề này không?"),
                    ("ai", "Tất nhiên! Tôi có thể giải thích chi tiết hơn về các khái niệm trong video này.")
                ]
                
                for message_type, content in sample_messages:
                    add_chat_message(demo_user_id, message_type, content, video_id)
        
        # Create admin user
        admin_password = "admin123"
        admin_password_hash = bcrypt.hashpw(admin_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        admin_user_id = create_user(
            username="admin",
            email="admin@example.com",
            password_hash=admin_password_hash,
            is_admin=True
        )
        
        if admin_user_id:
            print(f"✅ Created admin user (ID: {admin_user_id})")
        
        print("\n🎉 Demo setup completed successfully!")
        print("\n📋 Demo Accounts:")
        print("   User Account:")
        print("   - Username: demo")
        print("   - Password: demo123")
        print("   - Email: demo@example.com")
        print("\n   Admin Account:")
        print("   - Username: admin")
        print("   - Password: admin123")
        print("   - Email: admin@example.com")
        
        print("\n🚀 To start the application:")
        print("   streamlit run app.py")
        
        print("\n📖 For more information, see README.md")
        
    else:
        print("❌ Failed to create demo user")

def create_sample_config():
    """Create sample configuration file"""
    config_path = Path("config.json")
    
    if not config_path.exists():
        sample_config = {
            "app_name": "AI Video Assistant",
            "version": "1.0.0",
            "database": {
                "path": "data/app.db"
            },
            "ai": {
                "openai_api_key": "",
                "model": "gpt-3.5-turbo",
                "max_tokens": 1000
            },
            "video": {
                "max_file_size": 100,
                "allowed_formats": ["mp4", "avi", "mov", "mkv"],
                "youtube_dl_timeout": 30
            },
            "chat": {
                "max_history": 50,
                "auto_save": True
            },
            "features": {
                "real_time_narration": True,
                "ai_summary": True,
                "chat_ai": True,
                "video_upload": True,
                "youtube_import": True
            }
        }
        
        import json
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(sample_config, f, indent=2, ensure_ascii=False)
        
        print("✅ Created sample config.json")

if __name__ == "__main__":
    print("🎥 AI Video Assistant - Demo Setup")
    print("=" * 50)
    
    # Create sample config
    create_sample_config()
    
    # Setup demo data
    setup_demo_data()
    
    print("\n" + "=" * 50)
    print("🎉 Setup completed! Happy coding! 🚀") 