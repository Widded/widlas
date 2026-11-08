import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { defineConfig } from 'vite'

const KK_ALLOWED_PATH = /^web\/[a-zA-Z0-9/_-]+$/

// Yerelde /api/history çağrıları 404 yerine "depolama yok" dönsün.
function historyDevStub() {
  return {
    name: 'history-dev-stub',
    configureServer(server) {
      server.middlewares.use('/api/history', (req, res) => {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ enabled: false, reason: 'storage-not-configured' }))
      })
    }
  }
}

// Kentkart canlı API proxy'si (yerel geliştirme). Vercel'de api/kk.js devreye girer.
function kentkartProxy() {
  return {
    name: 'kentkart-proxy',
    configureServer(server) {
      server.middlewares.use('/api/kk', async (req, res) => {
        try {
          const url = new URL(req.url, 'http://local')
          const path = url.searchParams.get('path') || ''
          if (!KK_ALLOWED_PATH.test(path)) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'invalid path' }))
            return
          }
          const params = new URLSearchParams(url.searchParams)
          params.delete('path')
          const target = `https://service.kentkart.com/rl1//${path}?${params.toString()}`
          const upstream = await fetch(target, {
            headers: {
              'Content-Type': 'application/json',
              'Origin': 'https://m.kentkart.com',
              'Referer': 'https://m.kentkart.com/',
              'X-KK-Credential': req.headers['x-kk-credential'] || '',
              'X-KK-Date': req.headers['x-kk-date'] || '',
              'X-KK-Signature': req.headers['x-kk-signature'] || ''
            }
          })
          const text = await upstream.text()
          res.statusCode = upstream.status
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(text)
        } catch {
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'upstream unavailable' }))
        }
      })
    }
  }
}

// "npm run dev" → HTTP geliştirme sunucusu
// "npm run dev:https" → HTTPS (telefondan konum izni için; kendinden imzalı sertifika)
// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'https-dev' ? [basicSsl()] : []), kentkartProxy(), historyDevStub()],
  server: {
    allowedHosts: true
  },
  build: {
    chunkSizeWarningLimit: 1000
  }
}))
