import os
import subprocess
import json
from pytube import YouTube
from gtts import gTTS
import whisper
from deep_translator import GoogleTranslator
from pydub import AudioSegment
import yt_dlp
import uuid
import pyttsx3
import edge_tts
import asyncio
from downloader import download_youtube_video
from video_manager import video_manager
import time
import requests
from tqdm import tqdm


def extract_audio(video_path, audio_dir="audio"):
    # Tạo thư mục audio nếu chưa có
    os.makedirs(audio_dir, exist_ok=True)

    # Lấy tên file từ đường dẫn video (không kèm phần mở rộng)
    base_name = os.path.splitext(os.path.basename(video_path))[0]
    audio_path = os.path.join(audio_dir, f"{base_name}.wav")

    command = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-vn",
        "-acodec", "pcm_s16le",
        "-ar", "16000",
        audio_path
    ]

    subprocess.run(command, stdout=subprocess.DEVNULL,
                   stderr=subprocess.DEVNULL)
    return audio_path


def transcribe_with_timestamps(audio_path, model_size="base"):
    model = whisper.load_model(model_size)
    result = model.transcribe(audio_path, language="en")
    return result["segments"]


def translate_text_to_vietnamese(text):
    try:
        return GoogleTranslator(source="en", target="vi").translate(text)
    except Exception as e:
        print(f"Translation error: {e}")
        return text


# Danh sách giọng đọc có sẵn (chỉ 2 giọng chính)
AVAILABLE_VOICES = {
    "giahuy": "Giá Huy (Nam)",
    "ngoclam": "Ngọc Lâm (Nữ)"
}

# Hàm gọi FPT.AI TTS API


def fpt_tts(text, voice='giahuy', speed=0, output_file='fpt_tts.mp3'):
    # Kiểm tra giọng đọc hợp lệ
    if voice not in AVAILABLE_VOICES:
        print(f"Invalid voice: {voice}. Using default: giahuy")
        voice = 'giahuy'

    api_key = "FXxgmQp6tOUAwH2vcvGccDTt32dfBl2r"

    headers = {
        "api-key": api_key,
        "speed": str(speed),
        "voice": voice
    }

    response = requests.post(
        url="https://api.fpt.ai/hmi/tts/v5",
        headers=headers,
        data=text.encode('utf-8')
    )

    if response.status_code == 200:
        audio_url = response.json()['async']
        time.sleep(2)  # Giảm thời gian chờ
        audio_data = requests.get(audio_url).content
        with open(output_file, "wb") as f:
            f.write(audio_data)
        return True
    else:
        print(f"TTS Error: {response.text}")
        return False

# Hàm chính sinh voice từ segment + dịch


def generate_voice_segments(segments, voice, output_dir="voice_segments"):
    os.makedirs(output_dir, exist_ok=True)
    metadata = []

    print(f"Using voice: {voice} ({AVAILABLE_VOICES.get(voice, 'Unknown')})")

    for i, seg in enumerate(tqdm(segments, desc=f"Generating voice segments with {voice}")):
        vi_text = translate_text_to_vietnamese(seg['text'])
        if not vi_text or not vi_text.strip():
            continue

        voice_path = os.path.join(output_dir, f"voice_{i}_{voice}.mp3")

        try:
            ok = fpt_tts(vi_text, voice=voice, output_file=voice_path)
            if not ok:
                print(f"Failed to generate voice for segment {i}")
                continue

            metadata.append({
                "file": voice_path,
                "start": seg["start"],
                "end": seg["end"],
                "text": vi_text,
                "voice": voice
            })

        except Exception as e:
            print(f"Error TTS at segment {i}: {e}")

    return metadata


def create_audio_timeline(metadata, total_duration, output_dir="voice_segments", output_filename="combined_voice.mp3"):
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, output_filename)

    timeline = AudioSegment.silent(duration=int(total_duration * 1000))

    for item in metadata:
        voice = AudioSegment.from_file(item["file"])
        start = int(item["start"] * 1000)
        timeline = timeline.overlay(voice, position=start)

    timeline.export(output_path, format="mp3")
    return output_path


def merge_video_and_voice(video_path, voice_path, output_dir="video_transform"):
    os.makedirs(output_dir, exist_ok=True)

    # Lấy tên gốc của video (không đuôi .mp4)
    base_name = os.path.splitext(os.path.basename(video_path))[0]
    output_filename = f"trans_{base_name}.mp4"
    output_path = os.path.join(output_dir, output_filename)

    # Câu lệnh ffmpeg để ghép video + giọng đọc
    command = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-i", voice_path,
        "-c:v", "copy",
        "-map", "0:v:0",
        "-map", "1:a:0",
        "-shortest",
        output_path
    ]
    subprocess.run(command, stdout=subprocess.DEVNULL,
                   stderr=subprocess.DEVNULL)
    return output_path


def pipeline(youtube_url, voice='giahuy'):
    # Kiểm tra giọng đọc hợp lệ
    if voice not in AVAILABLE_VOICES:
        print(f"Invalid voice: {voice}. Using default: giahuy")
        voice = 'giahuy'

    print(f"Starting pipeline with voice: {voice} ({AVAILABLE_VOICES[voice]})")

    print("Downloading video...")
    video_path = download_youtube_video(youtube_url)

    if not video_path:
        print("Failed to download video")
        return None

    # Thêm video gốc vào VideoManager
    video_id = video_manager.add_video(video_path, youtube_url, voice=voice)
    if not video_id:
        print("Failed to add video to manager")
        return None

    print("Extracting audio...")
    audio_path = extract_audio(video_path)

    print("Transcribing with timestamps...")
    segments = transcribe_with_timestamps(audio_path)
    if not segments:
        print("Failed to transcribe audio")
        return None

    total_duration = segments[-1]["end"] if segments else 60

    print(f"Generating voice segments with {voice}...")
    metadata = generate_voice_segments(segments, voice)
    if not metadata:
        print("Failed to generate voice segments")
        return None

    print("Saving metadata...")
    with open("voice_segments_metadata.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

    print("Creating audio timeline...")
    voice_path = create_audio_timeline(metadata, total_duration=total_duration)

    print("Merging final voiceover with video...")
    final_video = merge_video_and_voice(video_path, voice_path)

    # Thêm video đã thuyết minh vào VideoManager
    success = video_manager.add_transformed_video(video_id, final_video, voice)
    if not success:
        print("Failed to add transformed video to manager")
        return None

    print(f"Done! Final video with {voice} voiceover: {final_video}")
    return video_id


if __name__ == "__main__":
    url = input("Enter YouTube video URL: ")
    print("Available voices:")
    for key, value in AVAILABLE_VOICES.items():
        print(f"  {key}: {value}")
    voice = input("Enter voice (default: giahuy): ") or "giahuy"
    video_id = pipeline(url, voice)
    if video_id:
        print(f"Video ID: {video_id}")
    else:
        print("Pipeline failed")
