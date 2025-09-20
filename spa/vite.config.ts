import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    watch: {
      usePolling: true,
    },
    // Allow all origins for Docker networking in CI environments
    cors: true,
    // Disable host checking for containerized environments
    hmr: {
      clientPort: 3000,
    },
    // Disable host header validation entirely for Docker environments
    strictPort: false,
    // Additional headers to prevent 403
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
      'Access-Control-Allow-Headers': '*',
    },
  },
  build: {
    outDir: 'build',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    // Make process.env available in the browser for compatibility with existing code
    'process.env': JSON.stringify(process.env),
  },
})