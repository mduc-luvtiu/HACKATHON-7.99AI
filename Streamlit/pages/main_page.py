import streamlit as st
from utils.database import get_user_videos, log_user_activity

def show_main_page():
    """Show main page after login"""
    st.title("🏠 Trang chủ")
    
    # Welcome message
    st.markdown(f"""
    <div style="background-color: #e8f4fd; padding: 1rem; border-radius: 10px; margin: 1rem 0;">
        <h3>Xin chào, {st.session_state.username}! 👋</h3>
        <p>Chào mừng bạn đến với AI Video Assistant - Nền tảng xem video thông minh với AI</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Quick stats
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("📹 Video đã thêm", "15")
    
    with col2:
        st.metric("💬 Chat với AI", "25")
    
    with col3:
        st.metric("🤖 Lần sử dụng AI", "10")
    
    with col4:
        st.metric("⭐ Đánh giá", "4.8/5")
    
    st.markdown("---")
    
    # Quick actions
    st.subheader("🚀 Thao tác nhanh")
    
    col1, col2 = st.columns(2)
    
    with col1:
        if st.button("➕ Thêm video mới", use_container_width=True):
            st.switch_page("pages/video_manager.py")
    
    with col2:
        if st.button("📹 Xem video của tôi", use_container_width=True):
            st.switch_page("pages/video_manager.py")
    
    st.markdown("---")
    
    # Recent videos
    st.subheader("📹 Video gần đây")
    
    # Get user's recent videos
    videos = get_user_videos(st.session_state.user_id)
    
    if videos:
        # Show recent videos in a grid
        for i in range(0, min(len(videos), 6), 3):
            cols = st.columns(3)
            for j in range(3):
                if i + j < len(videos):
                    video = videos[i + j]
                    with cols[j]:
                        show_video_card(video)
    else:
        st.info("Bạn chưa có video nào. Hãy thêm video đầu tiên!")
    
    st.markdown("---")
    
    # Features overview
    st.subheader("✨ Tính năng nổi bật")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.markdown("""
        <div style="background-color: #f0f2f6; padding: 1rem; border-radius: 10px;">
            <h4>🎬 Xem Video Thông Minh</h4>
            <ul>
                <li>Phát video với thuyết minh AI real-time</li>
                <li>Tóm tắt nội dung tự động</li>
                <li>Tra cứu theo timestamp</li>
            </ul>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown("""
        <div style="background-color: #f0f2f6; padding: 1rem; border-radius: 10px;">
            <h4>💬 Chat AI</h4>
            <ul>
                <li>Trò chuyện với AI về video</li>
                <li>Đặt câu hỏi và nhận câu trả lời</li>
                <li>Chat nhóm với người khác</li>
            </ul>
        </div>
        """, unsafe_allow_html=True)
    
    with col3:
        st.markdown("""
        <div style="background-color: #f0f2f6; padding: 1rem; border-radius: 10px;">
            <h4>🤖 Tính năng AI</h4>
            <ul>
                <li>Nhận diện hình ảnh</li>
                <li>Phân tích cảm xúc</li>
                <li>Đề xuất nội dung liên quan</li>
            </ul>
        </div>
        """, unsafe_allow_html=True)

def show_video_card(video):
    """Show a video card in the grid"""
    video_id, user_id, title, description, source_type, source_url, file_path, thumbnail_path, duration, status, created_at, updated_at = video
    
    st.markdown(f"""
    <div style="border: 1px solid #ddd; border-radius: 10px; padding: 1rem; margin: 0.5rem 0;">
        <h5>{title}</h5>
        <p style="color: #666; font-size: 0.9rem;">{description[:50]}{'...' if len(description) > 50 else ''}</p>
        <p style="color: #888; font-size: 0.8rem;">Nguồn: {source_type}</p>
        <p style="color: #888; font-size: 0.8rem;">Trạng thái: {status}</p>
    </div>
    """, unsafe_allow_html=True)
    
    if st.button(f"Xem video {video_id}", key=f"view_{video_id}"):
        st.session_state.current_video = video_id
        st.switch_page("pages/video_player.py")

# For direct page access
if __name__ == "__main__":
    if 'authenticated' not in st.session_state or not st.session_state.authenticated:
        st.error("Vui lòng đăng nhập trước!")
        st.stop()
    
    show_main_page() 