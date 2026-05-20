import api from './api';

export const leaveService = {
  getLeaves: async () => {
    const response = await api.get('/staff/leaves');
    return response.data;
  },

  getVouchingLeaves: async () => {
    const response = await api.get('/staff/leaves/vouching');
    return response.data;
  },

  submitLeaveRequest: async (data: any) => {
    const response = await api.post('/staff/leaves', data);
    return response.data;
  },

  vouchLeave: async (id: number | string, data: any) => {
    const response = await api.patch(`/staff/leaves/${id}/vouch`, data);
    return response.data;
  },
};
