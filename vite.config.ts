import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Fix: Property 'cwd' does not exist on type 'Process'. Cast process to any to avoid TS error.
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Esto permite que 'process.env' funcione en el navegador para compatibilidad
      'process.env.FIREBASE_API_KEY': JSON.stringify(env.FIREBASE_API_KEY),
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
  };
});