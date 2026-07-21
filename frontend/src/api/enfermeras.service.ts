import api from './axios';
import type { Enfermera, PagedResult } from '../types';

export const enfermerasService = {
  findAll: async (params?: { q?: string; page?: number; limit?: number }): Promise<PagedResult<Enfermera>> => {
    const { data } = await api.get('/enfermeras', { params });
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

  update: async (id: number, dto: Partial<Enfermera & { roleId?: number }>): Promise<Enfermera> => {
    const { data } = await api.put(`/enfermeras/${id}`, dto);
    return data.data;
  },
};
