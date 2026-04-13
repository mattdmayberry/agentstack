import { Link } from 'react-router-dom'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3 md:gap-4">
          <img
            src="/agent_stack_19fad7.png"
            alt="AgentStack"
            className="h-7 w-auto drop-shadow-[0_0_20px_rgba(6,182,212,0.35)] md:h-8"
          />
        </Link>
        <nav className="flex items-center gap-2 text-xs sm:gap-3 sm:text-sm">
          <Link
            className="rounded-full border border-zinc-700/80 bg-zinc-900/70 px-3 py-1.5 text-zinc-200 transition hover:border-cyan-500/50 hover:text-cyan-300"
            to="/"
          >
            Feed
          </Link>
          <a
            className="rounded-full border border-zinc-700/80 bg-zinc-900/70 px-3 py-1.5 text-zinc-200 transition hover:border-cyan-500/50 hover:text-cyan-300"
            href="#newsletter"
          >
            Newsletter
          </a>
        </nav>
      </div>
    </header>
  )
}
