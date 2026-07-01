import api from './axios';
import type { Control } from '../types';

export const controlesService = {
  findAll: async (params?: {
    pacienteId?: number;
    desde?: string;
    hasta?: string;
    tipo?: string;
  }): Promise<Control[]> => {
    const { data } = await api.get('/controles', { params });
    return data.data;
  },

  findOne: async (id: number): Promise<Control> => {
    const { data } = await api.get(`/controles/${id}`);
    return data.data;
  },

  create: async (dto: Partial<Control>): Promise<Control> => {
    const { data } = await api.post('/controles', dto);
    return data.data;
  },

  update: async (id: number, dto: Partial<Control>): Promise<Control> => {
    const { data } = await api.put(`/controles/${id}`, dto);
    return data.data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/controles/${id}`);
  },
};
