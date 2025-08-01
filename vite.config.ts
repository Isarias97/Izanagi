import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          charts: ['recharts'],
          pdf: ['jspdf', 'jspdf-autotable', 'html2canvas'],
          ai: ['@google/genai'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
})
