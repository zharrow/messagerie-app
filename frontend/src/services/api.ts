import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);

          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (email: string, password: string, remember_me = false) => {
    const response = await api.post('/auth/login', { email, password, remember_me });
    return response.data;
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    await api.post('/auth/logout', { refresh_token: refreshToken });
  },

  refresh: async (refreshToken: string) => {
    const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
    return response.data;
  },
};

// User API
export const userApi = {
  register: async (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }) => {
    const response = await api.post('/users/register', data);
    return response.data;
  },

  listUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  getUser: async (id: number) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  updateUser: async (id: number, data: { first_name?: string; last_name?: string }) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },
};

// Messages API
export const messagesApi = {
  getConversations: async () => {
    const response = await api.get('/messages/conversations');
    return response.data;
  },

  getConversation: async (id: string) => {
    const response = await api.get(`/messages/conversations/${id}`);
    return response.data;
  },

  createConversation: async (data: {
    participants: number[];
    isGroup?: boolean;
    groupName?: string;
  }) => {
    const response = await api.post('/messages/conversations', data);
    return response.data;
  },

  sendMessage: async (conversationId: string, content: string, attachments?: string[]) => {
    const response = await api.post(`/messages/conversations/${conversationId}/messages`, {
      content,
      attachments,
    });
    return response.data;
  },

  markAsRead: async (conversationId: string) => {
    const response = await api.put(`/messages/conversations/${conversationId}/read`);
    return response.data;
  },

  addParticipant: async (conversationId: string, participantId: number) => {
    const response = await api.post(`/messages/conversations/${conversationId}/participants`, {
      participantId,
    });
    return response.data;
  },

  removeParticipant: async (conversationId: string, participantId: number) => {
    const response = await api.delete(
      `/messages/conversations/${conversationId}/participants/${participantId}`
    );
    return response.data;
  },
};

export default api;
