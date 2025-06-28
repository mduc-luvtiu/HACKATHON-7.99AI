// API configuration for connecting to backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Helper function to handle BE response format
const handleResponse = async (response: Response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }
  
  // BE returns { success, message, data } format
  if (data.success && data.data) {
    return data.data;
  }
  
  // Fallback for other response formats
  return data;
};

export const api = {
  // Authentication
  auth: {
    login: async (email: string, password: string) => {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      return handleResponse(response);
    },
    register: async (email: string, password: string, fullName: string) => {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName }), // BE expects full_name
      });
      
      return handleResponse(response);
    },
    logout: async (token: string) => {
      const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      
      return handleResponse(response);
    },
    updateProfile: async (token: string, data: { full_name?: string; email?: string; bio?: string }) => {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
  },

  // Videos
  videos: {
    getAll: async (token: string, params?: any) => {
      const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
      const response = await fetch(`${API_BASE_URL}/api/videos${queryString}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      return handleResponse(response);
    },
    getById: async (id: string, token: string) => {
      const response = await fetch(`${API_BASE_URL}/api/videos/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      return handleResponse(response);
    },
    addYouTube: async (url: string, token: string, title?: string, description?: string) => {
      const response = await fetch(`${API_BASE_URL}/api/videos/youtube`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url, title, description }),
      });
      
      return handleResponse(response);
    },
    upload: async (file: File, title: string, description: string, token: string) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('description', description);
      
      const response = await fetch(`${API_BASE_URL}/api/videos/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      
      return handleResponse(response);
    },
  },

  // AI Features
  ai: {
    summarize: async (videoId: string, token: string, options?: any) => {
      const response = await fetch(`${API_BASE_URL}/api/ai/summarize/${videoId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(options),
      });
      
      return handleResponse(response);
    },
    narrate: async (videoId: string, token: string, options: any) => {
      const response = await fetch(`${API_BASE_URL}/api/ai/narrate/${videoId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(options),
      });
      
      return handleResponse(response);
    },
    chat: async (message: string, token: string, videoId?: string) => {
      const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message, videoId }),
      });
      
      return handleResponse(response);
    },
  },

  // Health check
  health: async () => {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    return handleResponse(response);
  },
};

export default api; 