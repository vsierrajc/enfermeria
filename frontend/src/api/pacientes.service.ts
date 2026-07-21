import api from './axios';
import type { PagedResult, Paciente } from '../types';

export const pacientesService = {
  findAll: async (params?: {
    q?: string;
    departamento?: string;
    page?: number;
    limit?: number;
  }): Promise<PagedResult<Paciente>> => {
    const { data } = await api.get('/pacientes', { params });
    return data.data;
  },

  findOne: async (id: number): Promise<Paciente> => {
    const { data } = await api.get(`/pacientes/${id}`);
    return data.data;
  },

  create: async (dto: Partial<Paciente>): Promise<Paciente> => {
    const { data } = await api.post('/pacientes', dto);
    return data.data;
  },

  update: async (id: number, dto: Partial<Paciente>): Promise<Paciente> => {
    const { data } = await api.put(`/pacientes/${id}`, dto);
    return data.data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/pacientes/${id}`);
  },
};
