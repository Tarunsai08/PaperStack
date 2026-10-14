import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// One build works everywhere: relative asset paths + hash routing mean the same
// dist/ can be served from GitHub Pages (/<repo>/) or bundled into the APK.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null, // registered manually in main.tsx (web only, never inside the APK)
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'PaperStack',
        short_name: 'PaperStack',
        description: 'Learn AI and machine learning from scratch, one landmark paper at a time.',
        theme_color: '#FF6719',
        background_color: '#FFFFFF',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}', 'content/**/*.{md,json}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: null,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.endsWith('/content/index.json'),
            handler: 'NetworkFirst',
            options: { cacheName: 'content-index', networkTimeoutSeconds: 4 },
          },
        ],
      },
    }),
  ],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
          markdown: ['react-markdown', 'remark-gfm', 'remark-math', 'rehype-katex', 'remark-directive', 'katex'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
