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
  /** Lower value appears earlier within the same featured / non-featured group. */
  displayOrder: number
  isApproved: boolean
  isFeatured: boolean
  content: string
}
