import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Carga variables de .env local O de las variables de entorno del sistema (GitHub Secrets)
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'), // Optional: helps if you want to use absolute imports later
      }
    },
    define: {
      // Mapea la API_KEY para que esté disponible como process.env.API_KEY
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
    },
  };
});