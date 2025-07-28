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
      build: {
        target: 'esnext',
        minify: 'terser',
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              charts: ['recharts'],
              ai: ['@google/genai']
            }
          }
        },
        terserOptions: {
          compress: {
            drop_console: mode === 'production',
            drop_debugger: mode === 'production'
          }
        }
      },
      plugins: [
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: [
            'favicon.ico', 
            'icon-72.png',
            'icon-96.png',
            'icon-128.png',
            'icon-144.png',
            'icon-152.png',
            'icon-192.png',
            'icon-384.png',
            'icon-512.png',
            'icon-maskable.png',
            'splash-*.png'
          ],
          manifest: false, // Usar manifest.json externo
          strategies: 'generateSW',
          workbox: {
            globPatterns: [
              '**/*.{js,css,html,ico,png,svg,json,webmanifest,woff,woff2,ttf}'
            ],
            navigateFallback: '/index.html',
            navigateFallbackDenylist: [/^\/api\//],
            cleanupOutdatedCaches: true,
            skipWaiting: true,
            clientsClaim: true,
            runtimeCaching: [
              // Google Fonts
              {
                urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\//,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts',
                  expiration: { 
                    maxEntries: 10, 
                    maxAgeSeconds: 60 * 60 * 24 * 365 
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                },
              },
              // Font Awesome
              {
                urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/font-awesome\//,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'font-awesome',
                  expiration: { 
                    maxEntries: 5, 
                    maxAgeSeconds: 60 * 60 * 24 * 30 
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                },
              },
              // Tailwind CSS
              {
                urlPattern: /^https:\/\/cdn\.tailwindcss\.com\//,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'tailwind-css',
                  expiration: { 
                    maxEntries: 3, 
                    maxAgeSeconds: 60 * 60 * 24 * 7 
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                },
              },
              // ESM.sh modules
              {
                urlPattern: /^https:\/\/esm\.sh\//,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'esm-modules',
                  expiration: { 
                    maxEntries: 50, 
                    maxAgeSeconds: 60 * 60 * 24 * 7 
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                },
              },
              // Images
              {
                urlPattern: /^https?:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/, 
                handler: 'CacheFirst',
                options: {
                  cacheName: 'images',
                  expiration: { 
                    maxEntries: 100, 
                    maxAgeSeconds: 60 * 60 * 24 * 30 
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                },
              },
              // Static resources
              {
                urlPattern: /^https?:\/\/.*\.(?:js|css)$/, 
                handler: 'StaleWhileRevalidate',
                options: {
                  cacheName: 'static-resources',
                  expiration: { 
                    maxEntries: 100, 
                    maxAgeSeconds: 60 * 60 * 24 * 30 
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                },
              },
              // API calls
              {
                urlPattern: /^https?:\/\/.*\/api\//, 
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'api-cache',
                  networkTimeoutSeconds: 10,
                  expiration: { 
                    maxEntries: 50, 
                    maxAgeSeconds: 60 * 60 * 24 
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                },
              },
              // Offline fallback
              {
                urlPattern: /^https?:\/\/.*/,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'offline-fallback',
                  networkTimeoutSeconds: 3,
                  expiration: { 
                    maxEntries: 200, 
                    maxAgeSeconds: 60 * 60 * 24 * 7 
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                },
              }
            ]
          },
          devOptions: {
            enabled: true,
            type: 'module'
          },
          injectRegister: 'auto'
        })
      ],
      test: {
        globals: true,
        environment: 'jsdom',
      },
      server: {
        host: true,
        port: 5173,
        strictPort: true,
        headers: {
          'X-Frame-Options': 'DENY',
          'X-Content-Type-Options': 'nosniff',
          'X-XSS-Protection': '1; mode=block',
          'Referrer-Policy': 'strict-origin-when-cross-origin'
        }
      }
    };
});
