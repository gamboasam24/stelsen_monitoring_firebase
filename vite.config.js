import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    strictPort: false,

    // 👇 THIS is the magic line
    origin: 'http://localhost:5173',

    allowedHosts: true, // 👈 boolean, not string

    proxy: {
      '/backend': {
        target: 'http://localhost',
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(/^\/backend/, '/stelsen_monitoring/src/backend'),
      },
    },
  },
})
