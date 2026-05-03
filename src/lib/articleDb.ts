import { supabase } from './supabase'
import type { Article } from '../types'

const CATEGORIES = ['MCP', 'API', 'Infra', 'Tooling', 'Opinion'] as const

/** Same rules as admin form slug normalization (for uniqueness checks). */
export function normalizeArticleSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function formatPostgrestError(err: unknown): string {
  if (err == null) return 'Unknown error'
  if (typeof err !== 'object') return String(err)
  const o = err as Record<string, unknown>
  const parts = [
    o.message != null ? String(o.message) : '',
    o.details != null ? String(o.details) : '',
    o.hint != null ? String(o.hint) : '',
    o.code != null ? `code ${o.code}` : '',
  ].filter((s) => s.length > 0)
  return parts.length > 0 ? parts.join(' — ') : 'Request failed'
}

export type ArticleRow = {
  id: string
  slug: string
  title: string
  url: string
  source_url: string | null
  source_name: string
  source_domain: string
  thumbnail_url: string | null
  summary: string
  category: string
  published_at: string
  created_at: string
  updated_at: string
  is_approved: boolean
  is_featured: boolean
  display_order: number
  content: string
}

/** Featured items first; then ascending display_order; then newest published_at. */
export function compareArticlesFeedOrder(a: Article, b: Article): number {
  if (a.isFeatured !== b.isFeatured) {
    return a.isFeatured ? -1 : 1
  }
  const da = a.displayOrder ?? 0
  const db = b.displayOrder ?? 0
  if (da !== db) {
    return da - db
  }
  return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
}

export function rowToArticle(row: ArticleRow): Article {
  const cat = row.category as Article['category']
  const category = CATEGORIES.includes(cat as (typeof CATEGORIES)[number]) ? cat : 'Infra'
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    url: row.url,
    sourceUrl: row.source_url ?? undefined,
    sourceName: row.source_name,
    sourceDomain: row.source_domain,
    thumbnailUrl: row.thumbnail_url ?? '',
    summary: row.summary,
    category,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
    isApproved: row.is_approved,
    isFeatured: row.is_featured,
    displayOrder: row.display_order ?? 0,
    content: row.content,
  }
}

async function fetchArticlesApprovedOrdered(): Promise<{ data: unknown[] | null; error: unknown }> {
  if (!supabase) return { data: [], error: null }
  const primary = await supabase
    .from('articles')
    .select('*')
    .eq('is_approved', true)
    .order('is_featured', { ascending: false })
    .order('display_order', { ascending: true })
    .order('published_at', { ascending: false })

  if (!primary.error) return primary

  const err = primary.error as { code?: string; message?: string }
  const msg = `${err.message ?? ''} ${err.code ?? ''}`.toLowerCase()
  if (msg.includes('display_order') || err.code === '42703') {
    return supabase
      .from('articles')
      .select('*')
      .eq('is_approved', true)
      .order('is_featured', { ascending: false })
      .order('published_at', { ascending: false })
  }
  return primary
}

export async function fetchApprovedArticles(): Promise<Article[]> {
  if (!supabase) return []
  const { data, error } = await fetchArticlesApprovedOrdered()
  if (error) throw error
  return ((data ?? []) as ArticleRow[]).map(rowToArticle)
}

export async function fetchArticleBySlug(slug: string): Promise<Article | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('is_approved', true)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return rowToArticle(data as ArticleRow)
}

export async function fetchAllArticlesAdmin(): Promise<Article[]> {
  if (!supabase) return []
  const primary = await supabase
    .from('articles')
    .select('*')
    .order('is_featured', { ascending: false })
    .order('display_order', { ascending: true })
    .order('published_at', { ascending: false })

  let { data, error } = primary
  if (error) {
    const err = error as { code?: string; message?: string }
    const msg = `${err.message ?? ''} ${err.code ?? ''}`.toLowerCase()
    if (msg.includes('display_order') || err.code === '42703') {
      const second = await supabase
        .from('articles')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('published_at', { ascending: false })
      data = second.data
      error = second.error
    }
  }
  if (error) throw error
  return ((data ?? []) as ArticleRow[]).map(rowToArticle)
}

export type ArticleInsertRow = {
  slug: string
  title: string
  url: string
  source_url: string | null
  source_name: string
  source_domain: string
  thumbnail_url: string
  summary: string
  category: Article['category']
  published_at: string
  is_approved: boolean
  is_featured: boolean
  display_order?: number
  content: string
}

export async function insertArticleAdmin(row: ArticleInsertRow): Promise<Article> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.from('articles').insert(row).select('*').single()
  if (error) throw new Error(formatPostgrestError(error))
  return rowToArticle(data as ArticleRow)
}

export type ArticleAdminUpdate = Partial<
  Omit<ArticleRow, 'id' | 'created_at' | 'updated_at'>
>

export async function updateArticleAdmin(id: string, patch: ArticleAdminUpdate): Promise<Article> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('articles')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .maybeSingle()

  if (error) throw new Error(formatPostgrestError(error))
  if (!data) {
    throw new Error(
      'No row was updated. Refresh the page, confirm you are signed in as an admin, and try again.',
    )
  }
  return rowToArticle(data as ArticleRow)
}

export async function deleteArticleAdmin(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase.from('articles').delete().eq('id', id)
  if (error) throw new Error(formatPostgrestError(error))
}
