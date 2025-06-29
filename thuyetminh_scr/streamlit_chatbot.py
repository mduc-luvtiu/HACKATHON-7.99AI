#!/usr/bin/env python3
"""
Streamlit Chatbot Component tích hợp với chatbot.py
"""

import streamlit as st
import os
import json
import sys
import subprocess
from pathlib import Path
from datetime import datetime


class StreamlitChatbot:
    def __init__(self):
        self.chatbot_dir = "rag_chatbot"
        self.metadata_file = "voice_segments_metadata.json"
        self.chatbot_metadata_file = os.path.join(
            self.chatbot_dir, "chatbot_metadata.json")

    def setup_chatbot_environment(self):
        """Thiết lập môi trường cho chatbot"""
        # Tạo thư mục rag_chatbot nếu chưa có
        os.makedirs(self.chatbot_dir, exist_ok=True)

        # Copy voice_segments_metadata.json vào thư mục rag_chatbot
        if os.path.exists(self.metadata_file):
            import shutil
            shutil.copy2(self.metadata_file, os.path.join(
                self.chatbot_dir, "voice_segments_metadata.json"))
            st.success("✅ Đã copy metadata vào thư mục chatbot")
        else:
            st.warning("⚠️ Chưa có file voice_segments_metadata.json")

    def get_chatbot_status(self):
        """Kiểm tra trạng thái chatbot"""
        metadata_path = os.path.join(
            self.chatbot_dir, "voice_segments_metadata.json")
        chatbot_metadata_path = os.path.join(
            self.chatbot_dir, "chatbot_metadata.json")

        status = {
            "has_metadata": os.path.exists(metadata_path),
            "has_chatbot_metadata": os.path.exists(chatbot_metadata_path),
            "metadata_count": 0,
            "last_updated": None
        }

        if status["has_metadata"]:
            try:
                with open(metadata_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    status["metadata_count"] = len(data)
            except:
                pass

        if status["has_chatbot_metadata"]:
            try:
                with open(chatbot_metadata_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    status["last_updated"] = data.get('last_updated')
            except:
                pass

        return status

    def initialize_chatbot(self):
        """Khởi tạo chatbot"""
        try:
            # Chuyển đến thư mục chatbot
            original_dir = os.getcwd()
            os.chdir(self.chatbot_dir)

            # Chạy script khởi tạo chatbot
            result = subprocess.run(
                [sys.executable, "chatbot.py"],
                capture_output=True, text=True, encoding='utf-8',
                timeout=30  # Timeout 30 giây
            )

            # Quay lại thư mục gốc
            os.chdir(original_dir)

            if result.returncode == 0:
                return True, "Chatbot đã được khởi tạo thành công"
            else:
                return False, f"Lỗi khởi tạo chatbot: {result.stderr}"

        except subprocess.TimeoutExpired:
            os.chdir(original_dir)
            return False, "Timeout khi khởi tạo chatbot"
        except Exception as e:
            os.chdir(original_dir)
            return False, f"Lỗi: {str(e)}"

    def chat_with_video(self, query):
        """Chat với video content"""
        try:
            # Chuyển đến thư mục chatbot
            original_dir = os.getcwd()
            os.chdir(self.chatbot_dir)

            # Import các module cần thiết
            sys.path.append(os.getcwd())

            try:
                from rag_engine import RAGEngine
                from pinecone_db import PineconeDB
                from deep_translator import GoogleTranslator

                # Khởi tạo RAG engine
                rag = RAGEngine()
                db = PineconeDB()
                namespace = "mini_visione"

                # Gửi query
                result = rag.chat(query, namespace)

                # Dịch sang tiếng Việt
                response_en = result['response']
                response_vi = GoogleTranslator(
                    source='auto', target='vi').translate(response_en)

                os.chdir(original_dir)
                return True, response_vi

            except ImportError as e:
                os.chdir(original_dir)
                return False, f"Lỗi import module: {str(e)}"
            except Exception as e:
                os.chdir(original_dir)
                return False, f"Lỗi chat: {str(e)}"

        except Exception as e:
            return False, f"Lỗi hệ thống: {str(e)}"

    def get_video_info(self):
        """Lấy thông tin video từ chatbot metadata"""
        chatbot_metadata_path = os.path.join(
            self.chatbot_dir, "chatbot_metadata.json")

        if os.path.exists(chatbot_metadata_path):
            try:
                with open(chatbot_metadata_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return {
                        "title": data.get('video_title', 'Unknown'),
                        "url": data.get('video_url', 'Unknown'),
                        "last_updated": data.get('last_updated', 'Unknown')
                    }
            except:
                pass

        return None

    def render_chat_interface(self):
        """Render giao diện chat"""
        st.markdown("### 🤖 Video Chatbot")

        # Thiết lập môi trường
        self.setup_chatbot_environment()

        # Kiểm tra trạng thái
        status = self.get_chatbot_status()

        # Hiển thị trạng thái
        if status["has_metadata"]:
            st.success(
                f"✅ Đã tải {status['metadata_count']} đoạn nội dung video")

            # Hiển thị thông tin video
            video_info = self.get_video_info()
            if video_info:
                st.info(f"📹 **Video:** {video_info['title']}")
                if video_info['last_updated']:
                    st.info(f"📅 **Cập nhật:** {video_info['last_updated']}")
        else:
            st.warning(
                "⚠️ Chưa có nội dung video. Hãy tạo video thuyết minh trước!")
            return

        # Nút khởi tạo chatbot
        if st.button("🚀 Khởi tạo Chatbot", help="Khởi tạo chatbot để có thể chat"):
            with st.spinner("🔄 Đang khởi tạo chatbot..."):
                success, message = self.initialize_chatbot()
                if success:
                    st.success(message)
                else:
                    st.error(message)

        # Câu hỏi thường gặp
        st.markdown("**💡 Câu hỏi thường gặp:**")
        common_questions = [
            "Tóm tắt video",
            "Nội dung chính của video",
            "Video nói về chủ đề gì?",
            "Có bao nhiêu đoạn trong video?",
            "Tìm từ khóa 'học'",
            "Tìm từ khóa 'tiếng Anh'"
        ]

        # Tạo buttons cho câu hỏi thường gặp
        cols = st.columns(2)
        for i, question in enumerate(common_questions):
            col = cols[i % 2]
            if col.button(question, key=f"q_{i}"):
                st.session_state.chat_input = question

        # Input chat
        if "chat_input" not in st.session_state:
            st.session_state.chat_input = ""

        user_input = st.text_input(
            "💬 Nhập câu hỏi:",
            value=st.session_state.chat_input,
            placeholder="Ví dụ: Tóm tắt video, Tìm từ khóa 'học'..."
        )

        # Clear input after use
        if st.session_state.chat_input:
            st.session_state.chat_input = ""

        # Process query
        if user_input:
            with st.spinner("🤔 Đang xử lý..."):
                success, response = self.chat_with_video(user_input)

            if success:
                # Hiển thị kết quả
                st.markdown("**🤖 Trả lời:**")
                st.write(response)

                # Lưu vào lịch sử chat
                if "chat_history" not in st.session_state:
                    st.session_state.chat_history = []

                st.session_state.chat_history.append({
                    "user": user_input,
                    "bot": response,
                    "timestamp": datetime.now().strftime("%H:%M:%S")
                })
            else:
                st.error(f"❌ Lỗi: {response}")
                st.info("💡 Hãy thử nhấn nút 'Khởi tạo Chatbot' trước khi chat")

        # Hiển thị lịch sử chat
        if "chat_history" in st.session_state and st.session_state.chat_history:
            st.markdown("---")
            st.markdown("**📝 Lịch sử chat:**")

            # Hiển thị 5 tin nhắn gần nhất
            for i, chat in enumerate(st.session_state.chat_history[-5:]):
                with st.expander(f"💬 {chat['user'][:50]}... ({chat['timestamp']})", expanded=False):
                    st.write(f"**Bạn:** {chat['user']}")
                    st.write(f"**Bot:** {chat['bot']}")

            # Nút xóa lịch sử
            if st.button("🗑️ Xóa lịch sử chat"):
                st.session_state.chat_history = []
                st.rerun()
