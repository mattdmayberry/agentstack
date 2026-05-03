import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { marked } from 'marked'
import { buildArticleHtmlDocument } from '../src/lib/articleSnapshotHtml'
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

  const dir = path.join(outDir, 'crawl', 'article')
  await mkdir(dir, { recursive: true })
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

  console.log(`[static-articles] Wrote ${written} file(s) to crawl/article/`)
}
