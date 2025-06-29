// Frontend Messages Constants
export const MESSAGES = {
  AUTH: {
    LOGIN_SUCCESS: 'Đăng nhập thành công',
    LOGIN_FAILED: 'Đăng nhập thất bại',
    REGISTER_SUCCESS: 'Đăng ký thành công',
    REGISTER_FAILED: 'Đăng ký thất bại',
    LOGOUT_SUCCESS: 'Đăng xuất thành công',
    INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng',
    EMAIL_EXISTS: 'Email đã tồn tại',
    USER_NOT_FOUND: 'Người dùng không tồn tại',
    ACCESS_DENIED: 'Truy cập bị từ chối',
    TOKEN_EXPIRED: 'Token đã hết hạn',
    TOKEN_INVALID: 'Token không hợp lệ',
    NOT_LOGGED_IN: 'Chưa đăng nhập',
    PASSWORD_MISMATCH: 'Mật khẩu không khớp',
    PASSWORD_TOO_SHORT: 'Mật khẩu phải có ít nhất 6 ký tự',
    EMAIL_INVALID: 'Email không hợp lệ',
    NAME_REQUIRED: 'Tên không được để trống'
  },
  VALIDATION: {
    FAILED: 'Validation failed',
    REQUIRED_FIELD: 'Trường này là bắt buộc',
    INVALID_FORMAT: 'Định dạng không hợp lệ',
    FILE_TOO_LARGE: 'File quá lớn',
    INVALID_FILE_TYPE: 'Loại file không được hỗ trợ',
    INVALID_URL: 'URL không hợp lệ',
    INVALID_UUID: 'ID không hợp lệ',
    MIN_LENGTH: 'Phải có ít nhất {min} ký tự',
    MAX_LENGTH: 'Không được quá {max} ký tự',
    INVALID_EMAIL: 'Email không hợp lệ',
    INVALID_PASSWORD: 'Mật khẩu không hợp lệ'
  },
  VIDEO: {
    UPLOAD_SUCCESS: 'Upload video thành công',
    UPLOAD_FAILED: 'Upload video thất bại',
    NOT_FOUND: 'Video không tồn tại',
    DELETE_SUCCESS: 'Xóa video thành công',
    DELETE_FAILED: 'Xóa video thất bại',
    UPDATE_SUCCESS: 'Cập nhật video thành công',
    UPDATE_FAILED: 'Cập nhật video thất bại',
    PROCESSING: 'Video đang được xử lý',
    PROCESSING_FAILED: 'Xử lý video thất bại',
    ALREADY_EXISTS: 'Video đã tồn tại',
    INVALID_URL: 'URL video không hợp lệ',
    DOWNLOAD_FAILED: 'Tải video thất bại',
    EXTRACT_AUDIO_FAILED: 'Trích xuất audio thất bại',
    GENERATE_THUMBNAIL_FAILED: 'Tạo thumbnail thất bại',
    TRANSCRIPT_GENERATED: 'Transcript đã được tạo',
    TRANSCRIPT_FAILED: 'Tạo transcript thất bại'
  },
  AI: {
    SUMMARY_SUCCESS: 'Tạo tóm tắt thành công',
    SUMMARY_FAILED: 'Tạo tóm tắt thất bại',
    NARRATION_SUCCESS: 'Tạo narration thành công',
    NARRATION_FAILED: 'Tạo narration thất bại',
    CHAT_SUCCESS: 'Xử lý tin nhắn thành công',
    CHAT_FAILED: 'Xử lý tin nhắn thất bại',
    PROCESSING: 'AI đang xử lý',
    MODEL_ERROR: 'Lỗi mô hình AI',
    API_ERROR: 'Lỗi API AI',
    QUOTA_EXCEEDED: 'Đã vượt quá giới hạn sử dụng',
    FEATURE_NOT_AVAILABLE: 'Tính năng không khả dụng'
  },
  CHAT: {
    MESSAGE_SENT: 'Tin nhắn đã gửi',
    MESSAGE_FAILED: 'Gửi tin nhắn thất bại',
    MESSAGE_NOT_FOUND: 'Tin nhắn không tồn tại',
    MESSAGE_DELETED: 'Tin nhắn đã xóa',
    DELETE_FAILED: 'Xóa tin nhắn thất bại',
    CONVERSATION_NOT_FOUND: 'Cuộc trò chuyện không tồn tại',
    MESSAGE_TOO_LONG: 'Tin nhắn quá dài',
    MESSAGE_TOO_SHORT: 'Tin nhắn quá ngắn',
    INVALID_MESSAGE_TYPE: 'Loại tin nhắn không hợp lệ'
  },
  USER: {
    PROFILE_UPDATED: 'Cập nhật hồ sơ thành công',
    PROFILE_UPDATE_FAILED: 'Cập nhật hồ sơ thất bại',
    AVATAR_UPDATED: 'Cập nhật avatar thành công',
    AVATAR_UPDATE_FAILED: 'Cập nhật avatar thất bại',
    PASSWORD_CHANGED: 'Đổi mật khẩu thành công',
    PASSWORD_CHANGE_FAILED: 'Đổi mật khẩu thất bại',
    ACCOUNT_DELETED: 'Tài khoản đã xóa',
    ACCOUNT_DELETE_FAILED: 'Xóa tài khoản thất bại',
    SUBSCRIPTION_UPDATED: 'Cập nhật gói thành công',
    SUBSCRIPTION_UPDATE_FAILED: 'Cập nhật gói thất bại'
  },
  SYSTEM: {
    INTERNAL_ERROR: 'Lỗi hệ thống',
    SERVICE_UNAVAILABLE: 'Dịch vụ không khả dụng',
    MAINTENANCE: 'Hệ thống đang bảo trì',
    RATE_LIMIT_EXCEEDED: 'Vượt quá giới hạn tần suất',
    DATABASE_ERROR: 'Lỗi cơ sở dữ liệu',
    FILE_SYSTEM_ERROR: 'Lỗi hệ thống file',
    NETWORK_ERROR: 'Lỗi mạng',
    TIMEOUT: 'Yêu cầu hết thời gian chờ',
    NOT_IMPLEMENTED: 'Tính năng chưa được triển khai',
    FORBIDDEN: 'Truy cập bị cấm',
    NOT_FOUND: 'Không tìm thấy tài nguyên',
    BAD_REQUEST: 'Yêu cầu không hợp lệ',
    UNAUTHORIZED: 'Chưa được ủy quyền'
  },
  DEMO: {
    AI_REPLACEMENT_QUESTION: 'AI có thể thay thế con người không?',
    AI_REPLACEMENT_ANSWER: 'AI hiện tại chưa thể thay thế hoàn toàn con người. AI giỏi ở việc xử lý dữ liệu lớn và tự động hóa, nhưng vẫn thiếu khả năng sáng tạo, cảm xúc và trực giác như con người. AI và con người sẽ bổ trợ cho nhau trong tương lai.',
    PYTHON_QUESTION: 'Python có khó học không?',
    PYTHON_ANSWER: 'Python được thiết kế để dễ học và dễ đọc. Syntax đơn giản, gần với ngôn ngữ tự nhiên. Người mới bắt đầu có thể học Python trong vài tuần để viết được chương trình cơ bản. Tuy nhiên, để thành thạo cần thời gian thực hành và học các thư viện nâng cao.',
    MOCK_TRANSCRIPT: 'Đây là transcript mẫu được tạo ra từ audio. Trong môi trường production, bạn sẽ sử dụng OpenAI Whisper hoặc các dịch vụ speech-to-text khác để tạo transcript thực tế từ audio file.',
    MOCK_NARRATION_TEXT: 'Đây là nội dung mẫu để tạo narration. Trong môi trường production, bạn sẽ sử dụng transcript hoặc tóm tắt của video để tạo narration. Narration này sẽ được chuyển thành audio sử dụng text-to-speech.',
    SUGGESTION_1: 'Bạn có thể giải thích thêm về chủ đề này không?',
    SUGGESTION_2: 'Có video nào liên quan khác không?',
    SUGGESTION_3: 'Tôi muốn tìm hiểu sâu hơn về điểm này'
  },
  AI_PROMPTS: {
    SYSTEM_CHAT: `Bạn là trợ lý AI thông minh giúp người dùng hiểu nội dung video.
    
    Hãy trả lời bằng tiếng Việt một cách hữu ích và thân thiện.
    Nếu có thông tin về video, hãy sử dụng để đưa ra câu trả lời chính xác.
    Đề xuất video liên quan khi phù hợp.`,
    SUGGESTION_PROMPT: `
    Dựa trên tin nhắn: "{message}"
    
    Hãy tạo 3 câu hỏi gợi ý liên quan mà người dùng có thể hỏi tiếp theo.
    Trả lời bằng JSON:
    {
      "textSuggestions": ["câu hỏi 1", "câu hỏi 2", "câu hỏi 3"]
    }
    `
  },
  FILES: {
    TRANSCRIPT_FILENAME: 'transcript_{videoId}.txt',
    NARRATION_FILENAME: 'narration_{videoId}_{timestamp}.mp3'
  }
};

export function formatMessage(message: string, params: Record<string, string | number> = {}) {
  let formattedMessage = message;
  Object.keys(params).forEach(key => {
    formattedMessage = formattedMessage.replace(`{${key}}`, String(params[key]));
  });
  return formattedMessage;
} 