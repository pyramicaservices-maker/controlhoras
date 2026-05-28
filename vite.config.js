import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import http from 'http'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'manual-proxy',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (
            req.url.startsWith('/api') || 
            req.url.startsWith('/data') || 
            req.url.startsWith('/projects') || 
            req.url.startsWith('/tasks') || 
            req.url.startsWith('/users') || 
            req.url.startsWith('/time-entries') || 
            req.url.startsWith('/uploads')
          ) {
            const options = {
              hostname: 'host.docker.internal',
              port: 3000,
              path: req.url,
              method: req.method,
              headers: req.headers
            };
            // Remove host header so the backend doesn't get confused
            delete options.headers.host;
            
            const proxyReq = http.request(options, (proxyRes) => {
              res.writeHead(proxyRes.statusCode, proxyRes.headers);
              proxyRes.pipe(res, { end: true });
            });
            
            req.pipe(proxyReq, { end: true });
            
            proxyReq.on('error', (err) => {
              console.error('Manual Proxy Error:', err);
              res.statusCode = 502;
              res.end('Bad Gateway');
            });
          } else {
            next();
          }
        });
      }
    }
  ],
  server: {
    host: true, // Listen on all local IPs
    port: 5173,
    watch: {
      usePolling: true // Required for Docker on Windows
    }
  }
})
