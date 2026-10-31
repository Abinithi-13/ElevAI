import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development, API and uploaded images are proxied to the Express backend,
// so the browser never needs to know the backend origin and no API keys are exposed.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
});
