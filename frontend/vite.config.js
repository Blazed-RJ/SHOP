import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Extract exact npm package name from any absolute resolved path
function getPkgName(id) {
  const m = id.match(/node_modules[/\\]((?:@[^/\\]+[/\\])?[^/\\]+)/);
  return m ? m[1].replace(/\\/g, '/') : null;
}

const chartPkgs = new Set([
  'recharts', 'd3', 'd3-scale', 'd3-shape', 'd3-array', 'd3-color',
  'd3-format', 'd3-interpolate', 'd3-path', 'd3-time', 'd3-time-format',
  'internmap', 'robust-predicates'
]);

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
          const pkg = getPkgName(id);
          if (!pkg) return 'vendor';

          if (pkg === 'xlsx') return 'vendor-excel';
          if (chartPkgs.has(pkg)) return 'vendor-charts';
          if (pkg === 'lucide-react') return 'vendor-icons';
          if (pkg === '@react-oauth/google' || pkg === 'google-auth-library') return 'vendor-google';
          if (pkg === 'date-fns' || pkg === 'lodash') return 'vendor-utils';
          if (pkg === 'react-dom') return 'vendor-react-dom';
          if (pkg === 'react-router-dom' || pkg === 'react-router') return 'vendor-router';
          if (pkg === 'react' || pkg === 'scheduler') return 'vendor-react';

          return 'vendor';
        }
      }
    }
  }
})
