/**
 * Vercel Edge: dynamic llms.txt from approved articles in Supabase.
 * Rewritten from /llms.txt via vercel.json.
 */
import { buildLlmsText, type LlmsArticleInput } from './llmsBody'

export const config = { runtime: 'edge' }

type ArticleRow = {
  slug: string
  title: string
  summary: string
  category?: string
}

export default async function handler(request: Request): Promise<Response> {
  const reqUrl = new URL(request.url)
  const origin = `${reqUrl.protocol}//${reqUrl.host}`

  const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace(/\/$/, '')
  const anon = process.env.VITE_SUPABASE_ANON_KEY

  let articles: LlmsArticleInput[] = []

  if (supabaseUrl && anon) {
    const restUrl = `${supabaseUrl}/rest/v1/articles?select=slug,title,summary,category&is_approved=eq.true&order=published_at.desc&limit=500`
    const res = await fetch(restUrl, {
      headers: {
        apikey: anon,
        Authorization: `Bearer ${anon}`,
        Accept: 'application/json',
      },
    })
    if (res.ok) {
      const rows = (await res.json()) as ArticleRow[]
      if (Array.isArray(rows)) {
        articles = rows.map((r) => ({
          slug: String(r.slug ?? '').trim(),
          title: String(r.title ?? '').trim(),
          summary: String(r.summary ?? ''),
          category: r.category != null ? String(r.category) : undefined,
        })).filter((r) => r.slug.length > 0)
      }
    }
  }

  const body = buildLlmsText(origin, articles)

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
    },
  })
}
