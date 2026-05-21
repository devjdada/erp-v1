import api from './api';

export interface CreateTicketPayload {
  subject: string;
  description: string;
  department_id: number;
  category?: string;
  priority: 'low' | 'medium' | 'high';
}

export const ticketService = {
  getTickets: async () => {
    const response = await api.get('/staff/tickets');
    return response.data;
  },

  getTicket: async (id: number) => {
    const response = await api.get(`/staff/tickets/${id}`);
    return response.data;
  },

  createTicket: async (data: CreateTicketPayload) => {
    const response = await api.post('/staff/tickets', data);
    return response.data;
  },

  addMessage: async (id: number, message: string) => {
    const response = await api.post(`/staff/tickets/${id}/message`, { message });
    return response.data;
  },
};
