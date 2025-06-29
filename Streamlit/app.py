import streamlit as st
from pathlib import Path

# Import các trang
from pages import auth, main_page, video_manager, video_player, chat_system, ai_features, admin_dashboard

# Cấu hình app
st.set_page_config(
    page_title="AI Video Assistant",
    page_icon="🎬",
    layout="wide",
    initial_sidebar_state="expanded"
)

# --- Custom CSS for Sidebar ---
# Xóa đoạn CSS ẩn sidebar nếu có
# (Không thêm hoặc giữ lại đoạn: section[data-testid="stSidebar"] { display: none !important; })
# Các phần CSS khác giữ nguyên

# --- Sidebar Navigation ---
def sidebar_menu():
    st.sidebar.markdown("""
    <div style="text-align: center; padding: 1rem 0;">
        <h1 style="color: #222; font-size: 1.5rem; font-weight: bold; margin: 0;">
            🎬 AI Video Assistant
        </h1>
        <p style="color: #444; font-size: 0.8rem; margin: 0.5rem 0 0 0;">
            Nền tảng video thông minh
        </p>
    </div>
    """, unsafe_allow_html=True)
    
    # User info section
    if st.session_state.authenticated:
        st.sidebar.markdown(f"""
        <div class="user-info">
            <h4>👤 {st.session_state.username}</h4>
            <p>🆔 ID: {st.session_state.user_id}</p>
            <p>👑 {'Admin' if st.session_state.is_admin else 'User'}</p>
        </div>
        """, unsafe_allow_html=True)
        
        # Quick stats
        st.sidebar.markdown("""
        <div class="quick-stats">
            <h5>📊 Thống kê nhanh</h5>
            <div class="stat-item">
                <span>📹 Video:</span>
                <span>15</span>
            </div>
            <div class="stat-item">
                <span>💬 Chat:</span>
                <span>25</span>
            </div>
            <div class="stat-item">
                <span>🤖 AI:</span>
                <span>10</span>
            </div>
        </div>
        """, unsafe_allow_html=True)
    
    st.sidebar.markdown('<div class="sidebar-divider"></div>', unsafe_allow_html=True)

    # Card menu items
    menu_items = [
        ("🏠 Trang chủ", "Trang chính của ứng dụng"),
        ("➕ Thêm video mới", "Tải lên video từ YouTube, file hoặc URL"),
        ("📋 Video của tôi", "Quản lý tất cả video đã thêm"),
        ("🎬 Xem video", "Phát video với tính năng AI"),
        ("💬 Chat AI", "Trò chuyện với AI về video"),
        ("🤖 Tính năng AI", "Các tính năng AI nâng cao"),
    ]
    if st.session_state.get("is_admin", False):
        menu_items.append(("🛠️ Admin Dashboard", "Quản lý hệ thống"))
    menu_items.append(("🚪 Đăng xuất", "Thoát khỏi hệ thống"))

    menu_labels = [item[0] for item in menu_items]
    menu_descs = [item[1] for item in menu_items]

    # Custom CSS for radio as card
    st.sidebar.markdown("""
    <style>
    div[data-testid="stRadio"] > label {
        display: block;
        margin-bottom: 0.7rem;
    }
    div[data-testid="stRadio"] > label > div {
        background: #fff;
        border-radius: 14px;
        box-shadow: 0 2px 12px rgba(102,126,234,0.07);
        padding: 1rem 1.2rem;
        display: flex;
        align-items: center;
        border: 2px solid transparent;
        transition: all 0.2s;
        cursor: pointer;
        position: relative;
    }
    div[data-testid="stRadio"] > label > div:hover,
    div[data-testid="stRadio"] > label > div[data-selected="true"] {
        border: 2px solid #667eea;
        background: linear-gradient(90deg, #e8eaf6 60%, #f5f6fa 100%);
        box-shadow: 0 4px 16px rgba(102,126,234,0.13);
    }
    .sidebar-card-icon {
        font-size: 2rem;
        margin-right: 1rem;
        flex-shrink: 0;
    }
    .sidebar-card-content {
        flex: 1;
    }
    .sidebar-card-label {
        font-size: 1.08rem;
        font-weight: 600;
        color: #222;
        margin-bottom: 0.1rem;
    }
    .sidebar-card-desc {
        font-size: 0.88rem;
        color: #666;
        margin: 0;
    }
    </style>
    """, unsafe_allow_html=True)

    # Hiển thị radio dạng card
    def card_label(label, desc):
        icon, text = label.split(' ', 1)
        return f'''<span class="sidebar-card-icon">{icon}</span>
                  <div class="sidebar-card-content">
                    <div class="sidebar-card-label">{text}</div>
                    <div class="sidebar-card-desc">{desc}</div>
                  </div>'''

    choice = st.sidebar.radio(
        "",
        menu_labels,
        format_func=lambda x: x,
        key="main_menu",
        help=None,
        index=menu_labels.index(st.session_state.get("main_menu", menu_labels[0])),
        label_visibility="collapsed"
    )

    # Hiển thị lại card với mô tả
    for i, (label, desc) in enumerate(zip(menu_labels, menu_descs)):
        st.sidebar.markdown(card_label(label, desc), unsafe_allow_html=True)

    return choice

# --- Session State Init ---
def init_session():
    if "authenticated" not in st.session_state:
        st.session_state.authenticated = False
    if "user_id" not in st.session_state:
        st.session_state.user_id = None
    if "username" not in st.session_state:
        st.session_state.username = ""
    if "is_admin" not in st.session_state:
        st.session_state.is_admin = False
    if "current_video" not in st.session_state:
        st.session_state.current_video = None
    if "page_history" not in st.session_state:
        st.session_state.page_history = []

init_session()

# --- Back Button Helper ---
def show_back_button(current_page):
    if st.session_state.page_history and st.session_state.page_history[-1] != current_page:
        st.session_state.page_history.append(current_page)
    if len(st.session_state.page_history) > 1:
        if st.button("⬅️ Quay lại"):
            st.session_state.page_history.pop()  # Remove current
            prev_page = st.session_state.page_history.pop()  # Get previous
            st.session_state["main_menu"] = prev_page
            st.experimental_rerun()

# --- Main Routing Logic ---
def main():
    # Nếu chưa đăng nhập, hiển thị trang đăng nhập
    if not st.session_state.authenticated:
        auth.show_auth_page()
        st.stop()

    # Danh sách các trang
    page_map = {
        "🏠 Trang chủ": main_page.show_main_page,
        "➕ Thêm video mới": video_manager.show_video_manager,
        "📋 Video của tôi": video_manager.show_video_manager,
        "🎬 Xem video": video_player.show_video_player,
        "💬 Chat AI": chat_system.show_chat_interface,
        "🤖 Tính năng AI": ai_features.show_ai_features,
        "🛠️ Admin Dashboard": admin_dashboard.show_admin_dashboard,
    }

    # Lấy trang hiện tại
    current_page = st.session_state.get("main_menu", "🏠 Trang chủ")

    # Lưu lịch sử trang
    if not st.session_state.page_history or st.session_state.page_history[-1] != current_page:
        st.session_state.page_history.append(current_page)

    # Hiển thị nút Back nếu không phải trang chủ
    if current_page != "🏠 Trang chủ":
        show_back_button(current_page)

    # Điều hướng trang
    if current_page in page_map:
        page_map[current_page]()
    elif current_page == "🚪 Đăng xuất":
        for k in ["authenticated", "user_id", "username", "is_admin", "current_video", "page_history"]:
            if k in st.session_state:
                del st.session_state[k]
        st.success("Đã đăng xuất!")
        st.experimental_rerun()
    else:
        main_page.show_main_page()

if __name__ == "__main__":
    main() 