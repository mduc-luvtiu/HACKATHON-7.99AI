const OpenAI = require('openai');
const AISummary = require('../models/AISummary');
const User = require('../models/User');

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  
  async generateSummary(videoId, transcript, language = 'vi') {
    try {
      const prompt = `
      Phân tích transcript video sau và cung cấp:
      1. Tổng quan toàn diện (2-3 câu)
      2. Các điểm chính (4-6 bullet points)
      3. Các timestamp quan trọng với mô tả
      
      Transcript: ${transcript}
      
      Trả lời bằng tiếng Việt và định dạng JSON:
      {
        "overview": "...",
        "keyPoints": ["...", "..."],
        "timestamps": [{"time": "MM:SS", "content": "..."}]
      }
      `;
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1000
      });
      
      const content = response.choices[0].message.content;
      let summary;
      
      try {
        summary = JSON.parse(content);
      } catch (parseError) {
        // Fallback if JSON parsing fails
        summary = {
          overview: content.substring(0, 200) + "...",
          keyPoints: [content.substring(200, 400) + "..."],
          timestamps: []
        };
      }
      
      // Save to database
      const aiSummary = await AISummary.create({
        video_id: videoId,
        overview: summary.overview,
        key_points: summary.keyPoints,
        timestamps: summary.timestamps,
        language: language,
        model_used: 'gpt-4'
      });
      
      return aiSummary;
    } catch (error) {
      console.error('Summary generation failed:', error);
      throw new Error('Failed to generate AI summary');
    }
  }
  
  async generateNarration(videoId, text, options = {}) {
    try {
      const { language = 'vi', voiceType = 'female', speed = 1.0 } = options;
      
      // Split text into chunks for better processing
      const chunks = this.splitTextIntoChunks(text, 4000);
      
      // Generate audio for each chunk
      const audioChunks = [];
      for (const chunk of chunks) {
        const response = await this.openai.audio.speech.create({
          model: "tts-1",
          voice: voiceType === 'female' ? 'nova' : 'onyx',
          input: chunk,
          speed: speed
        });
        
        const buffer = Buffer.from(await response.arrayBuffer());
        audioChunks.push(buffer);
      }
      
      // Merge audio chunks (simplified - in production you'd use a proper audio library)
      const mergedAudio = Buffer.concat(audioChunks);
      
      // Generate filename
      const filename = `narration_${videoId}_${Date.now()}.mp3`;
      const audioUrl = `/uploads/narrations/${filename}`;
      
      // Save audio file (in production, upload to cloud storage)
      const fs = require('fs');
      const path = require('path');
      const uploadDir = path.join(process.cwd(), 'uploads', 'narrations');
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      fs.writeFileSync(path.join(uploadDir, filename), mergedAudio);
      
      // Create transcript with timestamps (simplified)
      const transcript = this.generateTranscript(text, chunks.length);
      
      return {
        audioUrl,
        transcript,
        duration: this.estimateDuration(text, speed)
      };
    } catch (error) {
      console.error('Narration generation failed:', error);
      throw new Error('Failed to generate AI narration');
    }
  }
  
  async processChat(message, context = {}) {
    try {
      const { videoId, currentTime, emotion, previousMessages } = context;
      
      // Build context prompt
      let systemPrompt = `Bạn là trợ lý AI thông minh giúp người dùng hiểu nội dung video.
      
      Hãy trả lời bằng tiếng Việt một cách hữu ích và thân thiện.
      Nếu có thông tin về video, hãy sử dụng để đưa ra câu trả lời chính xác.
      Đề xuất video liên quan khi phù hợp.`;
      
      if (videoId) {
        systemPrompt += `\nVideo hiện tại: ${videoId}`;
      }
      
      if (currentTime) {
        systemPrompt += `\nThời gian hiện tại: ${currentTime} giây`;
      }
      
      if (emotion) {
        systemPrompt += `\nCảm xúc người dùng: ${emotion}`;
      }
      
      const messages = [
        { role: "system", content: systemPrompt },
        ...previousMessages.slice(-5).map(msg => ({
          role: msg.message_type === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        { role: "user", content: message }
      ];
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      });
      
      const aiResponse = response.choices[0].message.content;
      
      // Generate suggestions
      const suggestions = await this.generateSuggestions(message, context);
      
      return {
        message: aiResponse,
        suggestions: suggestions.textSuggestions,
        videoSuggestions: suggestions.videoSuggestions,
        metadata: {
          confidence: 0.9,
          sources: ['ai_model'],
          model_used: 'gpt-4'
        }
      };
    } catch (error) {
      console.error('Chat processing failed:', error);
      throw new Error('Failed to process chat message');
    }
  }
  
  async generateSuggestions(message, context) {
    try {
      const prompt = `
      Dựa trên tin nhắn: "${message}"
      
      Hãy tạo 3 câu hỏi gợi ý liên quan mà người dùng có thể hỏi tiếp theo.
      Trả lời bằng JSON:
      {
        "textSuggestions": ["câu hỏi 1", "câu hỏi 2", "câu hỏi 3"]
      }
      `;
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 200
      });
      
      const content = response.choices[0].message.content;
      let suggestions;
      
      try {
        suggestions = JSON.parse(content);
      } catch (parseError) {
        suggestions = {
          textSuggestions: [
            "Bạn có thể giải thích thêm về chủ đề này không?",
            "Có video nào liên quan khác không?",
            "Tôi muốn tìm hiểu sâu hơn về điểm này"
          ]
        };
      }
      
      return {
        textSuggestions: suggestions.textSuggestions || [],
        videoSuggestions: [] // In production, you'd implement video recommendation logic
      };
    } catch (error) {
      console.error('Suggestion generation failed:', error);
      return {
        textSuggestions: [],
        videoSuggestions: []
      };
    }
  }
  
  splitTextIntoChunks(text, maxChunkSize) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks = [];
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxChunkSize) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = sentence;
        } else {
          chunks.push(sentence.substring(0, maxChunkSize));
          currentChunk = sentence.substring(maxChunkSize);
        }
      } else {
        currentChunk += sentence + '. ';
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }
  
  generateTranscript(text, numChunks) {
    const words = text.split(' ');
    const wordsPerChunk = Math.ceil(words.length / numChunks);
    const transcript = [];
    
    for (let i = 0; i < numChunks; i++) {
      const startWords = i * wordsPerChunk;
      const endWords = Math.min((i + 1) * wordsPerChunk, words.length);
      const chunkText = words.slice(startWords, endWords).join(' ');
      
      transcript.push({
        start_time: i * 10, // Simplified timing
        end_time: (i + 1) * 10,
        text: chunkText
      });
    }
    
    return transcript;
  }
  
  estimateDuration(text, speed) {
    // Rough estimate: 150 words per minute at normal speed
    const words = text.split(' ').length;
    const minutes = words / 150;
    return Math.ceil(minutes * 60 / speed); // Return seconds
  }
  
  async incrementUserUsage(userId) {
    await User.incrementUsage(userId);
  }
}

module.exports = new AIService(); 