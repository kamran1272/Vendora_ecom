import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  define: {
    __VENDORA_API_PROXY_TARGET__: JSON.stringify(process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:4003'),
  },
  // GitHub Pages serves project sites from /<repository>/ rather than /.
  base: process.env.GITHUB_ACTIONS ? '/Vendora_ecom/' : '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: false,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:4003',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: false,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:4003',
        changeOrigin: true,
      },
      '/socket.io': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:4003',
        changeOrigin: true,
        ws: true,
      },
    },
  }
})
