# 🎬 AI Video Narrator

Ứng dụng Streamlit để tạo video thuyết minh tự động từ YouTube với AI.

## ✨ Tính năng

- **🎥 Tải video từ YouTube**: Tự động tải video từ link YouTube
- **🎙️ Tạo thuyết minh AI**: Sử dụng AI để tạo thuyết minh tiếng Việt
- **🎭 Chọn giọng đọc**: Hỗ trợ 2 giọng đọc (Giá Huy - Nam, Ngọc Lâm - Nữ)
- **📱 Giao diện thân thiện**: Streamlit UI dễ sử dụng
- **🔄 Quản lý video**: Xem, tải xuống và xóa video
- **🧹 Khởi động sạch**: Mỗi lần chạy app sẽ xóa hết dữ liệu cũ

## 🚀 Cách sử dụng

### 1. Cài đặt

```bash
# Cài đặt dependencies
pip install -r requirements_streamlit.txt

# Kiểm tra FFmpeg
python check_ffmpeg.py
```

### 2. Chạy ứng dụng

```bash
# Chạy Streamlit app
streamlit run streamlit_app.py

# Hoặc sử dụng batch file
run_streamlit.bat
```

### 3. Sử dụng

1. **Nhập link YouTube** vào ô input
2. **Chọn giọng đọc** trong sidebar
3. **Nhấn "Tạo Thuyết Minh"** để bắt đầu xử lý
4. **Chờ** quá trình hoàn tất (5-10 phút)
5. **Xem và tải xuống** video thuyết minh

## 📁 Cấu trúc thư mục

```
thuyetminh_scr/
├── streamlit_app.py          # Ứng dụng Streamlit chính
├── video_manager.py          # Quản lý video và metadata
├── downloader.py             # Tải video từ YouTube
├── thuyetminh_sync.py        # Tạo thuyết minh AI
├── check_ffmpeg.py           # Kiểm tra FFmpeg
├── run_streamlit.bat         # Script chạy app
├── requirements_streamlit.txt # Dependencies
└── README.md                 # Hướng dẫn này
```

## 🔧 Cấu hình

### Giọng đọc có sẵn:
- **giahuy**: Giá Huy (Nam)
- **ngoclam**: Ngọc Lâm (Nữ)

### Thư mục tự động tạo:
- `video_data/videos/`: Video gốc đã tải
- `video_data/transformed/`: Video đã thuyết minh
- `video_data/video_metadata.json`: Metadata video

## ⚠️ Lưu ý quan trọng

### 🧹 Khởi động sạch
- **Mỗi lần chạy app sẽ xóa hết dữ liệu cũ**
- Tất cả video, audio, voice_segments sẽ bị xóa
- Bắt đầu với thư mục trống mới
- Đảm bảo không có xung đột dữ liệu

### 🔄 Quy trình xử lý
1. **Tải video** từ YouTube → `videos/`
2. **Tạo thuyết minh** → `video_transform/`
3. **Quản lý** → `video_data/`
4. **Xóa file tạm** sau khi hoàn thành

### 💾 Lưu trữ
- Video gốc: `video_data/videos/`
- Video thuyết minh: `video_data/transformed/`
- Metadata: `video_data/video_metadata.json`

## 🛠️ Scripts hỗ trợ

### Chạy ứng dụng
```bash
# Streamlit app
run_streamlit.bat

# Demo test
test_demo.bat
```

### Kiểm tra hệ thống
```bash
# Kiểm tra FFmpeg
python check_ffmpeg.py

# Kiểm tra tích hợp
python check_integration.py
```

## 📊 Tính năng quản lý

### Tab "Tạo Video Mới"
- Nhập link YouTube
- Chọn giọng đọc
- Tạo thuyết minh
- Xem video mới nhất
- Tải xuống video

### Tab "Quản lý Video"
- Danh sách tất cả video
- Thống kê tổng quan
- Xem chi tiết từng video
- Xóa video
- Tải xuống video thuyết minh

## 🔍 Troubleshooting

### Lỗi thường gặp:
1. **FFmpeg không tìm thấy**: Chạy `python check_ffmpeg.py`
2. **Lỗi tải video**: Kiểm tra link YouTube và kết nối internet
3. **Lỗi tạo thuyết minh**: Kiểm tra quyền ghi file và dung lượng ổ đĩa

### Debug:
```bash
# Kiểm tra FFmpeg
python check_ffmpeg.py

# Test pipeline
python test_demo.bat

# Xem log chi tiết
python thuyetminh_sync.py [video_path] [voice]
```

## 📝 Changelog

### Version 2.0
- ✅ Khởi động sạch - xóa hết dữ liệu cũ
- ✅ Giao diện Streamlit cải tiến
- ✅ Quản lý video thống nhất
- ✅ Tab chuyển đổi video gốc/thuyết minh
- ✅ Thống kê và quản lý nâng cao

### Version 1.0
- ✅ Tải video từ YouTube
- ✅ Tạo thuyết minh AI
- ✅ Giao diện cơ bản

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📄 License

MIT License - Xem file LICENSE để biết thêm chi tiết.

---

**🎬 AI Video Narrator** - Tạo video thuyết minh tự động với AI! 