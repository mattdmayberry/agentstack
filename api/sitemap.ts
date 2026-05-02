/**
 * Vercel Edge: dynamic sitemap for approved articles (PostgREST, anon RLS).
 * Rewritten from /sitemap.xml via vercel.json.
 */
export const config = { runtime: 'edge' }

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

type ArticleSlugRow = { slug: string; updated_at?: string }

export default async function handler(request: Request): Promise<Response> {
  const reqUrl = new URL(request.url)
  const origin = `${reqUrl.protocol}//${reqUrl.host}`

  const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace(/\/$/, '')
  const anon = process.env.VITE_SUPABASE_ANON_KEY

  const today = new Date().toISOString().slice(0, 10)
  const entries: string[] = []

  entries.push(
    `  <url><loc>${xmlEscape(`${origin}/`)}</loc><changefreq>daily</changefreq><priority>1.0</priority><lastmod>${xmlEscape(today)}</lastmod></url>`,
  )

  if (supabaseUrl && anon) {
    const restUrl = `${supabaseUrl}/rest/v1/articles?select=slug,updated_at&is_approved=eq.true&limit=5000`
    const res = await fetch(restUrl, {
      headers: {
        apikey: anon,
        Authorization: `Bearer ${anon}`,
        Accept: 'application/json',
      },
    })

    if (res.ok) {
      const rows = (await res.json()) as ArticleSlugRow[]
      if (Array.isArray(rows)) {
        for (const row of rows) {
          const slug = typeof row.slug === 'string' ? row.slug.trim() : ''
          if (!slug) continue
          const loc = `${origin}/article/${encodeURIComponent(slug)}`
          const lm =
            typeof row.updated_at === 'string' && row.updated_at.length >= 10
              ? row.updated_at.slice(0, 10)
              : today
          entries.push(
            `  <url><loc>${xmlEscape(loc)}</loc><lastmod>${xmlEscape(lm)}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
          )
        }
      }
    }
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
