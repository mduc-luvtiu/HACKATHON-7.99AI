from faster_whisper import WhisperModel
import subprocess
import torch
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from underthesea import sent_tokenize
import numpy as np


def extract_audio(video_path, audio_path="audio.wav"):
    command = ['ffmpeg', '-y', '-i', video_path, '-vn',
               '-acodec', 'pcm_s16le', '-ar', '16000', audio_path]
    subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return audio_path


def transcribe_audio(audio_path, model_size='base'):
    model = WhisperModel(
        model_size, device="cuda" if torch.cuda.is_available() else "cpu")
    segments, _ = model.transcribe(audio_path, beam_size=5, language="vi")
    full_text = " ".join([segment.text for segment in segments])
    return full_text

# def summarize_text(text, max_length=130, min_length=30):
#     """Tóm tắt nội dung tiếng Anh bằng mô hình BART"""
#     summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
#     summary = summarizer(text, max_length=max_length,
#                          min_length=min_length, do_sample=False)[0]["summary_text"]
#     return summary

def summarize_text(text, max_sentences=5):
    """Tóm tắt văn bản tiếng Việt bằng TF-IDF và cosine similarity."""
    sentences = sent_tokenize(text)

    if len(sentences) <= max_sentences:
        return text

    # Tính TF-IDF và cosine similarity
    vectorizer = TfidfVectorizer()
    X = vectorizer.fit_transform(sentences)
    sim_matrix = cosine_similarity(X, X)

    # Tính độ quan trọng (importance score)
    scores = sim_matrix.sum(axis=1)
    ranked_sentences = [sentences[i]
                        for i in np.argsort(scores)[-max_sentences:]]

    # Giữ thứ tự câu theo bài gốc
    ranked_sentences.sort(key=lambda s: sentences.index(s))

    return ' '.join(ranked_sentences)

import google.generativeai as genai

# Đặt API Key
genai.configure(api_key="AIzaSyB2tZf-KsStJvXJtv_1-phjXuBZ1VCxvIM")  # Thay bằng key thật

# Khởi tạo model
model = genai.GenerativeModel("gemini-2.0-flash")

def gemini_summarize(text):
    prompt = f"Tóm tắt đoạn văn sau bằng tiếng Việt ngắn gọn, rõ ràng:\n\n{text}"
    response = model.generate_content(prompt)
    return response.text

# Ví dụ
long_text = """Thế giới đang chứng kiến biến đổi khí hậu với tốc độ nhanh chóng...
               ...Các biện pháp khẩn cấp cần được thực thi để hạn chế hậu quả nghiêm trọng."""

summary = gemini_summarize(long_text)
print("📝 Tóm tắt từ Gemini:\n", summary)

