/**
 * Vercel Edge middleware: serve crawler-friendly HTML for /article/:slug when the
 * User-Agent looks like a bot. Regular browsers still receive the SPA (no rewrite).
 *
 * Not run by `vite dev`; use `vercel dev` or deploy to verify.
 */
export const config = {
  matcher: ['/article/:path*'],
}

const BOT_UA =
  /googlebot|bingbot|yandex|baiduspider|duckduckbot|facebot|facebookexternalhit|linkedinbot|twitterbot|slackbot|discordbot|telegram|applebot|gptbot|chatgpt-user|anthropic|claude-web|claudebot|cohere-ai|ccbot|omgili|perplexitybot|bytespider|amazonbot|ia_archiver|semrushbot|ahrefsbot|mj12bot|dotbot/i

export default async function middleware(request: Request): Promise<Response | undefined> {
  const url = new URL(request.url)
  const pathname = url.pathname
  if (!pathname.startsWith('/article/')) {
    return undefined
  }

  const slug = pathname.slice('/article/'.length).split('/')[0] ?? ''
  if (!slug || !/^[a-z0-9-]+$/i.test(slug)) {
    return undefined
  }

  const ua = request.headers.get('user-agent') ?? ''
  if (!BOT_UA.test(ua)) {
    return undefined
  }

  const canonical = `${url.origin}/article/${slug}`
  const api = new URL('/api/bot-article-html', url.origin)
  api.searchParams.set('slug', slug)

  return fetch(api.toString(), {
    headers: {
      'x-article-canonical': canonical,
    },
  })
}
