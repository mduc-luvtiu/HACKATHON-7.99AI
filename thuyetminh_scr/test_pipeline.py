#!/usr/bin/env python3
"""
Script test đơn giản để kiểm tra pipeline thuyết minh video
"""

from video_manager import VideoManager
from thuyetminh_sync import pipeline
import sys
import os
from pathlib import Path

# Thêm thư mục hiện tại vào path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))


def test_pipeline():
    """Test pipeline với video ngắn"""
    print("Testing AI Video Narrator Pipeline")
    print("=" * 50)

    # URL video test ngắn (2 phút)
    test_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"  # Rick Roll - video ngắn

    # Giọng đọc test
    test_voice = "giahuy"

    print(f"Test URL: {test_url}")
    print(f"Test voice: {test_voice}")
    print()

    try:
        # Chạy pipeline
        print("Starting pipeline...")
        video_id = pipeline(test_url, test_voice)

        if video_id:
            print(f"✅ Pipeline completed successfully!")
            print(f"Video ID: {video_id}")

            # Kiểm tra kết quả
            vm = VideoManager(clear_on_start=False)
            video_info = vm.get_video_info(video_id)

            if video_info:
                print(f"Title: {video_info['title']}")
                print(f"Status: {video_info['status']}")
                print(
                    f"Original path: {video_info.get('original_path', 'N/A')}")
                print(
                    f"Transformed path: {video_info.get('transformed_path', 'N/A')}")

                # Kiểm tra file tồn tại
                if video_info.get('original_path') and Path(video_info['original_path']).exists():
                    print("✅ Original video file exists")
                else:
                    print("❌ Original video file missing")

                if video_info.get('transformed_path') and Path(video_info['transformed_path']).exists():
                    print("✅ Transformed video file exists")
                else:
                    print("❌ Transformed video file missing")
            else:
                print("❌ Video info not found")
        else:
            print("❌ Pipeline failed")

    except Exception as e:
        print(f"❌ Error during pipeline: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    test_pipeline()
