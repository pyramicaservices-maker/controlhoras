import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all local IPs
    port: 5173,
    watch: {
      usePolling: true // Required for Docker on Windows
    },
    proxy: {
      '/api': { target: 'http://controlhoras-backend-1:3000', changeOrigin: true },
      '/data': { target: 'http://controlhoras-backend-1:3000', changeOrigin: true },
      '/projects': { target: 'http://controlhoras-backend-1:3000', changeOrigin: true },
      '/tasks': { target: 'http://controlhoras-backend-1:3000', changeOrigin: true },
      '/time-entries': { target: 'http://controlhoras-backend-1:3000', changeOrigin: true },
      '/uploads': { target: 'http://controlhoras-backend-1:3000', changeOrigin: true }
    }
  }
})
