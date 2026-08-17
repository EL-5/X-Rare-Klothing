import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Only precache the built app shell (JS/CSS/HTML/icons). Deliberately
      // no runtimeCaching rule for the Supabase origin — this is a live
      // storefront with real prices/stock/cart state, and caching API
      // responses would risk showing stale data. Static assets can safely
      // be cached; everything from supabase.co always hits the network.
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'X-Rare',
        short_name: 'X-Rare',
        description: 'X-Rare — Rare by design. Different by nature.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0a0a0a',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/maskable-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Keeps large, rarely-changing vendor code (animation library,
        // Supabase client, router) in their own long-lived-cacheable
        // chunks, separate from route-level app code that changes on
        // every deploy — so a customer re-visiting after a deploy only
        // re-downloads what actually changed, not the whole vendor tree.
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-motion': ['framer-motion'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
});
