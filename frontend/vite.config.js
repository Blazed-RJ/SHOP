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
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('xlsx')) {
              return 'vendor-excel'; // Isolate the massive excel parser
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react'; // Isolate core react packages
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons'; // Isolate all icons
            }
            return 'vendor'; // Everything else in node_modules
          }
        }
      }
    }
  }
})
