
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carga variables de .env local O de las variables de entorno del sistema (GitHub Secrets)
  // Fix: process.cwd is a function on the process object
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Mapea la API_KEY para que esté disponible como process.env.API_KEY
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
    },
    // Las variables que empiezan con VITE_ se cargan automáticamente por Vite
  };
});
