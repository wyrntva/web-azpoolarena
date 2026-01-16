import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react({
    jsxRuntime: 'automatic',
    babel: {
      plugins: []
    }
  })],
  server: {
    host: true, // hoặc host: '0.0.0.0'
    port: 5173
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'antd-vendor': ['antd', '@ant-design/icons'],
          'utils-vendor': ['axios', 'dayjs'],
          // Heavy library for QR scanning - separate chunk
          'qr-scanner': ['html5-qrcode']
        }
      }
    },
    chunkSizeWarningLimit: 1000, // Increase limit to 1000KB
    sourcemap: false // Disable sourcemaps in production for smaller builds
  }
})