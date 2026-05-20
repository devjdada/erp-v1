import api from './api';

export const attendanceService = {
  clockInOut: async (endpoint: string, latitude: number | null, longitude: number | null) => {
    const response = await api.post(`/attendance/${endpoint}`, {
      latitude,
      longitude,
    });
    return response.data;
  },

  getCorrections: async () => {
    const response = await api.get('/attendance/corrections');
    return response.data;
  },

  submitCorrection: async (data: any) => {
    const response = await api.post('/attendance/corrections', data);
    return response.data;
  },

  getLogs: async (staffId: string | number) => {
    const response = await api.get(`/attendance?staff_id=${staffId}`);
    return response.data;
  },

  getPermissions: async () => {
    const response = await api.get('/settings/attendance-permissions');
    return response.data;
  },
};
