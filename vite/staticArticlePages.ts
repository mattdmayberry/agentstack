import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { marked } from 'marked'
import { buildArticleHtmlDocument, escapeHtml } from '../src/lib/articleSnapshotHtml'
import { articleOgImageUrl } from '../src/lib/ogImage'
import type { Article } from '../src/types'
import { explicitPublicOrigin, fetchApprovedArticlesForPrerender } from './homePrerender'

marked.setOptions({ gfm: true })

/** Fallback origin for absolute canonicals in static snapshots when `VITE_PUBLIC_SITE_URL` is unset at build time. */
const BUILD_FALLBACK_ORIGIN = 'https://agentstack.fyi'

/**
 * Writes one static HTML file per approved article to `outDir/crawl/article/{slug}.html`.
 * Served as plain files on Vercel (no bot UA required) — use for LLM / fetch clients.
 */
export async function writeStaticArticleSnapshots(
  outDir: string,
  env: Record<string, string>,
): Promise<void> {
  const origin = explicitPublicOrigin(env) ?? BUILD_FALLBACK_ORIGIN
  const url = env.VITE_SUPABASE_URL?.trim()
  const key = env.VITE_SUPABASE_ANON_KEY?.trim()
  if (!url || !key) {
    console.warn('[static-articles] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY; skipping crawl snapshots')
    return
  }

  let articles: Article[] = []
  try {
    articles = await fetchApprovedArticlesForPrerender(url, key)
  } catch (e) {
    console.warn('[static-articles] Supabase fetch failed:', e)
    return
  }

  const crawlRoot = path.join(outDir, 'crawl')
  const dir = path.join(crawlRoot, 'article')
  await mkdir(dir, { recursive: true })

  await writeCrawlIndexHtml(crawlRoot, origin, articles)

  let written = 0

  for (const article of articles) {
    const slug = (article.slug || '').trim().toLowerCase()
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) continue

    const canonical = `${origin.replace(/\/$/, '')}/article/${encodeURIComponent(slug)}`
    const title = article.title ?? 'Article'
    const summary = (article.summary ?? '').trim()
    const desc = summary.slice(0, 160) || `Read ${title} on AgentStack.fyi.`
    const bodyHtml = marked.parse(article.content ?? '') as string
    const published = article.publishedAt ? new Date(article.publishedAt).toISOString() : undefined
    let modifiedRaw = published
    if (article.updatedAt) {
      const d = new Date(article.updatedAt)
      if (!Number.isNaN(d.getTime())) modifiedRaw = d.toISOString()
    }
    const ogOrigin = new URL(canonical).origin
    const ogImage = articleOgImageUrl(ogOrigin, {
      title,
      category: article.category,
      thumbnailUrl: article.thumbnailUrl,
    })

    const html = buildArticleHtmlDocument({
      canonical,
      origin: ogOrigin,
      title,
      desc,
      bodyHtml,
      category: article.category ?? '',
      sourceName: article.sourceName ?? '',
      sourceUrl: article.sourceUrl ?? null,
      published,
      modifiedRaw,
      ogImage,
      bannerKind: 'static',
    })

    await writeFile(path.join(dir, `${slug}.html`), html, 'utf8')
    written += 1
  }

  console.log(`[static-articles] Wrote crawl/index.html + ${written} article file(s)`)
}

function buildCrawlIndexHtml(origin: string, articles: Article[]): string {
  const base = origin.replace(/\/$/, '')
  const canonicalHome = `${base}/`
  const sorted = [...articles]
    .filter((a) => a.isApproved)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

  const blocks = sorted
    .map((a) => {
      const slug = (a.slug || '').trim().toLowerCase()
      if (!slug || !/^[a-z0-9-]+$/.test(slug)) return ''
      const snap = `${base}/crawl/article/${encodeURIComponent(slug)}.html`
      const canonical = `${base}/article/${encodeURIComponent(slug)}`
      const sum = (a.summary ?? '').replace(/\s+/g, ' ').trim()
      const sumHtml = escapeHtml(sum.slice(0, 400)) || '—'
      const dateStr = a.publishedAt
        ? escapeHtml(new Date(a.publishedAt).toLocaleDateString('en-US', { dateStyle: 'medium' }))
        : ''
      return `    <article>
      <h2><a href="${escapeHtml(snap)}">${escapeHtml(a.title ?? slug)}</a></h2>
      <p class="meta">${escapeHtml(a.category ?? '')}${dateStr ? ` · ${dateStr}` : ''}</p>
      <p>${sumHtml}</p>
      <p class="links">Interactive: <a href="${escapeHtml(canonical)}">${escapeHtml(canonical)}</a> · Full static HTML: <a href="${escapeHtml(snap)}">${escapeHtml(snap)}</a></p>
    </article>`
    })
    .filter(Boolean)
    .join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>AgentStack.fyi — static crawl index (no JavaScript)</title>
<meta name="description" content="Plain HTML index of approved articles for crawlers and tools that do not run JavaScript."/>
<meta name="robots" content="index,follow"/>
<link rel="canonical" href="${escapeHtml(canonicalHome)}"/>
<style>
  body{font-family:system-ui,sans-serif;line-height:1.5;max-width:40rem;margin:2rem auto;padding:0 1rem;color:#18181b;background:#fafafa;}
  a{color:#0891b2;}
  h1{font-size:1.5rem;}
  .lead{color:#52525b;margin-bottom:2rem;}
  article{border-top:1px solid #e4e4e7;padding:1.25rem 0;}
  article h2{font-size:1.15rem;margin:0 0 0.35rem;}
  .meta{font-size:0.85rem;color:#71717a;margin:0 0 0.5rem;}
  .links{font-size:0.8rem;color:#71717a;}
  .banner{background:#e0f2fe;border:1px solid #7dd3fc;padding:0.75rem 1rem;border-radius:0.375rem;margin-bottom:1.5rem;font-size:0.9rem;}
</style>
</head>
<body>
  <h1>AgentStack.fyi — crawl index</h1>
  <p class="banner">This page is a <strong>static HTML file</strong> generated at deploy time. It lists every approved article with links to <strong>full article HTML</strong> (no JS required). The interactive site lives at <a href="${escapeHtml(canonicalHome)}">${escapeHtml(canonicalHome)}</a>.</p>
  <p class="lead">Also see <a href="${escapeHtml(`${base}/llms.txt`)}">llms.txt</a> and <a href="${escapeHtml(`${base}/sitemap.xml`)}">sitemap.xml</a>.</p>
  <main>
${blocks || '    <p>No approved articles yet.</p>'}
  </main>
</body>
</html>`
}

async function writeCrawlIndexHtml(
  crawlRoot: string,
  origin: string,
  articles: Article[],
): Promise<void> {
  const html = buildCrawlIndexHtml(origin, articles)
  await writeFile(path.join(crawlRoot, 'index.html'), html, 'utf8')
}
