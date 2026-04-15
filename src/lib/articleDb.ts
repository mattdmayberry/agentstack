import { supabase } from './supabase'
import type { Article } from '../types'

const CATEGORIES = ['MCP', 'API', 'Infra', 'Tooling', 'Opinion'] as const

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
  content: string
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
    createdAt: row.created_at,
    isApproved: row.is_approved,
    isFeatured: row.is_featured,
    content: row.content,
  }
}

export async function fetchApprovedArticles(): Promise<Article[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('is_approved', true)
    .order('published_at', { ascending: false })

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
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false })

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
  content: string
}

export async function insertArticleAdmin(row: ArticleInsertRow): Promise<Article> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.from('articles').insert(row).select('*').single()
  if (error) throw error
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
    .single()

  if (error) throw error
  return rowToArticle(data as ArticleRow)
}
