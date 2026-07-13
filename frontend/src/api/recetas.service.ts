import api from './axios';
import type { PagedResult, Receta } from '../types';

export const recetasService = {
  findAll: async (params?: {
    pacienteId?: number;
    medicamentoId?: number;
    desde?: string;
    hasta?: string;
    page?: number;
    limit?: number;
  }): Promise<PagedResult<Receta>> => {
    const { data } = await api.get('/recetas', { params });
    return data.data;
  },

  findOne: async (id: number): Promise<Receta> => {
    const { data } = await api.get(`/recetas/${id}`);
    return data.data;
  },

  create: async (dto: Partial<Receta>): Promise<Receta> => {
    const { data } = await api.post('/recetas', dto);
    return data.data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/recetas/${id}`);
  },
};
