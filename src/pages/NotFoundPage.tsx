import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { SiteHeader } from '../components/SiteHeader'
/**
 * Hard 404 for unknown routes (better than redirecting to `/`, which looks like a soft 404).
 */
export function NotFoundPage() {
  useEffect(() => {
    document.title = 'Page not found — AgentStack.fyi'
    const setMeta = (attr: 'name' | 'property', key: string, value: string) => {
      let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, key)
        document.head.appendChild(el)
      }
      el.content = value
    }
    setMeta('name', 'robots', 'noindex, nofollow')
    setMeta('name', 'description', 'The page you requested does not exist on AgentStack.fyi.')

    const canonical = `${window.location.origin}${window.location.pathname}`
    let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.rel = 'canonical'
      document.head.appendChild(link)
    }
    link.href = canonical

    return () => {
      document.head.querySelector('meta[name="robots"][content="noindex, nofollow"]')?.remove()
    }
  }, [])

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <SiteHeader />
      <div className="mx-auto max-w-lg px-3 py-16 text-center sm:px-4">
        <h1 className="mb-3 text-2xl font-semibold text-zinc-100">Page not found</h1>
        <p className="mb-8 text-sm text-zinc-400">That URL is not part of this site.</p>
        <Link to="/" className="text-cyan-400 hover:text-cyan-300">
          Back to AgentStack.fyi
        </Link>
      </div>
    </main>
  )
}
