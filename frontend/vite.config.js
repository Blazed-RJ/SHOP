import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5002',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          // ── Most specific first ───────────────────────────────────────────
          if (id.includes('xlsx')) return 'vendor-excel';
          if (id.includes('recharts') || id.includes('/d3-')) return 'vendor-charts';
          if (id.includes('lucide-react')) return 'vendor-icons';
          if (id.includes('@react-oauth') || id.includes('google-auth-library')) return 'vendor-google';
          if (id.includes('date-fns') || id.includes('lodash')) return 'vendor-utils';

          // ── React family (order matters: dom > router > react) ────────────
          if (id.includes('react-dom')) return 'vendor-react-dom';
          if (id.includes('react-router')) return 'vendor-router';
          if (id.includes('react')) return 'vendor-react';

          // ── Everything else ───────────────────────────────────────────────
          return 'vendor';
        }
      }
    }
  }
})

