"import random" 
import random
import os
import requests
from typing import List, Dict, Any
from datetime import datetime
import google.generativeai as genai

class ContentSuggester:
    def __init__(self, gemini_model=None):
        self.gemini_model = gemini_model
        self.youtube_api_key = os.getenv("YOUTUBE_API_KEY")
        self.youtube_search_url = "https://www.googleapis.com/youtube/v3/search"
        
        # Database các nội dung gợi ý theo cảm xúc
        self.content_database = {
            'happy': [
                {
                    'title': '🎵 Nhạc vui nhộn',
                    'description': 'Những bài hát sôi động để tăng thêm niềm vui',
                    'youtube_query': 'nhạc vui nhộn',
                },
                {
                    'title': '📚 Sách truyền cảm hứng',
                    'description': 'Những cuốn sách giúp bạn duy trì năng lượng tích cực',
                    'links': [
                        {'text': 'Đắc Nhân Tâm - Dale Carnegie', 'url': 'https://tiki.vn/dac-nhan-tam-p1000.html'},
                        {'text': '7 Thói Quen Hiệu Quả - Stephen Covey', 'url': 'https://tiki.vn/7-thoi-quen-hieu-qua-p1000.html'}
                    ]
                }
            ],
            'sad': [
                {
                    'title': '💝 Nhạc an ủi',
                    'description': 'Những bài hát nhẹ nhàng để xoa dịu tâm hồn',
                    'youtube_query': 'nhạc an ủi',
                }
            ],
            'anxious': [
                {
                    'title': '🫁 Kỹ thuật thở',
                    'description': 'Các bài tập thở giúp giảm lo lắng',
                    'youtube_query': 'bài tập thở thư giãn',
                }
            ],
            'neutral': [
                {
                    'title': '🎵 Video thư giãn',
                    'description': 'Video nhạc thư giãn, nhẹ nhàng cho tâm trạng bình thường',
                    'youtube_query': 'relaxing music'
                }
            ],
            'bình thường': [
                {
                    'title': '🎵 Video thư giãn',
                    'description': 'Video nhạc thư giãn, nhẹ nhàng cho tâm trạng bình thường',
                    'youtube_query': 'relaxing music'
                }
            ]
        }

    def get_youtube_link(self, query: str) -> str:
        if not self.youtube_api_key:
            return None
        params = {
            'part': 'snippet',
            'q': query,
            'type': 'video',
            'maxResults': 1,
            'key': self.youtube_api_key
        }
        try:
            resp = requests.get(self.youtube_search_url, params=params, timeout=5)
            data = resp.json()
            if 'items' in data and len(data['items']) > 0:
                video_id = data['items'][0]['id']['videoId']
                return f'https://www.youtube.com/watch?v={video_id}'
        except Exception as e:
            print('[YOUTUBE][ERROR]', e)
        return None

    async def get_suggestions(self, emotion: str, context: str = "") -> list:
        # Chỉ gợi ý video YouTube dựa trên cảm xúc
        keyword = emotion if emotion else 'video giải trí'
        params = {
            'part': 'snippet',
            'q': keyword,
            'type': 'video',
            'maxResults': 5,
            'key': self.youtube_api_key
        }
        try:
            resp = requests.get(self.youtube_search_url, params=params, timeout=10)
            data = resp.json()
            videos = []
            for item in data.get('items', []):
                video_id = item['id']['videoId']
                title = item['snippet']['title']
                url = f'https://www.youtube.com/watch?v={video_id}'
                videos.append({'title': title, 'url': url})
            if not videos:
                return [{'title': 'Không tìm thấy video phù hợp', 'url': ''}]
            return videos
        except Exception as e:
            return [{'title': f'Lỗi khi lấy video: {str(e)}', 'url': ''}]

    def format_suggestions_for_chat(self, suggestions: List[Dict[str, Any]]) -> str:
        """Format gợi ý để hiển thị trong chat"""
        if not suggestions:
            return "Tôi không có gợi ý nào phù hợp lúc này."
        
        formatted = "💡 **Gợi ý dành cho bạn:**\n\n"
        
        for i, suggestion in enumerate(suggestions[:3], 1):
            formatted += f"{i}. **{suggestion['title']}**\n"
            formatted += f"   {suggestion['description']}\n"
            
            if 'links' in suggestion:
                for link in suggestion['links'][:2]:
                    formatted += f"   🔗 [{link['text']}]({link['url']})\n"
            
            formatted += "\n"
        
        return formatted 

    def get_quick_suggestions(self, emotion: str) -> list:
        quick_suggestions = {
            'happy': [
                "🎵 Nghe nhạc vui nhộn để duy trì tâm trạng tốt",
                "📚 Đọc sách truyền cảm hứng",
                "🎬 Xem phim hài để cười thả ga",
                "🏃‍♀️ Tập thể dục để giải phóng endorphin"
            ],
            'sad': [
                "💝 Nghe nhạc nhẹ nhàng để an ủi",
                "📖 Đọc sách self-help",
                "🧘‍♀️ Thử thiền để tĩnh tâm",
                "☕ Uống trà và thư giãn"
            ],
            'anxious': [
                "🫁 Thực hành kỹ thuật thở 4-7-8",
                "📝 Viết nhật ký để giải tỏa",
                "🎨 Vẽ hoặc tô màu để thư giãn",
                "🚶‍♀️ Đi bộ ngoài trời"
            ],
            'angry': [
                "🏃‍♂️ Tập thể dục để giải phóng năng lượng",
                "🎵 Nghe nhạc rock/EDM",
                "🧘‍♂️ Thiền để kiểm soát cơn giận",
                "💪 Đấm bốc hoặc kickboxing"
            ],
            'confused': [
                "📚 Tìm tài liệu học tập có cấu trúc",
                "📝 Ghi chú và tổ chức thông tin",
                "🎯 Đặt mục tiêu rõ ràng",
                "🤝 Tìm người hướng dẫn"
            ],
            'excited': [
                "🚀 Bắt đầu dự án sáng tạo",
                "📖 Đọc sách về thành công",
                "🎯 Lập kế hoạch chi tiết",
                "💡 Chia sẻ ý tưởng với người khác"
            ],
            'neutral': [
                "📖 Khám phá sách mới",
                "🎵 Nghe thể loại nhạc mới",
                "🎬 Xem phim/TV show mới",
                "🌍 Học ngôn ngữ mới"
            ]
        }
        return quick_suggestions.get(emotion, quick_suggestions['neutral'])

    async def suggest_videos(self, conversation_history: List[Dict], emotion: str = "neutral") -> List[Dict[str, Any]]:
        """
        Phân tích ngữ cảnh hội thoại, sinh từ khoá bằng LLM, tìm kiếm YouTube, trả về 5 video ưu tiên nhất
        """
        # 1. Lấy ngữ cảnh hội thoại gần nhất
        context = "\n".join([
            f"User: {msg.get('user_message', msg.get('user', ''))}\nBot: {msg.get('bot_response', msg.get('bot', ''))}"
            for msg in conversation_history[-5:]
        ])
        # 2. Sinh từ khoá bằng LLM
        keyword = await self._generate_youtube_keyword(context, emotion)
        # 3. Tìm kiếm YouTube
        videos = self._search_youtube(keyword)
        return videos

    async def _generate_youtube_keyword(self, context: str, emotion: str) -> str:
        """
        Dùng Gemini LLM để sinh từ khoá tìm kiếm YouTube phù hợp ngữ cảnh và cảm xúc
        """
        if not self.gemini_model:
            return "video giải trí"
        prompt = f"""
Dựa trên đoạn hội thoại sau và cảm xúc người dùng là "{emotion}", hãy đề xuất một từ khoá (hoặc cụm từ) ngắn gọn, phù hợp nhất để tìm kiếm video YouTube giúp người dùng giải trí, thư giãn hoặc nâng cao tinh thần. Chỉ trả về từ khoá, không giải thích.

Hội thoại:
{context}

Từ khoá:
"""
        try:
            response = self.gemini_model.generate_content(prompt)
            keyword = response.text.strip().split('\n')[0]
            # Loại bỏ dấu ngoặc kép nếu có
            return keyword.replace('"', '').replace("'", "").strip()
        except Exception as e:
            print('[YOUTUBE][LLM][ERROR]', e)
            return "video giải trí"

    def _search_youtube(self, keyword: str) -> List[Dict[str, Any]]:
        """
        Tìm kiếm YouTube với từ khoá, trả về 5 video (title, url, thumbnail)
        """
        if not self.youtube_api_key:
            return []
        params = {
            'part': 'snippet',
            'q': keyword,
            'type': 'video',
            'maxResults': 5,
            'key': self.youtube_api_key
        }
        try:
            resp = requests.get(self.youtube_search_url, params=params, timeout=5)
            data = resp.json()
            results = []
            for item in data.get('items', []):
                video_id = item['id']['videoId']
                title = item['snippet']['title']
                url = f'https://www.youtube.com/watch?v={video_id}'
                thumbnail = item['snippet']['thumbnails']['medium']['url']
                results.append({
                    'title': title,
                    'url': url,
                    'thumbnail': thumbnail
                })
            return results
        except Exception as e:
            print('[YOUTUBE][SEARCH][ERROR]', e)
            return []

    async def suggest_youtube_videos(self, emotion, context):
        # 1. Dùng LLM sinh từ khóa YouTube phù hợp cảm xúc + context
        keyword = ''
        if self.gemini_model:
            prompt = f"""
Dựa trên cảm xúc người dùng là '{emotion}' và đoạn hội thoại sau, hãy đề xuất một từ khóa (hoặc cụm từ) ngắn gọn, phù hợp nhất để tìm kiếm video YouTube giúp người dùng giải trí, thư giãn hoặc nâng cao tinh thần. Chỉ trả về từ khóa, không giải thích.

Hội thoại:
{context}

Từ khóa:
"""
            try:
                response = self.gemini_model.generate_content(prompt)
                keyword = response.text.strip().split('\n')[0].replace('"', '').replace("'", "").strip()
            except Exception as e:
                print('[YOUTUBE][LLM][ERROR]', e)
                keyword = emotion if emotion else 'video giải trí'
        else:
            keyword = emotion if emotion else 'video giải trí'
        # 2. Gọi YouTube Data API
        params = {
            'part': 'snippet',
            'q': keyword,
            'type': 'video',
            'maxResults': 5,
            'key': self.youtube_api_key
        }
        try:
            resp = requests.get(self.youtube_search_url, params=params, timeout=10)
            data = resp.json()
            videos = []
            for item in data.get('items', []):
                video_id = item['id']['videoId']
                title = item['snippet']['title']
                url = f'https://www.youtube.com/watch?v={video_id}'
                videos.append({'title': title, 'url': url})
            if not videos:
                return [{'title': 'Không tìm thấy video phù hợp', 'url': ''}]
            return videos
        except Exception as e:
            return [{'title': f'Lỗi khi lấy video: {str(e)}', 'url': ''}]
