#!/usr/bin/env python3
"""
Test script cho VideoChatbot component
"""

import os
import json
from chatbot_component import VideoChatbot


def test_chatbot():
    """Test các chức năng của chatbot"""
    print("🧪 Testing VideoChatbot...")

    # Khởi tạo chatbot
    chatbot = VideoChatbot()

    # Test load content
    print("\n1. Testing load_video_content()...")
    content = chatbot.load_video_content()
    print(f"   Content loaded: {len(content)} items")

    if content:
        print(f"   Sample item: {content[0] if content else 'None'}")

    # Test video summary
    print("\n2. Testing get_video_summary()...")
    summary = chatbot.get_video_summary(content)
    print(f"   Summary: {summary[:100]}...")

    # Test search content
    print("\n3. Testing search_content()...")
    if content:
        search_result = chatbot.search_content("học", content)
        print(f"   Search result: {search_result[:100]}...")
    else:
        print("   No content to search")

    # Test common questions
    print("\n4. Testing get_common_questions()...")
    questions = chatbot.get_common_questions()
    print(f"   Common questions: {len(questions)} questions")
    for i, q in enumerate(questions, 1):
        print(f"   {i}. {q}")

    # Test process query
    print("\n5. Testing process_query()...")
    test_queries = [
        "Tóm tắt video",
        "Tìm từ khóa học",
        "Có bao nhiêu đoạn",
        "Nội dung chính"
    ]

    for query in test_queries:
        print(f"\n   Query: '{query}'")
        response = chatbot.process_query(query)
        print(f"   Response: {response[:100]}...")

    print("\n✅ Chatbot test completed!")


def create_sample_metadata():
    """Tạo file metadata mẫu để test"""
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

    with open("voice_segments_metadata.json", "w", encoding="utf-8") as f:
        json.dump(sample_data, f, indent=2, ensure_ascii=False)

    print("📝 Created sample metadata file")


if __name__ == "__main__":
    # Tạo metadata mẫu nếu chưa có
    if not os.path.exists("voice_segments_metadata.json"):
        create_sample_metadata()

    # Test chatbot
    test_chatbot()
