#!/usr/bin/env python3
"""
Test script cho Streamlit Chatbot tích hợp với chatbot.py
"""

import os
import json
import shutil
from streamlit_chatbot import StreamlitChatbot


def test_streamlit_chatbot():
    """Test các chức năng của StreamlitChatbot"""
    print("🧪 Testing StreamlitChatbot...")

    # Khởi tạo chatbot
    chatbot = StreamlitChatbot()

    # Test setup environment
    print("\n1. Testing setup_chatbot_environment()...")
    chatbot.setup_chatbot_environment()

    # Test get chatbot status
    print("\n2. Testing get_chatbot_status()...")
    status = chatbot.get_chatbot_status()
    print(f"   Status: {status}")

    # Test get video info
    print("\n3. Testing get_video_info()...")
    video_info = chatbot.get_video_info()
    if video_info:
        print(f"   Video info: {video_info}")
    else:
        print("   No video info available")

    # Test chat with video (sẽ fail nếu chưa có metadata)
    print("\n4. Testing chat_with_video()...")
    success, response = chatbot.chat_with_video("Tóm tắt video")
    if success:
        print(f"   Chat response: {response[:100]}...")
    else:
        print(f"   Chat error: {response}")

    print("\n✅ StreamlitChatbot test completed!")


def create_sample_metadata():
    """Tạo file metadata mẫu để test"""
    # Tạo thư mục rag_chatbot
    os.makedirs("rag_chatbot", exist_ok=True)

    # Tạo voice_segments_metadata.json
    sample_data = [
        {
            "start": 0.0,
            "end": 5.0,
            "text": "Chào mừng bạn đến với bài học tiếng Anh hôm nay",
            "voice": "giahuy"
        },
        {
            "start": 5.0,
            "end": 10.0,
            "text": "Hôm nay chúng ta sẽ học về cách phát âm",
            "voice": "giahuy"
        },
        {
            "start": 10.0,
            "end": 15.0,
            "text": "Hãy lắng nghe và lặp lại theo tôi",
            "voice": "giahuy"
        }
    ]

    # Lưu vào thư mục gốc
    with open("voice_segments_metadata.json", "w", encoding="utf-8") as f:
        json.dump(sample_data, f, indent=2, ensure_ascii=False)

    # Copy vào thư mục rag_chatbot
    shutil.copy2("voice_segments_metadata.json",
                 "rag_chatbot/voice_segments_metadata.json")

    # Tạo chatbot_metadata.json
    chatbot_metadata = {
        "last_file_hash": "sample_hash",
        "last_updated": "2024-01-01 12:00:00",
        "video_title": "Bài học tiếng Anh mẫu",
        "video_url": "https://example.com/video"
    }

    with open("rag_chatbot/chatbot_metadata.json", "w", encoding="utf-8") as f:
        json.dump(chatbot_metadata, f, indent=2, ensure_ascii=False)

    print("📝 Created sample metadata files")


def cleanup_test_files():
    """Dọn dẹp file test"""
    files_to_clean = [
        "voice_segments_metadata.json",
        "rag_chatbot"
    ]

    for file_path in files_to_clean:
        if os.path.exists(file_path):
            if os.path.isdir(file_path):
                shutil.rmtree(file_path)
            else:
                os.remove(file_path)
            print(f"🗑️ Cleaned: {file_path}")


if __name__ == "__main__":
    # Tạo metadata mẫu
    create_sample_metadata()

    # Test chatbot
    test_streamlit_chatbot()

    # Dọn dẹp
    cleanup_test_files()
