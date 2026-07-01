import api from './axios';
import type { Remision } from '../types';

export const remisionesService = {
  findAll: async (params?: {
    pacienteId?: number;
    estado?: string;
    desde?: string;
    hasta?: string;
  }): Promise<Remision[]> => {
    const { data } = await api.get('/remisiones', { params });
    return data.data;
  },

  findOne: async (id: number): Promise<Remision> => {
    const { data } = await api.get(`/remisiones/${id}`);
    return data.data;
  },

  create: async (dto: Partial<Remision>): Promise<Remision> => {
    const { data } = await api.post('/remisiones', dto);
    return data.data;
  },

  update: async (id: number, dto: Partial<Remision>): Promise<Remision> => {
    const { data } = await api.put(`/remisiones/${id}`, dto);
    return data.data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/remisiones/${id}`);
  },
};
