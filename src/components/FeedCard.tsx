import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import agentAutonomyThumb from '../assets/article-thumbs/agent-autonomy.jpg'
import agentStackThumb from '../assets/article-thumbs/agent-stack.jpg'
import agenticUiThumb from '../assets/article-thumbs/agentic-ui.jpg'
import cliMcpThumb from '../assets/article-thumbs/cli-mcp.jpg'
import cliWorkflowsThumb from '../assets/article-thumbs/cli-workflows.jpg'
import functionCallingThumb from '../assets/article-thumbs/function-calling.jpg'
import mcpProtocolThumb from '../assets/article-thumbs/mcp-protocol.jpg'
import mcpRegistryThumb from '../assets/article-thumbs/mcp-registry.jpg'
import type { Article } from '../types'

type FeedCardProps = {
  article: Article
  featured?: boolean
}

const defaultThumbByCategory: Record<Article['category'], string> = {
  MCP: mcpProtocolThumb,
  API: functionCallingThumb,
  Infra: agentStackThumb,
  Tooling: cliMcpThumb,
  Opinion: agenticUiThumb,
}

const backupThumbs = [
  agentAutonomyThumb,
  cliWorkflowsThumb,
  mcpRegistryThumb,
]

const categoryStyles: Record<Article['category'], string> = {
  MCP: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
  API: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  Infra: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  Tooling: 'border-violet-500/30 bg-violet-500/10 text-violet-300',
  Opinion: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
}

export function FeedCard({ article, featured = false }: FeedCardProps) {
  const articlePath = `/article/${article.slug ?? article.id}`
  const categoryThumb = defaultThumbByCategory[article.category]
  const defaultThumb = backupThumbs[article.id.length % backupThumbs.length] ?? categoryThumb
  const initialThumb = article.thumbnailUrl?.trim() ? article.thumbnailUrl : categoryThumb
  const [thumbSrc, setThumbSrc] = useState(initialThumb)

  useEffect(() => {
    setThumbSrc(initialThumb)
  }, [initialThumb])

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
          onError={() => {
            if (thumbSrc !== categoryThumb) {
              setThumbSrc(categoryThumb)
              return
            }
            if (thumbSrc !== defaultThumb) {
              setThumbSrc(defaultThumb)
            }
          }}
        />
        </div>
      </Link>
      <div className={`p-5 ${featured ? 'md:p-6' : ''}`}>
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
        <p className="mb-4 text-sm leading-6 text-zinc-300">{article.summary}</p>
        <div className="flex items-center justify-between text-sm">
          <span className="inline-flex items-center gap-2 text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/70" />
            {article.sourceName}
          </span>
          <div className="flex items-center gap-4">
            {article.sourceUrl && (
              <a
                className="font-medium text-zinc-400 hover:text-zinc-200"
                href={article.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                Source
              </a>
            )}
            <Link className="font-medium text-cyan-400 hover:text-cyan-300" to={articlePath}>
              Read analysis
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
