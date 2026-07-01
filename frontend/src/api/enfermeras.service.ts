import api from './axios';
import type { Enfermera } from '../types';

export const enfermerasService = {
  findAll: async (): Promise<Enfermera[]> => {
    const { data } = await api.get('/enfermeras');
    return data.data;
  },

  findOne: async (id: number): Promise<Enfermera> => {
    const { data } = await api.get(`/enfermeras/${id}`);
    return data.data;
  },

  create: async (dto: Partial<Enfermera & { password: string }>): Promise<Enfermera> => {
    const { data } = await api.post('/enfermeras', dto);
    return data.data;
  },
};
