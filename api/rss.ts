/**
 * Vercel Edge: RSS 2.0 feed of approved articles for discovery and syndication.
 * Rewritten from /rss.xml via vercel.json.
 */
export const config = { runtime: 'edge' }

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function cdata(s: string): string {
  return `<![CDATA[${s.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`
}

type Row = {
  slug: string
  title: string
  summary: string
  published_at: string
  updated_at?: string
}

function rfc822(iso: string | undefined): string {
  const t = iso ? Date.parse(iso) : NaN
  const d = Number.isFinite(t) ? new Date(t) : new Date()
  return d.toUTCString()
}

export default async function handler(request: Request): Promise<Response> {
  const reqUrl = new URL(request.url)
  const origin = `${reqUrl.protocol}//${reqUrl.host}`

  const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace(/\/$/, '')
  const anon = process.env.VITE_SUPABASE_ANON_KEY

  const channelTitle = 'AgentStack.fyi — AI Agent Infrastructure News'
  const channelDesc =
    'MCP, APIs, and agent infrastructure updates — high-signal coverage for builders.'
  const selfHref = `${origin}/rss.xml`
  const nowRfc = rfc822(new Date().toISOString())

  const items: string[] = []

  if (supabaseUrl && anon) {
    const restUrl = `${supabaseUrl}/rest/v1/articles?select=slug,title,summary,published_at,updated_at&is_approved=eq.true&order=published_at.desc&limit=80`
    const res = await fetch(restUrl, {
      headers: {
        apikey: anon,
        Authorization: `Bearer ${anon}`,
        Accept: 'application/json',
      },
    })

    if (res.ok) {
      const rows = (await res.json()) as Row[]
      if (Array.isArray(rows)) {
        for (const row of rows) {
          const slug = typeof row.slug === 'string' ? row.slug.trim() : ''
          const title = typeof row.title === 'string' ? row.title.trim() : ''
          if (!slug || !title) continue
          const link = `${origin}/article/${encodeURIComponent(slug)}`
          const summary = typeof row.summary === 'string' ? row.summary.trim() : ''
          const pub = rfc822(row.published_at)

          items.push(`    <item>
      <title>${cdata(title)}</title>
      <link>${xmlEscape(link)}</link>
      <guid isPermaLink="true">${xmlEscape(link)}</guid>
      <pubDate>${xmlEscape(pub)}</pubDate>
      <description>${cdata(summary.slice(0, 2000))}</description>
    </item>`)
        }
      }
    }
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(channelTitle)}</title>
    <link>${xmlEscape(`${origin}/`)}</link>
    <description>${xmlEscape(channelDesc)}</description>
    <language>en-us</language>
    <lastBuildDate>${xmlEscape(nowRfc)}</lastBuildDate>
    <atom:link href="${xmlEscape(selfHref)}" rel="self" type="application/rss+xml"/>
${items.join('\n')}
  </channel>
</rss>`

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400',
    },
  })
}
