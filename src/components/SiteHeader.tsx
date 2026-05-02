import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { NewsletterForm } from './NewsletterForm'

export function SiteHeader() {
  const [newsletterOpen, setNewsletterOpen] = useState(false)

  useEffect(() => {
    if (!newsletterOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setNewsletterOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [newsletterOpen])

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-3 py-2.5 sm:px-4 sm:py-3">
          <Link to="/" className="flex min-h-11 min-w-0 items-center gap-2 sm:gap-4">
            <img
              src="/agent_stack_19fad7.png"
              alt="AgentStack"
              className="h-7 w-auto shrink-0 drop-shadow-[0_0_20px_rgba(6,182,212,0.35)] md:h-8"
            />
          </Link>
          <nav className="flex shrink-0 items-center gap-2 text-xs sm:gap-3 sm:text-sm">
            <Link
              className="inline-flex min-h-11 items-center rounded-full border border-zinc-700/80 bg-zinc-900/70 px-3.5 py-2 text-zinc-200 transition hover:border-cyan-500/50 hover:text-cyan-300 active:bg-zinc-800/80"
              to="/"
            >
              Feed
            </Link>
            <button
              type="button"
              onClick={() => setNewsletterOpen(true)}
              className="inline-flex min-h-11 items-center rounded-full border border-zinc-700/80 bg-zinc-900/70 px-3.5 py-2 text-zinc-200 transition hover:border-cyan-500/50 hover:text-cyan-300 active:bg-zinc-800/80"
            >
              Newsletter
            </button>
          </nav>
        </div>
      </header>

      {newsletterOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/75 px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Newsletter signup"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setNewsletterOpen(false)
            }
          }}
        >
          <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto overscroll-contain rounded-xl border border-zinc-700 bg-zinc-900 p-4 shadow-xl sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0 pr-1">
                <h2 className="text-lg font-semibold text-zinc-100">Join the newsletter</h2>
                <p className="text-sm text-zinc-400">Get high-signal updates weekly.</p>
              </div>
              <button
                type="button"
                onClick={() => setNewsletterOpen(false)}
                className="inline-flex min-h-11 shrink-0 items-center rounded-md border border-zinc-600 px-3 py-2 text-xs text-zinc-300 hover:border-zinc-400 active:bg-zinc-800/80"
              >
                Close
              </button>
            </div>
            <NewsletterForm buttonLabel="Subscribe" />
          </div>
        </div>
      ) : null}
    </>
  )
}
