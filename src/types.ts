export type Article = {
  id: string
  slug?: string
  title: string
  url: string
  sourceUrl?: string
  sourceName: string
  sourceDomain: string
  thumbnailUrl: string
  summary: string
  category: 'MCP' | 'API' | 'Infra' | 'Tooling' | 'Opinion'
  publishedAt: string
  createdAt?: string
  isApproved: boolean
  isFeatured: boolean
  content: string
}
