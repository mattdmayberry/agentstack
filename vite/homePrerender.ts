import { createClient } from '@supabase/supabase-js'
import type { HtmlTagDescriptor } from 'vite'
import type { Article } from '../src/types'
import { getArticleThumbnailCandidates } from '../src/lib/articleThumbnails'
import { defaultSiteOgImageUrl } from '../src/lib/ogImage'

const CATEGORIES = ['MCP', 'API', 'Infra', 'Tooling', 'Opinion'] as const

const SITE_NAME = 'AgentStack.fyi'
const HOME_TITLE = `${SITE_NAME} — AI Agent Infrastructure News`
const HOME_DESCRIPTION =
  'Track MCP, APIs, and agent infrastructure updates without the noise. High-signal coverage for builders — AgentStack.fyi.'

/** When set, prerender uses this origin for absolute URLs; when unset, uses root-relative paths so both apex and www work. */
export function explicitPublicOrigin(env: Record<string, string>): string | null {
  const raw = env.VITE_PUBLIC_SITE_URL?.trim()
  if (!raw || !/^https?:\/\//i.test(raw)) return null
  return raw.replace(/\/$/, '')
}

type ArticleRow = {
  id: string
  slug: string
  title: string
  url: string
  source_url: string | null
  source_name: string
  source_domain: string
  thumbnail_url: string | null
  summary: string
  category: string
  published_at: string
  created_at: string
  updated_at: string
  is_approved: boolean
  is_featured: boolean
  display_order: number
  content: string
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function rowToArticle(row: ArticleRow): Article {
  const cat = row.category as Article['category']
  const category = CATEGORIES.includes(cat as (typeof CATEGORIES)[number]) ? cat : 'Infra'
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    url: row.url,
    sourceUrl: row.source_url ?? undefined,
    sourceName: row.source_name,
    sourceDomain: row.source_domain,
    thumbnailUrl: row.thumbnail_url ?? '',
    summary: row.summary,
    category,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
    isApproved: row.is_approved,
    isFeatured: row.is_featured,
    displayOrder: row.display_order ?? 0,
    content: row.content,
  }
}

function compareArticlesFeedOrder(a: Article, b: Article): number {
  if (a.isFeatured !== b.isFeatured) {
    return a.isFeatured ? -1 : 1
  }
  const da = a.displayOrder ?? 0
  const db = b.displayOrder ?? 0
  if (da !== db) {
    return da - db
  }
  return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
}

export async function fetchApprovedArticlesForPrerender(
  supabaseUrl: string,
  supabaseAnonKey: string,
): Promise<Article[]> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const primary = await supabase
    .from('articles')
    .select('*')
    .eq('is_approved', true)
    .order('is_featured', { ascending: false })
    .order('display_order', { ascending: true })
    .order('published_at', { ascending: false })

  let { data, error } = primary
  if (error) {
    const err = error as { code?: string; message?: string }
    const msg = `${err.message ?? ''} ${err.code ?? ''}`.toLowerCase()
    if (msg.includes('display_order') || err.code === '42703') {
      const second = await supabase
        .from('articles')
        .select('*')
        .eq('is_approved', true)
        .order('is_featured', { ascending: false })
        .order('published_at', { ascending: false })
      data = second.data
      error = second.error
    }
  }
  if (error) {
    console.warn('[home-prerender] Supabase fetch failed:', (error as { message?: string }).message ?? error)
    return []
  }
  return ((data ?? []) as ArticleRow[]).map(rowToArticle)
}

const PAGE_SIZE = 9

function articlePath(article: Article): string {
  return `/article/${article.slug ?? article.id}`
}

function articleUrlForSeo(origin: string | null, article: Article): string {
  const path = articlePath(article)
  return origin ? `${origin}${path}` : path
}

function renderArticleCard(origin: string | null, article: Article, featured: boolean): string {
  const href = escapeHtml(articleUrlForSeo(origin, article))
  const title = escapeHtml(article.title)
  const summary = escapeHtml(article.summary)
  const source = escapeHtml(article.sourceName)
  const cat = escapeHtml(article.category)
  const thumbSrc = escapeHtml(getArticleThumbnailCandidates(article)[0] ?? '')
  const thumbBlock = thumbSrc
    ? `<a class="block" href="${href}"><div class="${featured ? 'aspect-[16/9]' : 'aspect-[16/10]'} overflow-hidden border-b border-zinc-800"><img src="${thumbSrc}" alt="${title}" class="h-full w-full object-cover" width="640" height="360" loading="lazy" decoding="async" /></div></a>`
    : ''
  const h2Class = featured ? 'text-xl md:text-2xl' : 'text-lg md:text-xl'

  return `<article class="group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70">
  ${thumbBlock}
  <div class="p-4 sm:p-5 ${featured ? 'md:p-6' : ''}">
    <div class="mb-3 flex items-center justify-between gap-2">
      <span class="rounded-md border border-zinc-600 px-2.5 py-1 text-xs font-medium text-zinc-200">${cat}</span>
    </div>
    <a class="block" href="${href}">
      <h2 class="${h2Class} mb-2 font-semibold leading-snug text-zinc-100">${title}</h2>
    </a>
    <p class="mb-4 text-sm leading-relaxed text-zinc-300 sm:leading-6">${summary}</p>
    <p class="text-sm text-zinc-500"><span class="inline-flex items-center gap-2"><span class="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400/70"></span>${source}</span></p>
  </div>
</article>`
}

function buildHomeJsonLd(origin: string | null, listArticles: Article[]): string {
  const root = origin ? `${origin}/` : '/'
  const orgId = origin ? `${origin}/#organization` : '/#organization'
  const webId = origin ? `${origin}/#website` : '/#website'
  const listId = origin ? `${origin}/#homepage-itemlist` : '/#homepage-itemlist'
  const logoUrl = origin ? `${origin}/agent_stack_favicon_iso_19fad7_square.png` : '/agent_stack_favicon_iso_19fad7_square.png'

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'Organization',
      '@id': orgId,
      name: SITE_NAME,
      url: root,
      logo: {
        '@type': 'ImageObject',
        url: logoUrl,
      },
    },
    {
      '@type': 'WebSite',
      '@id': webId,
      url: root,
      name: SITE_NAME,
      description: HOME_DESCRIPTION,
      inLanguage: 'en',
      publisher: { '@id': orgId },
    },
  ]

  if (listArticles.length > 0) {
    graph.push({
      '@type': 'ItemList',
      '@id': listId,
      name: 'Latest coverage',
      numberOfItems: listArticles.length,
      itemListElement: listArticles.map((a, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Article',
          headline: a.title,
          url: articleUrlForSeo(origin, a),
          description: a.summary?.slice(0, 300) ?? undefined,
          datePublished: a.publishedAt,
          dateModified: a.updatedAt ?? a.publishedAt,
        },
      })),
    })
  }

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': graph,
  })
}

function buildHomeHeadTags(origin: string | null, jsonLdRaw: string): HtmlTagDescriptor[] {
  const safeJsonLd = jsonLdRaw.replace(/</g, '\\u003c')
  const canonicalHref = origin ? `${origin}/` : '/'
  const ogImage = defaultSiteOgImageUrl(origin)

  const tags: HtmlTagDescriptor[] = [
    { tag: 'link', attrs: { rel: 'canonical', href: canonicalHref }, injectTo: 'head' },
    { tag: 'meta', attrs: { property: 'og:type', content: 'website' }, injectTo: 'head' },
    { tag: 'meta', attrs: { property: 'og:site_name', content: SITE_NAME }, injectTo: 'head' },
    { tag: 'meta', attrs: { property: 'og:title', content: HOME_TITLE }, injectTo: 'head' },
    { tag: 'meta', attrs: { property: 'og:description', content: HOME_DESCRIPTION }, injectTo: 'head' },
  ]

  if (origin) {
    tags.push({ tag: 'meta', attrs: { property: 'og:url', content: `${origin}/` }, injectTo: 'head' })
  }

  tags.push(
    { tag: 'meta', attrs: { property: 'og:image', content: ogImage }, injectTo: 'head' },
    { tag: 'meta', attrs: { property: 'og:locale', content: 'en_US' }, injectTo: 'head' },
    { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' }, injectTo: 'head' },
    { tag: 'meta', attrs: { name: 'twitter:title', content: HOME_TITLE }, injectTo: 'head' },
    { tag: 'meta', attrs: { name: 'twitter:description', content: HOME_DESCRIPTION }, injectTo: 'head' },
    { tag: 'meta', attrs: { name: 'twitter:image', content: ogImage }, injectTo: 'head' },
    {
      tag: 'script',
      attrs: { type: 'application/ld+json', id: 'structured-data-home' },
      children: safeJsonLd,
      injectTo: 'head',
    },
  )

  return tags
}

export type HomePrerenderBundle = {
  rootInnerHtml: string
  headTags: HtmlTagDescriptor[]
}

/**
 * Static HTML shell for #root plus head tags (canonical, Open Graph, Twitter, JSON-LD).
 * Replaced on the client by React; helps crawlers and tools that do not execute JS.
 *
 * If `VITE_PUBLIC_SITE_URL` is unset, links and JSON-LD use root-relative URLs so the
 * same build works on both apex and `www`. If set, that origin is used for absolute URLs.
 */
export async function buildHomePrerenderBundle(env: Record<string, string>): Promise<HomePrerenderBundle> {
  const origin = explicitPublicOrigin(env)

  const url = env.VITE_SUPABASE_URL?.trim()
  const key = env.VITE_SUPABASE_ANON_KEY?.trim()

  let articles: Article[] = []
  if (url && key) {
    try {
      articles = await fetchApprovedArticlesForPrerender(url, key)
    } catch (e) {
      console.warn('[home-prerender]', e)
    }
  }

  const sortedArticles = [...articles].filter((a) => a.isApproved).sort(compareArticlesFeedOrder)
  const featuredArticles = sortedArticles.filter((a) => a.isFeatured)
  const nonFeaturedArticles = sortedArticles.filter((a) => !a.isFeatured)
  const showFeaturedSection = featuredArticles.length > 1 && nonFeaturedArticles.length > 0
  const feedSourceArticles = showFeaturedSection ? nonFeaturedArticles : sortedArticles
  const visibleArticles = feedSourceArticles.slice(0, PAGE_SIZE)

  const listForJsonLd: Article[] = []
  const seen = new Set<string>()
  if (showFeaturedSection) {
    for (const a of featuredArticles) {
      if (!seen.has(a.id)) {
        seen.add(a.id)
        listForJsonLd.push(a)
      }
    }
  }
  for (const a of visibleArticles) {
    if (!seen.has(a.id)) {
      seen.add(a.id)
      listForJsonLd.push(a)
    }
  }

  const homeHref = escapeHtml(origin ? `${origin}/` : '/')
  const heroImg = escapeHtml(origin ? `${origin}/agent_stack_bit.png` : '/agent_stack_bit.png')

  const featuredHtml =
    showFeaturedSection && featuredArticles.length > 0
      ? `<section class="mb-10">
  <div class="mb-5">
    <h2 class="text-xl font-semibold md:text-2xl">Featured</h2>
    <p class="text-sm text-zinc-400">Editorial picks worth your full attention.</p>
  </div>
  <div class="grid gap-5 md:grid-cols-2">
    ${featuredArticles.map((a) => renderArticleCard(origin, a, true)).join('\n')}
  </div>
</section>`
      : ''

  const latestHtml =
    visibleArticles.length > 0
      ? `<div class="mb-5 flex items-end justify-between">
  <h2 class="text-xl font-semibold md:text-2xl">Latest coverage</h2>
</div>
<div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
  ${visibleArticles.map((a) => renderArticleCard(origin, a, false)).join('\n')}
</div>`
      : `<p class="text-sm text-zinc-400">Latest articles load here when JavaScript runs, or after the next deploy once articles are approved.</p>`

  const rootInnerHtml = `<main class="min-h-screen bg-zinc-950 text-zinc-100">
  <header class="border-b border-zinc-800 bg-zinc-950/90">
    <div class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-3 sm:px-4">
      <a href="${homeHref}" class="text-sm font-semibold text-zinc-100">${escapeHtml(SITE_NAME)}</a>
      <nav class="flex gap-3 text-sm text-zinc-400"><a href="${homeHref}" class="hover:text-zinc-200">Home</a></nav>
    </div>
  </header>
  <section class="mx-auto max-w-6xl px-3 py-8 sm:px-4 sm:py-10 md:py-14">
    <div class="relative mb-8 overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-cyan-950/30 p-4 sm:p-6 md:p-8">
      <div class="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div class="max-w-2xl">
          <p class="mb-2 text-xs uppercase tracking-[0.2em] text-cyan-300">${escapeHtml(SITE_NAME)}</p>
          <h1 class="mb-3 text-2xl font-bold leading-tight sm:text-3xl md:text-4xl">The signal hub for the AI agent stack.</h1>
          <p class="mb-5 text-sm text-zinc-300 sm:text-base md:text-lg">Track MCP, APIs, and agent infrastructure updates without the noise.</p>
          <p id="newsletter" class="text-sm text-zinc-400">Newsletter signup loads with JavaScript.</p>
        </div>
        <div class="mx-auto w-full max-w-xs md:mx-0">
          <img src="${heroImg}" alt="AgentStack mascot" class="h-auto w-full object-contain" width="320" height="320" loading="eager" decoding="async" />
        </div>
      </div>
    </div>
    ${featuredHtml}
    ${latestHtml}
  </section>
  <footer class="border-t border-zinc-800">
    <div class="mx-auto flex max-w-5xl flex-col gap-3 px-3 py-6 sm:px-4">
      <p class="text-sm text-zinc-400">Stay current with the AI agent stack.</p>
    </div>
  </footer>
</main>`

  const jsonLdRaw = buildHomeJsonLd(origin, listForJsonLd)
  const headTags = buildHomeHeadTags(origin, jsonLdRaw)

  return { rootInnerHtml, headTags }
}
