import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // injectManifest (rather than the default generateSW) lets our own src/sw.js add a
      // `push` / `notificationclick` listener for parent announcement notifications, while
      // still precaching the app shell for offline/installed use.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      },
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'logo-wordmark.png'],
      manifest: {
        name: 'Ankura — TinyTimes Preschool',
        short_name: 'TinyTimes',
        description: 'School & childcare management, in your pocket.',
        theme_color: '#f97316',
        background_color: '#fff7ed',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
      '/uploads': 'http://localhost:4000',
    },
  },
})
