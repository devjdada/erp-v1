import api from './api';

export const toolService = {
  getTools: async () => {
    const response = await api.get('/tools');
    return response.data;
  },

  addTool: async (data: { name: string; tool_id: string; type: string; model?: string; serial_number?: string }) => {
    const response = await api.post('/tools', data);
    return response.data;
  },

  getRequests: async (all: boolean = false) => {
    const response = await api.get(`/tools/requests${all ? '?all=true' : ''}`);
    return response.data;
  },

  submitRequest: async (data: { tool_id: number; notes?: string }) => {
    const response = await api.post('/tools/requests', data);
    return response.data;
  },

  resolveRequest: async (id: number | string, data: { status: string; admin_notes?: string }) => {
    const response = await api.patch(`/tools/requests/${id}/handle`, data);
    return response.data;
  }
};
