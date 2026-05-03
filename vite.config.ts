import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

/**
 * Vite dev does not apply vercel.json rewrites, so /sitemap.xml would fall through to the SPA.
 * Uses ssrLoadModule so the same api/sitemap.ts runs under Vite (mirrors production behavior).
 */
function localSitemapPlugin(mode: string) {
  return {
    name: 'local-sitemap-xml',
    enforce: 'pre' as const,
    configureServer(server: import('vite').ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = req.url?.split('?')[0]
        if (pathname !== '/sitemap.xml') {
          next()
          return
        }

        const env = loadEnv(mode, rootDir, '')
        const keys = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const
        const backup: Partial<Record<(typeof keys)[number], string | undefined>> = {}
        for (const key of keys) {
          backup[key] = process.env[key]
          const v = env[key]
          if (v) process.env[key] = v
        }

        try {
          const mod = (await server.ssrLoadModule('/api/sitemap.ts')) as {
            default: (r: Request) => Promise<Response>
          }
          const host = req.headers.host ?? 'localhost:8080'
          const proto = host.startsWith('localhost') ? 'http' : 'https'
          const request = new Request(`${proto}://${host}/sitemap.xml`)
          const response = await mod.default(request)
          res.statusCode = response.status
          response.headers.forEach((value, key) => {
            res.setHeader(key, value)
          })
          res.end(await response.text())
        } catch (err) {
          console.error('[vite dev sitemap]', err)
          next()
        } finally {
          for (const key of keys) {
            const b = backup[key]
            if (b === undefined) delete process.env[key]
            else process.env[key] = b
          }
        }
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [localSitemapPlugin(mode), react()],
  server: {
    port: 8080,
  },
}))
