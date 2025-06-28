const ffmpeg = require('fluent-ffmpeg');
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Video = require('../models/Video');
const aiService = require('./aiService');

class VideoService {
  constructor() {
    // Set ffmpeg path if provided
    if (process.env.FFMPEG_PATH) {
      ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
    }
  }
  
  async processYouTubeVideo(url, userId) {
    try {
      // Extract video info
      const videoInfo = await this.getYouTubeInfo(url);
      
      // Create video record
      const video = await Video.create({
        user_id: userId,
        title: videoInfo.title,
        description: videoInfo.description,
        youtube_url: url,
        thumbnail_url: videoInfo.thumbnail,
        duration: videoInfo.duration,
        status: 'processing'
      });
      
      // Start processing job
      const job = await Video.createProcessingJob(video.id, 'download');
      
      // Process video in background
      this.processVideoInBackground(video.id, url, 'youtube');
      
      return { video, jobId: job.id };
    } catch (error) {
      console.error('YouTube video processing failed:', error);
      throw error;
    }
  }
  
  async processUploadedVideo(file, metadata, userId) {
    try {
      // Validate file
      const validation = this.validateVideoFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      
      // Generate unique filename
      const filename = `${uuidv4()}_${file.originalname}`;
      const uploadPath = path.join(process.env.UPLOAD_PATH || 'uploads', 'videos', filename);
      
      // Ensure upload directory exists
      const uploadDir = path.dirname(uploadPath);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      // Move file to upload directory
      fs.renameSync(file.path, uploadPath);
      
      // Create video record
      const video = await Video.create({
        user_id: userId,
        title: metadata.title,
        description: metadata.description,
        file_url: `/uploads/videos/${filename}`,
        file_size: file.size,
        status: 'processing'
      });
      
      // Start processing job
      const job = await Video.createProcessingJob(video.id, 'process');
      
      // Process video in background
      this.processVideoInBackground(video.id, uploadPath, 'file');
      
      return { video, jobId: job.id };
    } catch (error) {
      console.error('Uploaded video processing failed:', error);
      throw error;
    }
  }
  
  async processVideoInBackground(videoId, source, type) {
    try {
      // Update job status
      await Video.updateProcessingJob(videoId, { status: 'processing', progress: 10 });
      
      let videoPath;
      if (type === 'youtube') {
        videoPath = await this.downloadYouTubeVideo(source);
      } else {
        videoPath = source;
      }
      
      await Video.updateProcessingJob(videoId, { progress: 30 });
      
      // Extract metadata
      const metadata = await this.extractVideoMetadata(videoPath);
      
      await Video.updateProcessingJob(videoId, { progress: 50 });
      
      // Generate thumbnail
      const thumbnailPath = await this.generateThumbnail(videoPath, videoId);
      
      await Video.updateProcessingJob(videoId, { progress: 70 });
      
      // Extract audio for AI processing
      const audioPath = await this.extractAudio(videoPath, videoId);
      
      await Video.updateProcessingJob(videoId, { progress: 85 });
      
      // Generate transcript (simplified - in production use speech-to-text service)
      const transcript = await this.generateTranscript(audioPath);
      
      await Video.updateProcessingJob(videoId, { progress: 90 });
      
      // Update video with metadata
      await Video.update(videoId, {
        thumbnail_url: `/uploads/thumbnails/${path.basename(thumbnailPath)}`,
        duration: metadata.duration,
        metadata: metadata,
        status: 'processed',
        processing_progress: 100
      });
      
      // Generate AI summary
      if (transcript) {
        await aiService.generateSummary(videoId, transcript);
      }
      
      await Video.updateProcessingJob(videoId, { 
        status: 'completed', 
        progress: 100,
        result: { metadata, transcript }
      });
      
    } catch (error) {
      console.error('Video processing failed:', error);
      
      await Video.updateStatus(videoId, 'error');
      await Video.updateProcessingJob(videoId, { 
        status: 'failed', 
        error_message: error.message 
      });
    }
  }
  
  async getYouTubeInfo(url) {
    try {
      const info = await ytdl.getInfo(url);
      const videoDetails = info.videoDetails;
      
      return {
        title: videoDetails.title,
        description: videoDetails.description,
        duration: parseInt(videoDetails.lengthSeconds),
        thumbnail: videoDetails.thumbnails[videoDetails.thumbnails.length - 1].url,
        channelTitle: videoDetails.author.name
      };
    } catch (error) {
      throw new Error('Failed to get YouTube video info');
    }
  }
  
  async downloadYouTubeVideo(url) {
    return new Promise((resolve, reject) => {
      const filename = `${uuidv4()}.mp4`;
      const downloadPath = path.join(process.env.UPLOAD_PATH || 'uploads', 'temp', filename);
      
      // Ensure temp directory exists
      const tempDir = path.dirname(downloadPath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      ytdl(url, { 
        quality: 'best[height<=720]',
        filter: 'audioandvideo'
      })
      .pipe(fs.createWriteStream(downloadPath))
      .on('finish', () => resolve(downloadPath))
      .on('error', reject);
    });
  }
  
  async extractVideoMetadata(videoPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }
        
        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
        
        resolve({
          duration: Math.round(metadata.format.duration),
          size: metadata.format.size,
          bitrate: metadata.format.bit_rate,
          format: metadata.format.format_name,
          resolution: videoStream ? `${videoStream.width}x${videoStream.height}` : null,
          fps: videoStream ? videoStream.r_frame_rate : null,
          codec: videoStream ? videoStream.codec_name : null,
          audioCodec: audioStream ? audioStream.codec_name : null
        });
      });
    });
  }
  
  async generateThumbnail(videoPath, videoId) {
    return new Promise((resolve, reject) => {
      const thumbnailDir = path.join(process.env.UPLOAD_PATH || 'uploads', 'thumbnails');
      if (!fs.existsSync(thumbnailDir)) {
        fs.mkdirSync(thumbnailDir, { recursive: true });
      }
      
      const thumbnailPath = path.join(thumbnailDir, `thumb_${videoId}.jpg`);
      
      ffmpeg(videoPath)
        .screenshots({
          timestamps: ['50%'],
          filename: path.basename(thumbnailPath),
          folder: thumbnailDir,
          size: '320x240'
        })
        .on('end', () => resolve(thumbnailPath))
        .on('error', reject);
    });
  }
  
  async extractAudio(videoPath, videoId) {
    return new Promise((resolve, reject) => {
      const audioDir = path.join(process.env.UPLOAD_PATH || 'uploads', 'audio');
      if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
      }
      
      const audioPath = path.join(audioDir, `audio_${videoId}.mp3`);
      
      ffmpeg(videoPath)
        .toFormat('mp3')
        .audioBitrate(128)
        .on('end', () => resolve(audioPath))
        .on('error', reject)
        .save(audioPath);
    });
  }
  
  async generateTranscript(audioPath) {
    // In production, integrate with speech-to-text service like OpenAI Whisper
    // For demo purposes, return a mock transcript
    return "Đây là transcript mẫu được tạo ra từ audio. Trong môi trường production, bạn sẽ sử dụng OpenAI Whisper hoặc các dịch vụ speech-to-text khác để tạo transcript thực tế từ audio file.";
  }
  
  validateVideoFile(file) {
    const allowedTypes = process.env.ALLOWED_VIDEO_TYPES?.split(',') || [
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/wmv',
      'video/flv',
      'video/webm'
    ];
    
    const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 2 * 1024 * 1024 * 1024; // 2GB
    
    if (!allowedTypes.includes(file.mimetype)) {
      return { valid: false, error: 'Invalid file type' };
    }
    
    if (file.size > maxSize) {
      return { valid: false, error: 'File too large' };
    }
    
    return { valid: true };
  }
  
  async getVideoStream(videoId) {
    const video = await Video.findById(videoId);
    if (!video) {
      throw new Error('Video not found');
    }
    
    const videoPath = path.join(process.cwd(), video.file_url.replace(/^\//, ''));
    
    if (!fs.existsSync(videoPath)) {
      throw new Error('Video file not found');
    }
    
    return fs.createReadStream(videoPath);
  }
  
  async deleteVideo(videoId) {
    const video = await Video.findById(videoId);
    if (!video) {
      throw new Error('Video not found');
    }
    
    // Delete video file
    if (video.file_url) {
      const videoPath = path.join(process.cwd(), video.file_url.replace(/^\//, ''));
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
    }
    
    // Delete thumbnail
    if (video.thumbnail_url) {
      const thumbnailPath = path.join(process.cwd(), video.thumbnail_url.replace(/^\//, ''));
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }
    }
    
    // Delete from database
    await Video.delete(videoId);
  }
}

module.exports = new VideoService(); 