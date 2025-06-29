#!/usr/bin/env python3
"""
Script kiểm tra tích hợp hệ thống AI Video Narrator
Kiểm tra trạng thái file, thư mục và metadata
"""

import os
import json
from pathlib import Path
from video_manager import VideoManager


def check_system_status():
    """Kiểm tra trạng thái hệ thống"""
    print("Checking AI Video Narrator system status")
    print("=" * 60)

    # Kiểm tra thư mục chính
    base_dirs = [
        "video_data",
        "videos",
        "video_transform",
        "audio",
        "voice_segments"
    ]

    print("\nChecking directories:")
    for dir_name in base_dirs:
        dir_path = Path(dir_name)
        if dir_path.exists():
            file_count = len(list(dir_path.glob("*")))
            size_mb = sum(f.stat().st_size for f in dir_path.rglob(
                '*') if f.is_file()) / (1024*1024)
            print(f"  OK {dir_name}/ - {file_count} files, {size_mb:.1f} MB")
        else:
            print(f"  MISSING {dir_name}/ - Not found")

    # Kiểm tra VideoManager
    print("\nChecking VideoManager:")
    try:
        # Không xóa dữ liệu khi kiểm tra
        vm = VideoManager(clear_on_start=False)
        stats = vm.get_video_stats()
        print(f"  Total videos: {stats['total_videos']}")
        print(f"  Completed: {stats['completed_videos']}")
        print(f"  Pending: {stats['original_only']}")
        print(f"  Size: {stats['total_size_mb']:.1f} MB")

        # Kiểm tra metadata
        if vm.metadata_file.exists():
            print(f"  Metadata: {vm.metadata_file}")
            with open(vm.metadata_file, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            print(f"  Entries: {len(metadata)}")
        else:
            print(f"  Metadata: Not found")

    except Exception as e:
        print(f"  Error VideoManager: {e}")

    # Kiểm tra file quan trọng
    print("\nChecking important files:")
    important_files = [
        "streamlit_app.py",
        "video_manager.py",
        "downloader.py",
        "thuyetminh_sync.py",
        "requirements_streamlit.txt"
    ]

    for file_name in important_files:
        if Path(file_name).exists():
            print(f"  OK {file_name}")
        else:
            print(f"  MISSING {file_name} - File not found!")

    # Kiểm tra FFmpeg
    print("\nChecking FFmpeg:")
    try:
        import subprocess
        result = subprocess.run(["ffmpeg", "-version"],
                                capture_output=True, text=True)
        if result.returncode == 0:
            version_line = result.stdout.split('\n')[0]
            print(f"  OK FFmpeg: {version_line}")
        else:
            print(f"  MISSING FFmpeg: Not found")
    except:
        print(f"  ERROR FFmpeg: Check failed")


def check_video_details():
    """Kiểm tra chi tiết video"""
    print("\nChecking video details:")
    print("=" * 60)

    try:
        vm = VideoManager(clear_on_start=False)
        videos = vm.get_all_videos()

        if not videos:
            print("No videos in system")
            return

        for i, video in enumerate(videos, 1):
            print(f"\nVideo {i}: {video['title']}")
            print(f"  ID: {video['id']}")
            print(f"  Status: {video['status']}")
            print(f"  Voice: {video.get('voice', 'Not selected')}")
            print(f"  Created: {video['created_time'][:19]}")

            # Kiểm tra file gốc
            if video.get('original_path'):
                orig_path = Path(video['original_path'])
                if orig_path.exists():
                    size_mb = orig_path.stat().st_size / (1024*1024)
                    print(f"  OK Original video: {size_mb:.1f} MB")
                else:
                    print(f"  ERROR Original video: File not found")

            # Kiểm tra file thuyết minh
            if video.get('transformed_path'):
                trans_path = Path(video['transformed_path'])
                if trans_path.exists():
                    size_mb = trans_path.stat().st_size / (1024*1024)
                    print(f"  OK Narrated video: {size_mb:.1f} MB")
                    print(
                        f"  Completed: {video.get('transformed_time', 'N/A')[:19]}")
                else:
                    print(f"  ERROR Narrated video: File not found")
            else:
                print(f"  PENDING Narrated video: Not available")

    except Exception as e:
        print(f"Error checking videos: {e}")


def check_clear_status():
    """Kiểm tra trạng thái xóa dữ liệu"""
    print("\nChecking data clearing status:")
    print("=" * 60)

    print("IMPORTANT NOTES:")
    print("  * Each time you run Streamlit app, all old data will be deleted")
    print("  * All videos, audio, voice_segments will be removed")
    print("  * Start with empty directory")
    print("  * Ensure no data conflicts")

    # Kiểm tra thư mục hiện tại
    print("\nDirectories that will be deleted on startup:")
    clear_dirs = ["video_data", "videos",
                  "video_transform", "audio", "voice_segments"]

    for dir_name in clear_dirs:
        dir_path = Path(dir_name)
        if dir_path.exists():
            file_count = len(list(dir_path.glob("*")))
            print(
                f"  DELETE {dir_name}/ - {file_count} files (will be deleted)")
        else:
            print(f"  OK {dir_name}/ - Not exists (safe)")


def main():
    """Hàm chính"""
    print("AI Video Narrator - System Integration Check")
    print("=" * 60)

    # Kiểm tra trạng thái hệ thống
    check_system_status()

    # Kiểm tra chi tiết video
    check_video_details()

    # Kiểm tra trạng thái xóa dữ liệu
    check_clear_status()

    print("\n" + "=" * 60)
    print("System check completed!")
    print("\nSuggestions:")
    print("  * Run 'streamlit run streamlit_app.py' to start app")
    print("  * App will automatically clear old data and start fresh")
    print("  * Use 'Manage Videos' tab to view details")


if __name__ == "__main__":
    main()
