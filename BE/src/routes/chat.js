const express = require('express');
const { body, validationResult, query } = require('express-validator');
const ChatMessage = require('../models/ChatMessage');
const aiService = require('../services/aiService');
const { auth, checkSubscription } = require('../middleware/auth');

const router = express.Router();

// Send chat message
router.post('/', auth, checkSubscription('chat'), [
  body('message').trim().isLength({ min: 1, max: 1000 }),
  body('videoId').optional().isUUID(),
  body('messageType').optional().isIn(['text', 'image', 'audio']),
  body('context').optional().isObject()
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

    const { message, videoId, messageType = 'text', context = {} } = req.body;

    // Save user message
    const userMessage = await ChatMessage.create({
      user_id: req.user.id,
      video_id: videoId,
      message_type: 'user',
      content: message,
      metadata: { messageType, context }
    });

    // Get conversation history for context
    const history = videoId ? 
      await ChatMessage.getConversationHistory(videoId, 10) : 
      [];

    // Process with AI
    const aiResponse = await aiService.processChat(message, {
      videoId,
      currentTime: context.currentTime,
      emotion: context.emotion,
      previousMessages: history
    });

    // Save AI response
    const aiMessage = await ChatMessage.create({
      user_id: req.user.id,
      video_id: videoId,
      message_type: 'ai',
      content: aiResponse.message,
      parent_message_id: userMessage.id,
      metadata: {
        suggestions: aiResponse.suggestions,
        videoSuggestions: aiResponse.videoSuggestions,
        confidence: aiResponse.metadata?.confidence,
        model_used: aiResponse.metadata?.model_used
      }
    });

    // Increment user usage
    await aiService.incrementUserUsage(req.user.id);

    res.json({
      success: true,
      message: 'Chat message processed successfully',
      data: {
        userMessage,
        aiMessage: {
          ...aiMessage,
          suggestions: aiResponse.suggestions,
          videoSuggestions: aiResponse.videoSuggestions
        }
      }
    });
  } catch (error) {
    console.error('Chat processing error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process chat message'
    });
  }
});

// Get chat messages for a video
router.get('/video/:videoId', auth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
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
    const { page = 1, limit = 50 } = req.query;

    const result = await ChatMessage.findByVideoId(videoId, parseInt(page), parseInt(limit));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user's chat history
router.get('/history', auth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
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

    const { page = 1, limit = 20 } = req.query;

    const result = await ChatMessage.findByUserId(req.user.id, parseInt(page), parseInt(limit));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Search chat messages
router.get('/search', auth, [
  query('q').trim().isLength({ min: 1 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
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

    const { q, page = 1, limit = 20 } = req.query;

    const result = await ChatMessage.searchMessages(req.user.id, q, parseInt(page), parseInt(limit));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Search chat messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get chat statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await ChatMessage.getStats(req.user.id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get chat stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete chat message
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const { messageId } = req.params;

    // Check if message exists and user owns it
    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await ChatMessage.delete(messageId);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete chat message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get message replies
router.get('/:messageId/replies', auth, async (req, res) => {
  try {
    const { messageId } = req.params;

    const replies = await ChatMessage.getReplies(messageId);

    res.json({
      success: true,
      data: { replies }
    });
  } catch (error) {
    console.error('Get message replies error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 