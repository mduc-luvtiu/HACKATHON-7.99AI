from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
import aiofiles
from dotenv import load_dotenv
from datetime import datetime
import traceback

# Import services
from services.emotion_analyzer import EmotionAnalyzer
from services.document_processor import DocumentProcessor
from services.chat_service import ChatService
from services.content_suggester import ContentSuggester

import google.generativeai as genai

# Load environment variables
load_dotenv()

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)
GEMINI_MODEL = genai.GenerativeModel('gemini-2.0-flash')

# FastAPI app
app = FastAPI(title="SenseBot API", description="Trợ lý thấu hiểu cảm xúc & dữ liệu")

# CORS middleware (cho phép mọi origin, có thể chỉnh lại cho production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Khởi tạo services
emotion_analyzer = EmotionAnalyzer(gemini_model=GEMINI_MODEL)
document_processor = DocumentProcessor(gemini_model=GEMINI_MODEL)
content_suggester = ContentSuggester(gemini_model=GEMINI_MODEL)
chat_service = ChatService(GEMINI_MODEL, emotion_analyzer)
chat_service.document_memory = {}

# Lưu lịch sử chat (có thể thay bằng DB thực tế)
chat_history = {}

# Data models
class ChatRequest(BaseModel):
    message: str
    user_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    emotion: Optional[str] = None
    confidence: Optional[float] = None
    suggestions: Optional[list] = None

# Health check
@app.get("/api/health")
def health():
    return {"status": "healthy", "service": "SenseBot API"}

# Chat endpoint
@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    try:
        user_id = req.user_id or "default"
        message = req.message.strip()
        if not message:
            raise HTTPException(status_code=400, detail="Message is required")
        response, emotion, confidence, suggestions = await chat_service.chat(message, user_id)
        return ChatResponse(response=response, emotion=emotion, confidence=confidence, suggestions=suggestions)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

# Upload document endpoint
@app.post("/api/upload-document")
async def upload_document(file: UploadFile = File(...), user_id: str = Form(...)):
    try:
        allowed_types = [".pdf", ".docx", ".txt", ".jpg", ".jpeg", ".png"]
        file_extension = os.path.splitext(file.filename)[1].lower()
        if file_extension not in allowed_types:
            raise HTTPException(status_code=400, detail="File type not supported")
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, f"{user_id}_{file.filename}")
        async with aiofiles.open(file_path, "wb") as f:
            content = await file.read()
            await f.write(content)
        document_content = await document_processor.process_document(file_path)
        summary = await document_processor.get_document_summary(document_content)
        keywords = await document_processor.extract_keywords(document_content)
        # Lưu vào document_memory cho RAG
        if user_id not in chat_service.document_memory:
            chat_service.document_memory[user_id] = []
        # Chia đoạn theo đoạn văn hoặc 500 ký tự
        paragraphs = [p.strip() for p in document_content.split('\n') if p.strip()]
        for para in paragraphs:
            if len(para) > 500:
                for i in range(0, len(para), 500):
                    chat_service.document_memory[user_id].append(para[i:i+500])
            else:
                chat_service.document_memory[user_id].append(para)
        return {
            "message": "Document uploaded and processed successfully",
            "filename": file.filename,
            "content_preview": document_content[:500] + "..." if len(document_content) > 500 else document_content,
            "summary": summary,
            "keywords": keywords
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

# Q&A tài liệu
@app.post("/api/ask-about-document")
async def ask_about_document(question: str = Form(...), user_id: str = Form(...)):
    try:
        if user_id not in chat_history:
            raise HTTPException(status_code=404, detail="No documents found for this user")
        document_entries = [entry for entry in chat_history[user_id] if entry.get("type") == "document_upload"]
        if not document_entries:
            raise HTTPException(status_code=404, detail="No documents found for this user")
        latest_document = document_entries[-1]
        document_content = latest_document["content"]
        answer = await document_processor.answer_question_about_document(document_content, question)
        return {
            "question": question,
            "answer": answer,
            "document": latest_document["filename"]
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error answering question: {str(e)}")

# Gợi ý video
@app.get("/api/suggest-videos")
async def suggest_videos(user_id: str, emotion: str = "neutral"):
    try:
        # Lấy context chat gần nhất nếu cần
        context = ""
        if user_id in chat_history:
            context = "\n".join([m["content"] for m in chat_history[user_id][-5:]])
        videos = await content_suggester.suggest_youtube_videos(emotion, context)
        return {"videos": videos}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error suggesting videos: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app) 