const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const database = require('../database/connection');

class User {
  static async create(userData) {
    const { email, password, full_name, avatar_url } = userData;
    const id = uuidv4();
    const password_hash = await bcrypt.hash(password, 10);
    
    const result = await database.run(`
      INSERT INTO users (id, email, password_hash, full_name, avatar_url)
      VALUES (?, ?, ?, ?, ?)
    `, [id, email, password_hash, full_name, avatar_url || null]);
    
    return this.findById(id);
  }
  
  static async findById(id) {
    const user = await database.get(`
      SELECT id, email, full_name, avatar_url, subscription_type, 
             subscription_expires_at, ai_usage_count, ai_usage_limit, 
             created_at, updated_at
      FROM users WHERE id = ?
    `, [id]);
    
    return user;
  }
  
  static async findByEmail(email) {
    const user = await database.get(`
      SELECT id, email, password_hash, full_name, avatar_url, subscription_type, 
             subscription_expires_at, ai_usage_count, ai_usage_limit, 
             created_at, updated_at
      FROM users WHERE email = ?
    `, [email]);
    
    return user;
  }
  
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    
    Object.keys(updateData).forEach(key => {
      if (key !== 'id' && key !== 'password_hash') {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });
    
    if (fields.length === 0) return this.findById(id);
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    await database.run(`
      UPDATE users SET ${fields.join(', ')} WHERE id = ?
    `, values);
    
    return this.findById(id);
  }
  
  static async updatePassword(id, newPassword) {
    const password_hash = await bcrypt.hash(newPassword, 10);
    
    await database.run(`
      UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `, [password_hash, id]);
    
    return this.findById(id);
  }
  
  static async incrementUsage(id) {
    await database.run(`
      UPDATE users SET ai_usage_count = ai_usage_count + 1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [id]);
  }
  
  static async checkUsageLimit(id) {
    const user = await this.findById(id);
    if (!user) return false;
    
    return user.ai_usage_count < user.ai_usage_limit;
  }
  
  static async delete(id) {
    await database.run('DELETE FROM users WHERE id = ?', [id]);
  }
  
  static async list(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    const users = await database.all(`
      SELECT id, email, full_name, avatar_url, subscription_type, 
             ai_usage_count, ai_usage_limit, created_at
      FROM users 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `, [limit, offset]);
    
    const totalResult = await database.get('SELECT COUNT(*) as count FROM users');
    const total = totalResult.count;
    
    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  
  static async verifyPassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }
}

module.exports = User; 