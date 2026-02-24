import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Extract exact npm package name from any absolute resolved path
function getPkgName(id) {
  const m = id.match(/node_modules[/\\]((?:@[^/\\]+[/\\])?[^/\\]+)/);
  return m ? m[1].replace(/\\/g, '/') : null;
}

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

          // ── PDF / canvas (heavy — isolate so they load lazily per page) ──
          if (pkg === 'jspdf' || pkg === 'html2canvas') return 'vendor-pdf';

          // ── Excel ─────────────────────────────────────────────────────────
          if (pkg === 'xlsx') return 'vendor-excel';

          // ── QR code libs ──────────────────────────────────────────────────
          if (pkg === 'qrcode' || pkg === 'qrcode.react') return 'vendor-qr';

          // ── Time / date ───────────────────────────────────────────────────
          if (pkg === 'moment-timezone' || pkg === 'moment') return 'vendor-date';

          // ── Icons ─────────────────────────────────────────────────────────
          if (pkg === 'lucide-react') return 'vendor-icons';

          // ── Google OAuth ──────────────────────────────────────────────────
          if (pkg === '@react-oauth/google' ||
            pkg === 'google-auth-library') return 'vendor-google';

          // ── React family (dom > router > react — order matters) ───────────
          if (pkg === 'react-dom') return 'vendor-react-dom';
          if (pkg === 'react-router-dom' || pkg === 'react-router') return 'vendor-router';
          if (pkg === 'react' || pkg === 'scheduler') return 'vendor-react';

          // ── Everything else ───────────────────────────────────────────────
          return 'vendor';
        }
      }
    }
  }
})
