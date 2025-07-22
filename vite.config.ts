import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      plugins: [
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'icon-192.png', 'icon-512.png', 'icon-maskable.png'],
          manifest: false, // Usar manifest.json externo
          strategies: 'generateSW',
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,json,webmanifest}'],
            navigateFallback: '/index.html',
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\//,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts',
                  expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                },
              },
              {
                urlPattern: /^https?:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/, 
                handler: 'CacheFirst',
                options: {
                  cacheName: 'images',
                  expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
                },
              },
              {
                urlPattern: /^https?:\/\/.*\.(?:js|css)$/, 
                handler: 'StaleWhileRevalidate',
                options: {
                  cacheName: 'static-resources',
                  expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
                },
              },
              {
                urlPattern: /^https?:\/\/.*\/api\//, 
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'api',
                  networkTimeoutSeconds: 10,
                  expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 },
                },
              }
            ]
          },
          devOptions: {
            enabled: true
          }
        })
      ]
    };
});
