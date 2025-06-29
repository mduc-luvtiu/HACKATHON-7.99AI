#!/usr/bin/env python3
"""
Chatbot Component for Streamlit
Tương tác với video content
"""

import streamlit as st
import json
import os
from pathlib import Path
from deep_translator import GoogleTranslator


class VideoChatbot:
    def __init__(self):
        self.chat_history = []
        self.metadata_file = "voice_segments_metadata.json"

    def load_video_content(self):
        """Load video content from metadata"""
        if os.path.exists(self.metadata_file):
            try:
                with open(self.metadata_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                return []
        return []

    def get_video_summary(self, content):
        """Tạo tóm tắt video từ content"""
        if not content:
            return "Chưa có nội dung video để phân tích."

        # Đếm số segment
        total_segments = len(content)

        # Lấy text từ các segment
        texts = [item.get('text', '') for item in content if item.get('text')]

        # Tạo tóm tắt đơn giản
        summary = f"Video có {total_segments} đoạn nội dung.\n\n"

        if texts:
            # Lấy 3 đoạn đầu tiên làm preview
            preview_texts = texts[:3]
            summary += "Nội dung chính:\n"
            for i, text in enumerate(preview_texts, 1):
                summary += f"{i}. {text}\n"

            if len(texts) > 3:
                summary += f"\n... và {len(texts) - 3} đoạn khác."

        return summary

    def search_content(self, query, content):
        """Tìm kiếm trong nội dung video"""
        if not content:
            return "Chưa có nội dung video để tìm kiếm."

        query_lower = query.lower()
        results = []

        for i, item in enumerate(content):
            text = item.get('text', '').lower()
            if query_lower in text:
                start_time = item.get('start', 0)
                end_time = item.get('end', 0)
                original_text = item.get('text', '')

                results.append({
                    'segment': i + 1,
                    'time': f"{start_time:.1f}s - {end_time:.1f}s",
                    'text': original_text
                })

        if results:
            response = f"Tìm thấy {len(results)} kết quả cho '{query}':\n\n"
            for result in results[:5]:  # Giới hạn 5 kết quả
                response += f"Đoạn {result['segment']} ({result['time']}):\n"
                response += f"{result['text']}\n\n"

            if len(results) > 5:
                response += f"... và {len(results) - 5} kết quả khác."
        else:
            response = f"Không tìm thấy kết quả cho '{query}'."

        return response

    def get_common_questions(self):
        """Trả về danh sách câu hỏi thường gặp"""
        return [
            "Tóm tắt video",
            "Nội dung chính của video",
            "Video nói về chủ đề gì?",
            "Có bao nhiêu đoạn trong video?",
            "Tìm từ khóa 'học'",
            "Tìm từ khóa 'tiếng Anh'"
        ]

    def process_query(self, query):
        """Xử lý câu hỏi của người dùng"""
        content = self.load_video_content()

        query_lower = query.lower()

        # Xử lý các câu hỏi thường gặp
        if any(keyword in query_lower for keyword in ['tóm tắt', 'summary', 'tổng quan']):
            return self.get_video_summary(content)

        elif any(keyword in query_lower for keyword in ['nội dung', 'content', 'chủ đề', 'topic']):
            if content:
                return f"Video có {len(content)} đoạn nội dung về chủ đề học tiếng Anh."
            else:
                return "Chưa có nội dung video để phân tích."

        elif any(keyword in query_lower for keyword in ['tìm', 'search', 'kiếm']):
            # Trích xuất từ khóa tìm kiếm
            search_terms = ['tìm', 'search', 'kiếm']
            for term in search_terms:
                if term in query_lower:
                    keyword = query_lower.split(term)[-1].strip()
                    if keyword:
                        return self.search_content(keyword, content)
            return "Vui lòng cung cấp từ khóa để tìm kiếm."

        elif any(keyword in query_lower for keyword in ['bao nhiêu', 'count', 'số lượng']):
            if content:
                return f"Video có {len(content)} đoạn nội dung."
            else:
                return "Chưa có nội dung video."

        else:
            # Tìm kiếm chung trong nội dung
            return self.search_content(query, content)

    def render_chat_interface(self):
        """Render giao diện chat"""
        st.markdown("### 🤖 Video Chatbot")

        # Hiển thị thông tin video hiện tại
        content = self.load_video_content()
        if content:
            st.success(f"✅ Đã tải {len(content)} đoạn nội dung video")
        else:
            st.warning(
                "⚠️ Chưa có nội dung video. Hãy tạo video thuyết minh trước!")

        # Câu hỏi thường gặp
        st.markdown("**💡 Câu hỏi thường gặp:**")
        common_questions = self.get_common_questions()

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
                response = self.process_query(user_input)

            # Hiển thị kết quả
            st.markdown("**🤖 Trả lời:**")
            st.write(response)

            # Lưu vào lịch sử chat
            if "chat_history" not in st.session_state:
                st.session_state.chat_history = []

            st.session_state.chat_history.append({
                "user": user_input,
                "bot": response,
                "timestamp": "now"
            })

        # Hiển thị lịch sử chat
        if "chat_history" in st.session_state and st.session_state.chat_history:
            st.markdown("---")
            st.markdown("**📝 Lịch sử chat:**")

            # Hiển thị 5 tin nhắn gần nhất
            for i, chat in enumerate(st.session_state.chat_history[-5:]):
                with st.expander(f"💬 {chat['user'][:50]}...", expanded=False):
                    st.write(f"**Bạn:** {chat['user']}")
                    st.write(f"**Bot:** {chat['bot']}")

            # Nút xóa lịch sử
            if st.button("🗑️ Xóa lịch sử chat"):
                st.session_state.chat_history = []
                st.rerun()
