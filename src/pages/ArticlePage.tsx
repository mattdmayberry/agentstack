import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { SiteHeader } from '../components/SiteHeader'
import { fetchArticleBySlug } from '../lib/articleDb'
import { getStoredArticles } from '../lib/articleStore'
import { supabase } from '../lib/supabase'
import type { Article } from '../types'

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

  if (!isReady) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100">
        <SiteHeader />
      </main>
    )
  }

  if (!article) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-4 py-10">
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
      <article className="mx-auto max-w-3xl px-4 py-10">
        <p className="mb-4 text-xs uppercase tracking-widest text-cyan-400">{article.category}</p>
        <h1 className="mb-4 text-4xl font-bold leading-tight">{article.title}</h1>
        <p className="mb-8 text-zinc-400">
          {article.sourceName} • {new Date(article.publishedAt).toLocaleDateString()}
        </p>
        <img
          src={article.thumbnailUrl}
          alt={article.title}
          className="mb-8 h-72 w-full rounded-lg object-cover"
        />
        <p className="text-xl leading-8 text-zinc-200">{article.content}</p>
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
