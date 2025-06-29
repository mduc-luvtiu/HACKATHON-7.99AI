import streamlit as st
import os
import time
import tempfile
from pathlib import Path
import subprocess
import sys

# Import các module cần thiết
from downloader import download_youtube_video
from thuyetminh_sync import pipeline, AVAILABLE_VOICES
from video_manager import video_manager

# Cấu hình trang
st.set_page_config(
    page_title="🎬 AI Video Narrator",
    page_icon="🎬",
    layout="wide",
    initial_sidebar_state="expanded"
)

# CSS tùy chỉnh
st.markdown("""
<style>
    .main-header {
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        padding: 2rem;
        border-radius: 10px;
        color: white;
        text-align: center;
        margin-bottom: 2rem;
    }
    .status-box {
        background: #f0f2f6;
        padding: 1rem;
        border-radius: 8px;
        border-left: 4px solid #667eea;
        margin: 1rem 0;
    }
    .video-container {
        background: #f8f9fa;
        padding: 1.5rem;
        border-radius: 10px;
        margin: 1rem 0;
    }
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin: 1rem 0;
    }
    .stat-card {
        background: white;
        padding: 1rem;
        border-radius: 8px;
        text-align: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
</style>
""", unsafe_allow_html=True)

# Header
st.markdown("""
<div class="main-header">
    <h1>🎬 AI Video Narrator</h1>
    <p>Tạo video thuyết minh tự động từ YouTube với AI</p>
</div>
""", unsafe_allow_html=True)

# Thông báo khởi động
st.info("🚀 **Khởi động mới**: Mỗi lần chạy app sẽ xóa hết dữ liệu cũ và bắt đầu với thư mục trống!")

# Sidebar
with st.sidebar:
    st.header("⚙️ Cài đặt")

    # Chọn giọng đọc từ danh sách có sẵn
    selected_voice = st.selectbox(
        "Chọn giọng đọc:",
        options=list(AVAILABLE_VOICES.keys()),
        format_func=lambda x: AVAILABLE_VOICES[x],
        help="Chọn giọng đọc cho video thuyết minh"
    )

    # Hiển thị thông tin giọng đọc
    st.info(f"🎭 **Giọng đọc hiện tại**: {AVAILABLE_VOICES[selected_voice]}")

    # Thống kê
    st.header("📊 Thống kê")
    stats = video_manager.get_video_stats()

    col1, col2 = st.columns(2)
    with col1:
        st.metric("Tổng video", stats["total_videos"])
        st.metric("Đã hoàn thành", stats["completed_videos"])

    with col2:
        st.metric("Chưa xử lý", stats["original_only"])
        st.metric("Dung lượng (MB)", f"{stats['total_size_mb']:.1f}")

# Tab chính
tab1, tab2 = st.tabs(["🎥 Tạo Video Mới", "📋 Quản lý Video"])

with tab1:
    st.header("🎥 Tạo Video Thuyết Minh Mới")

    # Form nhập liệu
    with st.form("video_form"):
        youtube_url = st.text_input(
            "🔗 Link YouTube:",
            placeholder="https://www.youtube.com/watch?v=...",
            help="Nhập link video YouTube cần tạo thuyết minh"
        )

        video_title = st.text_input(
            "📝 Tiêu đề video (tùy chọn):",
            placeholder="Để trống để sử dụng tên gốc",
            help="Tiêu đề tùy chỉnh cho video"
        )

        col1, col2 = st.columns(2)
        with col1:
            submitted = st.form_submit_button(
                "🚀 Tạo Thuyết Minh", type="primary")
        with col2:
            if st.form_submit_button("🗑️ Xóa Tất Cả"):
                if st.session_state.get('confirm_delete', False):
                    # Xóa tất cả video
                    for video in video_manager.get_all_videos():
                        video_manager.delete_video(video["id"])
                    st.success("✅ Đã xóa tất cả video!")
                    st.rerun()
                else:
                    st.session_state.confirm_delete = True
                    st.warning("⚠️ Nhấn lại để xác nhận xóa tất cả video!")

    # Xử lý form
    if submitted and youtube_url:
        if not youtube_url.startswith("https:"):
            st.error("❌ Vui lòng nhập link YouTube hợp lệ!")
        else:
            with st.spinner("🔄 Đang xử lý video..."):
                try:
                    # Hiển thị thông tin giọng đọc được chọn
                    st.info(
                        f"🎭 Sử dụng giọng đọc: {AVAILABLE_VOICES[selected_voice]}")

                    # Sử dụng hàm pipeline để xử lý toàn bộ quá trình
                    st.info("🚀 Bắt đầu pipeline xử lý video...")

                    # Gọi hàm pipeline từ thuyetminh_sync
                    video_id = pipeline(youtube_url, selected_voice)

                    if video_id:
                        st.success("🎉 Hoàn thành tạo video thuyết minh!")
                        st.balloons()

                        # Hiển thị thông tin video
                        video_info = video_manager.get_video_info(video_id)
                        if video_info:
                            st.info(f"📹 Video ID: {video_id}")
                            st.info(f"📝 Tiêu đề: {video_info['title']}")
                            st.info(
                                f"🎭 Giọng đọc: {AVAILABLE_VOICES.get(video_info.get('voice', 'giahuy'), 'Unknown')}")

                        # Tự động refresh để hiển thị video mới
                        st.rerun()
                    else:
                        st.error("❌ Lỗi trong quá trình xử lý video!")

                except Exception as e:
                    st.error(f"❌ Lỗi: {str(e)}")
                    st.exception(e)

    # Hiển thị video mới nhất
    latest_video = video_manager.get_latest_video()
    if latest_video:
        st.header("🎬 Video Mới Nhất")

        # Nút refresh thủ công
        col1, col2 = st.columns([3, 1])
        with col2:
            if st.button("🔄 Refresh", help="Làm mới để xem video mới nhất"):
                st.rerun()

        # Hiển thị thông tin tổng quan
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric("ID", latest_video["id"])
        with col2:
            st.metric("Trạng thái", latest_video["status"])
        with col3:
            voice_name = AVAILABLE_VOICES.get(
                latest_video.get("voice", "giahuy"), "Unknown")
            st.metric("Giọng đọc", voice_name)
        with col4:
            st.metric("Kích thước gốc",
                      f"{latest_video['file_size'] / (1024*1024):.1f} MB")

        # Tab chọn video
        video_tab1, video_tab2 = st.tabs(
            ["🎥 Video Gốc", "🎙️ Video Thuyết Minh"])

        with video_tab1:
            if latest_video["original_path"]:
                video_bytes = video_manager.get_video_bytes(
                    latest_video["id"], "original")
                if video_bytes:
                    st.video(video_bytes)

                    # Thông tin chi tiết video gốc
                    st.info(f"📁 Đường dẫn: {latest_video['original_path']}")
                    st.info(f"📅 Tạo lúc: {latest_video['created_time'][:19]}")
                else:
                    st.error("❌ Không thể đọc file video gốc!")
                    st.info(f"📁 Đường dẫn: {latest_video['original_path']}")

        with video_tab2:
            if latest_video.get("transformed_path"):
                video_bytes = video_manager.get_video_bytes(
                    latest_video["id"], "transformed")
                if video_bytes:
                    st.video(video_bytes)

                    # Thông tin chi tiết video thuyết minh
                    col1, col2, col3 = st.columns(3)
                    with col1:
                        st.metric(
                            "Kích thước", f"{latest_video.get('transformed_size', 0) / (1024*1024):.1f} MB")
                    with col2:
                        st.metric("Trạng thái", "Đã thuyết minh")
                    with col3:
                        voice_name = AVAILABLE_VOICES.get(
                            latest_video.get("voice", "giahuy"), "Unknown")
                        st.metric("Giọng đọc", voice_name)

                    st.info(f"📁 Đường dẫn: {latest_video['transformed_path']}")
                    if latest_video.get('transformed_time'):
                        st.info(
                            f"📅 Hoàn thành: {latest_video['transformed_time'][:19]}")

                    # Nút tải xuống
                    st.download_button(
                        label="📥 Tải xuống video thuyết minh",
                        data=video_bytes,
                        file_name=f"narrated_{latest_video['title']}.mp4",
                        mime="video/mp4"
                    )
                else:
                    st.error("❌ Không thể đọc file video thuyết minh!")
                    st.info(f"📁 Đường dẫn: {latest_video['transformed_path']}")
            else:
                st.info("⏳ Video chưa được thuyết minh. Vui lòng chờ hoặc thử lại!")
                st.info(
                    "💡 Nếu vừa tạo video, hãy nhấn nút Refresh hoặc F5 để xem kết quả.")
    else:
        st.info("📭 Chưa có video nào trong hệ thống. Hãy tạo video mới!")

with tab2:
    st.header("📋 Quản lý Video")

    # Danh sách video
    videos = video_manager.get_all_videos()

    if not videos:
        st.info("📭 Chưa có video nào trong hệ thống!")
    else:
        # Thống kê tổng quan
        st.subheader("📊 Thống kê tổng quan")
        stats = video_manager.get_video_stats()

        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric("Tổng video", stats["total_videos"])
        with col2:
            st.metric("Đã hoàn thành", stats["completed_videos"])
        with col3:
            st.metric("Chưa xử lý", stats["original_only"])
        with col4:
            st.metric("Dung lượng", f"{stats['total_size_mb']:.1f} MB")

        # Danh sách chi tiết
        st.subheader("📋 Danh sách video")

        for i, video in enumerate(videos):
            with st.expander(f"🎬 {video['title']} ({video['status']})"):
                col1, col2 = st.columns([2, 1])

                with col1:
                    st.write(f"**ID:** {video['id']}")
                    st.write(f"**YouTube URL:** {video['youtube_url']}")
                    voice_name = AVAILABLE_VOICES.get(
                        video.get("voice", "giahuy"), "Unknown")
                    st.write(f"**Giọng đọc:** {voice_name}")
                    st.write(f"**Ngày tạo:** {video['created_time'][:19]}")

                    if video.get('transformed_time'):
                        st.write(
                            f"**Hoàn thành:** {video['transformed_time'][:19]}")

                with col2:
                    # Nút xóa
                    if st.button(f"🗑️ Xóa", key=f"delete_{i}"):
                        if video_manager.delete_video(video['id']):
                            st.success("✅ Đã xóa video!")
                            st.rerun()
                        else:
                            st.error("❌ Lỗi khi xóa video!")

                    # Nút tải xuống nếu có video thuyết minh
                    if video.get("transformed_path"):
                        video_bytes = video_manager.get_video_bytes(
                            video["id"], "transformed")
                        if video_bytes:
                            st.download_button(
                                label="📥 Tải xuống",
                                data=video_bytes,
                                file_name=f"narrated_{video['title']}.mp4",
                                mime="video/mp4",
                                key=f"download_{i}"
                            )

# Footer
st.markdown("---")
st.markdown("""
<div style="text-align: center; color: #666;">
    <p>🎬 AI Video Narrator - Tạo video thuyết minh tự động với AI</p>
    <p>Mỗi lần chạy app sẽ bắt đầu với thư mục trống mới!</p>
</div>
""", unsafe_allow_html=True)
