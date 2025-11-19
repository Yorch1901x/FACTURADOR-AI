
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    define: {
      // Stringify the values to ensure they are injected as strings.
      // We check process.env first (for system vars/Vercel) then env (for local .env files)
      'process.env.FIREBASE_API_KEY': JSON.stringify(process.env.FIREBASE_API_KEY || env.FIREBASE_API_KEY || ''),
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY || env.API_KEY || ''),
    },
  };
});
