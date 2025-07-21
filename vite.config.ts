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
          includeAssets: ['favicon.ico'],
          manifest: {
            name: 'Izanagi Sales System',
            short_name: 'Izanagi',
            description: 'Sistema de ventas optimizado para móviles y PWA.',
            start_url: '/',
            display: 'standalone',
            background_color: '#002A8F',
            theme_color: '#CF142B',
            orientation: 'portrait',
            icons: [
              {
                src: 'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 192 192\'><rect width=\'192\' height=\'192\' fill=\'%23002A8F\'/><circle cx=\'96\' cy=\'96\' r=\'70\' fill=\'%23CF142B\'/><text x=\'50%\' y=\'58%\' font-size=\'72\' text-anchor=\'middle\' fill=\'white\' font-family=\'Segoe UI,Arial,sans-serif\'>I</text></svg>',
                sizes: '192x192',
                type: 'image/svg+xml',
                purpose: 'any maskable'
              },
              {
                src: 'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 512 512\'><rect width=\'512\' height=\'512\' fill=\'%23002A8F\'/><circle cx=\'256\' cy=\'256\' r=\'200\' fill=\'%23CF142B\'/><text x=\'50%\' y=\'58%\' font-size=\'200\' text-anchor=\'middle\' fill=\'white\' font-family=\'Segoe UI,Arial,sans-serif\'>I</text></svg>',
                sizes: '512x512',
                type: 'image/svg+xml',
                purpose: 'any maskable'
              }
            ]
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          },
          devOptions: {
            enabled: true
          }
        })
      ]
    };
});
