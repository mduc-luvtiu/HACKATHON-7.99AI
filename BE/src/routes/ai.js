const express = require('express');
const { body, validationResult } = require('express-validator');
const aiService = require('../services/aiService');
const AISummary = require('../models/AISummary');
const { auth, checkSubscription } = require('../middleware/auth');

const router = express.Router();

// Generate AI summary for video
router.post('/summarize/:videoId', auth, checkSubscription('ai_summary'), [
  body('language').optional().isIn(['vi', 'en']),
  body('includeTimestamps').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { videoId } = req.params;
    const { language = 'vi', includeTimestamps = true } = req.body;

    // Check if summary already exists
    const existingSummary = await AISummary.getLatestByVideoId(videoId);
    if (existingSummary) {
      return res.json({
        success: true,
        message: 'Summary already exists',
        data: {
          summary: existingSummary,
          jobId: null
        }
      });
    }

    // For demo purposes, generate a mock transcript
    // In production, you would get the actual transcript from the video
    const mockTranscript = `
    Đây là transcript mẫu cho video. Trong môi trường production, bạn sẽ sử dụng 
    OpenAI Whisper hoặc các dịch vụ speech-to-text khác để tạo transcript thực tế 
    từ audio file của video. Transcript này sẽ được sử dụng để tạo tóm tắt AI.
    `;

    // Generate summary
    const summary = await aiService.generateSummary(videoId, mockTranscript, language);
    
    // Increment user usage
    await aiService.incrementUserUsage(req.user.id);

    res.json({
      success: true,
      message: 'AI summary generated successfully',
      data: {
        summary,
        jobId: summary.id
      }
    });
  } catch (error) {
    console.error('AI summary generation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate AI summary'
    });
  }
});

// Generate AI narration for video
router.post('/narrate/:videoId', auth, checkSubscription('ai_narration'), [
  body('language').isIn(['vi', 'en']),
  body('voiceType').isIn(['male', 'female']),
  body('speed').isFloat({ min: 0.5, max: 2.0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { videoId } = req.params;
    const { language, voiceType, speed } = req.body;

    // For demo purposes, use a mock text
    // In production, you would use the actual video transcript or summary
    const mockText = `
    Đây là nội dung mẫu để tạo narration. Trong môi trường production, bạn sẽ sử dụng 
    transcript hoặc tóm tắt của video để tạo narration. Narration này sẽ được chuyển 
    thành audio sử dụng text-to-speech.
    `;

    // Generate narration
    const narration = await aiService.generateNarration(videoId, mockText, {
      language,
      voiceType,
      speed
    });

    // Increment user usage
    await aiService.incrementUserUsage(req.user.id);

    res.json({
      success: true,
      message: 'AI narration generated successfully',
      data: {
        narration: {
          id: `narration_${videoId}_${Date.now()}`,
          video_id: videoId,
          language,
          voice_type: voiceType,
          speed,
          audio_url: narration.audioUrl,
          transcript: narration.transcript,
          status: 'completed'
        },
        jobId: `narration_${videoId}_${Date.now()}`
      }
    });
  } catch (error) {
    console.error('AI narration generation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate AI narration'
    });
  }
});

// Get narration status
router.get('/narrate/:videoId/status', auth, async (req, res) => {
  try {
    const { videoId } = req.params;

    // For demo purposes, return a mock status
    // In production, you would check the actual job status
    res.json({
      success: true,
      data: {
        status: 'completed',
        progress: 100,
        audioUrl: `/uploads/narrations/narration_${videoId}_${Date.now()}.mp3`,
        transcript: [
          {
            startTime: 0,
            endTime: 10,
            text: 'Đây là narration mẫu'
          }
        ]
      }
    });
  } catch (error) {
    console.error('Get narration status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get AI summary by video ID
router.get('/summary/:videoId', auth, async (req, res) => {
  try {
    const { videoId } = req.params;

    const summary = await AISummary.getLatestByVideoId(videoId);
    
    if (!summary) {
      return res.status(404).json({
        success: false,
        message: 'AI summary not found'
      });
    }

    res.json({
      success: true,
      data: { summary }
    });
  } catch (error) {
    console.error('Get AI summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get AI statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await AISummary.getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get AI stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 