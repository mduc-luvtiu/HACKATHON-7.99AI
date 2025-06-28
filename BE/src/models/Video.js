const { v4: uuidv4 } = require('uuid');
const database = require('../database/connection');

class Video {
  static async create(videoData) {
    const { user_id, title, description, youtube_url, file_url, thumbnail_url, duration, file_size, metadata } = videoData;
    const id = uuidv4();
    
    const result = await database.run(`
      INSERT INTO videos (id, user_id, title, description, youtube_url, file_url, thumbnail_url, duration, file_size, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, user_id, title, description || null, youtube_url || null, file_url || null, thumbnail_url || null, duration || null, file_size || null, database.stringifyJsonField(metadata)]);
    
    return this.findById(id);
  }
  
  static async findById(id) {
    const video = await database.get(`
      SELECT v.*, u.full_name as user_name
      FROM videos v
      LEFT JOIN users u ON v.user_id = u.id
      WHERE v.id = ?
    `, [id]);
    
    if (video) {
      video.metadata = database.parseJsonField(video.metadata);
    }
    
    return video;
  }
  
  static async findByUserId(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    const videos = await database.all(`
      SELECT * FROM videos 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]);
    
    // Parse metadata for each video
    videos.forEach(video => {
      video.metadata = database.parseJsonField(video.metadata);
    });
    
    const totalResult = await database.get('SELECT COUNT(*) as count FROM videos WHERE user_id = ?', [userId]);
    const total = totalResult.count;
    
    return {
      videos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    
    Object.keys(updateData).forEach(key => {
      if (key !== 'id' && key !== 'user_id') {
        if (key === 'metadata') {
          fields.push(`${key} = ?`);
          values.push(database.stringifyJsonField(updateData[key]));
        } else {
          fields.push(`${key} = ?`);
          values.push(updateData[key]);
        }
      }
    });
    
    if (fields.length === 0) return this.findById(id);
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    await database.run(`
      UPDATE videos SET ${fields.join(', ')} WHERE id = ?
    `, values);
    
    return this.findById(id);
  }
  
  static async updateStatus(id, status, progress = null) {
    const fields = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
    const values = [status];
    
    if (progress !== null) {
      fields.push('processing_progress = ?');
      values.push(progress);
    }
    
    values.push(id);
    
    await database.run(`
      UPDATE videos SET ${fields.join(', ')} WHERE id = ?
    `, values);
    
    return this.findById(id);
  }
  
  static async delete(id) {
    await database.run('DELETE FROM videos WHERE id = ?', [id]);
  }
  
  static async list(page = 1, limit = 10, filters = {}) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];
    
    if (filters.search) {
      conditions.push('(title LIKE ? OR description LIKE ?)');
      values.push(`%${filters.search}%`, `%${filters.search}%`);
    }
    
    if (filters.status) {
      conditions.push('status = ?');
      values.push(filters.status);
    }
    
    if (filters.user_id) {
      conditions.push('user_id = ?');
      values.push(filters.user_id);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const videos = await database.all(`
      SELECT v.*, u.full_name as user_name
      FROM videos v
      LEFT JOIN users u ON v.user_id = u.id
      ${whereClause}
      ORDER BY v.created_at DESC 
      LIMIT ? OFFSET ?
    `, [...values, limit, offset]);
    
    // Parse metadata for each video
    videos.forEach(video => {
      video.metadata = database.parseJsonField(video.metadata);
    });
    
    const countQuery = `
      SELECT COUNT(*) as count 
      FROM videos v
      LEFT JOIN users u ON v.user_id = u.id
      ${whereClause}
    `;
    
    const totalResult = await database.get(countQuery, values);
    const total = totalResult.count;
    
    return {
      videos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  
  static async getWithSummary(id) {
    const video = await this.findById(id);
    if (!video) return null;
    
    const summary = await database.get(`
      SELECT * FROM ai_summaries WHERE video_id = ? ORDER BY created_at DESC LIMIT 1
    `, [id]);
    
    if (summary) {
      summary.key_points = database.parseJsonField(summary.key_points);
      summary.timestamps = database.parseJsonField(summary.timestamps);
    }
    
    return {
      ...video,
      ai_summary: summary
    };
  }
  
  static async getWithNarrations(id) {
    const video = await this.findById(id);
    if (!video) return null;
    
    const narrations = await database.all(`
      SELECT * FROM ai_narrations WHERE video_id = ? ORDER BY created_at DESC
    `, [id]);
    
    narrations.forEach(narration => {
      narration.transcript = database.parseJsonField(narration.transcript);
    });
    
    return {
      ...video,
      narrations
    };
  }
  
  static async getProcessingJobs(id) {
    return database.all(`
      SELECT * FROM processing_jobs WHERE video_id = ? ORDER BY created_at DESC
    `, [id]);
  }
  
  static async createProcessingJob(videoId, jobType) {
    const id = uuidv4();
    
    await database.run(`
      INSERT INTO processing_jobs (id, video_id, job_type, status)
      VALUES (?, ?, ?, 'pending')
    `, [id, videoId, jobType]);
    
    return { id, video_id: videoId, job_type: jobType, status: 'pending' };
  }
  
  static async updateProcessingJob(jobId, updateData) {
    const fields = [];
    const values = [];
    
    Object.keys(updateData).forEach(key => {
      if (key !== 'id') {
        if (key === 'result') {
          fields.push(`${key} = ?`);
          values.push(database.stringifyJsonField(updateData[key]));
        } else {
          fields.push(`${key} = ?`);
          values.push(updateData[key]);
        }
      }
    });
    
    if (fields.length === 0) return null;
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(jobId);
    
    await database.run(`
      UPDATE processing_jobs SET ${fields.join(', ')} WHERE id = ?
    `, values);
    
    return database.get('SELECT * FROM processing_jobs WHERE id = ?', [jobId]);
  }
}

module.exports = Video; 