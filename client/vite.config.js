import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('sampleResponses')) return 'data-sample'
          if (id.includes('node_modules')) {
            if (id.includes('leaflet')) return 'leaflet'
            if (id.includes('react')) return 'react'
            return 'vendor'
          }
        },
      },
    },
  },
})
