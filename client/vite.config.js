import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'chart-vendor': ['recharts'],
          'form-vendor': ['formik', 'yup'],
          'animation-vendor': ['framer-motion'],
          'utils-vendor': ['axios']
        }
      }
    },
    chunkSizeWarningLimit: 600
  },
  // Ensure public folder files are copied to dist
  publicDir: 'public'
})
