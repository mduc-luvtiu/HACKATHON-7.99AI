import streamlit as st
import os
from pathlib import Path
from utils.database import add_video, get_user_videos, update_video_status, log_user_activity
from utils.config import get_config_value
import pytube
import requests
from PIL import Image
import io
import yt_dlp
import re

def show_video_manager():
    """Show video management page"""
    st.title("📹 Quản lý Video")
    
    # Create tabs
    tab1, tab2 = st.tabs(["➕ Thêm video mới", "📋 Danh sách video của tôi"])
    
    with tab1:
        show_add_video_form()
    
    with tab2:
        show_video_list()

def show_add_video_form():
    """Show form to add new video với UI đẹp hơn"""
    st.markdown(
        '''
        <div style="background: #fff; border-radius: 16px; box-shadow: 0 2px 8px #0001; padding: 2rem; margin-bottom: 2rem;">
            <h2 style="color: #2d6cdf; margin-bottom: 1rem;">
                <span style="font-size: 2rem; vertical-align: middle;">🎬</span> Thêm video mới
            </h2>
        </div>
        ''',
        unsafe_allow_html=True
    )

    col1, col2 = st.columns([2, 1])

    with col1:
        st.markdown("#### Chọn nguồn video:")
        source_type = st.selectbox(
            "",
            [
                "🎥 Link YouTube | Liên kết YouTube",
                "📁 Upload file video | Tải lên video tệp lên",
                "🔗 Link video trực tiếp | Link video trực tiếp"
            ],
            key="source_type_selectbox"
        )
        # Map lại cho logic cũ
        if source_type.startswith("🎥"):
            source_type_val = "youtube"
        elif source_type.startswith("📁"):
            source_type_val = "upload"
        else:
            source_type_val = "url"
        # Gọi form tương ứng
        if source_type_val == "youtube":
            show_youtube_form()
        elif source_type_val == "upload":
            show_upload_form()
        elif source_type_val == "url":
            show_url_form()

    with col2:
        st.info("""
        💡 **Hướng dẫn:**
        - Thêm video từ YouTube, upload file hoặc dán link video trực tiếp.
        - Hỗ trợ định dạng: mp4, avi, mov, mkv.
        - Video sẽ được xử lý AI sau khi tải lên thành công.
        """)

    st.markdown(
        '''
        <style>
        .stButton>button {
            background: linear-gradient(90deg, #2d6cdf 0%, #4f8cff 100%);
            color: white;
            border-radius: 8px;
            font-size: 1.1rem;
            padding: 0.75rem 2rem;
            margin-top: 1rem;
            transition: 0.2s;
        }
        .stButton>button:hover {
            background: linear-gradient(90deg, #4f8cff 0%, #2d6cdf 100%);
            color: #fff;
            box-shadow: 0 2px 8px #2d6cdf33;
        }
        .stSelectbox>div>div {
            border-radius: 8px !important;
            font-size: 1.1rem !important;
        }
        </style>
        ''',
        unsafe_allow_html=True
    )

def show_youtube_form():
    """Show YouTube URL form (dùng yt-dlp để tải video về server, ép chuẩn mp4 H.264/AAC)"""
    st.markdown("### 🎥 Thêm video từ YouTube")
    
    with st.form("youtube_form"):
        youtube_url = st.text_input("Nhập URL YouTube:")
        title = st.text_input("Tiêu đề video (tùy chọn):")
        description = st.text_area("Mô tả (tùy chọn):")
        
        submit = st.form_submit_button("Thêm video")
        
        if submit:
            if youtube_url:
                try:
                    # Tạo thư mục uploads nếu chưa có
                    upload_dir = Path("data/uploads")
                    upload_dir.mkdir(parents=True, exist_ok=True)
                    
                    # Đặt outtmpl để yt-dlp tự lấy video_id
                    outtmpl = str(upload_dir / "youtube_%(id)s.%(ext)s")
                    
                    # Ép tải video mp4 chuẩn H.264/AAC (avc1/m4a)
                    ydl_opts = {
                        'outtmpl': outtmpl,
                        'format': 'bestvideo[ext=mp4][vcodec^=avc1]+bestaudio[ext=m4a]/best[ext=mp4]/best',
                        'merge_output_format': 'mp4',
                        'quiet': True,
                        'no_warnings': True,
                    }
                    
                    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                        info = ydl.extract_info(youtube_url, download=True)
                        video_id_str = info.get('id')
                        video_title = title or info.get('title', 'YouTube Video')
                        video_desc = description or info.get('description', '')
                        thumbnail_url = info.get('thumbnail')
                        duration = info.get('duration')
                        ext = info.get('ext', 'mp4')
                        file_path = str(upload_dir / f"youtube_{video_id_str}.{ext}")
                    
                    # Kiểm tra file có tồn tại không
                    if not Path(file_path).exists():
                        st.error(f"Không tìm thấy file đã tải: {file_path}")
                        return
                    
                    # Lưu vào database
                    db_video_id = add_video(
                        user_id=st.session_state.user_id,
                        title=video_title,
                        description=video_desc or f"Video từ YouTube: {youtube_url}",
                        source_type="youtube",
                        source_url=youtube_url,
                        file_path=file_path
                    )
                    
                    if db_video_id:
                        # Lưu thumbnail nếu có
                        thumbnail_path = None
                        if thumbnail_url:
                            thumbnail_path = save_thumbnail(thumbnail_url, db_video_id)
                        
                        # Update video status
                        update_video_status(db_video_id, "ready", thumbnail_path, duration)
                        
                        # Log activity
                        log_user_activity(
                            st.session_state.user_id, 
                            "upload", 
                            f"Added YouTube video: {video_title}",
                            {"video_id": db_video_id, "source": "youtube"}
                        )
                        
                        st.success(f"Đã tải và thêm video '{video_title}' thành công!")
                        st.info(f"File: {file_path}")
                        st.rerun()
                    else:
                        st.error("Có lỗi xảy ra khi thêm video vào database!")
                        
                except Exception as e:
                    st.error(f"Không thể tải video YouTube: {str(e)}")
                    st.info("Thử lại với URL khác hoặc kiểm tra kết nối mạng")
            else:
                st.warning("Vui lòng nhập URL YouTube!")

def show_upload_form():
    """Show file upload form"""
    st.markdown("### 📁 Upload file video")
    
    # Get allowed formats
    allowed_formats = get_config_value("video.allowed_formats", ["mp4", "avi", "mov", "mkv"])
    max_size = get_config_value("video.max_file_size", 100)  # MB
    
    st.info(f"Định dạng hỗ trợ: {', '.join(allowed_formats)} | Kích thước tối đa: {max_size}MB")
    
    uploaded_file = st.file_uploader(
        "Chọn file video:",
        type=allowed_formats,
        help="Chọn file video từ máy tính của bạn"
    )
    
    if uploaded_file is not None:
        # Show file info
        file_size = uploaded_file.size / (1024 * 1024)  # Convert to MB
        st.write(f"**Tên file:** {uploaded_file.name}")
        st.write(f"**Kích thước:** {file_size:.2f} MB")
        st.write(f"**Định dạng:** {uploaded_file.type}")
        
        if file_size > max_size:
            st.error(f"File quá lớn! Kích thước tối đa là {max_size}MB")
        else:
            with st.form("upload_form"):
                title = st.text_input("Tiêu đề video:", value=uploaded_file.name)
                description = st.text_area("Mô tả (tùy chọn):")
                
                submit = st.form_submit_button("Upload video")
                
                if submit:
                    try:
                        # Save file
                        file_path = save_uploaded_file(uploaded_file)
                        
                        # Generate thumbnail
                        thumbnail_path = generate_thumbnail(file_path)
                        
                        # Add to database
                        video_id = add_video(
                            user_id=st.session_state.user_id,
                            title=title,
                            description=description or f"Video đã upload: {uploaded_file.name}",
                            source_type="upload",
                            file_path=file_path
                        )
                        
                        if video_id:
                            # Update video status
                            update_video_status(video_id, "ready", thumbnail_path)
                            
                            # Log activity
                            log_user_activity(
                                st.session_state.user_id,
                                "upload",
                                f"Uploaded video: {title}",
                                {"video_id": video_id, "source": "upload", "file_size": file_size}
                            )
                            
                            st.success(f"Đã upload video '{title}' thành công!")
                            st.rerun()
                        else:
                            st.error("Có lỗi xảy ra khi thêm video!")
                            
                    except Exception as e:
                        st.error(f"Có lỗi xảy ra khi upload: {str(e)}")

def show_url_form():
    """Show direct URL form"""
    st.markdown("### 🔗 Thêm video từ URL")
    
    with st.form("url_form"):
        video_url = st.text_input("Nhập URL video:")
        title = st.text_input("Tiêu đề video:")
        description = st.text_area("Mô tả (tùy chọn):")
        
        submit = st.form_submit_button("Thêm video")
        
        if submit:
            if video_url and title:
                try:
                    # Add to database
                    video_id = add_video(
                        user_id=st.session_state.user_id,
                        title=title,
                        description=description or f"Video từ URL: {video_url}",
                        source_type="url",
                        source_url=video_url
                    )
                    
                    if video_id:
                        # Log activity
                        log_user_activity(
                            st.session_state.user_id,
                            "upload",
                            f"Added URL video: {title}",
                            {"video_id": video_id, "source": "url"}
                        )
                        
                        st.success(f"Đã thêm video '{title}' thành công!")
                        st.rerun()
                    else:
                        st.error("Có lỗi xảy ra khi thêm video!")
                        
                except Exception as e:
                    st.error(f"Có lỗi xảy ra: {str(e)}")
            else:
                st.warning("Vui lòng nhập URL và tiêu đề!")

def show_video_list():
    """Show list of user's videos"""
    st.subheader("Danh sách video của tôi")
    
    # Get user's videos
    videos = get_user_videos(st.session_state.user_id)
    
    if videos:
        # Search and filter
        col1, col2 = st.columns([2, 1])
        with col1:
            search_term = st.text_input("🔍 Tìm kiếm video:", placeholder="Nhập tên video...")
        with col2:
            status_filter = st.selectbox("Trạng thái:", ["Tất cả", "ready", "processing", "error"])
        
        # Filter videos
        filtered_videos = videos
        if search_term:
            filtered_videos = [v for v in videos if search_term.lower() in v[2].lower()]
        if status_filter != "Tất cả":
            filtered_videos = [v for v in filtered_videos if v[9] == status_filter]
        
        # Display videos
        for video in filtered_videos:
            show_video_item(video)
    else:
        st.info("Bạn chưa có video nào. Hãy thêm video đầu tiên!")

def show_video_item(video):
    """Show a single video item in the list"""
    video_id, user_id, title, description, source_type, source_url, file_path, thumbnail_path, duration, status, created_at, updated_at = video
    
    # Create video card
    col1, col2, col3 = st.columns([3, 2, 1])
    
    with col1:
        st.markdown(f"""
        <div style="border: 1px solid #ddd; border-radius: 10px; padding: 1rem; margin: 0.5rem 0;">
            <h4>{title}</h4>
            <p style="color: #666;">{description[:100]}{'...' if len(description) > 100 else ''}</p>
            <p style="color: #888; font-size: 0.9rem;">
                <strong>Nguồn:</strong> {source_type} | 
                <strong>Trạng thái:</strong> {status} |
                <strong>Ngày tạo:</strong> {created_at[:10]}
            </p>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        # Status indicator
        if status == "ready":
            st.success("✅ Sẵn sàng")
        elif status == "processing":
            st.warning("⏳ Đang xử lý")
        else:
            st.error("❌ Lỗi")
        
        # Duration
        if duration:
            minutes = duration // 60
            seconds = duration % 60
            st.write(f"⏱️ {minutes}:{seconds:02d}")
    
    with col3:
        # Action buttons
        if st.button("👁️ Xem", key=f"view_{video_id}"):
            st.session_state.current_video = video_id
            st.switch_page("pages/video_player.py")
        
        if st.button("✏️ Sửa", key=f"edit_{video_id}"):
            show_edit_video_form(video)
        
        if st.button("🗑️ Xóa", key=f"delete_{video_id}"):
            if st.button("Xác nhận xóa", key=f"confirm_delete_{video_id}"):
                # TODO: Implement delete video
                st.success("Đã xóa video!")

def show_edit_video_form(video):
    """Show form to edit video"""
    video_id, user_id, title, description, source_type, source_url, file_path, thumbnail_path, duration, status, created_at, updated_at = video
    
    with st.form(f"edit_form_{video_id}"):
        new_title = st.text_input("Tiêu đề:", value=title)
        new_description = st.text_area("Mô tả:", value=description)
        
        submit = st.form_submit_button("Cập nhật")
        
        if submit:
            # TODO: Implement update video
            st.success("Đã cập nhật video!")

def save_thumbnail(thumbnail_url, video_id):
    """Save thumbnail from URL"""
    try:
        response = requests.get(thumbnail_url)
        img = Image.open(io.BytesIO(response.content))
        
        # Create thumbnails directory
        thumb_dir = Path("data/thumbnails")
        thumb_dir.mkdir(parents=True, exist_ok=True)
        
        # Save thumbnail
        thumb_path = thumb_dir / f"thumb_{video_id}.jpg"
        img.save(thumb_path, "JPEG")
        
        return str(thumb_path)
    except Exception as e:
        st.error(f"Không thể lưu thumbnail: {str(e)}")
        return None

def save_uploaded_file(uploaded_file):
    """Save uploaded file"""
    # Create uploads directory
    upload_dir = Path("data/uploads")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Save file
    file_path = upload_dir / uploaded_file.name
    with open(file_path, "wb") as f:
        f.write(uploaded_file.getbuffer())
    
    return str(file_path)

def generate_thumbnail(video_path):
    """Generate thumbnail from video file"""
    try:
        # TODO: Implement video thumbnail generation
        # For now, return a placeholder
        return None
    except Exception as e:
        st.error(f"Không thể tạo thumbnail: {str(e)}")
        return None

# For direct page access
if __name__ == "__main__":
    if 'authenticated' not in st.session_state or not st.session_state.authenticated:
        st.error("Vui lòng đăng nhập trước!")
        st.stop()
    
    show_video_manager() 