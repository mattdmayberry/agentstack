import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Link, useParams } from 'react-router-dom'
import { SiteHeader } from '../components/SiteHeader'
import { useArticleThumbnail } from '../hooks/useArticleThumbnail'
import { fetchArticleBySlug } from '../lib/articleDb'
import { getPublicSiteOrigin } from '../lib/siteUrl'
import { getStoredArticles } from '../lib/articleStore'
import { supabase } from '../lib/supabase'
import type { Article } from '../types'

function ArticleHeroImage({ article }: { article: Article }) {
  const { src, onError } = useArticleThumbnail(article)
  return (
    <img
      src={src}
      alt={article.title}
      className="mb-6 h-44 w-full rounded-lg object-cover sm:mb-8 sm:h-60 md:h-72"
      onError={onError}
    />
  )
}

export function ArticlePage() {
  const { id: articleSlug } = useParams()
  const [article, setArticle] = useState<Article | undefined>(undefined)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        if (supabase && articleSlug) {
          const found = await fetchArticleBySlug(articleSlug)
          if (!cancelled) {
            setArticle(found ?? undefined)
          }
        } else {
          const entries = getStoredArticles()
          if (!cancelled) {
            setArticle(
              entries.find((entry) => entry.slug === articleSlug || entry.id === articleSlug),
            )
          }
        }
      } finally {
        if (!cancelled) {
          setIsReady(true)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [articleSlug])

  useEffect(() => {
    const siteTitle = 'AgentStack.fyi'
    const setMeta = (attr: 'name' | 'property', key: string, value: string) => {
      let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, key)
        document.head.appendChild(el)
      }
      el.content = value
    }
    const setCanonical = (href: string) => {
      let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
      if (!link) {
        link = document.createElement('link')
        link.rel = 'canonical'
        document.head.appendChild(link)
      }
      link.href = href
    }
    const clearArticleJsonLd = () => {
      const old = document.getElementById('article-jsonld')
      if (old) old.remove()
    }

    if (!isReady) return

    if (!article) {
      document.title = 'Article not found — AgentStack.fyi'
      setMeta('name', 'description', 'This article could not be found on AgentStack.fyi.')
      setMeta('name', 'robots', 'noindex, nofollow')
      clearArticleJsonLd()
      return
    }

    const origin = getPublicSiteOrigin()
    const canonicalHref = `${origin}${article.url.startsWith('/') ? article.url : `/${article.url}`}`
    const description = article.summary?.trim() || `Read ${article.title} on AgentStack.fyi.`
    const ogImage = article.thumbnailUrl?.trim()
      ? article.thumbnailUrl
      : `${origin}/agent_stack_19fad7.png`

    document.title = `${article.title} — AgentStack.fyi`
    setCanonical(canonicalHref)
    setMeta('name', 'description', description)
    setMeta('name', 'robots', 'index, follow')
    setMeta('property', 'og:type', 'article')
    setMeta('property', 'og:site_name', siteTitle)
    setMeta('property', 'og:title', article.title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', canonicalHref)
    setMeta('property', 'og:image', ogImage)
    setMeta('property', 'article:published_time', article.publishedAt)
    setMeta('property', 'article:modified_time', article.updatedAt ?? article.publishedAt)
    if (article.category) {
      setMeta('property', 'article:section', article.category)
    }
    setMeta('property', 'og:locale', 'en_US')
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', article.title)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', ogImage)

    clearArticleJsonLd()
    const script = document.createElement('script')
    script.id = 'article-jsonld'
    script.type = 'application/ld+json'
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: article.title,
      description,
      image: [ogImage],
      datePublished: article.publishedAt,
      dateModified: article.updatedAt ?? article.publishedAt,
      mainEntityOfPage: canonicalHref,
      publisher: {
        '@type': 'Organization',
        name: siteTitle,
        logo: {
          '@type': 'ImageObject',
          url: `${getPublicSiteOrigin()}/agent_stack_favicon_iso_19fad7_square.png`,
        },
      },
      author: {
        '@type': 'Organization',
        name: article.sourceName || siteTitle,
      },
    })
    document.head.appendChild(script)

    return () => {
      clearArticleJsonLd()
    }
  }, [article, isReady])

  if (!isReady) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100">
        <SiteHeader />
        <p className="px-3 py-8 text-center text-sm text-zinc-500 sm:px-4">Loading…</p>
      </main>
    )
  }

  if (!article) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-3 py-8 sm:px-4 sm:py-10">
          <p className="mb-4 text-zinc-400">Article not found.</p>
          <Link className="text-cyan-400" to="/">
            Back to feed
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-3 py-8 sm:px-4 sm:py-10">
        <p className="mb-3 text-xs uppercase tracking-widest text-cyan-400 sm:mb-4">{article.category}</p>
        <h1 className="mb-3 text-2xl font-bold leading-tight sm:mb-4 sm:text-3xl md:text-4xl">
          {article.title}
        </h1>
        <p className="mb-6 text-sm text-zinc-400 sm:mb-8 sm:text-base">
          {article.sourceName} • {new Date(article.publishedAt).toLocaleDateString()}
        </p>
        <ArticleHeroImage article={article} />
        <div className="space-y-3 text-zinc-200 sm:space-y-4">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h2 className="text-xl font-semibold leading-snug sm:text-2xl md:text-3xl">{children}</h2>
              ),
              h2: ({ children }) => (
                <h3 className="text-lg font-semibold leading-snug sm:text-xl md:text-2xl">{children}</h3>
              ),
              h3: ({ children }) => (
                <h4 className="text-base font-semibold leading-snug sm:text-lg md:text-xl">{children}</h4>
              ),
              p: ({ children }) => (
                <p className="text-base leading-7 sm:text-lg sm:leading-8 md:text-xl md:leading-8">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc space-y-2 pl-5 text-base leading-7 sm:pl-6 sm:text-lg sm:leading-8">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal space-y-2 pl-5 text-base leading-7 sm:pl-6 sm:text-lg sm:leading-8">
                  {children}
                </ol>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-cyan-500/50 pl-4 text-zinc-300">{children}</blockquote>
              ),
              code: ({ children }) => (
                <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-sm text-cyan-300">{children}</code>
              ),
              pre: ({ children }) => (
                <pre className="overflow-x-auto rounded-md bg-zinc-900 p-3 text-sm text-zinc-200">{children}</pre>
              ),
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noreferrer" className="text-cyan-400 hover:text-cyan-300">
                  {children}
                </a>
              ),
            }}
          >
            {article.content}
          </ReactMarkdown>
        </div>
        {article.sourceUrl && (
          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-block text-cyan-400 hover:text-cyan-300"
          >
            View source
          </a>
        )}
      </article>
    </main>
  )
}
