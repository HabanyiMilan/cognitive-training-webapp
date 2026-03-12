import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server:{
    host: '127.0.0.1',
    port: 5173,
    historyApiFallback: true,
    proxy: {
      "/auth": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },
      "/assessment": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },
      "/profile": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },
    }
  }
})
