import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
export default defineConfig({
    plugins: [react()],
    // GitHub Pages serves project sites from /<repository>/ rather than /.
    base: process.env.GITHUB_ACTIONS ? '/Vendora_ecom/' : '/',
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    },
    server: {
        host: '127.0.0.1',
        port: 4173,
        strictPort: false,
        hmr: {
            host: '127.0.0.1',
            port: 4173,
            protocol: 'ws'
        }
    },
    preview: {
        host: '127.0.0.1',
        port: 4173,
        strictPort: false
    }
});
