import { useEffect, useMemo, useRef, useState } from 'react'
import { FeedCard } from '../components/FeedCard'
import { NewsletterForm } from '../components/NewsletterForm'
import { SiteHeader } from '../components/SiteHeader'
import { compareArticlesFeedOrder, fetchApprovedArticles } from '../lib/articleDb'
import { getStoredArticles } from '../lib/articleStore'
import { supabase } from '../lib/supabase'
import type { Article } from '../types'

/** Articles shown initially and per “Load more” (grid is up to 3 columns on xl). */
const PAGE_SIZE = 9

export function HomePage() {
  const [page, setPage] = useState(1)
  const [articles, setArticles] = useState<Article[]>([])
  const [feedError, setFeedError] = useState('')
  const [activeCategory, setActiveCategory] = useState<'All' | 'MCP' | 'API' | 'Infra' | 'Tooling' | 'Opinion'>('All')
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        if (supabase) {
          const list = await fetchApprovedArticles()
          if (!cancelled) {
            setArticles(list)
          }
        } else {
          const list = getStoredArticles().filter((a) => a.isApproved)
          if (!cancelled) {
            setArticles(list)
          }
        }
      } catch (e) {
        if (!cancelled) {
          setFeedError(e instanceof Error ? e.message : 'Could not load articles')
          setArticles([])
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const sortedArticles = useMemo(
    () =>
      [...articles]
        .filter((article) => article.isApproved)
        .sort(compareArticlesFeedOrder),
    [articles],
  )

  const featuredArticles = sortedArticles.filter((article) => article.isFeatured)
  const showFeaturedSection = featuredArticles.length > 1
  const feedSourceArticles = showFeaturedSection
    ? sortedArticles.filter((article) => !article.isFeatured)
    : sortedArticles
  const filteredArticles =
    activeCategory === 'All'
      ? feedSourceArticles
      : feedSourceArticles.filter((article) => article.category === activeCategory)
  const visibleArticles = filteredArticles.slice(0, PAGE_SIZE * page)
  const hasMore = visibleArticles.length < filteredArticles.length
  const categories: Array<'All' | 'MCP' | 'API' | 'Infra' | 'Tooling' | 'Opinion'> = [
    'All',
    'MCP',
    'API',
    'Infra',
    'Tooling',
    'Opinion',
  ]

  useEffect(() => {
    const siteTitle = 'AgentStack.fyi'
    const title = 'AgentStack.fyi — AI Agent Infrastructure News'
    const description =
      'Track MCP, APIs, and agent infrastructure updates without the noise. High-signal coverage for builders.'
    const canonicalHref = `${window.location.origin}/`
    const ogImage = `${window.location.origin}/agent_stack_19fad7.png`

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

    document.title = title
    setCanonical(canonicalHref)
    setMeta('name', 'description', description)
    setMeta('property', 'og:type', 'website')
    setMeta('property', 'og:site_name', siteTitle)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', canonicalHref)
    setMeta('property', 'og:image', ogImage)
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', ogImage)
  }, [])

  useEffect(() => {
    if (!hasMore || !loadMoreRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (first?.isIntersecting) {
          setPage((current) => current + 1)
        }
      },
      { rootMargin: '320px 0px 320px 0px' },
    )

    observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [hasMore])

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-3 py-8 sm:px-4 sm:py-10 md:py-14">
        <div className="relative mb-8 overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-cyan-950/30 p-4 sm:p-6 md:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl" />
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-cyan-300">AgentStack.fyi</p>
              <h1 className="mb-3 text-2xl font-bold leading-tight sm:text-3xl md:text-4xl">
                The signal hub for the AI agent stack.
              </h1>
              <p className="mb-5 text-sm text-zinc-300 sm:text-base md:text-lg">
                Track MCP, APIs, and agent infrastructure updates without the noise.
              </p>
              <div id="newsletter">
                <NewsletterForm buttonLabel="Subscribe" />
              </div>
            </div>
            <div className="mx-auto w-full max-w-xs md:mx-0">
              <img
                src="/agent_stack_bit.png"
                alt="AgentStack mascot"
                className="h-auto w-full object-contain drop-shadow-[0_0_28px_rgba(34,211,238,0.25)]"
              />
            </div>
          </div>
        </div>

        {showFeaturedSection && (
          <section className="mb-10">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <h2 className="text-xl font-semibold md:text-2xl">Featured</h2>
                <p className="text-sm text-zinc-400">Editorial picks worth your full attention.</p>
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {featuredArticles.map((article) => (
                <FeedCard key={article.id} article={article} featured />
              ))}
            </div>
          </section>
        )}

        {feedError ? (
          <p className="mb-4 rounded-lg border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {feedError}
          </p>
        ) : null}

        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold md:text-2xl">Latest coverage</h2>
          </div>
          <div className="hidden flex-wrap justify-end gap-2 md:flex">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => {
                  setActiveCategory(category)
                  setPage(1)
                }}
                className={`touch-manipulation rounded-full border px-3 py-2 text-xs transition sm:min-h-10 sm:py-1.5 ${
                  activeCategory === category
                    ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
                    : 'border-zinc-700/80 bg-zinc-900/70 text-zinc-300 hover:border-zinc-500'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2 md:hidden">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => {
                setActiveCategory(category)
                setPage(1)
              }}
              className={`touch-manipulation min-h-10 rounded-full border px-3 py-2 text-xs transition active:bg-zinc-800/80 ${
                activeCategory === category
                  ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
                  : 'border-zinc-700/80 bg-zinc-900/70 text-zinc-300 hover:border-zinc-500'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visibleArticles.map((article, index) => (
            <div key={article.id}>
              <FeedCard article={article} />
              {index === 0 && (
                <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:col-span-2 xl:col-span-1">
                  <p className="mb-2 text-sm text-zinc-300">Get high-signal updates weekly.</p>
                  <NewsletterForm compact />
                </div>
              )}
            </div>
          ))}
        </div>

        {visibleArticles.length === 0 && (
          <p className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-8 text-center text-sm text-zinc-400">
            No articles in this category yet.
          </p>
        )}

        {hasMore ? <div ref={loadMoreRef} className="mt-6 h-4 w-full" aria-hidden /> : null}
      </section>

      <footer className="border-t border-zinc-800">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-3 py-6 sm:px-4">
          <p className="text-sm text-zinc-400">Stay current with the AI agent stack.</p>
          <NewsletterForm compact />
        </div>
      </footer>
    </main>
  )
}
