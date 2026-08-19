import api from './api';

export const authService = {
  login: async (credentials) => {
    return await api.post('/auth/login', credentials);
  },

  register: async (userData) => {
    return await api.post('/auth/register', userData);
  },

  signup: async (userData) => {
    return await api.post('/auth/signup', userData);
  },

  getProfile: async () => {
    return await api.get('/auth/profile');
  },

  getMe: async () => {
    return await api.get('/auth/me');
  },

  updateProfile: async (profileData) => {
    return await api.put('/auth/profile', profileData);
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export default authService;
