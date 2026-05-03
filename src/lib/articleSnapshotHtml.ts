/**
 * Full HTML document for article snapshots (Edge bot handler + build-time static files).
 * No network I/O — safe for Edge and Node.
 */

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export type ArticleSnapshotBanner = 'edge' | 'static'

export type ArticleHtmlDocumentInput = {
  canonical: string
  origin: string
  title: string
  desc: string
  bodyHtml: string
  category: string
  sourceName: string
  sourceUrl: string | null
  published?: string
  modifiedRaw?: string
  ogImage: string
  bannerKind: ArticleSnapshotBanner
}

function articleJsonLdGraph(input: ArticleHtmlDocumentInput): Record<string, unknown>[] {
  const { canonical, origin, title, desc, published, modifiedRaw, ogImage } = input
  const rowCategory = input.category
  const sourceName = input.sourceName
  const sourceUrl = input.sourceUrl

  const orgId = `${origin}/#organization`
  const articleId = `${canonical}#article`

  return [
    {
      '@type': 'Organization',
      '@id': orgId,
      name: 'AgentStack.fyi',
      url: `${origin}/`,
      logo: {
        '@type': 'ImageObject',
        url: `${origin}/agent_stack_favicon_iso_19fad7_square.png`,
      },
    },
    {
      '@type': 'NewsArticle',
      '@id': articleId,
      headline: title,
      description: desc,
      datePublished: published,
      dateModified: modifiedRaw,
      url: canonical,
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
      image: [ogImage],
      articleSection: rowCategory || undefined,
      author: {
        '@type': 'Organization',
        name: sourceName || 'AgentStack.fyi',
        ...(sourceUrl ? { url: sourceUrl } : {}),
      },
      publisher: { '@id': orgId },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: `${origin}/`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: title,
          item: canonical,
        },
      ],
    },
  ]
}

function bannerBlock(canonical: string, kind: ArticleSnapshotBanner): string {
  const esc = escapeHtml(canonical)
  if (kind === 'static') {
    return `<p class="banner banner-static">Static HTML snapshot (rebuilt on each deploy). Canonical interactive URL: <a href="${esc}">${esc}</a>.</p>`
  }
  return `<p class="banner">You are viewing a crawler-friendly HTML snapshot. Humans: <a href="${esc}">open the full interactive article</a>.</p>`
}

export function buildArticleHtmlDocument(input: ArticleHtmlDocumentInput): string {
  const {
    canonical,
    title,
    desc,
    bodyHtml,
    category,
    sourceName,
    sourceUrl,
    published,
    modifiedRaw,
    ogImage,
    bannerKind,
  } = input

  const graph = articleJsonLdGraph(input)
  const safeJsonLd = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${escapeHtml(`${title} — AgentStack.fyi`)}</title>
<meta name="description" content="${escapeHtml(desc)}"/>
<meta name="robots" content="index,follow"/>
<link rel="canonical" href="${escapeHtml(canonical)}"/>
<meta property="og:type" content="article"/>
<meta property="og:site_name" content="AgentStack.fyi"/>
<meta property="og:title" content="${escapeHtml(title)}"/>
<meta property="og:description" content="${escapeHtml(desc.slice(0, 200))}"/>
<meta property="og:url" content="${escapeHtml(canonical)}"/>
<meta property="og:image" content="${escapeHtml(ogImage)}"/>
<meta property="og:locale" content="en_US"/>
${published ? `<meta property="article:published_time" content="${escapeHtml(published)}"/>` : ''}
${modifiedRaw ? `<meta property="article:modified_time" content="${escapeHtml(modifiedRaw)}"/>` : ''}
${category ? `<meta property="article:section" content="${escapeHtml(category)}"/>` : ''}
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
  .banner-static{color:#1e3a5f;background:#e0f2fe;border-color:#7dd3fc;}
</style>
<script type="application/ld+json">${safeJsonLd}</script>
</head>
<body>
${bannerBlock(canonical, bannerKind)}
<article>
<p class="cat">${escapeHtml(category)}</p>
<h1>${escapeHtml(title)}</h1>
<p class="meta">${escapeHtml(sourceName)}${published ? ` · ${escapeHtml(new Date(published).toLocaleDateString('en-US', { dateStyle: 'medium' }))}` : ''}</p>
<div class="content">${bodyHtml}</div>
${sourceUrl ? `<p><a href="${escapeHtml(sourceUrl)}" rel="noopener noreferrer">View original source</a></p>` : ''}
</article>
</body>
</html>`
}
