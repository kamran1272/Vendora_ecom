import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    __VENDORA_API_PROXY_TARGET__: JSON.stringify(process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:4003'),
  },
  server: {
    host: '0.0.0.0',
    port: 4176,
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:4003',
        changeOrigin: true,
      },
    },
    hmr: { port: 4176 },
  },
  preview: {
    host: '0.0.0.0',
    port: 4176,
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:4003',
        changeOrigin: true,
      },
    },
  },
})
