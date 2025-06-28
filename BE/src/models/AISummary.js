const { v4: uuidv4 } = require('uuid');
const database = require('../database/connection');

class AISummary {
  static async create(summaryData) {
    const { video_id, overview, key_points, timestamps, language, model_used } = summaryData;
    const id = uuidv4();
    
    const result = await database.run(`
      INSERT INTO ai_summaries (id, video_id, overview, key_points, timestamps, language, model_used)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, video_id, overview, database.stringifyJsonField(key_points), database.stringifyJsonField(timestamps), language || 'vi', model_used]);
    
    return this.findById(id);
  }
  
  static async findById(id) {
    const summary = await database.get(`
      SELECT s.*, v.title as video_title, v.user_id
      FROM ai_summaries s
      LEFT JOIN videos v ON s.video_id = v.id
      WHERE s.id = ?
    `, [id]);
    
    if (summary) {
      summary.key_points = database.parseJsonField(summary.key_points);
      summary.timestamps = database.parseJsonField(summary.timestamps);
    }
    
    return summary;
  }
  
  static async findByVideoId(videoId) {
    const summaries = await database.all(`
      SELECT * FROM ai_summaries WHERE video_id = ? ORDER BY created_at DESC
    `, [videoId]);
    
    summaries.forEach(summary => {
      summary.key_points = database.parseJsonField(summary.key_points);
      summary.timestamps = database.parseJsonField(summary.timestamps);
    });
    
    return summaries;
  }
  
  static async getLatestByVideoId(videoId) {
    const summary = await database.get(`
      SELECT * FROM ai_summaries WHERE video_id = ? ORDER BY created_at DESC LIMIT 1
    `, [videoId]);
    
    if (summary) {
      summary.key_points = database.parseJsonField(summary.key_points);
      summary.timestamps = database.parseJsonField(summary.timestamps);
    }
    
    return summary;
  }
  
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    
    Object.keys(updateData).forEach(key => {
      if (key !== 'id' && key !== 'video_id') {
        if (key === 'key_points' || key === 'timestamps') {
          fields.push(`${key} = ?`);
          values.push(database.stringifyJsonField(updateData[key]));
        } else {
          fields.push(`${key} = ?`);
          values.push(updateData[key]);
        }
      }
    });
    
    if (fields.length === 0) return this.findById(id);
    
    values.push(id);
    
    await database.run(`
      UPDATE ai_summaries SET ${fields.join(', ')} WHERE id = ?
    `, values);
    
    return this.findById(id);
  }
  
  static async delete(id) {
    await database.run('DELETE FROM ai_summaries WHERE id = ?', [id]);
  }
  
  static async deleteByVideoId(videoId) {
    await database.run('DELETE FROM ai_summaries WHERE video_id = ?', [videoId]);
  }
  
  static async list(page = 1, limit = 10, filters = {}) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];
    
    if (filters.video_id) {
      conditions.push('video_id = ?');
      values.push(filters.video_id);
    }
    
    if (filters.language) {
      conditions.push('language = ?');
      values.push(filters.language);
    }
    
    if (filters.model_used) {
      conditions.push('model_used = ?');
      values.push(filters.model_used);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const summaries = await database.all(`
      SELECT s.*, v.title as video_title, v.user_id
      FROM ai_summaries s
      LEFT JOIN videos v ON s.video_id = v.id
      ${whereClause}
      ORDER BY s.created_at DESC 
      LIMIT ? OFFSET ?
    `, [...values, limit, offset]);
    
    summaries.forEach(summary => {
      summary.key_points = database.parseJsonField(summary.key_points);
      summary.timestamps = database.parseJsonField(summary.timestamps);
    });
    
    const countQuery = `
      SELECT COUNT(*) as count 
      FROM ai_summaries s
      LEFT JOIN videos v ON s.video_id = v.id
      ${whereClause}
    `;
    
    const totalResult = await database.get(countQuery, values);
    const total = totalResult.count;
    
    return {
      summaries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  
  static async getStats() {
    const stats = await database.get(`
      SELECT 
        COUNT(*) as total_summaries,
        COUNT(DISTINCT video_id) as unique_videos,
        COUNT(DISTINCT model_used) as models_used,
        AVG(LENGTH(overview)) as avg_overview_length
      FROM ai_summaries
    `);
    
    const languageStats = await database.all(`
      SELECT language, COUNT(*) as count
      FROM ai_summaries
      GROUP BY language
      ORDER BY count DESC
    `);
    
    const modelStats = await database.all(`
      SELECT model_used, COUNT(*) as count
      FROM ai_summaries
      GROUP BY model_used
      ORDER BY count DESC
    `);
    
    return {
      ...stats,
      language_stats: languageStats,
      model_stats: modelStats
    };
  }
}

module.exports = AISummary; 