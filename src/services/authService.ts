import api from './api';

export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/login', {
      email,
      password,
      device_name: 'mobile_app',
    });
    return response.data;
  },

  register: async (name: string, email: string, password: string) => {
    const response = await api.post('/register', {
      name,
      email,
      password,
      password_confirmation: password,
    });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/logout');
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/user');
    return response.data;
  },

  refreshToken: async () => {
    const response = await api.post('/refresh-token');
    return response.data;
  },
};

