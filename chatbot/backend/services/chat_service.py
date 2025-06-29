import google.generativeai as genai
from typing import List, Dict, Any
import json
import re
import traceback

class ChatService:
    def __init__(self, model, emotion_analyzer):
        self.model = model
        self.emotion_analyzer = emotion_analyzer
        self.conversation_history = {}
        
        # Emotion-based response templates
        self.emotion_templates = {
            'happy': {
                'tone': 'vui vẻ và tích cực',
                'style': 'thân thiện, khuyến khích',
                'suggestions': [
                    'Bạn có muốn chia sẻ thêm về điều làm bạn vui không?',
                    'Tôi rất vui khi thấy bạn hạnh phúc!',
                    'Hãy tận hưởng khoảnh khắc này nhé!'
                ]
            },
            'sad': {
                'tone': 'nhẹ nhàng và đồng cảm',
                'style': 'an ủi, hỗ trợ',
                'suggestions': [
                    'Tôi hiểu bạn đang buồn. Hãy cho tôi biết thêm về điều đó.',
                    'Mọi chuyện rồi sẽ ổn thôi. Bạn có muốn nói chuyện không?',
                    'Đôi khi việc chia sẻ có thể giúp chúng ta cảm thấy tốt hơn.'
                ]
            },
            'angry': {
                'tone': 'bình tĩnh và trung lập',
                'style': 'lắng nghe, không đối đầu',
                'suggestions': [
                    'Tôi hiểu bạn đang khó chịu. Hãy bình tĩnh và cho tôi biết chuyện gì đã xảy ra.',
                    'Đôi khi việc hít thở sâu có thể giúp chúng ta bình tĩnh hơn.',
                    'Bạn có muốn chia sẻ về điều khiến bạn tức giận không?'
                ]
            },
            'anxious': {
                'tone': 'trấn an và hỗ trợ',
                'style': 'khuyến khích, hướng dẫn',
                'suggestions': [
                    'Hãy thử hít thở sâu vài lần. Điều này có thể giúp bạn bình tĩnh hơn.',
                    'Tôi ở đây để lắng nghe. Bạn có thể chia sẻ với tôi.',
                    'Mọi thứ sẽ ổn thôi. Hãy từ từ và bước từng bước một.'
                ]
            },
            'confused': {
                'tone': 'rõ ràng và hướng dẫn',
                'style': 'giải thích, hỗ trợ',
                'suggestions': [
                    'Tôi có thể giúp bạn hiểu rõ hơn về vấn đề này.',
                    'Hãy để tôi giải thích từng bước một cách đơn giản.',
                    'Bạn có câu hỏi cụ thể nào không? Tôi sẽ cố gắng trả lời rõ ràng.'
                ]
            },
            'excited': {
                'tone': 'hào hứng và khuyến khích',
                'style': 'chia sẻ niềm vui, động viên',
                'suggestions': [
                    'Thật tuyệt! Tôi cũng cảm thấy hào hứng với bạn!',
                    'Hãy chia sẻ thêm về điều khiến bạn phấn khích!',
                    'Niềm vui của bạn thật đáng quý!'
                ]
            },
            'neutral': {
                'tone': 'thân thiện và hữu ích',
                'style': 'hỗ trợ, thông tin',
                'suggestions': [
                    'Tôi có thể giúp gì cho bạn hôm nay?',
                    'Bạn có câu hỏi nào muốn hỏi không?',
                    'Tôi luôn sẵn sàng hỗ trợ bạn!'
                ]
            }
        }
        
        # System prompt template
        self.system_prompt = """
Bạn là SenseBot - một trợ lý AI thông minh và đồng cảm. Hãy tuân thủ các nguyên tắc sau:

1. **Tính trung thực**: Chỉ trả lời những gì bạn biết chắc chắn. Nếu không chắc chắn, hãy thẳng thắn nói rằng bạn không biết hoặc cần thêm thông tin.

2. **Đồng cảm**: Điều chỉnh giọng điệu phù hợp với cảm xúc của người dùng:
   - {emotion_tone}
   - Phong cách: {emotion_style}

3. **Hữu ích**: Cung cấp thông tin chính xác và hữu ích, đưa ra gợi ý phù hợp.

4. **An toàn**: Không đưa ra lời khuyên y tế, pháp lý hoặc tài chính chuyên môn mà không có đủ thông tin.

5. **Tôn trọng**: Luôn tôn trọng người dùng và quyền riêng tư của họ.

Hãy trả lời bằng tiếng Việt một cách tự nhiên và thân thiện.
"""

    async def get_response(self, message: str, emotion: str = "neutral", user_id: str = None) -> str:
        """
        Get response from Gemini with emotion context
        """
        try:
            print(f"[CHAT][INPUT] user_id={user_id}, message={message}, emotion={emotion}")
            # Get emotion template
            emotion_template = self.emotion_templates.get(emotion, self.emotion_templates['neutral'])
            
            # Build system prompt with emotion context
            system_prompt = self.system_prompt.format(
                emotion_tone=emotion_template['tone'],
                emotion_style=emotion_template['style']
            )
            
            # Get conversation history
            history = self.conversation_history.get(user_id, [])
            
            # Build conversation context
            conversation_context = self._build_conversation_context(history, message)
            
            # Create prompt with context
            full_prompt = f"{system_prompt}\n\n{conversation_context}"
            
            # Generate response
            response = await self._generate_response(full_prompt)
            print(f"[CHAT][RESPONSE] {response}")
            
            # Store in history
            if user_id:
                if user_id not in self.conversation_history:
                    self.conversation_history[user_id] = []
                
                self.conversation_history[user_id].append({
                    'user': message,
                    'bot': response,
                    'emotion': emotion
                })
                
                # Keep only last 10 messages to avoid context overflow
                if len(self.conversation_history[user_id]) > 10:
                    self.conversation_history[user_id] = self.conversation_history[user_id][-10:]
            
            return response
            
        except Exception as e:
            print("[ERROR][CHAT][RESPONSE]", str(e))
            traceback.print_exc()
            return f"Xin lỗi, tôi gặp lỗi khi xử lý câu hỏi của bạn: {str(e)}"
    
    async def _generate_response(self, prompt: str) -> str:
        """Generate response using Gemini API"""
        try:
            print(f"[CHAT][PROMPT] {prompt[:200]}")
            response = self.model.generate_content(prompt)
            print(f"[CHAT][LLM RAW] {response.text[:200]}")
            return response.text
        except Exception as e:
            print("[ERROR][CHAT][LLM]", str(e))
            traceback.print_exc()
            # Fallback response
            return "Xin lỗi, tôi không thể xử lý câu hỏi của bạn ngay lúc này. Vui lòng thử lại sau."
    
    def _build_conversation_context(self, history: List[Dict], current_message: str) -> str:
        """Build conversation context from history"""
        context = "Lịch sử trò chuyện giữa bạn và SenseBot:\n"
        for msg in history:
            if msg.get('role') == 'user':
                context += f"Người dùng: {msg.get('content', '')}\n"
            elif msg.get('role') == 'bot':
                context += f"SenseBot: {msg.get('content', '')}\n"
        context += f"Câu hỏi hiện tại: {current_message}\nTrả lời:"
        return context
    
    def generate_suggestions(self, emotion: str) -> List[str]:
        """Generate suggestions based on emotion"""
        emotion_template = self.emotion_templates.get(emotion, self.emotion_templates['neutral'])
        return emotion_template['suggestions']
    
    def get_emotion_appropriate_response(self, base_response: str, emotion: str) -> str:
        """Modify response to be more appropriate for the detected emotion"""
        emotion_template = self.emotion_templates.get(emotion, self.emotion_templates['neutral'])
        
        # Add emotion-appropriate prefix/suffix
        if emotion == 'sad':
            return f"Tôi hiểu bạn đang buồn. {base_response}"
        elif emotion == 'anxious':
            return f"Đừng lo lắng quá. {base_response}"
        elif emotion == 'angry':
            return f"Hãy bình tĩnh. {base_response}"
        elif emotion == 'happy':
            return f"Thật tuyệt! {base_response}"
        elif emotion == 'excited':
            return f"Tôi cũng cảm thấy hào hứng! {base_response}"
        else:
            return base_response
    
    def clear_history(self, user_id: str = None):
        """Clear conversation history"""
        if user_id:
            if user_id in self.conversation_history:
                del self.conversation_history[user_id]
        else:
            self.conversation_history.clear()
    
    def get_conversation_summary(self, user_id: str) -> Dict[str, Any]:
        """Get summary of conversation for a user"""
        if user_id not in self.conversation_history:
            return {"message_count": 0, "emotions": [], "topics": []}
        
        history = self.conversation_history[user_id]
        
        # Analyze emotions
        emotions = [msg.get('emotion', 'neutral') for msg in history]
        emotion_counts = {}
        for emotion in emotions:
            emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
        
        # Extract potential topics (simple keyword extraction)
        all_text = " ".join([msg['user'] + " " + msg['bot'] for msg in history])
        words = re.findall(r'\b\w+\b', all_text.lower())
        
        # Simple topic extraction (in production, use more sophisticated NLP)
        common_topics = ['học tập', 'công việc', 'gia đình', 'bạn bè', 'sức khỏe', 'tình cảm']
        topics = [topic for topic in common_topics if topic in all_text]
        
        return {
            "message_count": len(history),
            "emotions": emotion_counts,
            "topics": topics,
            "last_interaction": history[-1] if history else None
        }
    
    async def chat(self, message: str, user_id: str) -> tuple:
        # Phân tích cảm xúc
        emotion_result = await self.emotion_analyzer.analyze_emotion(message)
        emotion = emotion_result.get('emotion', 'neutral')
        confidence = emotion_result.get('confidence', 0.5)

        # Lưu lịch sử
        if user_id not in self.conversation_history:
            self.conversation_history[user_id] = []
        self.conversation_history[user_id].append({"role": "user", "content": message, "emotion": emotion})

        # RAG: Nếu user đã upload tài liệu, tìm đoạn liên quan
        rag_context = ''
        if hasattr(self, 'document_memory') and user_id in self.document_memory:
            docs = self.document_memory[user_id]
            # Tìm đoạn liên quan nhất (simple keyword match, có thể thay bằng embedding)
            best = ''
            for doc in docs:
                if any(word in doc.lower() for word in message.lower().split()):
                    best = doc
                    break
            if best:
                rag_context = f"\nThông tin từ tài liệu của bạn:\n{best}\n"

        # Prompt kiểm soát: không bịa đặt
        system_prompt = (
            "Bạn là SenseBot, trợ lý AI trung thực. Nếu không biết câu trả lời, hãy nói 'Tôi không biết'. "
            "Không bịa đặt, không suy đoán khi thiếu thông tin. Luôn trả lời bằng tiếng Việt."
        )
        full_prompt = f"{system_prompt}\n{rag_context}\nCâu hỏi: {message}\nTrả lời:"

        # Lấy phản hồi từ LLM
        response = await self.get_response(full_prompt, emotion, user_id)

        # Lưu phản hồi bot vào lịch sử
        self.conversation_history[user_id].append({"role": "bot", "content": response, "emotion": emotion})

        # Gợi ý dựa trên cảm xúc
        suggestions = self.generate_suggestions(emotion)
        return response, emotion, confidence, suggestions 