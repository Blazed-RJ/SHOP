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
          if (id.includes('node_modules/xlsx')) return 'vendor-excel';
          if (id.includes('node_modules/recharts') ||
            id.includes('node_modules/d3') ||
            id.includes('node_modules/internmap') ||
            id.includes('node_modules/robust-predicates') ||
            id.includes('node_modules/victory')) return 'vendor-charts';
          if (id.includes('node_modules/lucide-react')) return 'vendor-icons';
          if (id.includes('node_modules/@react-oauth') ||
            id.includes('node_modules/google-auth-library')) return 'vendor-google';
          if (id.includes('node_modules/date-fns') ||
            id.includes('node_modules/lodash')) return 'vendor-utils';

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

