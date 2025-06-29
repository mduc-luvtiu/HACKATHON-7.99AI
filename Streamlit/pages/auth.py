import streamlit as st
import bcrypt
from utils.database import create_user, get_user_by_username, log_user_activity

def hash_password(password):
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password, hashed):
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def show_login_form():
    """Show login form"""
    st.subheader("🔐 Đăng nhập")
    
    with st.form("login_form"):
        username = st.text_input("Tên đăng nhập")
        password = st.text_input("Mật khẩu", type="password")
        submit = st.form_submit_button("Đăng nhập")
        
        if submit:
            if username and password:
                user = get_user_by_username(username)
                if user and verify_password(password, user[3]):  # user[3] is password_hash
                    st.session_state.authenticated = True
                    st.session_state.user_id = user[0]  # user[0] is user_id
                    st.session_state.username = user[1]  # user[1] is username
                    
                    # Log activity
                    log_user_activity(user[0], "login", f"User {username} logged in")
                    
                    st.success("Đăng nhập thành công!")
                    st.rerun()
                else:
                    st.error("Tên đăng nhập hoặc mật khẩu không đúng!")
            else:
                st.warning("Vui lòng nhập đầy đủ thông tin!")

def show_register_form():
    """Show registration form"""
    st.subheader("📝 Đăng ký tài khoản mới")
    
    with st.form("register_form"):
        username = st.text_input("Tên đăng nhập")
        email = st.text_input("Email")
        password = st.text_input("Mật khẩu", type="password")
        confirm_password = st.text_input("Xác nhận mật khẩu", type="password")
        submit = st.form_submit_button("Đăng ký")
        
        if submit:
            if not all([username, email, password, confirm_password]):
                st.warning("Vui lòng nhập đầy đủ thông tin!")
            elif password != confirm_password:
                st.error("Mật khẩu xác nhận không khớp!")
            elif len(password) < 6:
                st.error("Mật khẩu phải có ít nhất 6 ký tự!")
            else:
                # Check if user already exists
                existing_user = get_user_by_username(username)
                if existing_user:
                    st.error("Tên đăng nhập đã tồn tại!")
                else:
                    # Create new user
                    password_hash = hash_password(password)
                    user_id = create_user(username, email, password_hash)
                    
                    if user_id:
                        st.success("Đăng ký thành công! Vui lòng đăng nhập.")
                        # Log activity
                        log_user_activity(user_id, "register", f"New user {username} registered")
                    else:
                        st.error("Có lỗi xảy ra khi tạo tài khoản!")

def show_auth_page():
    """Main authentication page"""
    st.title("🎥 AI Video Assistant")
    st.markdown("---")
    
    # Create tabs for login and register
    tab1, tab2 = st.tabs(["🔐 Đăng nhập", "📝 Đăng ký"])
    
    with tab1:
        show_login_form()
    
    with tab2:
        show_register_form()
    
    # Demo account info
    st.markdown("---")
    st.info("""
    **Tài khoản demo:**
    - Username: demo
    - Password: demo123
    
    Hoặc đăng ký tài khoản mới để trải nghiệm đầy đủ tính năng!
    """)

# For direct page access
if __name__ == "__main__":
    show_auth_page() 