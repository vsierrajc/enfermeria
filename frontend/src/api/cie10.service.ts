import api from './axios';
import type { Cie10 } from '../types';

export const cie10Service = {
  search: async (q: string): Promise<Cie10[]> => {
    const { data } = await api.get('/cie10', { params: { q } });
    return data.data;
  },
};
