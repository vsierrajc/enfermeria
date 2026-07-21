import api from './axios';

export const motivosService = {
  search: async (q: string): Promise<string[]> => {
    const { data } = await api.get('/motivos', { params: { q } });
    return data.data;
  },
};
