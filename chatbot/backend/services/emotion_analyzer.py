import nltk
from textblob import TextBlob
import re
from typing import Dict, Any
import google.generativeai as genai
import traceback

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/vader_lexicon')
except LookupError:
    nltk.download('vader_lexicon')

from nltk.sentiment.vader import SentimentIntensityAnalyzer

class EmotionAnalyzer:
    def __init__(self, gemini_model=None):
        self.sentiment_analyzer = SentimentIntensityAnalyzer()
        self.gemini_model = gemini_model
        
        # Emotion keywords mapping
        self.emotion_keywords = {
            'happy': ['vui', 'hạnh phúc', 'thích', 'tuyệt', 'tốt', 'hay', 'đẹp', 'thú vị', 'hài lòng'],
            'sad': ['buồn', 'khổ', 'đau', 'thất vọng', 'chán', 'mệt mỏi', 'cô đơn', 'tuyệt vọng'],
            'angry': ['giận', 'tức', 'bực', 'khó chịu', 'phẫn nộ', 'cáu', 'nổi điên'],
            'anxious': ['lo lắng', 'băn khoăn', 'sợ', 'hồi hộp', 'căng thẳng', 'stress'],
            'confused': ['bối rối', 'không hiểu', 'lúng túng', 'rối', 'không biết', 'mơ hồ'],
            'excited': ['hào hứng', 'phấn khích', 'thích thú', 'mong đợi', 'nóng lòng'],
            'neutral': ['bình thường', 'ổn', 'ok', 'được', 'tạm']
        }
        
        # Vietnamese emotion indicators
        self.vietnamese_indicators = {
            'happy': ['😊', '😄', '😃', '😁', '😆', '😍', '🥰', '😋', '😎', '🤗'],
            'sad': ['😢', '😭', '😔', '😞', '😟', '😕', '😣', '😖', '😫', '😩'],
            'angry': ['😠', '😡', '🤬', '😤', '😾', '💢', '😈', '👿'],
            'anxious': ['😰', '😨', '😱', '😳', '😵', '🤯', '😓', '😥'],
            'confused': ['😕', '😟', '😵‍💫', '🤔', '😶', '😐', '🤷', '🤷‍♂️'],
            'excited': ['🤩', '😍', '🥳', '🎉', '🎊', '🔥', '💯', '✨'],
            'neutral': ['😐', '😑', '😶', '🤷', '🤷‍♂️', '💭']
        }

    async def analyze_emotion(self, text: str) -> Dict[str, Any]:
        """
        Analyze emotion from text input using both traditional methods and Gemini LLM
        Returns: dict with emotion, confidence, and details
        """
        if not text or not text.strip():
            return {
                "emotion": "neutral",
                "confidence": 0.5,
                "details": "No text provided"
            }
        try:
            print(f"[EMOTION][INPUT] {text}")
            traditional_result = self._traditional_analysis(text)
            print(f"[EMOTION][TRADITIONAL] {traditional_result}")
            if self.gemini_model:
                try:
                    llm_result = await self._llm_analysis(text)
                    print(f"[EMOTION][LLM] {llm_result}")
                    final_result = self._combine_llm_and_traditional(traditional_result, llm_result)
                    print(f"[EMOTION][COMBINED] {final_result}")
                    return final_result
                except Exception as e:
                    print("[ERROR][EMOTION][LLM]", str(e))
                    traceback.print_exc()
                    return traditional_result
            else:
                return traditional_result
        except Exception as e:
            print("[ERROR][EMOTION]", str(e))
            traceback.print_exc()
            return {
                "emotion": "neutral",
                "confidence": 0.5,
                "details": f"Exception: {str(e)}"
            }

    def _traditional_analysis(self, text: str) -> Dict[str, Any]:
        """Traditional emotion analysis using NLTK and keywords"""
        # Clean text
        cleaned_text = self._clean_text(text.lower())
        
        # Get sentiment scores
        sentiment_scores = self.sentiment_analyzer.polarity_scores(cleaned_text)
        
        # Analyze emotion keywords
        emotion_scores = self._analyze_emotion_keywords(cleaned_text)
        
        # Analyze emojis
        emoji_emotion = self._analyze_emojis(text)
        
        # Combine all analyses
        final_emotion = self._combine_analyses(sentiment_scores, emotion_scores, emoji_emotion)
        
        return {
            "emotion": final_emotion["emotion"],
            "confidence": final_emotion["confidence"],
            "details": {
                "sentiment_scores": sentiment_scores,
                "emotion_keywords": emotion_scores,
                "emoji_analysis": emoji_emotion,
                "text_length": len(text),
                "cleaned_text": cleaned_text,
                "method": "traditional"
            }
        }

    async def _llm_analysis(self, text: str) -> Dict[str, Any]:
        """Advanced emotion analysis using Gemini LLM"""
        prompt = f"""
Phân tích cảm xúc của đoạn văn bản sau bằng tiếng Việt. Trả về kết quả dưới dạng JSON với format:

{{
    "emotion": "happy|sad|angry|anxious|confused|excited|neutral",
    "confidence": 0.0-1.0,
    "reasoning": "Giải thích ngắn gọn lý do",
    "intensity": "low|medium|high"
}}

Văn bản cần phân tích: "{text}"

Chỉ trả về JSON, không có text khác.
"""

        try:
            response = self.gemini_model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Try to parse JSON response
            import json
            result = json.loads(response_text)
            
            return {
                "emotion": result.get("emotion", "neutral"),
                "confidence": float(result.get("confidence", 0.5)),
                "details": {
                    "reasoning": result.get("reasoning", ""),
                    "intensity": result.get("intensity", "medium"),
                    "method": "llm"
                }
            }
        except Exception as e:
            print(f"Error parsing LLM response: {e}")
            return {
                "emotion": "neutral",
                "confidence": 0.5,
                "details": {"method": "llm_fallback"}
            }

    def _combine_llm_and_traditional(self, traditional: Dict, llm: Dict) -> Dict[str, Any]:
        """Combine LLM and traditional analysis results"""
        # Weight the analyses (LLM gets higher weight)
        llm_weight = 0.7
        traditional_weight = 0.3
        
        # Combine emotions (simple approach - use LLM if confidence is high)
        if llm["confidence"] > 0.7:
            final_emotion = llm["emotion"]
            final_confidence = llm["confidence"]
        else:
            final_emotion = traditional["emotion"]
            final_confidence = traditional["confidence"]
        
        return {
            "emotion": final_emotion,
            "confidence": final_confidence,
            "details": {
                "traditional_analysis": traditional,
                "llm_analysis": llm,
                "method": "combined"
            }
        }
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        # Remove special characters but keep Vietnamese diacritics
        text = re.sub(r'[^\w\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]', ' ', text)
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        return text
    
    def _analyze_emotion_keywords(self, text: str) -> Dict[str, float]:
        """Analyze emotion based on Vietnamese keywords"""
        emotion_scores = {emotion: 0.0 for emotion in self.emotion_keywords.keys()}
        
        words = text.split()
        for word in words:
            for emotion, keywords in self.emotion_keywords.items():
                if word in keywords:
                    emotion_scores[emotion] += 1.0
        
        # Normalize scores
        total_words = len(words)
        if total_words > 0:
            for emotion in emotion_scores:
                emotion_scores[emotion] = min(emotion_scores[emotion] / total_words, 1.0)
        
        return emotion_scores
    
    def _analyze_emojis(self, text: str) -> Dict[str, float]:
        """Analyze emotion based on emojis"""
        emoji_scores = {emotion: 0.0 for emotion in self.vietnamese_indicators.keys()}
        
        for emotion, emojis in self.vietnamese_indicators.items():
            for emoji in emojis:
                if emoji in text:
                    emoji_scores[emotion] += 1.0
        
        # Normalize scores
        total_emojis = sum(emoji_scores.values())
        if total_emojis > 0:
            for emotion in emoji_scores:
                emoji_scores[emotion] = min(emoji_scores[emotion] / total_emojis, 1.0)
        
        return emoji_scores
    
    def _combine_analyses(self, sentiment_scores: Dict, emotion_scores: Dict, emoji_scores: Dict) -> Dict[str, Any]:
        """Combine all analyses to determine final emotion"""
        # Weight the different analyses
        sentiment_weight = 0.4
        keyword_weight = 0.4
        emoji_weight = 0.2
        
        # Convert sentiment to emotion mapping
        sentiment_emotion = self._sentiment_to_emotion(sentiment_scores)
        
        # Find highest scoring emotion from keywords
        keyword_emotion = max(emotion_scores.items(), key=lambda x: x[1])
        
        # Find highest scoring emotion from emojis
        emoji_emotion = max(emoji_scores.items(), key=lambda x: x[1])
        
        # Combine scores
        combined_scores = {}
        for emotion in self.emotion_keywords.keys():
            combined_scores[emotion] = (
                (sentiment_emotion.get(emotion, 0) * sentiment_weight) +
                (emotion_scores.get(emotion, 0) * keyword_weight) +
                (emoji_scores.get(emotion, 0) * emoji_weight)
            )
        
        # Get the emotion with highest score
        final_emotion = max(combined_scores.items(), key=lambda x: x[1])
        
        return {
            "emotion": final_emotion[0],
            "confidence": min(final_emotion[1], 1.0)
        }
    
    def _sentiment_to_emotion(self, sentiment_scores: Dict) -> Dict[str, float]:
        """Convert sentiment scores to emotion scores"""
        compound = sentiment_scores['compound']
        
        if compound >= 0.5:
            return {'happy': compound, 'excited': compound * 0.8}
        elif compound >= 0.1:
            return {'happy': compound, 'neutral': 0.3}
        elif compound >= -0.1:
            return {'neutral': 0.5}
        elif compound >= -0.5:
            return {'sad': abs(compound), 'anxious': abs(compound) * 0.6}
        else:
            return {'sad': abs(compound), 'angry': abs(compound) * 0.7} 