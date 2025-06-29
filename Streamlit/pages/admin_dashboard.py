import streamlit as st
import pandas as pd
from utils.database import get_user_activity, get_user_by_id
from utils.config import get_config_value

def show_admin_dashboard():
    """Show admin dashboard"""
    st.title("👨‍💼 Admin Dashboard")
    
    # Check if user is admin
    if not is_admin():
        st.error("Bạn không có quyền truy cập trang admin!")
        return
    
    # Admin navigation
    tab1, tab2, tab3, tab4, tab5 = st.tabs([
        "📊 Thống kê tổng quan", 
        "👥 Quản lý người dùng", 
        "🎬 Quản lý video", 
        "🔧 Cài đặt hệ thống",
        "📈 Báo cáo"
    ])
    
    with tab1:
        show_overview_stats()
    
    with tab2:
        show_user_management()
    
    with tab3:
        show_video_management()
    
    with tab4:
        show_system_settings()
    
    with tab5:
        show_reports()

def is_admin():
    """Check if current user is admin"""
    if 'user_id' not in st.session_state:
        return False
    
    user = get_user_by_id(st.session_state.user_id)
    if user and len(user) > 5:
        return user[5]  # is_admin field
    return False

def show_overview_stats():
    """Show overview statistics"""
    st.subheader("📊 Thống kê tổng quan")
    
    # Key metrics
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("👥 Tổng người dùng", "1,234")
        st.metric("📈 Tăng trưởng", "+12%", "+5")
    
    with col2:
        st.metric("🎬 Tổng video", "5,678")
        st.metric("📈 Tăng trưởng", "+8%", "+23")
    
    with col3:
        st.metric("💬 Chat messages", "12,345")
        st.metric("📈 Tăng trưởng", "+15%", "+45")
    
    with col4:
        st.metric("🤖 AI interactions", "8,901")
        st.metric("📈 Tăng trưởng", "+20%", "+67")
    
    st.markdown("---")
    
    # Charts
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("📈 Hoạt động theo ngày")
        
        # Sample data
        dates = pd.date_range('2024-01-01', periods=30, freq='D')
        users = [100 + i*2 + (i%3)*10 for i in range(30)]
        videos = [50 + i*1.5 + (i%2)*5 for i in range(30)]
        
        chart_data = pd.DataFrame({
            'Ngày': dates,
            'Người dùng': users,
            'Video': videos
        })
        
        st.line_chart(chart_data.set_index('Ngày'))
    
    with col2:
        st.subheader("🎯 Phân bố người dùng")
        
        # Sample pie chart data
        user_types = ['Người dùng thường', 'Premium', 'Admin']
        user_counts = [1200, 30, 4]
        
        chart_data = pd.DataFrame({
            'Loại người dùng': user_types,
            'Số lượng': user_counts
        })
        
        st.bar_chart(chart_data.set_index('Loại người dùng'))

def show_user_management():
    """Show user management interface"""
    st.subheader("👥 Quản lý người dùng")
    
    # User search and filter
    col1, col2, col3 = st.columns(3)
    
    with col1:
        search_term = st.text_input("🔍 Tìm kiếm người dùng:", placeholder="Username hoặc email...")
    
    with col2:
        status_filter = st.selectbox("Trạng thái:", ["Tất cả", "Active", "Inactive", "Banned"])
    
    with col3:
        role_filter = st.selectbox("Vai trò:", ["Tất cả", "User", "Premium", "Admin"])
    
    # Sample user data
    users_data = [
        {"id": 1, "username": "user1", "email": "user1@example.com", "status": "Active", "role": "User", "created": "2024-01-01"},
        {"id": 2, "username": "premium_user", "email": "premium@example.com", "status": "Active", "role": "Premium", "created": "2024-01-15"},
        {"id": 3, "username": "admin", "email": "admin@example.com", "status": "Active", "role": "Admin", "created": "2024-01-01"},
        {"id": 4, "username": "banned_user", "email": "banned@example.com", "status": "Banned", "role": "User", "created": "2024-01-10"},
    ]
    
    # Filter users
    filtered_users = users_data
    if search_term:
        filtered_users = [u for u in users_data if search_term.lower() in u["username"].lower() or search_term.lower() in u["email"].lower()]
    if status_filter != "Tất cả":
        filtered_users = [u for u in filtered_users if u["status"] == status_filter]
    if role_filter != "Tất cả":
        filtered_users = [u for u in filtered_users if u["role"] == role_filter]
    
    # Display users
    st.markdown("### Danh sách người dùng")
    
    for user in filtered_users:
        with st.expander(f"{user['username']} ({user['email']})"):
            col1, col2, col3, col4 = st.columns(4)
            
            with col1:
                st.write(f"**ID:** {user['id']}")
                st.write(f"**Username:** {user['username']}")
            
            with col2:
                st.write(f"**Email:** {user['email']}")
                st.write(f"**Ngày tạo:** {user['created']}")
            
            with col3:
                status_color = {"Active": "green", "Inactive": "orange", "Banned": "red"}
                st.markdown(f"**Trạng thái:** :{status_color[user['status']]}[{user['status']}]")
                st.write(f"**Vai trò:** {user['role']}")
            
            with col4:
                if st.button("✏️ Sửa", key=f"edit_user_{user['id']}"):
                    show_edit_user_form(user)
                
                if st.button("🗑️ Xóa", key=f"delete_user_{user['id']}"):
                    if st.button("Xác nhận xóa", key=f"confirm_delete_user_{user['id']}"):
                        st.success(f"Đã xóa người dùng {user['username']}")

def show_video_management():
    """Show video management interface"""
    st.subheader("🎬 Quản lý video")
    
    # Video search and filter
    col1, col2, col3 = st.columns(3)
    
    with col1:
        search_term = st.text_input("🔍 Tìm kiếm video:", placeholder="Tiêu đề video...")
    
    with col2:
        status_filter = st.selectbox("Trạng thái video:", ["Tất cả", "ready", "processing", "error"])
    
    with col3:
        source_filter = st.selectbox("Nguồn:", ["Tất cả", "youtube", "upload", "url"])
    
    # Sample video data
    videos_data = [
        {"id": 1, "title": "AI Tutorial", "user": "user1", "status": "ready", "source": "youtube", "views": 150},
        {"id": 2, "title": "Machine Learning Basics", "user": "premium_user", "status": "ready", "source": "upload", "views": 89},
        {"id": 3, "title": "Deep Learning", "user": "user1", "status": "processing", "source": "youtube", "views": 0},
        {"id": 4, "title": "Computer Vision", "user": "admin", "status": "error", "source": "url", "views": 12},
    ]
    
    # Filter videos
    filtered_videos = videos_data
    if search_term:
        filtered_videos = [v for v in videos_data if search_term.lower() in v["title"].lower()]
    if status_filter != "Tất cả":
        filtered_videos = [v for v in filtered_videos if v["status"] == status_filter]
    if source_filter != "Tất cả":
        filtered_videos = [v for v in filtered_videos if v["source"] == source_filter]
    
    # Display videos
    st.markdown("### Danh sách video")
    
    for video in filtered_videos:
        with st.expander(f"{video['title']} (ID: {video['id']})"):
            col1, col2, col3, col4 = st.columns(4)
            
            with col1:
                st.write(f"**ID:** {video['id']}")
                st.write(f"**Tiêu đề:** {video['title']}")
            
            with col2:
                st.write(f"**Người dùng:** {video['user']}")
                st.write(f"**Nguồn:** {video['source']}")
            
            with col3:
                status_color = {"ready": "green", "processing": "orange", "error": "red"}
                st.markdown(f"**Trạng thái:** :{status_color[video['status']]}[{video['status']}]")
                st.write(f"**Lượt xem:** {video['views']}")
            
            with col4:
                if st.button("👁️ Xem", key=f"view_video_{video['id']}"):
                    st.info(f"Xem video: {video['title']}")
                
                if st.button("🗑️ Xóa", key=f"delete_video_{video['id']}"):
                    if st.button("Xác nhận xóa", key=f"confirm_delete_video_{video['id']}"):
                        st.success(f"Đã xóa video {video['title']}")

def show_system_settings():
    """Show system settings"""
    st.subheader("🔧 Cài đặt hệ thống")
    
    # System configuration
    with st.form("system_settings"):
        st.markdown("### Cấu hình chung")
        
        app_name = st.text_input("Tên ứng dụng:", value=get_config_value("app_name", "AI Video Assistant"))
        max_file_size = st.number_input("Kích thước file tối đa (MB):", value=get_config_value("video.max_file_size", 100))
        max_users = st.number_input("Số người dùng tối đa:", value=10000)
        
        st.markdown("### Cấu hình AI")
        
        ai_model = st.selectbox("Model AI:", ["gpt-3.5-turbo", "gpt-4", "claude-3"], index=0)
        max_tokens = st.number_input("Max tokens:", value=get_config_value("ai.max_tokens", 1000))
        
        st.markdown("### Cấu hình bảo mật")
        
        session_timeout = st.number_input("Thời gian timeout session (phút):", value=30)
        max_login_attempts = st.number_input("Số lần đăng nhập tối đa:", value=5)
        
        if st.form_submit_button("💾 Lưu cài đặt"):
            st.success("Đã lưu cài đặt hệ thống!")
    
    # System maintenance
    st.markdown("---")
    st.markdown("### 🛠️ Bảo trì hệ thống")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("🧹 Dọn dẹp cache"):
            st.success("Đã dọn dẹp cache!")
    
    with col2:
        if st.button("📊 Tối ưu database"):
            st.success("Đã tối ưu database!")
    
    with col3:
        if st.button("🔄 Khởi động lại hệ thống"):
            st.warning("Hệ thống sẽ khởi động lại trong 5 giây...")

def show_reports():
    """Show system reports"""
    st.subheader("📈 Báo cáo hệ thống")
    
    # Report type selection
    report_type = st.selectbox(
        "Loại báo cáo:",
        ["user_activity", "video_analytics", "ai_usage", "system_performance"]
    )
    
    if report_type == "user_activity":
        show_user_activity_report()
    elif report_type == "video_analytics":
        show_video_analytics_report()
    elif report_type == "ai_usage":
        show_ai_usage_report()
    elif report_type == "system_performance":
        show_system_performance_report()

def show_user_activity_report():
    """Show user activity report"""
    st.markdown("### 📊 Báo cáo hoạt động người dùng")
    
    # Date range selection
    col1, col2 = st.columns(2)
    with col1:
        start_date = st.date_input("Từ ngày:")
    with col2:
        end_date = st.date_input("Đến ngày:")
    
    if st.button("📊 Tạo báo cáo"):
        # Sample report data
        st.markdown("#### Thống kê hoạt động")
        
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric("Người dùng mới", "45")
        with col2:
            st.metric("Đăng nhập", "1,234")
        with col3:
            st.metric("Video xem", "5,678")
        with col4:
            st.metric("Chat messages", "2,345")
        
        # Activity chart
        st.markdown("#### Biểu đồ hoạt động")
        activity_data = pd.DataFrame({
            'Ngày': pd.date_range(start_date, end_date, freq='D'),
            'Đăng nhập': [100, 120, 95, 110, 130, 115, 125],
            'Video xem': [200, 250, 180, 220, 280, 240, 260],
            'Chat': [50, 60, 45, 55, 70, 65, 75]
        })
        
        st.line_chart(activity_data.set_index('Ngày'))

def show_video_analytics_report():
    """Show video analytics report"""
    st.markdown("### 🎬 Báo cáo phân tích video")
    
    # Sample video analytics
    st.markdown("#### Video phổ biến nhất")
    
    popular_videos = [
        {"title": "AI Tutorial", "views": 1500, "likes": 120, "shares": 45},
        {"title": "Machine Learning Basics", "views": 1200, "likes": 95, "shares": 32},
        {"title": "Deep Learning", "views": 980, "likes": 78, "shares": 28},
        {"title": "Computer Vision", "views": 850, "likes": 65, "shares": 22},
    ]
    
    for video in popular_videos:
        with st.expander(f"{video['title']} - {video['views']} lượt xem"):
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("Lượt xem", video['views'])
            with col2:
                st.metric("Lượt thích", video['likes'])
            with col3:
                st.metric("Lượt chia sẻ", video['shares'])

def show_ai_usage_report():
    """Show AI usage report"""
    st.markdown("### 🤖 Báo cáo sử dụng AI")
    
    # AI usage statistics
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("Chat với AI", "8,901")
    with col2:
        st.metric("Thuyết minh", "1,234")
    with col3:
        st.metric("Tóm tắt", "567")
    with col4:
        st.metric("Phân tích hình ảnh", "890")
    
    # AI usage chart
    st.markdown("#### Biểu đồ sử dụng AI")
    ai_data = pd.DataFrame({
        'Tính năng': ['Chat', 'Thuyết minh', 'Tóm tắt', 'Phân tích ảnh'],
        'Số lần sử dụng': [8901, 1234, 567, 890]
    })
    
    st.bar_chart(ai_data.set_index('Tính năng'))

def show_system_performance_report():
    """Show system performance report"""
    st.markdown("### ⚡ Báo cáo hiệu suất hệ thống")
    
    # System metrics
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("CPU Usage", "45%")
    with col2:
        st.metric("Memory Usage", "67%")
    with col3:
        st.metric("Disk Usage", "23%")
    with col4:
        st.metric("Network", "12 Mbps")
    
    # Performance chart
    st.markdown("#### Biểu đồ hiệu suất")
    perf_data = pd.DataFrame({
        'Thời gian': pd.date_range('2024-01-01', periods=24, freq='H'),
        'CPU': [45, 48, 52, 49, 46, 43, 47, 50, 53, 51, 48, 45, 42, 44, 46, 49, 52, 55, 58, 56, 53, 50, 47, 45],
        'Memory': [67, 68, 70, 69, 67, 65, 66, 68, 71, 70, 68, 67, 65, 66, 68, 70, 72, 75, 77, 76, 73, 70, 68, 67]
    })
    
    st.line_chart(perf_data.set_index('Thời gian'))

def show_edit_user_form(user):
    """Show form to edit user"""
    st.markdown(f"### ✏️ Sửa người dùng: {user['username']}")
    
    with st.form(f"edit_user_{user['id']}"):
        new_username = st.text_input("Username:", value=user['username'])
        new_email = st.text_input("Email:", value=user['email'])
        new_status = st.selectbox("Trạng thái:", ["Active", "Inactive", "Banned"], index=0 if user['status'] == "Active" else 1 if user['status'] == "Inactive" else 2)
        new_role = st.selectbox("Vai trò:", ["User", "Premium", "Admin"], index=0 if user['role'] == "User" else 1 if user['role'] == "Premium" else 2)
        
        if st.form_submit_button("💾 Cập nhật"):
            st.success(f"Đã cập nhật người dùng {user['username']}")

# For direct page access
if __name__ == "__main__":
    if 'authenticated' not in st.session_state or not st.session_state.authenticated:
        st.error("Vui lòng đăng nhập trước!")
        st.stop()
    
    show_admin_dashboard() 