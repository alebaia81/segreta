import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/',

  plugins: [react()],

  // ─── Build ottimizzata per Vercel ───────────────────────────────────────────
  build: {
    outDir: 'dist',

    rollupOptions: {
      output: {
        entryFileNames:   'assets/[name]-[hash].js',
        chunkFileNames:   'assets/[name]-[hash].js',
        assetFileNames:   'assets/[name]-[hash][extname]',

        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'react';
          if (id.includes('node_modules/react-router-dom')) return 'router';
          if (id.includes('node_modules/motion')) return 'motion';
          if (id.includes('node_modules/lucide-react')) return 'icons';
        },
      },
    },

    chunkSizeWarningLimit: 800,
    sourcemap: false,
    target: 'es2020',
    minify: true,
  },

  // ─── Dev server proxy → Vercel API Routes locali (vercel dev) ───────────────
  // In sviluppo usa `vercel dev` oppure mantieni il proxy verso Express locale
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
