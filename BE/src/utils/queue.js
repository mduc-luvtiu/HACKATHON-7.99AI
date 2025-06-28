const EventEmitter = require('events');
const logger = require('./logger');

class JobQueue extends EventEmitter {
  constructor(name, maxConcurrent = 3) {
    super();
    this.name = name;
    this.maxConcurrent = maxConcurrent;
    this.queue = [];
    this.running = 0;
    this.jobs = new Map(); // Track all jobs by ID
    this.stats = {
      total: 0,
      completed: 0,
      failed: 0,
      pending: 0
    };
  }

  add(jobType, data, priority = 0) {
    const jobId = `${this.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job = {
      id: jobId,
      type: jobType,
      data,
      priority,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
      result: null,
      error: null
    };

    this.jobs.set(jobId, job);
    this.queue.push(job);
    this.stats.total++;
    this.stats.pending++;
    
    // Sort queue by priority (higher priority first)
    this.queue.sort((a, b) => b.priority - a.priority);
    
    logger.info(`Job added to ${this.name} queue:`, { jobId, jobType, priority });
    
    // Process queue
    this.process();
    
    return jobId;
  }

  async process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const job = this.queue.shift();
    this.running++;
    this.stats.pending--;
    
    job.status = 'processing';
    job.startedAt = new Date();
    
    logger.info(`Processing job: ${job.id} (${job.type})`);
    
    try {
      // Emit job start event
      this.emit('jobStart', job);
      
      // Process the job
      const result = await this.processJob(job);
      
      job.status = 'completed';
      job.progress = 100;
      job.result = result;
      job.completedAt = new Date();
      this.stats.completed++;
      
      logger.info(`Job completed: ${job.id}`);
      this.emit('jobComplete', job);
      
    } catch (error) {
      job.status = 'failed';
      job.error = error.message;
      job.completedAt = new Date();
      this.stats.failed++;
      
      logger.error(`Job failed: ${job.id}`, error);
      this.emit('jobFailed', job, error);
    } finally {
      this.running--;
      this.process(); // Process next job
    }
  }

  async processJob(job) {
    // This method should be overridden by specific queue implementations
    throw new Error('processJob method must be implemented');
  }

  updateProgress(jobId, progress) {
    const job = this.jobs.get(jobId);
    if (job) {
      job.progress = progress;
      this.emit('jobProgress', job);
    }
  }

  getJob(jobId) {
    return this.jobs.get(jobId);
  }

  getStats() {
    return {
      ...this.stats,
      running: this.running,
      queueLength: this.queue.length,
      totalJobs: this.jobs.size
    };
  }

  clear() {
    this.queue = [];
    this.jobs.clear();
    this.stats = {
      total: 0,
      completed: 0,
      failed: 0,
      pending: 0
    };
  }
}

class VideoProcessingQueue extends JobQueue {
  constructor() {
    super('video-processing', parseInt(process.env.MAX_CONCURRENT_JOBS) || 3);
  }

  async processJob(job) {
    const { videoService } = require('../services/videoService');
    const videoServiceInstance = new videoService();
    
    switch (job.type) {
      case 'download-youtube':
        return await videoServiceInstance.downloadYouTubeVideo(job.data.url);
        
      case 'extract-audio':
        return await videoServiceInstance.extractAudio(job.data.inputPath, job.data.videoId);
        
      case 'generate-thumbnail':
        return await videoServiceInstance.generateThumbnail(job.data.videoPath, job.data.videoId);
        
      case 'extract-metadata':
        return await videoServiceInstance.extractVideoMetadata(job.data.videoPath);
        
      case 'generate-transcript':
        return await videoServiceInstance.generateTranscript(job.data.audioPath);
        
      default:
        throw new Error(`Unknown video processing job type: ${job.type}`);
    }
  }
}

class AIProcessingQueue extends JobQueue {
  constructor() {
    super('ai-processing', 2); // Limit AI processing to 2 concurrent jobs
  }

  async processJob(job) {
    const { aiService } = require('../services/aiService');
    const aiServiceInstance = new aiService();
    
    switch (job.type) {
      case 'generate-summary':
        return await aiServiceInstance.generateSummary(
          job.data.videoId, 
          job.data.transcript, 
          job.data.language
        );
        
      case 'generate-narration':
        return await aiServiceInstance.generateNarration(
          job.data.videoId,
          job.data.text,
          job.data.options
        );
        
      case 'process-chat':
        return await aiServiceInstance.processChat(
          job.data.message,
          job.data.context
        );
        
      default:
        throw new Error(`Unknown AI processing job type: ${job.type}`);
    }
  }
}

// Create queue instances
const videoQueue = new VideoProcessingQueue();
const aiQueue = new AIProcessingQueue();

// Set up event listeners for monitoring
[videoQueue, aiQueue].forEach(queue => {
  queue.on('jobStart', (job) => {
    logger.info(`Job started: ${job.id} (${job.type})`);
  });
  
  queue.on('jobComplete', (job) => {
    logger.info(`Job completed: ${job.id} in ${Date.now() - job.startedAt.getTime()}ms`);
  });
  
  queue.on('jobFailed', (job, error) => {
    logger.error(`Job failed: ${job.id}`, { error: error.message, jobType: job.type });
  });
  
  queue.on('jobProgress', (job) => {
    logger.debug(`Job progress: ${job.id} - ${job.progress}%`);
  });
});

module.exports = {
  JobQueue,
  VideoProcessingQueue,
  AIProcessingQueue,
  videoQueue,
  aiQueue
}; 