import streamlit as st
import time
import os
from utils.database import get_video_by_id, add_chat_message, get_chat_history, add_video_summary, log_user_activity

def show_video_player():
    """Show video player page"""
    st.title("🎬 Xem Video")
    
    # Check if video is selected
    if 'current_video' not in st.session_state or not st.session_state.current_video:
        st.error("Không có video nào được chọn!")
        st.button("Quay lại trang chủ", on_click=lambda: st.switch_page("pages/main_page.py"))
        return
    
    # Get video info
    video = get_video_by_id(st.session_state.current_video)
    if not video:
        st.error("Không tìm thấy video!")
        return
    
    video_id, user_id, title, description, source_type, source_url, file_path, thumbnail_path, duration, status, created_at, updated_at = video
    
    # Video info header
    st.markdown(f"""
    <div style="background-color: #f0f2f6; padding: 1rem; border-radius: 10px; margin: 1rem 0;">
        <h2>{title}</h2>
        <p style="color: #666;">{description}</p>
        <p style="color: #888; font-size: 0.9rem;">
            <strong>Nguồn:</strong> {source_type} | 
            <strong>Trạng thái:</strong> {status} |
            <strong>Thời lượng:</strong> {format_duration(duration) if duration else 'N/A'}
        </p>
    </div>
    """, unsafe_allow_html=True)
    
    # Create main layout with video player and sidebar
    col1, col2 = st.columns([2, 1])
    
    with col1:
        show_video_player_main(video)
    
    with col2:
        show_video_sidebar(video)

def show_video_player_main(video):
    """Show main video player area"""
    video_id, user_id, title, description, source_type, source_url, file_path, thumbnail_path, duration, status, created_at, updated_at = video
    
    # Video player
    st.subheader("🎥 Video Player")
    
    if status != "ready":
        st.warning("Video đang được xử lý, vui lòng chờ...")
        return
    
    # Display video based on source type
    if source_type == "youtube":
        show_youtube_player(source_url)
    elif source_type == "upload":
        show_uploaded_video(file_path)
    elif source_type == "url":
        show_url_video(source_url)
    
    # Video controls
    st.markdown("---")
    show_video_controls(video)

def show_youtube_player(youtube_url):
    """Show YouTube video player"""
    # Extract video ID from YouTube URL
    import re
    video_id_match = re.search(r'(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)', youtube_url)
    
    if video_id_match:
        video_id = video_id_match.group(1)
        embed_url = f"https://www.youtube.com/embed/{video_id}"
        
        st.markdown(f"""
        <iframe 
            width="100%" 
            height="400" 
            src="{embed_url}" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
        </iframe>
        """, unsafe_allow_html=True)
    else:
        st.error("Không thể phát video YouTube!")

def show_uploaded_video(file_path):
    """Show uploaded video player"""
    if file_path and os.path.exists(file_path):
        with open(file_path, "rb") as f:
            video_bytes = f.read()
        
        st.video(video_bytes)
    else:
        st.error("Không tìm thấy file video!")

def show_url_video(url):
    """Show video from direct URL"""
    st.markdown(f"""
    <video width="100%" controls>
        <source src="{url}" type="video/mp4">
        Trình duyệt của bạn không hỗ trợ video.
    </video>
    """, unsafe_allow_html=True)

def show_video_controls(video):
    """Show video control buttons"""
    video_id, user_id, title, description, source_type, source_url, file_path, thumbnail_path, duration, status, created_at, updated_at = video
    
    st.subheader("🎛️ Điều khiển")
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        if st.button("🎤 Thuyết minh AI", use_container_width=True):
            show_narration_panel(video)
    
    with col2:
        if st.button("📝 Tóm tắt", use_container_width=True):
            show_summary_panel(video)
    
    with col3:
        if st.button("🔍 Tra cứu", use_container_width=True):
            show_search_panel(video)
    
    with col4:
        if st.button("💬 Chat AI", use_container_width=True):
            show_chat_panel(video)

def show_video_sidebar(video):
    """Show video sidebar with additional features"""
    video_id, user_id, title, description, source_type, source_url, file_path, thumbnail_path, duration, status, created_at, updated_at = video
    
    st.subheader("📋 Thông tin video")
    
    # Video metadata
    st.write(f"**Tiêu đề:** {title}")
    st.write(f"**Mô tả:** {description}")
    st.write(f"**Nguồn:** {source_type}")
    st.write(f"**Thời lượng:** {format_duration(duration) if duration else 'N/A'}")
    st.write(f"**Ngày tạo:** {created_at[:10]}")
    
    # Show thumbnail if available
    if thumbnail_path and os.path.exists(thumbnail_path):
        st.image(thumbnail_path, caption="Thumbnail", use_column_width=True)
    
    st.markdown("---")
    
    # Quick actions
    st.subheader("⚡ Thao tác nhanh")
    
    if st.button("📊 Xem thống kê", use_container_width=True):
        show_video_stats(video)
    
    if st.button("🔖 Đánh dấu", use_container_width=True):
        show_bookmark_panel(video)
    
    if st.button("📤 Chia sẻ", use_container_width=True):
        show_share_panel(video)

def show_narration_panel(video):
    """Show AI narration panel"""
    video_id, user_id, title, description, source_type, source_url, file_path, thumbnail_path, duration, status, created_at, updated_at = video
    
    st.subheader("🎤 Thuyết minh AI Real-time")
    
    # Narration settings
    col1, col2, col3 = st.columns(3)
    
    with col1:
        language = st.selectbox("Ngôn ngữ:", ["Tiếng Việt", "English", "中文"])
    
    with col2:
        voice = st.selectbox("Giọng đọc:", ["Nam", "Nữ"])
    
    with col3:
        speed = st.slider("Tốc độ:", 0.5, 2.0, 1.0, 0.1)
    
    # Start narration
    if st.button("Bắt đầu thuyết minh"):
        with st.spinner("Đang xử lý thuyết minh..."):
            # Simulate AI narration
            time.sleep(2)
            
            # Generate sample narration
            narration_text = generate_sample_narration(title, description)
            
            st.success("Thuyết minh đã sẵn sàng!")
            
            # Display narration
            st.markdown("### 📝 Nội dung thuyết minh:")
            st.write(narration_text)
            
            # Audio controls (simulated)
            st.audio("sample_audio.mp3", format="audio/mp3")  # Placeholder

def show_summary_panel(video):
    """Show AI summary panel"""
    video_id, user_id, title, description, source_type, source_url, file_path, thumbnail_path, duration, status, created_at, updated_at = video
    
    st.subheader("📝 Tóm tắt AI")
    
    # Summary options
    summary_type = st.selectbox("Loại tóm tắt:", ["Tóm tắt ngắn", "Tóm tắt chi tiết", "Điểm chính"])
    
    if st.button("Tạo tóm tắt"):
        with st.spinner("Đang tạo tóm tắt..."):
            # Simulate AI summary generation
            time.sleep(3)
            
            # Generate sample summary
            summary_text = generate_sample_summary(title, description, summary_type)
            
            # Save to database
            add_video_summary(video_id, summary_text)
            
            st.success("Đã tạo tóm tắt!")
            
            # Display summary
            st.markdown("### 📋 Tóm tắt:")
            st.write(summary_text)
            
            # Download option
            if st.button("📥 Tải về"):
                st.info("Tính năng tải về sẽ được thêm sau!")

def show_search_panel(video):
    """Show content search panel"""
    video_id, user_id, title, description, source_type, source_url, file_path, thumbnail_path, duration, status, created_at, updated_at = video
    
    st.subheader("🔍 Tra cứu nội dung")
    
    # Search options
    search_type = st.selectbox("Tìm kiếm theo:", ["Từ khóa", "Timestamp", "Chủ đề"])
    
    if search_type == "Từ khóa":
        keyword = st.text_input("Nhập từ khóa:")
        if st.button("Tìm kiếm") and keyword:
            show_search_results(video, keyword)
    
    elif search_type == "Timestamp":
        timestamp = st.text_input("Nhập thời gian (phút:giây):", placeholder="1:30")
        if st.button("Tìm kiếm") and timestamp:
            show_timestamp_results(video, timestamp)
    
    elif search_type == "Chủ đề":
        topic = st.selectbox("Chọn chủ đề:", ["Giới thiệu", "Nội dung chính", "Kết luận", "Q&A"])
        if st.button("Tìm kiếm"):
            show_topic_results(video, topic)

def show_chat_panel(video):
    """Show AI chat panel"""
    video_id, user_id, title, description, source_type, source_url, file_path, thumbnail_path, duration, status, created_at, updated_at = video
    
    st.subheader("💬 Chat với AI về video")
    
    # Chat interface
    chat_container = st.container()
    
    with chat_container:
        # Display chat history
        chat_history = get_chat_history(st.session_state.user_id, video_id, limit=10)
        
        for message in reversed(chat_history):
            message_id, user_id, msg_video_id, message_type, content, timestamp, metadata = message
            
            if message_type == "user":
                st.markdown(f"""
                <div style="background-color: #d4edda; padding: 1rem; border-radius: 10px; margin: 0.5rem 0; text-align: right;">
                    <strong>Bạn:</strong> {content}
                </div>
                """, unsafe_allow_html=True)
            else:
                st.markdown(f"""
                <div style="background-color: #e8f4fd; padding: 1rem; border-radius: 10px; margin: 0.5rem 0;">
                    <strong>AI:</strong> {content}
                </div>
                """, unsafe_allow_html=True)
    
    # Chat input
    with st.form("chat_form"):
        user_message = st.text_area("Nhập câu hỏi của bạn:", height=100)
        col1, col2 = st.columns([1, 4])
        
        with col1:
            submit = st.form_submit_button("Gửi")
        
        with col2:
            if st.form_submit_button("🎤 Ghi âm"):
                st.info("Tính năng ghi âm sẽ được thêm sau!")
        
        if submit and user_message:
            # Add user message to database
            add_chat_message(st.session_state.user_id, "user", user_message, video_id)
            
            # Generate AI response
            ai_response = generate_ai_response(user_message, title, description)
            
            # Add AI response to database
            add_chat_message(st.session_state.user_id, "ai", ai_response, video_id)
            
            st.rerun()

def show_video_stats(video):
    """Show video statistics"""
    video_id, user_id, title, description, source_type, source_url, file_path, thumbnail_path, duration, status, created_at, updated_at = video
    
    st.subheader("📊 Thống kê video")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.metric("Lượt xem", "1,234")
        st.metric("Thời gian xem trung bình", "8:45")
    
    with col2:
        st.metric("Lượt thích", "56")
        st.metric("Lượt chia sẻ", "12")

def show_bookmark_panel(video):
    """Show bookmark panel"""
    st.subheader("🔖 Đánh dấu video")
    
    with st.form("bookmark_form"):
        note = st.text_area("Ghi chú:")
        timestamp = st.text_input("Thời gian (phút:giây):", placeholder="1:30")
        
        if st.form_submit_button("Lưu đánh dấu"):
            st.success("Đã lưu đánh dấu!")

def show_share_panel(video):
    """Show share panel"""
    video_id, user_id, title, description, source_type, source_url, file_path, thumbnail_path, duration, status, created_at, updated_at = video
    
    st.subheader("📤 Chia sẻ video")
    
    share_url = f"http://localhost:8501/video/{video_id}"
    
    st.write("**Link chia sẻ:**")
    st.code(share_url)
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("📋 Copy link"):
            st.success("Đã copy link!")
    
    with col2:
        if st.button("📧 Email"):
            st.info("Tính năng email sẽ được thêm sau!")
    
    with col3:
        if st.button("📱 SMS"):
            st.info("Tính năng SMS sẽ được thêm sau!")

def show_search_results(video, keyword):
    """Show search results"""
    st.write(f"**Kết quả tìm kiếm cho '{keyword}':**")
    
    # Simulate search results
    results = [
        {"timestamp": "0:30", "content": f"Tìm thấy '{keyword}' trong phần giới thiệu"},
        {"timestamp": "2:15", "content": f"'{keyword}' được đề cập trong nội dung chính"},
        {"timestamp": "5:45", "content": f"Kết luận về '{keyword}'"}
    ]
    
    for result in results:
        st.write(f"**{result['timestamp']}:** {result['content']}")

def show_timestamp_results(video, timestamp):
    """Show timestamp results"""
    st.write(f"**Nội dung tại {timestamp}:**")
    st.write("Đây là nội dung tại thời điểm được chọn...")

def show_topic_results(video, topic):
    """Show topic results"""
    st.write(f"**Nội dung về {topic}:**")
    st.write("Đây là nội dung về chủ đề được chọn...")

def generate_sample_narration(title, description):
    """Generate sample narration text"""
    return f"""
    Chào mừng bạn đến với video "{title}". 
    
    {description}
    
    Trong video này, chúng ta sẽ tìm hiểu về các chủ đề thú vị và bổ ích. 
    Hãy cùng theo dõi để khám phá những điều mới mẻ!
    """

def generate_sample_summary(title, description, summary_type):
    """Generate sample summary text"""
    if summary_type == "Tóm tắt ngắn":
        return f"Video '{title}' cung cấp thông tin về {description[:50]}..."
    elif summary_type == "Tóm tắt chi tiết":
        return f"Video '{title}' là một tài liệu toàn diện về {description}. Video bao gồm nhiều khía cạnh quan trọng và cung cấp cái nhìn sâu sắc về chủ đề này."
    else:
        return f"Điểm chính của video '{title}':\n1. Giới thiệu tổng quan\n2. Nội dung chính\n3. Kết luận và ứng dụng"

def generate_ai_response(user_message, title, description):
    """Generate AI response to user message"""
    # Simple AI response generation
    responses = [
        f"Về video '{title}', tôi có thể giải thích rằng {description[:100]}...",
        f"Đây là một câu hỏi thú vị về video. Dựa trên nội dung, tôi có thể chia sẻ rằng...",
        f"Trong video này, chúng ta đã thảo luận về nhiều khía cạnh. Để trả lời câu hỏi của bạn...",
        f"Cảm ơn câu hỏi của bạn! Video này cung cấp thông tin chi tiết về chủ đề này..."
    ]
    
    import random
    return random.choice(responses)

def format_duration(seconds):
    """Format duration in seconds to MM:SS"""
    if not seconds:
        return "N/A"
    
    minutes = seconds // 60
    remaining_seconds = seconds % 60
    return f"{minutes}:{remaining_seconds:02d}"

# For direct page access
if __name__ == "__main__":
    if 'authenticated' not in st.session_state or not st.session_state.authenticated:
        st.error("Vui lòng đăng nhập trước!")
        st.stop()
    
    show_video_player() 