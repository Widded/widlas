import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { defineConfig } from 'vite'

// "npm run dev" → HTTP geliştirme sunucusu
// "npm run dev:https" → HTTPS (telefondan konum izni için; kendinden imzalı sertifika)
// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'https-dev' ? [basicSsl()] : [])],
  server: {
    allowedHosts: true
  },
  build: {
    chunkSizeWarningLimit: 1000
  }
}))
