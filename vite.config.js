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
      '/api': 'http://host.docker.internal:3000',
      '/data': 'http://host.docker.internal:3000',
      '/projects': 'http://host.docker.internal:3000',
      '/tasks': 'http://host.docker.internal:3000',
      '/time-entries': 'http://host.docker.internal:3000',
      '/uploads': 'http://host.docker.internal:3000'
    }
  }
})
