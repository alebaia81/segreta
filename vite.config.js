import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // BASE: root assoluto per Cloudflare Pages (non relativo come GitHub Pages)
  base: '/',

  plugins: [react()],

  // ─── Build ottimizzata per Cloudflare Pages ─────────────────────────────────
  build: {
    outDir: 'dist',

    // Asset hashing → ogni nuovo rilascio ha nomi di file diversi.
    // Cloudflare CDN può fare cache infinita su /assets/* (immutable),
    // mentre index.html viene servito sempre fresh (no-cache).
    rollupOptions: {
      output: {
        // Hash nei nomi: assets/index-[hash].js / assets/index-[hash].css
        entryFileNames:   'assets/[name]-[hash].js',
        chunkFileNames:   'assets/[name]-[hash].js',
        assetFileNames:   'assets/[name]-[hash][extname]',

        // Code splitting manuale per separare vendor da app code
        // Vite 8 (Rolldown) richiede una funzione, non un oggetto
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'react';
          if (id.includes('node_modules/react-router-dom')) return 'router';
          if (id.includes('node_modules/motion')) return 'motion';
          if (id.includes('node_modules/lucide-react')) return 'icons';
        },
      },
    },

    // Soglia warning chunk (500 KB di default è bassa per motion)
    chunkSizeWarningLimit: 800,

    // Source map in produzione → utile per debug in Cloudflare Analytics
    sourcemap: false,

    // Target moderno: Cloudflare Workers runtime è V8 moderno
    target: 'es2020',

    // Minificazione con oxc (default Vite 8 / Rolldown — più veloce di esbuild)
    minify: true,
  },

  // ─── Dev server proxy → Express locale ─────────────────────────────────────
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
