import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/scraping': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/businesses': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
