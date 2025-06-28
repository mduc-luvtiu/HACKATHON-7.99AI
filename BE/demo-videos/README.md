# Demo Videos Directory

Thư mục này chứa các video mẫu để demo hệ thống AI Video Hub.

## Cấu trúc thư mục

```
demo-videos/
├── ai-intro.mp4              # Video giới thiệu AI và Machine Learning
├── ai-intro-thumb.jpg        # Thumbnail cho video AI intro
├── python-tutorial.mp4       # Video hướng dẫn Python
├── python-tutorial-thumb.jpg # Thumbnail cho video Python
├── react-nextjs.mp4          # Video về React và Next.js
├── react-nextjs-thumb.jpg    # Thumbnail cho video React
└── README.md                 # File này
```

## Hướng dẫn sử dụng

1. **Thêm video mẫu**: Đặt các file video MP4 vào thư mục này
2. **Thêm thumbnail**: Tạo file thumbnail JPG tương ứng với tên video
3. **Cập nhật database**: Chạy lệnh `npm run seed` để cập nhật dữ liệu mẫu

## Yêu cầu video

- **Định dạng**: MP4
- **Độ phân giải**: 720p hoặc 1080p
- **Thời lượng**: 5-60 phút
- **Kích thước**: Tối đa 100MB mỗi video

## Yêu cầu thumbnail

- **Định dạng**: JPG
- **Kích thước**: 320x240 pixels
- **Tên file**: `{video-name}-thumb.jpg`

## Lưu ý

- Các video trong thư mục này chỉ dùng cho mục đích demo
- Trong môi trường production, video sẽ được lưu trữ trên cloud storage
- Đảm bảo có quyền sử dụng các video mẫu 