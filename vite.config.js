import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5044', // địa chỉ backend C#
        changeOrigin: true,
        secure: false,
      },
      '/ai': {
        target: 'http://localhost:5000', // địa chỉ AI service
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/ai/, ''),
      },
    },
  },
})
