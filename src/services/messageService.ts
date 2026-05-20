import api from './api';

export const messageService = {
  getMessages: async () => {
    const response = await api.get('/messages');
    return response.data;
  },

  getResources: async () => {
    const response = await api.get('/messages/resources');
    return response.data;
  },

  createChat: async (payload: any) => {
    const response = await api.post('/messages', payload);
    return response.data;
  },

  getThread: async (threadId: string | number) => {
    const response = await api.get(`/messages/thread/${threadId}`);
    return response.data;
  },

  markThreadRead: async (threadId: string | number) => {
    const response = await api.post(`/messages/${threadId}/read`);
    return response.data;
  },

  sendMessage: async (payload: any, config?: any) => {
    const response = await api.post('/messages', payload, config); // For sending new msg
    return response.data;
  },
};
