import { supabase } from './supabase'

const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'])

/**
 * Upload an image to Supabase Storage (bucket article-assets) and return its public URL.
 * Requires migration 20260414120000_article_assets_storage.sql and admin RLS on storage.objects.
 */
export async function uploadArticleAsset(file: File): Promise<string> {
  if (!supabase) throw new Error('Supabase is not configured')

  const rawExt = file.name.split('.').pop()?.toLowerCase()
  const ext = rawExt && ALLOWED_EXT.has(rawExt) ? rawExt : ''
  if (!ext) {
    throw new Error('Use an image file: JPEG, PNG, GIF, WebP, or SVG.')
  }

  const path = `uploads/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('article-assets').upload(path, file, {
    upsert: false,
    contentType: file.type || `image/${ext === 'jpg' ? 'jpeg' : ext}`,
  })

  if (error) throw error

  const { data } = supabase.storage.from('article-assets').getPublicUrl(path)
  return data.publicUrl
}
