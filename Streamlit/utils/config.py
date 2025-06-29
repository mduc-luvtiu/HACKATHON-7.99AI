import os
import json
from pathlib import Path

def load_config():
    """Load configuration from config.json or create default"""
    config_path = Path("config.json")
    
    if config_path.exists():
        with open(config_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    else:
        # Default configuration
        default_config = {
            "app_name": "AI Video Assistant",
            "version": "1.0.0",
            "database": {
                "path": "data/app.db"
            },
            "ai": {
                "openai_api_key": os.getenv("OPENAI_API_KEY", ""),
                "model": "gpt-3.5-turbo",
                "max_tokens": 1000
            },
            "video": {
                "max_file_size": 100,  # MB
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
        
        # Create config directory if it doesn't exist
        config_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Save default config
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(default_config, f, indent=2, ensure_ascii=False)
        
        return default_config

def save_config(config):
    """Save configuration to file"""
    config_path = Path("config.json")
    with open(config_path, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)

def get_config_value(key, default=None):
    """Get a specific configuration value"""
    config = load_config()
    keys = key.split('.')
    value = config
    
    for k in keys:
        if isinstance(value, dict) and k in value:
            value = value[k]
        else:
            return default
    
    return value

def update_config_value(key, value):
    """Update a specific configuration value"""
    config = load_config()
    keys = key.split('.')
    
    # Navigate to the nested location
    current = config
    for k in keys[:-1]:
        if k not in current:
            current[k] = {}
        current = current[k]
    
    # Set the value
    current[keys[-1]] = value
    
    # Save the updated config
    save_config(config) 