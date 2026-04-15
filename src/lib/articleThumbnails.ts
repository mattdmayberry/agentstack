import type { Article } from '../types'
import agentAutonomyThumb from '../assets/article-thumbs/agent-autonomy.jpg'
import agentStackThumb from '../assets/article-thumbs/agent-stack.jpg'
import agenticUiThumb from '../assets/article-thumbs/agentic-ui.jpg'
import cliMcpThumb from '../assets/article-thumbs/cli-mcp.jpg'
import cliWorkflowsThumb from '../assets/article-thumbs/cli-workflows.jpg'
import functionCallingThumb from '../assets/article-thumbs/function-calling.jpg'
import mcpProtocolThumb from '../assets/article-thumbs/mcp-protocol.jpg'
import mcpRegistryThumb from '../assets/article-thumbs/mcp-registry.jpg'

const FALLBACK_POOL = [
  agentAutonomyThumb,
  cliWorkflowsThumb,
  mcpRegistryThumb,
  agentStackThumb,
  mcpProtocolThumb,
  functionCallingThumb,
] as const

export const categoryDefaultThumb: Record<Article['category'], string> = {
  MCP: mcpProtocolThumb,
  API: functionCallingThumb,
  Infra: agentStackThumb,
  Tooling: cliMcpThumb,
  Opinion: agenticUiThumb,
}

function hashKey(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

/** Reject values that are clearly not image URLs (common data mistakes). */
export function isPlausibleImageSrc(raw: string | undefined | null): boolean {
  if (raw == null) return false
  const u = raw.trim()
  if (!u) return false
  if (u.startsWith('/article/')) return false
  if (u.startsWith('mailto:') || u.startsWith('javascript:')) return false
  if (u.startsWith('data:image/')) return true
  if (u.startsWith('http://') || u.startsWith('https://')) return true
  if (u.startsWith('/')) return true
  return false
}

function rotatedThumb(article: Article, avoid: string): string {
  const key = article.slug ?? article.id
  const pool = FALLBACK_POOL
  const h = hashKey(key)
  for (let t = 0; t < pool.length; t++) {
    const candidate = pool[(h + t) % pool.length]
    if (candidate !== avoid) return candidate
  }
  return pool[h % pool.length]
}

/**
 * Ordered candidates for <img src>. First loadable wins; rest are fallbacks.
 */
export function getArticleThumbnailCandidates(article: Article): string[] {
  const custom = article.thumbnailUrl?.trim() ?? ''
  const category = categoryDefaultThumb[article.category]
  const uniq: string[] = []

  const push = (s: string) => {
    if (s && !uniq.includes(s)) uniq.push(s)
  }

  if (isPlausibleImageSrc(custom)) push(custom)
  push(category)
  push(rotatedThumb(article, category))

  return uniq.length > 0 ? uniq : [categoryDefaultThumb.Infra]
}
