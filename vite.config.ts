import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load all env vars (including non-VITE_ prefixed ones like API_KEY)
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Expose API_KEY for GeminiService (non-VITE_ prefix requires explicit mapping)
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
    },
    server: {
      headers: {
        // Prevent clickjacking
        'X-Frame-Options': 'DENY',
        // Prevent MIME-type sniffing
        'X-Content-Type-Options': 'nosniff',
        // Control referrer information sent to external sites
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        // Permissions policy — restrict access to sensitive browser APIs
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        // Basic CSP — tighten further when deploying to production
        'Content-Security-Policy': [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://api.hacienda.go.cr https://generativelanguage.googleapis.com wss://*.firebaseio.com",
          "img-src 'self' data: blob:",
          "frame-ancestors 'none'",
        ].join('; '),
      },
    },
  };
});