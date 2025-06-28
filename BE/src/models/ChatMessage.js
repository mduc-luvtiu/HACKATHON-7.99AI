const { v4: uuidv4 } = require('uuid');
const database = require('../database/connection');

class ChatMessage {
  static async create(messageData) {
    const { user_id, video_id, message_type, content, metadata, parent_message_id } = messageData;
    const id = uuidv4();
    
    const result = await database.run(`
      INSERT INTO chat_messages (id, user_id, video_id, message_type, content, metadata, parent_message_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, user_id, video_id || null, message_type, content, database.stringifyJsonField(metadata), parent_message_id || null]);
    
    return this.findById(id);
  }
  
  static async findById(id) {
    const message = await database.get(`
      SELECT m.*, u.full_name as user_name, v.title as video_title
      FROM chat_messages m
      LEFT JOIN users u ON m.user_id = u.id
      LEFT JOIN videos v ON m.video_id = v.id
      WHERE m.id = ?
    `, [id]);
    
    if (message) {
      message.metadata = database.parseJsonField(message.metadata);
    }
    
    return message;
  }
  
  static async findByVideoId(videoId, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    
    const messages = await database.all(`
      SELECT m.*, u.full_name as user_name, u.avatar_url as user_avatar
      FROM chat_messages m
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.video_id = ?
      ORDER BY m.created_at ASC
      LIMIT ? OFFSET ?
    `, [videoId, limit, offset]);
    
    messages.forEach(message => {
      message.metadata = database.parseJsonField(message.metadata);
    });
    
    const totalResult = await database.get('SELECT COUNT(*) as count FROM chat_messages WHERE video_id = ?', [videoId]);
    const total = totalResult.count;
    
    return {
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  
  static async findByUserId(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    const messages = await database.all(`
      SELECT m.*, v.title as video_title, v.thumbnail_url as video_thumbnail
      FROM chat_messages m
      LEFT JOIN videos v ON m.video_id = v.id
      WHERE m.user_id = ?
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]);
    
    messages.forEach(message => {
      message.metadata = database.parseJsonField(message.metadata);
    });
    
    const totalResult = await database.get('SELECT COUNT(*) as count FROM chat_messages WHERE user_id = ?', [userId]);
    const total = totalResult.count;
    
    return {
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  
  static async getConversationHistory(videoId, limit = 10) {
    const messages = await database.all(`
      SELECT m.*, u.full_name as user_name, u.avatar_url as user_avatar
      FROM chat_messages m
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.video_id = ?
      ORDER BY m.created_at DESC
      LIMIT ?
    `, [videoId, limit]);
    
    messages.forEach(message => {
      message.metadata = database.parseJsonField(message.metadata);
    });
    
    return messages.reverse(); // Return in chronological order
  }
  
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    
    Object.keys(updateData).forEach(key => {
      if (key !== 'id' && key !== 'user_id' && key !== 'video_id') {
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
    
    values.push(id);
    
    await database.run(`
      UPDATE chat_messages SET ${fields.join(', ')} WHERE id = ?
    `, values);
    
    return this.findById(id);
  }
  
  static async delete(id) {
    await database.run('DELETE FROM chat_messages WHERE id = ?', [id]);
  }
  
  static async deleteByVideoId(videoId) {
    await database.run('DELETE FROM chat_messages WHERE video_id = ?', [videoId]);
  }
  
  static async deleteByUserId(userId) {
    await database.run('DELETE FROM chat_messages WHERE user_id = ?', [userId]);
  }
  
  static async getReplies(parentMessageId) {
    const replies = await database.all(`
      SELECT m.*, u.full_name as user_name, u.avatar_url as user_avatar
      FROM chat_messages m
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.parent_message_id = ?
      ORDER BY m.created_at ASC
    `, [parentMessageId]);
    
    replies.forEach(reply => {
      reply.metadata = database.parseJsonField(reply.metadata);
    });
    
    return replies;
  }
  
  static async searchMessages(userId, query, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    const messages = await database.all(`
      SELECT m.*, v.title as video_title, v.thumbnail_url as video_thumbnail
      FROM chat_messages m
      LEFT JOIN videos v ON m.video_id = v.id
      WHERE m.user_id = ? AND m.content LIKE ?
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, `%${query}%`, limit, offset]);
    
    messages.forEach(message => {
      message.metadata = database.parseJsonField(message.metadata);
    });
    
    const totalResult = await database.get(
      'SELECT COUNT(*) as count FROM chat_messages WHERE user_id = ? AND content LIKE ?', 
      [userId, `%${query}%`]
    );
    const total = totalResult.count;
    
    return {
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  
  static async getStats(userId) {
    const stats = await database.get(`
      SELECT 
        COUNT(*) as total_messages,
        COUNT(DISTINCT video_id) as videos_discussed,
        COUNT(CASE WHEN message_type = 'ai' THEN 1 END) as ai_responses,
        COUNT(CASE WHEN message_type = 'user' THEN 1 END) as user_messages,
        MAX(created_at) as last_message_at
      FROM chat_messages
      WHERE user_id = ?
    `, [userId]);
    
    const recentActivity = await database.all(`
      SELECT DATE(created_at) as date, COUNT(*) as message_count
      FROM chat_messages
      WHERE user_id = ? AND created_at >= datetime('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [userId]);
    
    return {
      ...stats,
      recent_activity: recentActivity
    };
  }
}

module.exports = ChatMessage; 