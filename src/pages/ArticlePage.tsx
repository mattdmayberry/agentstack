import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Link, useParams } from 'react-router-dom'
import { SiteHeader } from '../components/SiteHeader'
import { useArticleThumbnail } from '../hooks/useArticleThumbnail'
import { fetchArticleBySlug } from '../lib/articleDb'
import { getStoredArticles } from '../lib/articleStore'
import { supabase } from '../lib/supabase'
import type { Article } from '../types'

function ArticleHeroImage({ article }: { article: Article }) {
  const { src, onError } = useArticleThumbnail(article)
  return (
    <img
      src={src}
      alt={article.title}
      className="mb-8 h-72 w-full rounded-lg object-cover"
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
        <ArticleHeroImage article={article} />
        <div className="space-y-4 text-zinc-200">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => <h2 className="text-3xl font-semibold leading-tight">{children}</h2>,
              h2: ({ children }) => <h3 className="text-2xl font-semibold leading-tight">{children}</h3>,
              h3: ({ children }) => <h4 className="text-xl font-semibold leading-tight">{children}</h4>,
              p: ({ children }) => <p className="text-xl leading-8">{children}</p>,
              ul: ({ children }) => <ul className="list-disc space-y-2 pl-6 text-lg leading-8">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal space-y-2 pl-6 text-lg leading-8">{children}</ol>,
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
