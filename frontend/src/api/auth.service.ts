import api from './axios';
import type { LoginResponse } from '../types';

export const authService = {
  login: async (usuario: string, password: string): Promise<LoginResponse> => {
    const { data } = await api.post('/auth/login', { usuario, password });
    return data.data;
  },
};
