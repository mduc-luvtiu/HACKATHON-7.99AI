# SenseBot - Trợ lý thấu hiểu cảm xúc & dữ liệu

SenseBot là một chatbot thông minh được xây dựng với FastAPI backend và giao diện web hiện đại. Bot sử dụng Gemini LLM để cung cấp trải nghiệm tương tác thông minh và thấu hiểu cảm xúc.

## 🌟 Tính năng chính

### 💬 Chat thông minh
- Trò chuyện tự nhiên với Gemini LLM
- Lưu trữ lịch sử chat theo từng người dùng
- Giao diện chat hiện đại và responsive

### 😊 Phân tích cảm xúc
- Phân tích cảm xúc từ tin nhắn người dùng
- Hiển thị emoji và thông tin cảm xúc
- Sử dụng Gemini LLM cho độ chính xác cao

### 📄 Xử lý tài liệu thông minh
- **Upload và xử lý đa định dạng**: PDF, DOCX, TXT, JPG, PNG
- **OCR với Gemini Vision**: Trích xuất văn bản từ ảnh không cần Tesseract
- **Phân tích nâng cao**: Tóm tắt, từ khóa, chủ đề chính
- **Hỏi đáp tài liệu**: Đặt câu hỏi về nội dung tài liệu đã upload

### 🎥 Gợi ý nội dung
- Gợi ý video YouTube dựa trên cảm xúc
- Tích hợp YouTube Data API
- Gợi ý video theo ngữ cảnh chat

## 🚀 Cài đặt và chạy

### Yêu cầu hệ thống
- Python 3.8+
- Google Gemini API key
- YouTube Data API key (tùy chọn, cho gợi ý video)

### Cài đặt

1. **Clone repository**
```bash
git clone <repository-url>
cd chatbot
```

2. **Cài đặt dependencies**
```bash
pip install -r requirements.txt
```

3. **Cấu hình environment**
Tạo file `.env` với nội dung:
```env
GEMINI_API_KEY=your_gemini_api_key_here
YOUTUBE_API_KEY=your_youtube_api_key_here
```

4. **Chạy ứng dụng**
```bash
python main.py
```

5. **Truy cập ứng dụng**
Mở trình duyệt và truy cập: `http://localhost:8000`

## 📋 Hướng dẫn sử dụng

### 1. Thiết lập người dùng
- Nhập tên người dùng để bắt đầu
- Mỗi người dùng có lịch sử chat riêng biệt

### 2. Chat và phân tích cảm xúc
- Gửi tin nhắn để trò chuyện
- Bot sẽ phân tích cảm xúc và hiển thị kết quả
- Lịch sử chat được lưu tự động

### 3. Upload và xử lý tài liệu
- Chọn file PDF, DOCX, TXT hoặc ảnh
- Bot sẽ trích xuất và phân tích nội dung
- Hiển thị tóm tắt và từ khóa

### 4. Hỏi đáp về tài liệu
- Sau khi upload tài liệu, sử dụng phần "Hỏi đáp về tài liệu"
- Đặt câu hỏi về nội dung tài liệu
- Bot sẽ trả lời dựa trên nội dung đã xử lý

### 5. Gợi ý nội dung
- Nhấn "Gợi ý video" để nhận video phù hợp
- Video được gợi ý dựa trên cảm xúc và ngữ cảnh

## 🔧 Cấu trúc dự án

```
chatbot/
├── main.py                 # FastAPI server
├── requirements.txt        # Python dependencies
├── .env                   # Environment variables
├── services/
│   ├── chat_service.py    # Chat logic
│   ├── emotion_analyzer.py # Emotion analysis
│   ├── document_processor.py # Document processing & OCR
│   └── content_suggester.py # Content suggestions
├── static/
│   ├── index.html         # Main UI
│   ├── style.css          # Styling
│   └── script.js          # Frontend logic
└── uploads/               # Uploaded files
```

## 🛠️ Công nghệ sử dụng

### Backend
- **FastAPI**: Web framework hiện đại
- **Google Gemini**: LLM cho chat và phân tích
- **Gemini Vision**: OCR và xử lý ảnh
- **PyPDF2**: Xử lý file PDF
- **python-docx**: Xử lý file DOCX
- **Pillow**: Xử lý ảnh

### Frontend
- **HTML5/CSS3**: Giao diện responsive
- **JavaScript**: Logic tương tác
- **YouTube Data API**: Gợi ý video

## 🔑 API Keys

### Google Gemini API
1. Truy cập [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Tạo API key mới
3. Thêm vào file `.env`

### YouTube Data API (tùy chọn)
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project và enable YouTube Data API v3
3. Tạo API key
4. Thêm vào file `.env`

## 🐛 Xử lý lỗi thường gặp

### Lỗi OCR
- **Trước đây**: Cần cài đặt Tesseract OCR
- **Hiện tại**: Sử dụng Gemini Vision, không cần cài đặt thêm

### Lỗi API
- Kiểm tra API keys trong file `.env`
- Đảm bảo có kết nối internet
- Kiểm tra quota của API

### Lỗi upload file
- Kiểm tra định dạng file được hỗ trợ
- Đảm bảo file không quá lớn
- Kiểm tra quyền ghi trong thư mục uploads

## 📈 Tính năng nâng cao

### Xử lý tài liệu nâng cao
- Phân tích cấu trúc tài liệu
- Trích xuất bảng và biểu đồ
- Hỗ trợ đa ngôn ngữ

### Phân tích cảm xúc nâng cao
- Theo dõi xu hướng cảm xúc theo thời gian
- Phân tích ngữ cảnh và ý định
- Gợi ý hành động dựa trên cảm xúc

### Tích hợp nâng cao
- Kết nối với cơ sở dữ liệu
- Hỗ trợ đa người dùng
- Backup và restore dữ liệu

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng:
1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📄 License

MIT License - xem file LICENSE để biết thêm chi tiết.

## 📞 Hỗ trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra phần "Xử lý lỗi thường gặp"
2. Tạo issue trên GitHub
3. Mô tả chi tiết lỗi và cách tái hiện

---

**SenseBot** - Trợ lý thông minh cho cuộc sống số! 🚀 