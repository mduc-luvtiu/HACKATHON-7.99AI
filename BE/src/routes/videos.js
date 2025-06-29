const express = require('express');
const multer = require('multer');
const { body, validationResult, query } = require('express-validator');
const Video = require('../models/Video');
const videoService = require('../services/videoService');
const { auth, checkSubscription } = require('../middleware/auth');
const path = require('path');
const { uploadFileToDrive } = require('../services/googleDriveService');

const router = express.Router();

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/temp/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 2 * 1024 * 1024 * 1024 // 2GB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = process.env.ALLOWED_VIDEO_TYPES?.split(',') || [
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/wmv',
      'video/flv',
      'video/webm'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Multer config for video upload
const videoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/videos'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, req.user.userId + '_' + Date.now() + ext);
  }
});
const uploadVideo = multer({ storage: videoStorage });

// Get all videos (with pagination and filters)
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
  query('status').optional().isIn(['processing', 'processed', 'error']),
  query('sortBy').optional().isIn(['created_at', 'title', 'duration']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
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

    const {
      page = 1,
      limit = 10,
      search,
      status,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const filters = {
      user_id: req.user.id,
      search,
      status
    };

    const result = await Video.list(parseInt(page), parseInt(limit), filters);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get video by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const video = await Video.getWithSummary(id);
    
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check if user owns the video
    if (video.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { video }
    });
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Upload video
router.post('/upload', auth, uploadVideo.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Không có file được upload.' });
    }
    const { title, description } = req.body;
    const localPath = req.file.path;
    const fileName = req.file.originalname;

    // Upload lên Google Drive
    const driveRes = await uploadFileToDrive(localPath, fileName);

    // Lưu vào DB: file_url là driveRes.webViewLink
    const video = await Video.create({
      user_id: req.user.id,
      title,
      description,
      file_url: driveRes.webViewLink,
      file_size: req.file.size,
      status: 'processing'
    });

    // Tạo job xử lý video (nếu có)
    const job = await Video.createProcessingJob(video.id, 'process');
    res.json({
      success: true,
      message: 'Tải video thành công!',
      data: { video, jobId: job.id }
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, message: 'Tải video thất bại! Lỗi hệ thống hoặc Google Drive.' });
  }
});

// Add YouTube video
router.post('/youtube', auth, checkSubscription('video_upload'), [
  body('url').isURL().matches(/youtube\.com|youtu\.be/),
  body('title').optional().trim().isLength({ min: 1, max: 500 }),
  body('description').optional().trim().isLength({ max: 2000 })
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

    const { url, title, description } = req.body;

    const result = await videoService.processYouTubeVideo(url, req.user.id);

    res.status(201).json({
      success: true,
      message: 'YouTube video added successfully',
      data: result
    });
  } catch (error) {
    console.error('YouTube video error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// Update video
router.put('/:id', auth, [
  body('title').optional().trim().isLength({ min: 1, max: 500 }),
  body('description').optional().trim().isLength({ max: 2000 })
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

    const { id } = req.params;
    const { title, description } = req.body;

    // Check if video exists and user owns it
    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    if (video.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;

    const updatedVideo = await Video.update(id, updateData);

    res.json({
      success: true,
      message: 'Video updated successfully',
      data: { video: updatedVideo }
    });
  } catch (error) {
    console.error('Update video error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete video
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if video exists and user owns it
    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    if (video.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await videoService.deleteVideo(id);

    res.json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get video processing status
router.get('/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if video exists and user owns it
    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    if (video.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const jobs = await Video.getProcessingJobs(id);

    res.json({
      success: true,
      data: {
        video: {
          id: video.id,
          title: video.title,
          status: video.status,
          processing_progress: video.processing_progress,
          processing_started_at: video.processing_started_at,
          estimated_finish_at: video.estimated_finish_at
        },
        jobs
      }
    });
  } catch (error) {
    console.error('Get video status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Stream video
router.get('/:id/stream', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if video exists and user owns it
    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    if (video.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const videoStream = await videoService.getVideoStream(id);
    
    // Set headers for video streaming
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    
    videoStream.pipe(res);
  } catch (error) {
    console.error('Video stream error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get video with narrations
router.get('/:id/narrations', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if video exists and user owns it
    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    if (video.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const videoWithNarrations = await Video.getWithNarrations(id);

    res.json({
      success: true,
      data: videoWithNarrations
    });
  } catch (error) {
    console.error('Get video narrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get video transcript
router.get('/:id/transcript', auth, async (req, res) => {
  try {
    const videoId = req.params.id;
    const video = await Video.findById(videoId);
    if (!video || !video.transcript) {
      return res.status(404).json({ success: false, message: 'Transcript not found' });
    }
    let transcriptText = "";
    if (Array.isArray(video.transcript)) {
      transcriptText = video.transcript.map(line => line.text || line).join('\n');
    } else {
      transcriptText = video.transcript;
    }
    res.setHeader('Content-Disposition', `attachment; filename="transcript_${videoId}.txt"`);
    res.setHeader('Content-Type', 'text/plain');
    res.send(transcriptText);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router; 