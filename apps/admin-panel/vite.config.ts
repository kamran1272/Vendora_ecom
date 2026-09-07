import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 4176,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4003',
        changeOrigin: true,
      },
    },
    hmr: {
      host: '127.0.0.1',
      port: 4176,
      protocol: 'ws',
    },
  },
  preview: {
    host: '127.0.0.1',
    port: 4176,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4003',
        changeOrigin: true,
      },
    },
  },
})
