import api from './api';

export const loanService = {
  getLoans: async () => {
    const response = await api.get('/staff/loans');
    return response.data;
  },

  applyForLoan: async (data: { amount: number; tenure_months: number; reason?: string }) => {
    const response = await api.post('/staff/loans', data);
    return response.data;
  },
};
