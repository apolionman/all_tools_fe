import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    cors: true,
    hmr: {
      host: '192.168.70.50', // Replace with your actual local IP
      protocol: 'ws',
      port: 3006, // Optional, defaults to server.port
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-syntax-highlighter'],
        },
      },
    },
  },
});
