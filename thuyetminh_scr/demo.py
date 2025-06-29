#!/usr/bin/env python3
"""
Demo script để test các chức năng cơ bản
"""

import os
import sys
from pathlib import Path


def test_imports():
    """Test import các module cần thiết"""
    print("🔍 Testing imports...")

    try:
        import streamlit
        print("✅ streamlit")
    except ImportError as e:
        print(f"❌ streamlit: {e}")
        return False

    try:
        import yt_dlp
        print("✅ yt-dlp")
    except ImportError as e:
        print(f"❌ yt-dlp: {e}")
        return False

    try:
        import whisper
        print("✅ openai-whisper")
    except ImportError as e:
        print(f"❌ openai-whisper: {e}")
        return False

    try:
        from deep_translator import GoogleTranslator
        print("✅ deep-translator")
    except ImportError as e:
        print(f"❌ deep-translator: {e}")
        return False

    try:
        from pydub import AudioSegment
        print("✅ pydub")
    except ImportError as e:
        print(f"❌ pydub: {e}")
        return False

    try:
        import requests
        print("✅ requests")
    except ImportError as e:
        print(f"❌ requests: {e}")
        return False

    try:
        from tqdm import tqdm
        print("✅ tqdm")
    except ImportError as e:
        print(f"❌ tqdm: {e}")
        return False

    try:
        import plotly
        print("✅ plotly")
    except ImportError as e:
        print(f"❌ plotly: {e}")
        return False

    return True


def test_local_modules():
    """Test import các module local"""
    print("\n🔍 Testing local modules...")

    try:
        from downloader import download_youtube_video
        print("✅ downloader.py")
    except ImportError as e:
        print(f"❌ downloader.py: {e}")
        return False

    try:
        from thuyetminh_sync import (
            extract_audio,
            transcribe_with_timestamps,
            generate_voice_segments,
            create_audio_timeline,
            merge_video_and_voice,
            pipeline
        )
        print("✅ thuyetminh_sync.py")
    except ImportError as e:
        print(f"❌ thuyetminh_sync.py: {e}")
        return False

    try:
        from video_manager import video_manager
        print("✅ video_manager.py")
    except ImportError as e:
        print(f"❌ video_manager.py: {e}")
        return False

    return True


def test_directories():
    """Test tạo các thư mục cần thiết"""
    print("\n🔍 Testing directories...")

    directories = ["videos", "audio", "voice_segments",
                   "video_transform", "video_data"]

    for dir_name in directories:
        try:
            os.makedirs(dir_name, exist_ok=True)
            print(f"✅ {dir_name}/")
        except Exception as e:
            print(f"❌ {dir_name}/: {e}")
            return False

    return True


def test_ffmpeg():
    """Test FFmpeg"""
    print("\n🔍 Testing FFmpeg...")

    try:
        import subprocess
        result = subprocess.run(['ffmpeg', '-version'],
                                capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            print("✅ FFmpeg is working")
            return True
        else:
            print("❌ FFmpeg is not working properly")
            return False
    except Exception as e:
        print(f"❌ FFmpeg error: {e}")
        return False


def test_video_manager():
    """Test VideoManager"""
    print("\n🔍 Testing VideoManager...")

    try:
        from video_manager import video_manager

        # Test tạo thư mục
        if video_manager.base_dir.exists():
            print("✅ VideoManager directories created")
        else:
            print("❌ VideoManager directories not created")
            return False

        # Test metadata file
        if video_manager.metadata_file.exists():
            print("✅ Metadata file exists")
        else:
            print("✅ Metadata file will be created when needed")

        # Test stats
        stats = video_manager.get_video_stats()
        print(f"✅ VideoManager stats: {stats}")

        return True
    except Exception as e:
        print(f"❌ VideoManager error: {e}")
        return False


def main():
    """Main function"""
    print("🎬 AI Video Thuyết Minh - Demo Test")
    print("=" * 50)

    all_tests_passed = True

    # Test imports
    if not test_imports():
        all_tests_passed = False

    # Test local modules
    if not test_local_modules():
        all_tests_passed = False

    # Test directories
    if not test_directories():
        all_tests_passed = False

    # Test FFmpeg
    if not test_ffmpeg():
        all_tests_passed = False

    # Test VideoManager
    if not test_video_manager():
        all_tests_passed = False

    print("\n" + "=" * 50)
    if all_tests_passed:
        print("🎉 Tất cả tests đã pass! Bạn có thể chạy Streamlit app.")
        print("\nĐể chạy app:")
        print("1. Windows: double-click run_streamlit.bat")
        print("2. Hoặc chạy: streamlit run streamlit_app.py")
        print("\n✨ Tính năng mới:")
        print("- Hệ thống quản lý video thống nhất")
        print("- Thống kê và biểu đồ")
        print("- Quản lý metadata")
        print("- Xem video gốc và thuyết minh")
    else:
        print("❌ Một số tests đã fail. Vui lòng kiểm tra và cài đặt lại.")
        print("\nHướng dẫn:")
        print("1. Cài đặt dependencies: pip install -r requirements_streamlit.txt")
        print("2. Cài đặt FFmpeg: chạy python check_ffmpeg.py")
        print("3. Chạy lại demo: python demo.py")


if __name__ == "__main__":
    main()
