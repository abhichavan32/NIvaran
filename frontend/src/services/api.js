import axios from 'axios';

const API_BASE_URL = 'https://clean-days-tease.loca.lt/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true'
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const tokens = localStorage.getItem('tokens');
    if (tokens) {
      const { access } = JSON.parse(tokens);
      config.headers.Authorization = `Bearer ${access}`;
    }
    // If sending FormData, remove Content-Type to let browser set it
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const tokens = JSON.parse(localStorage.getItem('tokens'));
        const response = await axios.post(`${API_BASE_URL}/users/token/refresh/`, {
          refresh: tokens.refresh,
        });
        const newTokens = { ...tokens, access: response.data.access };
        localStorage.setItem('tokens', JSON.stringify(newTokens));
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('tokens');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data) => api.post('/users/login/', data),
  register: (data) => api.post('/users/register/', data),
  getProfile: () => api.get('/users/profile/'),
  updateProfile: (data) => api.patch('/users/profile/', data),
  changePassword: (data) => api.post('/users/change-password/', data),
};

// Issues API
export const issuesAPI = {
  getAll: (params) => api.get('/issues/', { params }),
  getById: (id) => api.get(`/issues/${id}/`),
  create: (data) => api.post('/issues/create/', data),
  update: (id, data) => api.patch(`/issues/${id}/update/`, data),
  delete: (id) => api.delete(`/issues/${id}/delete/`),
  vote: (id) => api.post(`/issues/${id}/vote/`),
  assign: (id, adminId) => api.post(`/issues/${id}/assign/`, { admin_id: adminId }),
  getComments: (id) => api.get(`/issues/${id}/comments/`),
  addComment: (id, text) => api.post(`/issues/${id}/comments/`, { text }),
  getMapData: () => api.get('/issues/map/'),
  findSimilar: (data) => api.post('/issues/similar/', data),
  chat: (message) => api.post('/issues/chatbot/', { message }),
  export: () => api.get('/issues/export/', { responseType: 'blob' }),
};

// Users API (Admin)
export const usersAPI = {
  getAll: (params) => api.get('/users/list/', { params }),
  getById: (id) => api.get(`/users/${id}/`),
  update: (id, data) => api.patch(`/users/${id}/`, data),
  delete: (id) => api.delete(`/users/${id}/`),
  getAreaAdmins: () => api.get('/users/area-admins/'),
  getDashboardStats: () => api.get('/users/dashboard-stats/'),
};

// Notifications API
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications/', { params }),
  markRead: (id) => api.post(`/notifications/${id}/read/`),
  markAllRead: () => api.post('/notifications/read-all/'),
  getUnreadCount: () => api.get('/notifications/unread-count/'),
};

export default api;
