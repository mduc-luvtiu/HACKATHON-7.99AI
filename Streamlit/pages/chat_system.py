import streamlit as st
from utils.database import add_chat_message, get_chat_history, log_user_activity

def show_chat_interface():
    """Show main chat interface"""
    st.title("💬 Chat AI")
    
    # Chat type selection
    chat_type = st.selectbox(
        "Chọn loại chat:",
        ["general", "video_specific", "group"],
        format_func=lambda x: {
            "general": "🤖 Chat chung với AI",
            "video_specific": "🎬 Chat về video cụ thể",
            "group": "👥 Chat nhóm"
        }[x]
    )
    
    if chat_type == "general":
        show_general_chat()
    elif chat_type == "video_specific":
        show_video_chat()
    elif chat_type == "group":
        show_group_chat()

def show_general_chat():
    """Show general AI chat"""
    st.subheader("🤖 Chat chung với AI")
    
    # Chat container
    chat_container = st.container()
    
    with chat_container:
        # Display chat history
        chat_history = get_chat_history(st.session_state.user_id, limit=20)
        
        for message in reversed(chat_history):
            message_id, user_id, video_id, message_type, content, timestamp, metadata = message
            
            if message_type == "user":
                st.markdown(f"""
                <div style="background-color: #d4edda; padding: 1rem; border-radius: 10px; margin: 0.5rem 0; text-align: right;">
                    <strong>Bạn:</strong> {content}
                    <br><small style="color: #666;">{timestamp}</small>
                </div>
                """, unsafe_allow_html=True)
            else:
                st.markdown(f"""
                <div style="background-color: #e8f4fd; padding: 1rem; border-radius: 10px; margin: 0.5rem 0;">
                    <strong>AI:</strong> {content}
                    <br><small style="color: #666;">{timestamp}</small>
                </div>
                """, unsafe_allow_html=True)
    
    # Chat input
    with st.form("general_chat_form"):
        user_message = st.text_area("Nhập tin nhắn của bạn:", height=100, placeholder="Hỏi AI bất cứ điều gì...")
        
        col1, col2, col3 = st.columns([1, 1, 2])
        
        with col1:
            submit = st.form_submit_button("Gửi")
        
        with col2:
            if st.form_submit_button("🎤 Ghi âm"):
                st.info("Tính năng ghi âm sẽ được thêm sau!")
        
        with col3:
            if st.form_submit_button("📷 Gửi ảnh"):
                st.info("Tính năng gửi ảnh sẽ được thêm sau!")
        
        if submit and user_message:
            # Add user message to database
            add_chat_message(st.session_state.user_id, "user", user_message)
            
            # Generate AI response
            ai_response = generate_ai_response(user_message)
            
            # Add AI response to database
            add_chat_message(st.session_state.user_id, "ai", ai_response)
            
            # Log activity
            log_user_activity(st.session_state.user_id, "chat", f"General chat: {user_message[:50]}")
            
            st.rerun()

def show_video_chat():
    """Show video-specific chat"""
    st.subheader("🎬 Chat về video cụ thể")
    
    # Video selection
    from utils.database import get_user_videos
    videos = get_user_videos(st.session_state.user_id)
    
    if not videos:
        st.warning("Bạn chưa có video nào. Hãy thêm video trước!")
        return
    
    # Create video selection
    video_options = {f"{v[2]} (ID: {v[0]})": v[0] for v in videos}
    selected_video_title = st.selectbox("Chọn video:", list(video_options.keys()))
    selected_video_id = video_options[selected_video_title]
    
    # Get video info
    from utils.database import get_video_by_id
    video = get_video_by_id(selected_video_id)
    
    if video:
        video_id, user_id, title, description, source_type, source_url, file_path, thumbnail_path, duration, status, created_at, updated_at = video
        
        st.info(f"Đang chat về video: **{title}**")
        
        # Chat container
        chat_container = st.container()
        
        with chat_container:
            # Display chat history for this video
            chat_history = get_chat_history(st.session_state.user_id, selected_video_id, limit=15)
            
            for message in reversed(chat_history):
                message_id, user_id, msg_video_id, message_type, content, timestamp, metadata = message
                
                if message_type == "user":
                    st.markdown(f"""
                    <div style="background-color: #d4edda; padding: 1rem; border-radius: 10px; margin: 0.5rem 0; text-align: right;">
                        <strong>Bạn:</strong> {content}
                        <br><small style="color: #666;">{timestamp}</small>
                    </div>
                    """, unsafe_allow_html=True)
                else:
                    st.markdown(f"""
                    <div style="background-color: #e8f4fd; padding: 1rem; border-radius: 10px; margin: 0.5rem 0;">
                        <strong>AI:</strong> {content}
                        <br><small style="color: #666;">{timestamp}</small>
                    </div>
                    """, unsafe_allow_html=True)
        
        # Chat input
        with st.form("video_chat_form"):
            user_message = st.text_area("Hỏi về video này:", height=100, placeholder=f"Hỏi về video '{title}'...")
            
            col1, col2 = st.columns([1, 3])
            
            with col1:
                submit = st.form_submit_button("Gửi")
            
            with col2:
                if st.form_submit_button("🎤 Ghi âm câu hỏi"):
                    st.info("Tính năng ghi âm sẽ được thêm sau!")
            
            if submit and user_message:
                # Add user message to database
                add_chat_message(st.session_state.user_id, "user", user_message, selected_video_id)
                
                # Generate AI response about the video
                ai_response = generate_video_ai_response(user_message, title, description)
                
                # Add AI response to database
                add_chat_message(st.session_state.user_id, "ai", ai_response, selected_video_id)
                
                # Log activity
                log_user_activity(st.session_state.user_id, "chat", f"Video chat about '{title}': {user_message[:50]}")
                
                st.rerun()

def show_group_chat():
    """Show group chat interface"""
    st.subheader("👥 Chat nhóm")
    
    st.info("Tính năng chat nhóm sẽ được phát triển trong phiên bản tiếp theo!")
    
    # Placeholder for group chat features
    st.markdown("""
    ### Tính năng chat nhóm sẽ bao gồm:
    - Tạo và tham gia nhóm chat
    - Chat real-time với nhiều người dùng
    - Chia sẻ video và tài liệu
    - Ghi chú và đánh dấu
    - Lịch sử chat nhóm
    """)

def generate_ai_response(user_message):
    """Generate AI response for general chat"""
    # Simple AI response generation
    responses = [
        f"Cảm ơn câu hỏi của bạn! Tôi có thể giúp bạn với điều đó. {user_message[:50]}...",
        f"Đây là một câu hỏi thú vị. Dựa trên kiến thức của tôi, tôi có thể chia sẻ rằng...",
        f"Tôi hiểu bạn đang hỏi về '{user_message[:30]}...'. Đây là câu trả lời của tôi...",
        f"Rất vui được trò chuyện với bạn! Về vấn đề này, tôi nghĩ rằng...",
        f"Tôi có thể giúp bạn với điều đó. Hãy để tôi giải thích chi tiết..."
    ]
    
    import random
    return random.choice(responses)

def generate_video_ai_response(user_message, video_title, video_description):
    """Generate AI response for video-specific chat"""
    # Video-specific AI response generation
    responses = [
        f"Về video '{video_title}', tôi có thể giải thích rằng {video_description[:100]}...",
        f"Trong video này, chúng ta đã thảo luận về nhiều khía cạnh. Để trả lời câu hỏi của bạn về '{user_message[:30]}...'...",
        f"Video '{video_title}' cung cấp thông tin chi tiết về chủ đề này. Dựa trên nội dung, tôi có thể chia sẻ rằng...",
        f"Đây là một câu hỏi thú vị về video. Tôi có thể thấy rằng video đề cập đến '{user_message[:40]}...'...",
        f"Cảm ơn câu hỏi của bạn! Video này thực sự rất hữu ích về chủ đề này..."
    ]
    
    import random
    return random.choice(responses)

# For direct page access
if __name__ == "__main__":
    if 'authenticated' not in st.session_state or not st.session_state.authenticated:
        st.error("Vui lòng đăng nhập trước!")
        st.stop()
    
    show_chat_interface() 