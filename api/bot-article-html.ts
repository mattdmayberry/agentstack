/**
 * Vercel Edge: full HTML document for an approved article (for crawlers that do not run JS).
 * Invoked from middleware for bot user-agents; humans still get the SPA.
 */
import { marked } from 'marked'

export const config = { runtime: 'edge' }

marked.setOptions({ gfm: true })

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function notFoundPage(canonicalFallback: string): string {
  const t = 'Article not found — AgentStack.fyi'
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${escapeHtml(t)}</title>
<meta name="description" content="This article could not be found on AgentStack.fyi."/>
<meta name="robots" content="noindex,nofollow"/>
<link rel="canonical" href="${escapeHtml(canonicalFallback)}"/>
</head>
<body>
<p>${escapeHtml(t)}</p>
<p><a href="${escapeHtml(new URL('/', canonicalFallback).href)}">Back to AgentStack.fyi</a></p>
</body>
</html>`
}

export default async function handler(request: Request): Promise<Response> {
  const reqUrl = new URL(request.url)
  const slugRaw = reqUrl.searchParams.get('slug')?.trim() ?? ''
  const slug = slugRaw.toLowerCase()
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return new Response('Invalid slug', { status: 400 })
  }

  const canonicalHeader = request.headers.get('x-article-canonical')?.trim()
  const canonical =
    canonicalHeader && /^https?:\/\//i.test(canonicalHeader)
      ? canonicalHeader
      : `${reqUrl.origin}/article/${slug}`

  const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace(/\/$/, '')
  const anon = process.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anon) {
    return new Response(notFoundPage(`${reqUrl.origin}/`), {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  const restUrl = `${supabaseUrl}/rest/v1/articles?slug=eq.${encodeURIComponent(slug)}&is_approved=eq.true&select=title,slug,summary,content,category,published_at,thumbnail_url,source_name,source_url&limit=1`

  const r = await fetch(restUrl, {
    headers: {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
      Accept: 'application/json',
    },
  })

  if (!r.ok) {
    return new Response(notFoundPage(canonical), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  const rows = (await r.json()) as Record<string, unknown>[]
  if (!Array.isArray(rows) || rows.length === 0) {
    return new Response(notFoundPage(canonical), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  const row = rows[0] as {
    title: string
    slug: string
    summary: string
    content: string
    category: string
    published_at: string
    thumbnail_url?: string | null
    source_name: string
    source_url?: string | null
  }

  const title = row.title ?? 'Article'
  const summary = (row.summary ?? '').trim()
  const desc = summary.slice(0, 160) || `Read ${title} on AgentStack.fyi.`
  const contentMd = row.content ?? ''
  const bodyHtml = marked.parse(contentMd) as string
  const published = row.published_at ? new Date(row.published_at).toISOString() : undefined
  const ogImage =
    row.thumbnail_url && String(row.thumbnail_url).trim().length > 0
      ? String(row.thumbnail_url).trim()
      : `${new URL(canonical).origin}/agent_stack_19fad7.png`

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    description: desc,
    datePublished: published,
    mainEntityOfPage: canonical,
    image: [ogImage],
    publisher: {
      '@type': 'Organization',
      name: 'AgentStack.fyi',
    },
  }

  const safeJsonLd = JSON.stringify(ld).replace(/</g, '\\u003c')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${escapeHtml(`${title} — AgentStack.fyi`)}</title>
<meta name="description" content="${escapeHtml(desc)}"/>
<meta name="robots" content="index,follow"/>
<link rel="canonical" href="${escapeHtml(canonical)}"/>
<meta property="og:type" content="article"/>
<meta property="og:title" content="${escapeHtml(title)}"/>
<meta property="og:description" content="${escapeHtml(desc.slice(0, 200))}"/>
<meta property="og:url" content="${escapeHtml(canonical)}"/>
<meta property="og:image" content="${escapeHtml(ogImage)}"/>
<meta property="article:published_time" content="${escapeHtml(published ?? '')}"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${escapeHtml(title)}"/>
<meta name="twitter:description" content="${escapeHtml(desc.slice(0, 200))}"/>
<meta name="twitter:image" content="${escapeHtml(ogImage)}"/>
<style>
  body{font-family:system-ui,-apple-system,sans-serif;line-height:1.6;max-width:42rem;margin:2rem auto;padding:0 1rem;color:#18181b;background:#fafafa;}
  a{color:#0891b2;}
  h1{font-size:1.75rem;line-height:1.2;margin:0 0 0.5rem;}
  .meta{color:#52525b;font-size:0.9rem;margin-bottom:1.5rem;}
  .cat{text-transform:uppercase;letter-spacing:0.08em;font-size:0.7rem;color:#0e7490;margin:0 0 0.25rem;}
  .content{font-size:1.05rem;}
  .content pre{overflow:auto;background:#f4f4f5;padding:0.75rem;border-radius:0.375rem;}
  .content code{font-size:0.9em;}
  .banner{font-size:0.8rem;color:#713f12;background:#fef3c7;border:1px solid #fcd34d;padding:0.5rem 0.75rem;border-radius:0.375rem;margin-bottom:1rem;}
</style>
<script type="application/ld+json">${safeJsonLd}</script>
</head>
<body>
<p class="banner">You are viewing a crawler-friendly HTML snapshot. Humans: <a href="${escapeHtml(canonical)}">open the full interactive article</a>.</p>
<article>
<p class="cat">${escapeHtml(row.category ?? '')}</p>
<h1>${escapeHtml(title)}</h1>
<p class="meta">${escapeHtml(row.source_name ?? '')}${published ? ` · ${escapeHtml(new Date(published).toLocaleDateString('en-US', { dateStyle: 'medium' }))}` : ''}</p>
<div class="content">${bodyHtml}</div>
${row.source_url ? `<p><a href="${escapeHtml(row.source_url)}" rel="noopener noreferrer">View original source</a></p>` : ''}
</article>
</body>
</html>`

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400',
    },
  })
}
