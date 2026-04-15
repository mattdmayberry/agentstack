import { SiteHeader } from './SiteHeader'
import { getPublicAdminEntryUrl } from '../lib/adminAccess'

/**
 * Shown when the admin route path matches but the hostname is not an admin host
 * (e.g. user opened https://agentstack.fyi/agentops704 instead of https://admin.agentstack.fyi/...).
 */
export function AdminHostGate() {
  const href = getPublicAdminEntryUrl()

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <SiteHeader />
      <section className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="mb-3 text-2xl font-semibold">Admin is blocked on this hostname</h1>
        <p className="mb-4 text-zinc-400">
          By default, admin only loads on an <code className="text-cyan-400">admin.</code> subdomain or
          localhost. Your current host is not in that list (and{' '}
          <code className="text-cyan-400">VITE_ADMIN_EXTRA_HOSTS</code> does not include it).
        </p>
        <p className="mb-6 break-all text-sm text-zinc-300">
          <a href={href} className="text-cyan-400 underline hover:text-cyan-300">
            {href}
          </a>
        </p>
        <p className="text-xs text-zinc-500">
          Either open that URL (after pointing <code className="text-zinc-400">admin</code> DNS at Vercel),
          or set <code className="text-zinc-400">VITE_ADMIN_EXTRA_HOSTS</code> to this hostname in Vercel
          and redeploy — see <code className="text-zinc-400">.env.example</code>.
        </p>
      </section>
    </main>
  )
}
