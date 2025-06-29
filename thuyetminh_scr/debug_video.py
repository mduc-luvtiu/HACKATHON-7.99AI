#!/usr/bin/env python3
"""
Script debug để kiểm tra video và metadata
"""

import os
import json
from pathlib import Path
from video_manager import VideoManager


def debug_video_system():
    """Debug hệ thống video"""
    print("Debug AI Video Narrator System")
    print("=" * 50)

    # Tạo VideoManager không xóa dữ liệu
    vm = VideoManager(clear_on_start=False)

    print(f"Base directory: {vm.base_dir}")
    print(f"Videos directory: {vm.videos_dir}")
    print(f"Transformed directory: {vm.transformed_dir}")
    print(f"Metadata file: {vm.metadata_file}")
    print()

    # Kiểm tra thư mục
    print("Checking directories:")
    print(f"  video_data exists: {vm.base_dir.exists()}")
    print(f"  videos exists: {vm.videos_dir.exists()}")
    print(f"  transformed exists: {vm.transformed_dir.exists()}")
    print(f"  metadata exists: {vm.metadata_file.exists()}")
    print()

    # Kiểm tra metadata
    if vm.metadata_file.exists():
        print("Metadata content:")
        with open(vm.metadata_file, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
            print(json.dumps(metadata, indent=2, ensure_ascii=False))
    else:
        print("No metadata file found")
    print()

    # Kiểm tra video files
    print("Video files in videos directory:")
    if vm.videos_dir.exists():
        for file in vm.videos_dir.glob("*"):
            print(f"  {file.name} - {file.stat().st_size / (1024*1024):.1f} MB")
    else:
        print("  Videos directory not found")
    print()

    print("Video files in transformed directory:")
    if vm.transformed_dir.exists():
        for file in vm.transformed_dir.glob("*"):
            print(f"  {file.name} - {file.stat().st_size / (1024*1024):.1f} MB")
    else:
        print("  Transformed directory not found")
    print()

    # Kiểm tra video mới nhất
    latest_video = vm.get_latest_video()
    if latest_video:
        print("Latest video info:")
        print(f"  ID: {latest_video['id']}")
        print(f"  Title: {latest_video['title']}")
        print(f"  Status: {latest_video['status']}")
        print(f"  Original path: {latest_video.get('original_path', 'N/A')}")
        print(
            f"  Transformed path: {latest_video.get('transformed_path', 'N/A')}")

        # Kiểm tra file tồn tại
        if latest_video.get('original_path'):
            orig_path = Path(latest_video['original_path'])
            print(f"  Original file exists: {orig_path.exists()}")
            if orig_path.exists():
                print(
                    f"  Original file size: {orig_path.stat().st_size / (1024*1024):.1f} MB")

        if latest_video.get('transformed_path'):
            trans_path = Path(latest_video['transformed_path'])
            print(f"  Transformed file exists: {trans_path.exists()}")
            if trans_path.exists():
                print(
                    f"  Transformed file size: {trans_path.stat().st_size / (1024*1024):.1f} MB")

        # Test get_video_bytes
        print("\nTesting get_video_bytes:")
        original_bytes = vm.get_video_bytes(latest_video['id'], "original")
        print(
            f"  Original bytes: {len(original_bytes) if original_bytes else 0} bytes")

        transformed_bytes = vm.get_video_bytes(
            latest_video['id'], "transformed")
        print(
            f"  Transformed bytes: {len(transformed_bytes) if transformed_bytes else 0} bytes")
    else:
        print("No videos found in system")

    # Thống kê
    stats = vm.get_video_stats()
    print(f"\nStatistics:")
    print(f"  Total videos: {stats['total_videos']}")
    print(f"  Completed: {stats['completed_videos']}")
    print(f"  Original only: {stats['original_only']}")
    print(f"  Total size: {stats['total_size_mb']:.1f} MB")
    print(f"  Transformed size: {stats['transformed_size_mb']:.1f} MB")


if __name__ == "__main__":
    debug_video_system()
