import api from './api';

export const hrService = {
  getDirectory: async () => {
    const response = await api.get('/staff');
    return response.data;
  },
  getAttendance: async () => {
    const response = await api.get('/attendance');
    return response.data;
  },
  getLeaves: async () => {
    const response = await api.get('/admin/leaves');
    return response.data;
  },
  getPermissions: async () => {
    const response = await api.get('/settings/attendance-permissions');
    return response.data;
  },
  getReports: async () => {
    const response = await api.get('/attendance/stats');
    return response.data;
  },
  getDepartments: async () => {
    const response = await api.get('/departments');
    return response.data;
  },
  getCareers: async () => {
    const response = await api.get('/admin/careers/applications');
    return response.data;
  },
  getTools: async () => {
    const response = await api.get('/tools');
    return response.data;
  },
};
