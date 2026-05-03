import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { buildHomePrerenderBundle } from './vite/homePrerender'
import { writeStaticArticleSnapshots } from './vite/staticArticlePages'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

/**
 * Vite dev does not apply vercel.json rewrites for /sitemap.xml or /llms.txt.
 * Uses ssrLoadModule so the same Edge handlers run locally (mirrors production).
 */
function localEdgeTextRoutesPlugin(mode: string) {
  return {
    name: 'local-edge-text-routes',
    enforce: 'pre' as const,
    configureServer(server: import('vite').ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = req.url?.split('?')[0]
        if (pathname !== '/sitemap.xml' && pathname !== '/llms.txt' && pathname !== '/rss.xml') {
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

        const modulePath =
          pathname === '/sitemap.xml'
            ? '/api/sitemap.ts'
            : pathname === '/rss.xml'
              ? '/api/rss.ts'
              : '/api/llms.ts'

        try {
          const mod = (await server.ssrLoadModule(modulePath)) as {
            default: (r: Request) => Promise<Response>
          }
          const host = req.headers.host ?? 'localhost:8080'
          const proto = host.startsWith('localhost') ? 'http' : 'https'
          const request = new Request(`${proto}://${host}${pathname}`)
          const response = await mod.default(request)
          res.statusCode = response.status
          response.headers.forEach((value, key) => {
            res.setHeader(key, value)
          })
          res.end(await response.text())
        } catch (err) {
          console.error(`[vite dev ${pathname}]`, err)
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

function homePrerenderPlugin(mode: string, command: string) {
  return {
    name: 'inject-home-prerender',
    transformIndexHtml: {
      order: 'pre' as const,
      async handler(html: string) {
        if (command !== 'build') return html
        const env = loadEnv(mode, rootDir, '')
        const { rootInnerHtml, headTags } = await buildHomePrerenderBundle(env)
        const nextHtml = html.replace('<div id="root"></div>', `<div id="root">${rootInnerHtml}</div>`)
        return { html: nextHtml, tags: headTags }
      },
    },
  }
}

function staticArticleSnapshotsPlugin(mode: string, command: string) {
  let outDir = path.join(rootDir, 'dist')
  return {
    name: 'static-article-snapshots',
    apply: 'build' as const,
    configResolved(config: import('vite').ResolvedConfig) {
      outDir = config.build.outDir
    },
    async closeBundle() {
      if (command !== 'build') return
      const env = loadEnv(mode, rootDir, '')
      await writeStaticArticleSnapshots(outDir, env)
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => ({
  plugins: [
    localEdgeTextRoutesPlugin(mode),
    react(),
    homePrerenderPlugin(mode, command),
    staticArticleSnapshotsPlugin(mode, command),
  ],
  server: {
    port: 8080,
  },
}))
