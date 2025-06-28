const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const database = require('./connection');

async function seed() {
  try {
    console.log('Starting database seeding...');
    
    // Connect to database
    await database.connect();
    
    // Create demo user
    const demoUserId = uuidv4();
    const hashedPassword = await bcrypt.hash('demo123', 10);
    
    await database.run(`
      INSERT OR IGNORE INTO users (id, email, password_hash, full_name, subscription_type, ai_usage_limit)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [demoUserId, 'demo@example.com', hashedPassword, 'Demo User', 'premium', 1000]);
    
    console.log('Created demo user');
    
    // Create demo videos
    const demoVideos = [
      {
        id: uuidv4(),
        user_id: demoUserId,
        title: 'Giới thiệu về AI và Machine Learning',
        description: 'Video giới thiệu cơ bản về trí tuệ nhân tạo và học máy',
        file_url: '/demo-videos/ai-intro.mp4',
        thumbnail_url: '/demo-videos/ai-intro-thumb.jpg',
        duration: 1800, // 30 minutes
        file_size: 50000000, // 50MB
        status: 'processed',
        processing_progress: 100,
        metadata: database.stringifyJsonField({
          resolution: '1920x1080',
          format: 'mp4',
          bitrate: '2000k',
          fps: 30
        })
      },
      {
        id: uuidv4(),
        user_id: demoUserId,
        title: 'Hướng dẫn lập trình Python cơ bản',
        description: 'Khóa học Python từ cơ bản đến nâng cao',
        file_url: '/demo-videos/python-tutorial.mp4',
        thumbnail_url: '/demo-videos/python-tutorial-thumb.jpg',
        duration: 3600, // 1 hour
        file_size: 80000000, // 80MB
        status: 'processed',
        processing_progress: 100,
        metadata: database.stringifyJsonField({
          resolution: '1920x1080',
          format: 'mp4',
          bitrate: '2500k',
          fps: 30
        })
      },
      {
        id: uuidv4(),
        user_id: demoUserId,
        title: 'Thiết kế web với React và Next.js',
        description: 'Tutorial về xây dựng ứng dụng web hiện đại',
        file_url: '/demo-videos/react-nextjs.mp4',
        thumbnail_url: '/demo-videos/react-nextjs-thumb.jpg',
        duration: 2700, // 45 minutes
        file_size: 60000000, // 60MB
        status: 'processed',
        processing_progress: 100,
        metadata: database.stringifyJsonField({
          resolution: '1920x1080',
          format: 'mp4',
          bitrate: '2200k',
          fps: 30
        })
      }
    ];
    
    for (const video of demoVideos) {
      await database.run(`
        INSERT OR IGNORE INTO videos (id, user_id, title, description, file_url, thumbnail_url, duration, file_size, status, processing_progress, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [video.id, video.user_id, video.title, video.description, video.file_url, video.thumbnail_url, video.duration, video.file_size, video.status, video.processing_progress, video.metadata]);
    }
    
    console.log('Created demo videos');
    
    // Create demo AI summaries
    const demoSummaries = [
      {
        id: uuidv4(),
        video_id: demoVideos[0].id,
        overview: 'Video giới thiệu tổng quan về AI và Machine Learning, bao gồm các khái niệm cơ bản, ứng dụng thực tế và xu hướng phát triển trong tương lai.',
        key_points: database.stringifyJsonField([
          'AI là công nghệ mô phỏng trí tuệ con người',
          'Machine Learning là tập con của AI',
          'Deep Learning sử dụng neural networks',
          'AI có ứng dụng rộng rãi trong nhiều lĩnh vực'
        ]),
        timestamps: database.stringifyJsonField([
          { time: '00:00', content: 'Giới thiệu chủ đề' },
          { time: '05:30', content: 'Định nghĩa AI và ML' },
          { time: '12:15', content: 'Deep Learning' },
          { time: '20:45', content: 'Ứng dụng thực tế' },
          { time: '28:30', content: 'Tương lai của AI' }
        ]),
        language: 'vi',
        model_used: 'gpt-4'
      },
      {
        id: uuidv4(),
        video_id: demoVideos[1].id,
        overview: 'Khóa học Python toàn diện từ cơ bản đến nâng cao, bao gồm syntax, data structures, OOP và các thư viện phổ biến.',
        key_points: database.stringifyJsonField([
          'Python là ngôn ngữ lập trình đa năng',
          'Syntax đơn giản và dễ học',
          'Có nhiều thư viện mạnh mẽ',
          'Ứng dụng trong AI, web, data science'
        ]),
        timestamps: database.stringifyJsonField([
          { time: '00:00', content: 'Giới thiệu Python' },
          { time: '08:20', content: 'Cài đặt và setup' },
          { time: '15:45', content: 'Variables và data types' },
          { time: '30:10', content: 'Control structures' },
          { time: '45:30', content: 'Functions và modules' },
          { time: '55:20', content: 'OOP trong Python' }
        ]),
        language: 'vi',
        model_used: 'gpt-4'
      }
    ];
    
    for (const summary of demoSummaries) {
      await database.run(`
        INSERT OR IGNORE INTO ai_summaries (id, video_id, overview, key_points, timestamps, language, model_used)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [summary.id, summary.video_id, summary.overview, summary.key_points, summary.timestamps, summary.language, summary.model_used]);
    }
    
    console.log('Created demo AI summaries');
    
    // Create demo chat messages
    const demoMessages = [
      {
        id: uuidv4(),
        user_id: demoUserId,
        video_id: demoVideos[0].id,
        message_type: 'user',
        content: 'AI có thể thay thế con người không?'
      },
      {
        id: uuidv4(),
        user_id: demoUserId,
        video_id: demoVideos[0].id,
        message_type: 'ai',
        content: 'AI hiện tại chưa thể thay thế hoàn toàn con người. AI giỏi ở việc xử lý dữ liệu lớn và tự động hóa, nhưng vẫn thiếu khả năng sáng tạo, cảm xúc và trực giác như con người. AI và con người sẽ bổ trợ cho nhau trong tương lai.'
      },
      {
        id: uuidv4(),
        user_id: demoUserId,
        video_id: demoVideos[1].id,
        message_type: 'user',
        content: 'Python có khó học không?'
      },
      {
        id: uuidv4(),
        user_id: demoUserId,
        video_id: demoVideos[1].id,
        message_type: 'ai',
        content: 'Python được thiết kế để dễ học và dễ đọc. Syntax đơn giản, gần với ngôn ngữ tự nhiên. Người mới bắt đầu có thể học Python trong vài tuần để viết được chương trình cơ bản. Tuy nhiên, để thành thạo cần thời gian thực hành và học các thư viện nâng cao.'
      }
    ];
    
    for (const message of demoMessages) {
      await database.run(`
        INSERT OR IGNORE INTO chat_messages (id, user_id, video_id, message_type, content)
        VALUES (?, ?, ?, ?, ?)
      `, [message.id, message.user_id, message.video_id, message.message_type, message.content]);
    }
    
    console.log('Created demo chat messages');
    
    console.log('Database seeding completed successfully!');
    
    // Close database connection
    await database.close();
    
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seed();
}

module.exports = seed; 