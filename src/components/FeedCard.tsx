import { Link } from 'react-router-dom'
import { useArticleThumbnail } from '../hooks/useArticleThumbnail'
import type { Article } from '../types'

type FeedCardProps = {
  article: Article
  featured?: boolean
}

const categoryStyles: Record<Article['category'], string> = {
  MCP: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
  API: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  Infra: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  Tooling: 'border-violet-500/30 bg-violet-500/10 text-violet-300',
  Opinion: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
}

export function FeedCard({ article, featured = false }: FeedCardProps) {
  const articlePath = `/article/${article.slug ?? article.id}`
  const { src: thumbSrc, onError: onThumbError } = useArticleThumbnail(article)

  const daysDiff = Math.floor(
    (Date.now() - new Date(article.publishedAt).getTime()) / 86400000,
  )
  const published = daysDiff === 0 ? 'Today' : daysDiff === 1 ? 'Yesterday' : `${daysDiff}d ago`

  return (
    <article className="group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 transition duration-300 hover:border-cyan-500/40 hover:shadow-[0_0_28px_rgba(34,211,238,0.12)]">
      <Link className="block" to={articlePath}>
        <div className={`${featured ? 'aspect-[16/9]' : 'aspect-[16/10]'} overflow-hidden border-b border-zinc-800`}>
        <img
          src={thumbSrc}
          alt={article.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          onError={onThumbError}
        />
        </div>
      </Link>
      <div className={`p-4 sm:p-5 ${featured ? 'md:p-6' : ''}`}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <span
            className={`rounded-md border px-2.5 py-1 text-xs font-medium ${categoryStyles[article.category]}`}
          >
            {article.category}
          </span>
          <span className="text-xs text-zinc-500">{published}</span>
        </div>
        <Link className="block" to={articlePath}>
          <h2 className={`${featured ? 'text-xl md:text-2xl' : 'text-lg md:text-xl'} mb-2 font-semibold leading-snug text-zinc-100 transition group-hover:text-cyan-300`}>
            {article.title}
          </h2>
        </Link>
        <p className="mb-4 text-sm leading-relaxed text-zinc-300 sm:leading-6">{article.summary}</p>
        <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-2">
          <span className="inline-flex min-h-11 items-center gap-2 text-zinc-500">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400/70" />
            <span className="break-words">{article.sourceName}</span>
          </span>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end sm:gap-3">
            {article.sourceUrl && (
              <a
                className="inline-flex min-h-11 min-w-[5.5rem] items-center justify-center rounded-md border border-zinc-700/80 px-3 font-medium text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 active:bg-zinc-800/80"
                href={article.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                Source
              </a>
            )}
            <Link
              className="inline-flex min-h-11 min-w-[6.5rem] items-center justify-center rounded-md border border-cyan-700/50 bg-cyan-500/10 px-3 font-medium text-cyan-300 hover:border-cyan-500 hover:bg-cyan-500/15 active:bg-cyan-500/20"
              to={articlePath}
            >
              Read analysis
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
