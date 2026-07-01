import api from './axios';
import type { EstadisticasResumen, ControlesPorMes, PresionPromedio } from '../types';

export const estadisticasService = {
  getResumen: async (params?: { desde?: string; hasta?: string }): Promise<EstadisticasResumen> => {
    const { data } = await api.get('/estadisticas/resumen', { params });
    return data.data;
  },

  getControlesPorMes: async (anio?: number): Promise<ControlesPorMes[]> => {
    const { data } = await api.get('/estadisticas/controles-por-mes', {
      params: { anio },
    });
    return data.data;
  },

  getPresionPromedio: async (params?: {
    desde?: string;
    hasta?: string;
  }): Promise<PresionPromedio> => {
    const { data } = await api.get('/estadisticas/presion-promedio', { params });
    return data.data;
  },

  getControlesPorTipo: async (): Promise<{ tipo: string; cantidad: number }[]> => {
    const { data } = await api.get('/estadisticas/controles-por-tipo');
    return data.data;
  },

  getRemisionesPorEstado: async (): Promise<{ estado: string; cantidad: number }[]> => {
    const { data } = await api.get('/estadisticas/remisiones-por-estado');
    return data.data;
  },
};
