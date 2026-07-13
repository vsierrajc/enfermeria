import api from './axios';
import type { Medicamento, PagedResult } from '../types';

export const medicamentosService = {
  findAll: async (params?: { q?: string; soloStockBajo?: boolean; page?: number; limit?: number }): Promise<PagedResult<Medicamento>> => {
    const { data } = await api.get('/medicamentos', { params });
    return data.data;
  },

  findOne: async (id: number): Promise<Medicamento> => {
    const { data } = await api.get(`/medicamentos/${id}`);
    return data.data;
  },

  create: async (dto: Partial<Medicamento>): Promise<Medicamento> => {
    const { data } = await api.post('/medicamentos', dto);
    return data.data;
  },

  update: async (id: number, dto: Partial<Medicamento>): Promise<Medicamento> => {
    const { data } = await api.put(`/medicamentos/${id}`, dto);
    return data.data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/medicamentos/${id}`);
  },
};
