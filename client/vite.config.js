import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: './', // Ensure relative paths for assets in production (optional, but good for portability)
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    router: ['react-router-dom'],
                    charts: ['recharts'],
                    pdf: ['jspdf', 'jspdf-autotable', 'html2pdf.js'],
                    icons: ['lucide-react']
                }
            }
        },
        chunkSizeWarningLimit: 1000 // Increase limit since recharts is huge
    },
    server: {
        host: true, // Listen on all addresses (0.0.0.0)
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            },
            '/uploads': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            },
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: './src/setupTests.js',
    },
})
