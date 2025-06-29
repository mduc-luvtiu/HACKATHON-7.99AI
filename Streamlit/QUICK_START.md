# 🚀 Quick Start Guide

## Cài đặt nhanh

### 1. Cài đặt dependencies
```bash
pip install -r requirements.txt
```

### 2. Khởi tạo demo data
```bash
python setup_demo.py
```

### 3. Chạy ứng dụng
```bash
streamlit run app.py
```

## Tài khoản demo

### User Account
- **Username:** demo
- **Password:** demo123
- **Email:** demo@example.com

### Admin Account
- **Username:** admin
- **Password:** admin123
- **Email:** admin@example.com

## Tính năng chính

✅ **Đã hoàn thành:**
- 🔐 Đăng nhập/Đăng ký
- 📹 Quản lý video (YouTube, Upload, URL)
- 🎬 Video player với AI features
- 💬 Chat AI
- 🤖 Tính năng AI nâng cao
- 👨‍💼 Admin dashboard
- 📊 Thống kê và báo cáo

🔄 **Đang phát triển:**
- 🎤 Voice recognition
- 👥 Group chat
- 📱 Mobile app

## Cấu trúc file

```
├── app.py                 # Main application
├── requirements.txt       # Dependencies
├── setup_demo.py         # Demo setup script
├── README.md             # Full documentation
├── QUICK_START.md        # This file
├── pages/                # Application pages
│   ├── auth.py          # Authentication
│   ├── main_page.py     # Home page
│   ├── video_manager.py # Video management
│   ├── video_player.py  # Video player
│   ├── chat_system.py   # Chat AI
│   ├── ai_features.py   # AI features
│   └── admin_dashboard.py # Admin panel
└── utils/                # Utilities
    ├── config.py        # Configuration
    └── database.py      # Database operations
```

## Troubleshooting

### Lỗi import
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Database error
```bash
# Xóa database cũ và tạo lại
rm data/app.db
python setup_demo.py
```

### YouTube video không load
```bash
pip install --upgrade pytube
```

## Hỗ trợ

- 📖 Xem README.md để biết thêm chi tiết
- 🐛 Báo lỗi: Tạo issue trên GitHub
- 💬 Hỏi đáp: Email support@aivideoassistant.com

---

**AI Video Assistant** - Nền tảng xem video thông minh với AI 🎥✨ 