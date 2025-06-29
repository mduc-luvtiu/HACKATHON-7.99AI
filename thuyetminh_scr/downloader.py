import os
import uuid
import yt_dlp
import re


def sanitize_filename(name):
    # Loại bỏ ký tự không hợp lệ cho tên file
    name = re.sub(r'[\\/*?:"<>|]', "_", name)
    name = name.replace(' ', '_')
    return name


def download_youtube_video(url, output_dir="videos"):
    os.makedirs(output_dir, exist_ok=True)

    try:
        # Lấy thông tin video (chỉ metadata, không tải)
        info = yt_dlp.YoutubeDL(
            {'quiet': True}).extract_info(url, download=False)
        video_title = info.get('title', f"video_{str(uuid.uuid4())}")
        safe_title = sanitize_filename(video_title)
        output_path = os.path.join(output_dir, f"{safe_title}.mp4")

        ydl_opts = {
            'format': 'best[ext=mp4]',
            'outtmpl': output_path,
            'quiet': True,
            'noplaylist': True,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])

        return output_path

    except Exception as e:
        print(f"[ERROR] Failed to download: {e}")
        return None


# Ví dụ sử dụng
if __name__ == "__main__":
    url = "https://youtu.be/HaRPzQdunww?si=D9QRVCQC8lfY-JPO"  # thay link tùy ý
    path = download_youtube_video(url)
    if path:
        print(f"[OK] Video đã tải về: {path}")
    else:
        print("[ERROR] Tải video thất bại.")
