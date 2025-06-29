#!/usr/bin/env python3
"""
Script kiểm tra và hướng dẫn cài đặt FFmpeg
"""

import subprocess
import sys
import os

def check_ffmpeg():
    """Kiểm tra xem FFmpeg đã được cài đặt chưa"""
    try:
        result = subprocess.run(['ffmpeg', '-version'], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            print("✅ FFmpeg đã được cài đặt!")
            print(f"Phiên bản: {result.stdout.split('ffmpeg version')[1].split()[0]}")
            return True
        else:
            print("❌ FFmpeg không hoạt động đúng cách")
            return False
    except FileNotFoundError:
        print("❌ FFmpeg chưa được cài đặt hoặc không có trong PATH")
        return False
    except subprocess.TimeoutExpired:
        print("❌ FFmpeg không phản hồi (có thể bị treo)")
        return False
    except Exception as e:
        print(f"❌ Lỗi khi kiểm tra FFmpeg: {e}")
        return False

def install_ffmpeg_windows():
    """Hướng dẫn cài đặt FFmpeg trên Windows"""
    print("\n📋 Hướng dẫn cài đặt FFmpeg trên Windows:")
    print("1. Truy cập: https://ffmpeg.org/download.html")
    print("2. Tải phiên bản Windows (Windows builds)")
    print("3. Giải nén vào thư mục (ví dụ: C:\\ffmpeg)")
    print("4. Thêm C:\\ffmpeg\\bin vào PATH:")
    print("   - Mở System Properties > Advanced > Environment Variables")
    print("   - Chọn Path > Edit > New")
    print("   - Thêm đường dẫn đến thư mục bin của FFmpeg")
    print("5. Khởi động lại Command Prompt/PowerShell")
    print("6. Chạy lại script này để kiểm tra")

def install_ffmpeg_mac():
    """Hướng dẫn cài đặt FFmpeg trên macOS"""
    print("\n📋 Hướng dẫn cài đặt FFmpeg trên macOS:")
    print("1. Cài đặt Homebrew (nếu chưa có):")
    print("   /bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\"")
    print("2. Cài đặt FFmpeg:")
    print("   brew install ffmpeg")
    print("3. Chạy lại script này để kiểm tra")

def install_ffmpeg_linux():
    """Hướng dẫn cài đặt FFmpeg trên Linux"""
    print("\n📋 Hướng dẫn cài đặt FFmpeg trên Linux:")
    print("Ubuntu/Debian:")
    print("   sudo apt update")
    print("   sudo apt install ffmpeg")
    print("\nCentOS/RHEL/Fedora:")
    print("   sudo yum install ffmpeg")
    print("   # hoặc")
    print("   sudo dnf install ffmpeg")
    print("\n3. Chạy lại script này để kiểm tra")

def main():
    print("🔍 Kiểm tra FFmpeg...")
    
    if check_ffmpeg():
        print("\n🎉 FFmpeg đã sẵn sàng! Bạn có thể chạy Streamlit app.")
        return True
    else:
        print("\n⚠️ FFmpeg chưa được cài đặt hoặc không hoạt động.")
        
        # Xác định hệ điều hành
        if sys.platform.startswith('win'):
            install_ffmpeg_windows()
        elif sys.platform.startswith('darwin'):
            install_ffmpeg_mac()
        elif sys.platform.startswith('linux'):
            install_ffmpeg_linux()
        else:
            print(f"\n❓ Hệ điều hành không được hỗ trợ: {sys.platform}")
            print("Vui lòng cài đặt FFmpeg thủ công từ: https://ffmpeg.org/download.html")
        
        return False

if __name__ == "__main__":
    main() 