import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ''); // carga todas las vars, sin filtro de prefijo
  return {
    plugins: [react()],
    // Mantiene el nombre REACT_APP_API_URL para no tocar Dockerfile/compose.
    // Por defecto '' => baseURL relativa '/api' (proxy en dev, nginx en prod).
    define: {
      'process.env.REACT_APP_API_URL': JSON.stringify(env.REACT_APP_API_URL ?? ''),
    },
    server: {
      port: 3000,
      proxy: { '/api': 'http://localhost:3001' }, // dev: enruta /api al backend
    },
    build: { outDir: 'build' }, // conserva la salida que el Dockerfile ya copia
  };
});
