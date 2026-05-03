/** Branded default Open Graph image (1200×630) — place file at `public/og-default.png`. */
export const DEFAULT_OG_IMAGE_PATH = '/og-default.png'

export function withAbsoluteOrigin(origin: string, path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  const o = origin.replace(/\/$/, '')
  if (!o) return p
  return `${o}${p}`
}

/** Homepage / site-wide default `og:image`. */
export function defaultSiteOgImageUrl(origin: string | null | undefined): string {
  const o = origin?.trim()
  if (o && /^https?:\/\//i.test(o)) {
    return withAbsoluteOrigin(o, DEFAULT_OG_IMAGE_PATH)
  }
  return DEFAULT_OG_IMAGE_PATH
}

/**
 * Per-article `og:image`: use remote or absolute thumbnail when present; otherwise the
 * branded default (`/og-default.png`). Dynamic `@vercel/og` routes are omitted here
 * because that package is not reliably deployable on Vercel Edge outside Next.js.
 */
export function articleOgImageUrl(
  origin: string,
  article: {
    title: string
    category?: string | null
    thumbnailUrl?: string | null
  },
): string {
  const thumb = article.thumbnailUrl?.trim()
  if (thumb) {
    if (/^https?:\/\//i.test(thumb)) return thumb
    if (thumb.startsWith('/')) return withAbsoluteOrigin(origin, thumb)
    return thumb
  }
  return defaultSiteOgImageUrl(origin || undefined)
}
