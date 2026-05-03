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
  /** ISO timestamp from DB `updated_at` (for `dateModified` in structured data). */
  updatedAt?: string
  createdAt?: string
  /** Lower value appears earlier within the same featured / non-featured group. */
  displayOrder: number
  isApproved: boolean
  isFeatured: boolean
  content: string
}
