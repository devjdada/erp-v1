import api from './api';

export const workspaceService = {
  getDashboard: async () => {
    const response = await api.get('/staff/dashboard');
    return response.data;
  },
};
