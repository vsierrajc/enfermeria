import axios from 'axios';

// En producción (imagen Docker) se construye con REACT_APP_API_URL="" para que
// baseURL sea relativa (`/api`) y nginx haga proxy al backend. Usamos `??` en
// lugar de `||` para no descartar la cadena vacía. En desarrollo, si la variable
// no está definida, se usa el backend local.
const API_URL = process.env.REACT_APP_API_URL ?? 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
