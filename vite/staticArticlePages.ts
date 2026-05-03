import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { marked } from 'marked'
import { buildLlmsText, type LlmsArticleInput } from '../api/llmsBody'
import { buildArticleHtmlDocument, escapeHtml } from '../src/lib/articleSnapshotHtml'
import { articleOgImageUrl } from '../src/lib/ogImage'
import type { Article } from '../src/types'
import { explicitPublicOrigin, fetchApprovedArticlesForPrerender } from './homePrerender'

marked.setOptions({ gfm: true })

/** Fallback origin when `VITE_PUBLIC_SITE_URL` is unset at build time. */
const BUILD_FALLBACK_ORIGIN = 'https://agentstack.fyi'

function articlesToLlmsInputs(articles: Article[]): LlmsArticleInput[] {
  return articles
    .filter((a) => a.isApproved)
    .map((a) => ({
      slug: String(a.slug ?? '').trim(),
      title: String(a.title ?? '').trim(),
      summary: String(a.summary ?? ''),
      category: a.category,
    }))
    .filter((r) => r.slug.length > 0)
}

function buildCrawlAboutHtml(origin: string): string {
  const base = origin.replace(/\/$/, '')
  const index = `${base}/crawl/index.html`
  const llms = `${base}/llms.txt`
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>About AgentStack.fyi (static HTML, no JavaScript)</title>
<meta name="description" content="What AgentStack.fyi is: curated AI agent infrastructure news — MCP, APIs, tooling, and analysis for builders."/>
<meta name="robots" content="index,follow"/>
<link rel="canonical" href="${escapeHtml(`${base}/`)}"/>
<style>
  body{font-family:system-ui,sans-serif;line-height:1.6;max-width:42rem;margin:2rem auto;padding:0 1rem;color:#18181b;background:#fafafa;}
  a{color:#0891b2;}
  .banner{background:#e0f2fe;border:1px solid #7dd3fc;padding:0.75rem 1rem;border-radius:0.375rem;margin-bottom:1.5rem;font-size:0.9rem;}
  ul{padding-left:1.25rem;}
</style>
</head>
<body>
  <p class="banner">This is a <strong>static page</strong> generated at deploy. No JavaScript required. <a href="${escapeHtml(index)}">Article index</a> · <a href="${escapeHtml(llms)}">llms.txt</a></p>
  <h1>About AgentStack.fyi</h1>
  <p><strong>AgentStack.fyi</strong> is a curated publication for people building with <strong>AI agents</strong> — the stack around MCP, tool APIs, CLIs, orchestration, security, and production infrastructure.</p>
  <p>We publish short, high-signal coverage so you can track how the ecosystem moves without wading through noise. Articles include editorial analysis and links to primary sources.</p>
  <h2>How to read this site without JavaScript</h2>
  <ul>
    <li><a href="${escapeHtml(index)}">Crawl index</a> — list of all approved articles with links to full static HTML for each piece.</li>
    <li><a href="${escapeHtml(`${base}/crawl/article/`)}">/crawl/article/&lt;slug&gt;.html</a> — replace <code>&lt;slug&gt;</code> with the article slug from the index or sitemap.</li>
    <li><a href="${escapeHtml(llms)}">llms.txt</a> — plain-text manifest and summaries (also on disk at deploy).</li>
    <li><a href="${escapeHtml(`${base}/sitemap.xml`)}">sitemap.xml</a> — URL discovery for search engines.</li>
  </ul>
  <p>The interactive app at <a href="${escapeHtml(`${base}/`)}">${escapeHtml(`${base}/`)}</a> uses React; crawlers and LLM fetch tools should prefer the URLs above.</p>
</body>
</html>`
}

/**
 * Writes static crawl artifacts into dist/: llms.txt, crawl/index.html, crawl/about.html,
 * crawl/article/{slug}.html. Always creates crawl files even if Supabase env is missing
 * (fallback empty state + explanatory llms.txt).
 */
export async function writeStaticArticleSnapshots(
  outDir: string,
  env: Record<string, string>,
): Promise<void> {
  const origin = explicitPublicOrigin(env) ?? BUILD_FALLBACK_ORIGIN
  const url = env.VITE_SUPABASE_URL?.trim()
  const key = env.VITE_SUPABASE_ANON_KEY?.trim()

  let articles: Article[] = []
  if (url && key) {
    try {
      articles = await fetchApprovedArticlesForPrerender(url, key)
    } catch (e) {
      console.warn('[crawl-artifacts] Supabase fetch failed:', e)
    }
  } else {
    console.warn(
      '[crawl-artifacts] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — writing empty crawl index and minimal llms.txt',
    )
  }

  const crawlRoot = path.join(outDir, 'crawl')
  const articleDir = path.join(crawlRoot, 'article')
  await mkdir(articleDir, { recursive: true })

  await writeCrawlIndexHtml(crawlRoot, origin, articles)
  await writeFile(path.join(crawlRoot, 'about.html'), buildCrawlAboutHtml(origin), 'utf8')

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

    await writeFile(path.join(articleDir, `${slug}.html`), html, 'utf8')
    written += 1
  }

  const llmsBody = buildLlmsText(origin, articlesToLlmsInputs(articles))
  await writeFile(path.join(outDir, 'llms.txt'), llmsBody, 'utf8')

  console.log(`[crawl-artifacts] Wrote llms.txt, crawl/about.html, crawl/index.html, + ${written} article HTML file(s)`)
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

  const aboutUrl = `${base}/crawl/about.html`

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
  <p class="banner">This page is a <strong>static HTML file</strong> on disk (generated at deploy). It lists every approved article with links to <strong>full article HTML</strong> (no JS). Product overview: <a href="${escapeHtml(aboutUrl)}">/crawl/about.html</a>. The interactive site: <a href="${escapeHtml(canonicalHome)}">${escapeHtml(canonicalHome)}</a>.</p>
  <p class="lead">Plain-text manifest: <a href="${escapeHtml(`${base}/llms.txt`)}">llms.txt</a> · <a href="${escapeHtml(`${base}/sitemap.xml`)}">sitemap.xml</a></p>
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
