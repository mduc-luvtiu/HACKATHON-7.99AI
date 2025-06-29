# 🎬 AI Video Thuyết Minh - Streamlit App

Ứng dụng web để tự động tạo video thuyết minh từ video YouTube bằng AI với chatbot tương tác.

## ✨ Tính năng

- 📥 Tải video từ YouTube
- 🎵 Trích xuất audio từ video
- 📝 Chuyển đổi giọng nói thành văn bản (Speech-to-Text)
- 🌐 Dịch thuật từ tiếng Anh sang tiếng Việt
- 🎤 Tạo giọng nói tiếng Việt với nhiều giọng đọc khác nhau
- 🎬 Ghép video gốc với giọng thuyết minh
- 🤖 Chatbot tương tác với nội dung video
- 📱 Giao diện web thân thiện với Streamlit

## 🚀 Cách sử dụng

### 1. Cài đặt dependencies

```bash
pip install -r requirements_streamlit.txt
```

### 2. Chạy ứng dụng

**Cách 1: Sử dụng file batch (Windows)**
```bash
run_streamlit.bat
```

**Cách 2: Chạy trực tiếp**
```bash
streamlit run streamlit_app.py
```

### 3. Sử dụng giao diện

#### 🎥 Tạo Video Mới
1. **Nhập URL YouTube** vào ô input
2. **Chọn giọng nói** trong sidebar (giahuy, ngoclam)
3. **Nhấn nút "Tạo Thuyết Minh"**
4. **Chờ** quá trình xử lý hoàn tất
5. **Xem và tải xuống** video thuyết minh

#### 🤖 Chatbot Tương Tác
- **Vị trí**: Bên phải màn hình
- **Chức năng**: 
  - Tóm tắt nội dung video
  - Tìm kiếm từ khóa trong video
  - Trả lời câu hỏi về video
  - Hiển thị thống kê video
- **Cách sử dụng**:
  - Nhập câu hỏi vào ô chat
  - Hoặc nhấn các câu hỏi thường gặp
  - Xem lịch sử chat

#### 📋 Quản lý Video
- Xem danh sách tất cả video
- Thống kê chi tiết
- Tải xuống video
- Xóa video không cần thiết

## 📁 Cấu trúc thư mục

```
thuyetminh_scr/
├── streamlit_app.py          # Ứng dụng Streamlit chính
├── chatbot_component.py      # Component chatbot
├── downloader.py             # Module tải video YouTube
├── thuyetminh_sync.py        # Module xử lý video thuyết minh
├── video_manager.py          # Quản lý video và metadata
├── requirements_streamlit.txt # Dependencies
├── run_streamlit.bat         # Script chạy trên Windows
├── test_chatbot.py           # Test script cho chatbot
├── video_data/               # Thư mục quản lý video
│   ├── videos/               # Video gốc
│   ├── transformed/          # Video thuyết minh
│   └── video_metadata.json   # Metadata video
├── voice_segments/           # Thư mục chứa các đoạn giọng nói
└── voice_segments_metadata.json # Metadata giọng nói
```

## ⚙️ Cấu hình

### Giọng nói có sẵn:
- `giahuy` - Giọng nam trẻ (mặc định)
- `ngoclam` - Giọng nữ trẻ

### Chatbot Features:
- **Tóm tắt video**: Phân tích và tóm tắt nội dung
- **Tìm kiếm**: Tìm từ khóa trong video
- **Thống kê**: Số đoạn, thời gian, nội dung
- **Lịch sử chat**: Lưu trữ cuộc hội thoại

## 🔧 Yêu cầu hệ thống

- Python 3.8+
- FFmpeg (cần cài đặt và thêm vào PATH)
- Kết nối internet ổn định
- RAM: ít nhất 4GB (khuyến nghị 8GB+)
- GPU: không bắt buộc nhưng sẽ tăng tốc độ xử lý

## 📝 Lưu ý

- ⏱️ Thời gian xử lý: 5-15 phút tùy thuộc vào độ dài video
- 🌐 Cần kết nối internet để tải video và sử dụng API
- 💾 Video sẽ được lưu trong thư mục `video_data/`
- 🔑 Cần API key FPT.AI cho tính năng TTS (đã có sẵn trong code)
- 🗑️ **Khởi động mới**: Mỗi lần chạy app sẽ xóa hết dữ liệu cũ và bắt đầu với thư mục trống

## 🤖 Sử dụng Chatbot

### Câu hỏi thường gặp:
- "Tóm tắt video"
- "Nội dung chính của video"
- "Video nói về chủ đề gì?"
- "Có bao nhiêu đoạn trong video?"
- "Tìm từ khóa 'học'"
- "Tìm từ khóa 'tiếng Anh'"

### Tính năng chatbot:
- **Tự động tải nội dung**: Từ file `voice_segments_metadata.json`
- **Tìm kiếm thông minh**: Tìm từ khóa trong nội dung video
- **Tóm tắt nội dung**: Phân tích và tóm tắt video
- **Lịch sử chat**: Lưu trữ và hiển thị cuộc hội thoại
- **Giao diện thân thiện**: Buttons cho câu hỏi thường gặp

## 🐛 Xử lý lỗi

### Lỗi tải video:
- Kiểm tra URL YouTube có hợp lệ không
- Kiểm tra kết nối internet
- Thử lại sau vài phút

### Lỗi TTS:
- Kiểm tra API key FPT.AI
- Kiểm tra kết nối internet
- Thử chọn giọng nói khác

### Lỗi FFmpeg:
- Cài đặt FFmpeg và thêm vào PATH
- Kiểm tra quyền ghi file

### Lỗi Chatbot:
- Kiểm tra file `voice_segments_metadata.json` có tồn tại không
- Đảm bảo đã tạo video thuyết minh trước khi sử dụng chatbot
- Chạy `test_chatbot.py` để kiểm tra

## 🧪 Testing

### Test Chatbot:
```bash
python test_chatbot.py
```

### Test Integration:
```bash
python check_integration.py
```

## 📞 Hỗ trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra log lỗi trong terminal
2. Đảm bảo đã cài đặt đầy đủ dependencies
3. Kiểm tra kết nối internet
4. Thử với video YouTube khác
5. Chạy script test để kiểm tra

---

🎬 **AI Video Thuyết Minh** - Tự động hóa quá trình tạo video thuyết minh với chatbot thông minh! 