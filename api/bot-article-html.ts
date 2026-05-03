/**
 * Vercel Edge: full HTML document for an approved article (for crawlers that do not run JS).
 * Invoked from middleware for bot user-agents; humans still get the SPA.
 */
import { buildArticleHtmlDocument, escapeHtml } from '../src/lib/articleSnapshotHtml.js'
import { articleOgImageUrl } from '../src/lib/ogImage.js'
import { marked } from 'marked'

export const config = { runtime: 'edge' }

marked.setOptions({ gfm: true })

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

  const restUrl = `${supabaseUrl}/rest/v1/articles?slug=eq.${encodeURIComponent(slug)}&is_approved=eq.true&select=title,slug,summary,content,category,published_at,updated_at,thumbnail_url,source_name,source_url&limit=1`

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
    updated_at?: string | null
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
  let modifiedRaw = published
  if (row.updated_at) {
    const d = new Date(String(row.updated_at))
    if (!Number.isNaN(d.getTime())) {
      modifiedRaw = d.toISOString()
    }
  }
  const origin = new URL(canonical).origin
  const ogImage = articleOgImageUrl(origin, {
    title,
    category: row.category,
    thumbnailUrl: row.thumbnail_url,
  })

  const html = buildArticleHtmlDocument({
    canonical,
    origin,
    title,
    desc,
    bodyHtml,
    category: row.category ?? '',
    sourceName: row.source_name ?? '',
    sourceUrl: row.source_url ?? null,
    published,
    modifiedRaw,
    ogImage,
    bannerKind: 'edge',
  })

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400',
    },
  })
}
