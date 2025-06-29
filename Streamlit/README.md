# 🎥 AI Video Assistant

Ứng dụng Streamlit hoàn chỉnh cho việc xem video thông minh với AI, bao gồm thuyết minh real-time, chat AI, và nhiều tính năng nâng cao.

## 🌟 Tính năng chính

### 1. 🔐 Hệ thống xác thực
- Đăng ký và đăng nhập tài khoản
- Quản lý phiên làm việc
- Phân quyền người dùng (User, Premium, Admin)

### 2. 📹 Quản lý Video
- **Thêm video từ nhiều nguồn:**
  - YouTube URL
  - Upload file video
  - Link video trực tiếp
- **Quản lý video:**
  - Danh sách video cá nhân
  - Tìm kiếm và lọc
  - Chỉnh sửa thông tin
  - Xóa video

### 3. 🎬 Xem Video Thông Minh
- **Video Player:**
  - Phát video từ YouTube, file upload, hoặc URL
  - Thông tin video chi tiết
  - Timeline và điều khiển
- **Tính năng AI:**
  - 🎤 Thuyết minh real-time với tùy chọn ngôn ngữ, giọng đọc, tốc độ
  - 📝 Tóm tắt nội dung tự động
  - 🔍 Tra cứu theo timestamp và từ khóa
  - 💬 Chat AI về nội dung video

### 4. 💬 Chat AI
- **Chat chung với AI:** Trò chuyện về bất kỳ chủ đề nào
- **Chat về video cụ thể:** Đặt câu hỏi về nội dung video
- **Chat nhóm:** (Sẽ được phát triển trong phiên bản tiếp theo)
- **Lịch sử chat:** Lưu trữ và xem lại các cuộc trò chuyện

### 5. 🤖 Tính năng AI nâng cao
- **🖼️ Nhận diện hình ảnh:** Phân tích và liên kết với video
- **😊 Phân tích cảm xúc:** Hiểu cảm xúc người dùng
- **💡 Đề xuất nội dung:** Gợi ý video và chủ đề phù hợp
- **🎯 AI đa phương tiện:** Tương tác qua text, hình ảnh, âm thanh

### 6. 👨‍💼 Admin Dashboard
- **Thống kê tổng quan:** Metrics và biểu đồ
- **Quản lý người dùng:** CRUD operations
- **Quản lý video:** Kiểm duyệt và quản lý nội dung
- **Cài đặt hệ thống:** Cấu hình và bảo trì
- **Báo cáo:** Analytics chi tiết

## 🚀 Cài đặt và chạy

### Yêu cầu hệ thống
- Python 3.8+
- pip
- Git

### Bước 1: Clone repository
```bash
git clone <repository-url>
cd AI-Video-Assistant
```

### Bước 2: Cài đặt dependencies
```bash
pip install -r requirements.txt
```

### Bước 3: Cấu hình
1. Tạo file `.env` (tùy chọn):
```env
OPENAI_API_KEY=your_openai_api_key_here
```

2. Hoặc cấu hình trực tiếp trong `config.json` (sẽ được tạo tự động)

### Bước 4: Chạy ứng dụng
```bash
streamlit run app.py
```

Ứng dụng sẽ chạy tại: `http://localhost:8501`

## 📁 Cấu trúc dự án

```
AI-Video-Assistant/
├── app.py                 # File chính của ứng dụng
├── requirements.txt       # Dependencies
├── README.md             # Hướng dẫn sử dụng
├── config.json           # Cấu hình ứng dụng (tự động tạo)
├── data/                 # Thư mục dữ liệu
│   ├── app.db           # Database SQLite
│   ├── uploads/         # Video files
│   └── thumbnails/      # Video thumbnails
├── pages/               # Các trang của ứng dụng
│   ├── __init__.py
│   ├── auth.py          # Xác thực
│   ├── main_page.py     # Trang chủ
│   ├── video_manager.py # Quản lý video
│   ├── video_player.py  # Xem video
│   ├── chat_system.py   # Chat AI
│   ├── ai_features.py   # Tính năng AI
│   └── admin_dashboard.py # Admin dashboard
└── utils/               # Utilities
    ├── __init__.py
    ├── config.py        # Quản lý cấu hình
    └── database.py      # Database operations
```

## 🎯 Hướng dẫn sử dụng

### Đăng ký và đăng nhập
1. Truy cập ứng dụng
2. Chọn "Đăng ký" để tạo tài khoản mới
3. Hoặc sử dụng tài khoản demo:
   - Username: `demo`
   - Password: `demo123`

### Thêm video
1. Đăng nhập vào hệ thống
2. Chọn "Quản lý Video" từ sidebar
3. Chọn tab "Thêm video mới"
4. Chọn nguồn video (YouTube, Upload, URL)
5. Nhập thông tin và xác nhận

### Xem video với AI
1. Chọn video từ danh sách
2. Sử dụng các nút điều khiển:
   - 🎤 Thuyết minh AI
   - 📝 Tóm tắt
   - 🔍 Tra cứu
   - 💬 Chat AI

### Chat với AI
1. Chọn "Chat AI" từ sidebar
2. Chọn loại chat (Chung, Video cụ thể, Nhóm)
3. Nhập câu hỏi và nhận câu trả lời từ AI

### Tính năng AI nâng cao
1. Chọn "Tính năng AI" từ sidebar
2. Khám phá các tính năng:
   - Nhận diện hình ảnh
   - Phân tích cảm xúc
   - Đề xuất nội dung
   - AI đa phương tiện

## 🔧 Cấu hình

### Database
- SQLite database tự động được tạo tại `data/app.db`
- Các bảng được tạo tự động khi chạy lần đầu

### Video Processing
- Hỗ trợ format: MP4, AVI, MOV, MKV
- Kích thước tối đa: 100MB (có thể thay đổi trong config)
- YouTube videos được xử lý qua pytube

### AI Features
- OpenAI API cho chat và tóm tắt
- Có thể thay đổi model trong config
- Fallback responses khi không có API key

## 🛠️ Phát triển

### Thêm tính năng mới
1. Tạo file mới trong thư mục `pages/`
2. Import và thêm vào navigation trong `app.py`
3. Cập nhật database schema nếu cần

### Customize UI
- CSS được định nghĩa trong `app.py`
- Có thể thêm custom components
- Responsive design cho mobile

### Database Schema
```sql
-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_admin BOOLEAN DEFAULT FALSE
);

-- Videos table
CREATE TABLE videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    source_type TEXT NOT NULL,
    source_url TEXT,
    file_path TEXT,
    thumbnail_path TEXT,
    duration INTEGER,
    status TEXT DEFAULT 'processing',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Chat messages table
CREATE TABLE chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    video_id INTEGER,
    message_type TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (video_id) REFERENCES videos (id)
);
```

## 🐛 Troubleshooting

### Lỗi thường gặp

1. **Import error:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Database error:**
   - Xóa file `data/app.db` và chạy lại
   - Database sẽ được tạo tự động

3. **YouTube video không load:**
   - Kiểm tra URL YouTube
   - Cập nhật pytube: `pip install --upgrade pytube`

4. **File upload error:**
   - Kiểm tra kích thước file
   - Kiểm tra format được hỗ trợ

### Logs
- Streamlit logs hiển thị trong terminal
- Database logs có thể xem trong `data/app.db`

## 📈 Roadmap

### Phiên bản tiếp theo
- [ ] Chat nhóm real-time
- [ ] Voice recognition
- [ ] Video editing tools
- [ ] Mobile app
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] Cloud storage integration
- [ ] API endpoints

### Tính năng nâng cao
- [ ] Real-time video processing
- [ ] Advanced AI models
- [ ] Social features
- [ ] Monetization
- [ ] Enterprise features

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📄 License

MIT License - xem file LICENSE để biết thêm chi tiết.

## 📞 Hỗ trợ

- Tạo issue trên GitHub
- Email: support@aivideoassistant.com
- Documentation: [Wiki](link-to-wiki)

---

**AI Video Assistant** - Nền tảng xem video thông minh với AI 🚀 