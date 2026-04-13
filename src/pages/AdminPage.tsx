import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { SiteHeader } from '../components/SiteHeader'
import { canAccessAdmin } from '../lib/adminAccess'
import { userIsAdmin } from '../lib/adminAuth'
import { fetchAllArticlesAdmin, insertArticleAdmin, updateArticleAdmin } from '../lib/articleDb'
import { supabase } from '../lib/supabase'
import type { Article } from '../types'

type AdminDraft = {
  title: string
  slug: string
  sourceUrl: string
  sourceName: string
  thumbnailUrl: string
  summary: string
  category: Article['category']
  content: string
  isFeatured: boolean
}

const defaultDraft: AdminDraft = {
  title: '',
  slug: '',
  sourceUrl: '',
  sourceName: '',
  thumbnailUrl: '',
  summary: '',
  category: 'Infra',
  content: '',
  isFeatured: false,
}

type AuthGate = 'loading' | 'noconfig' | 'login' | 'denied' | 'ok'

export function AdminPage() {
  const adminHost = canAccessAdmin(window.location.hostname)
  const [gate, setGate] = useState<AuthGate>('loading')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  const [draft, setDraft] = useState<AdminDraft>(defaultDraft)
  const [articles, setArticles] = useState<Article[]>([])
  const [formMessage, setFormMessage] = useState('')
  const rows = useMemo(() => articles, [articles])

  const refreshAuth = useCallback(async () => {
    if (!supabase) {
      setGate('noconfig')
      return
    }
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setGate('login')
      return
    }
    const ok = await userIsAdmin(user)
    setGate(ok ? 'ok' : 'denied')
  }, [])

  useEffect(() => {
    if (!adminHost) {
      return
    }
    void refreshAuth()
    if (!supabase) {
      return
    }
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refreshAuth()
    })
    return () => subscription.unsubscribe()
  }, [adminHost, refreshAuth])

  useEffect(() => {
    if (gate !== 'ok' || !supabase) {
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const list = await fetchAllArticlesAdmin()
        if (!cancelled) {
          setArticles(list)
        }
      } catch (e) {
        if (!cancelled) {
          setFormMessage(e instanceof Error ? e.message : 'Failed to load articles')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [gate])

  async function onLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoginError('')
    if (!supabase) {
      setLoginError('Supabase is not configured.')
      return
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    })
    if (error) {
      setLoginError(error.message)
      return
    }
    await refreshAuth()
  }

  async function onSignOut() {
    if (supabase) {
      await supabase.auth.signOut()
    }
    setLoginPassword('')
    setGate('login')
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!draft.title.trim() || !draft.slug.trim() || !draft.summary.trim() || !draft.content.trim()) {
      setFormMessage('Title, slug, summary, and content are required.')
      return
    }

    if (draft.sourceUrl.trim()) {
      try {
        new URL(draft.sourceUrl)
      } catch {
        setFormMessage('Please enter a valid source link.')
        return
      }
    }

    let sourceDomain = ''
    sourceDomain = draft.sourceUrl.trim()
      ? new URL(draft.sourceUrl.trim()).hostname.replace(/^www\./, '')
      : 'agentstack.fyi'

    const normalizedSlug = draft.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    if (!normalizedSlug) {
      setFormMessage('Slug must include letters or numbers.')
      return
    }

    if (articles.some((entry) => entry.slug === normalizedSlug)) {
      setFormMessage('That slug is already in use.')
      return
    }

    try {
      const inserted = await insertArticleAdmin({
        slug: normalizedSlug,
        title: draft.title.trim(),
        url: `/article/${normalizedSlug}`,
        source_url: draft.sourceUrl.trim() || null,
        source_name: draft.sourceName.trim() || sourceDomain,
        source_domain: sourceDomain,
        thumbnail_url: draft.thumbnailUrl.trim() || '',
        summary: draft.summary.trim(),
        category: draft.category,
        published_at: new Date().toISOString(),
        is_approved: false,
        is_featured: draft.isFeatured,
        content: draft.content.trim(),
      })
      setArticles((current) => [inserted, ...current])
      setDraft(defaultDraft)
      setFormMessage('Content added to moderation queue.')
    } catch (err: unknown) {
      const code = err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : ''
      if (code === '23505') {
        setFormMessage('That slug is already in use.')
        return
      }
      setFormMessage(err instanceof Error ? err.message : 'Could not save article.')
    }
  }

  if (!adminHost) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100">
        <SiteHeader />
        <section className="mx-auto max-w-2xl px-4 py-16 text-center">
          <h1 className="mb-3 text-2xl font-semibold">Admin portal restricted</h1>
          <p className="mb-6 text-zinc-400">
            Access the admin interface from an admin hostname.
          </p>
          <Link to="/" className="text-cyan-400 hover:text-cyan-300">
            Return to homepage
          </Link>
        </section>
      </main>
    )
  }

  if (gate === 'loading') {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100">
        <SiteHeader />
        <p className="px-4 py-10 text-center text-zinc-400">Checking session…</p>
      </main>
    )
  }

  if (gate === 'noconfig') {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100">
        <SiteHeader />
        <section className="mx-auto max-w-lg px-4 py-16">
          <h1 className="mb-3 text-2xl font-semibold">Admin needs Supabase</h1>
          <p className="mb-6 text-zinc-400">
            Set <code className="text-cyan-400">VITE_SUPABASE_URL</code> and{' '}
            <code className="text-cyan-400">VITE_SUPABASE_ANON_KEY</code> in your environment, then add
            yourself to <code className="text-cyan-400">admin_users</code> after running the SQL migration. See{' '}
            <code className="text-cyan-400">.env.example</code> and{' '}
            <code className="text-cyan-400">supabase/migrations/20260413120000_articles_rls.sql</code>.
          </p>
          <Link to="/" className="text-cyan-400 hover:text-cyan-300">
            Back to site
          </Link>
        </section>
      </main>
    )
  }

  if (gate === 'login') {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100">
        <SiteHeader />
        <section className="mx-auto max-w-md px-4 py-16">
          <h1 className="mb-2 text-2xl font-bold">Admin sign in</h1>
          <p className="mb-6 text-sm text-zinc-400">Use your Supabase Auth account.</p>
          <form className="flex flex-col gap-3" onSubmit={onLogin}>
            <input
              type="email"
              autoComplete="email"
              required
              className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
              placeholder="Email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
            />
            <input
              type="password"
              autoComplete="current-password"
              required
              className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
              placeholder="Password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
            />
            {loginError ? <p className="text-sm text-red-400">{loginError}</p> : null}
            <button
              type="submit"
              className="rounded-md bg-cyan-500 py-2 text-sm font-semibold text-zinc-950 hover:bg-cyan-400"
            >
              Sign in
            </button>
          </form>
          <Link to="/" className="mt-6 inline-block text-sm text-cyan-400 hover:text-cyan-300">
            Back to site
          </Link>
        </section>
      </main>
    )
  }

  if (gate === 'denied') {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100">
        <SiteHeader />
        <section className="mx-auto max-w-md px-4 py-16 text-center">
          <h1 className="mb-3 text-2xl font-semibold">Not authorized</h1>
          <p className="mb-6 text-zinc-400">
            This account is signed in but is not in <code className="text-cyan-400">admin_users</code>. In the
            Supabase SQL editor run:{' '}
            <code className="block break-all text-left text-cyan-400">
              insert into public.admin_users (user_id) values (&apos;&lt;uuid from auth.users&gt;&apos;);
            </code>
          </p>
          <button
            type="button"
            className="rounded-md border border-zinc-600 px-4 py-2 text-sm hover:border-zinc-400"
            onClick={() => void onSignOut()}
          >
            Sign out
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Admin moderation</h1>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="text-sm text-zinc-400 hover:text-zinc-200"
              onClick={() => void onSignOut()}
            >
              Sign out
            </button>
            <Link to="/" className="text-sm text-cyan-400">
              Back to feed
            </Link>
          </div>
        </div>
        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="mb-4 text-lg font-semibold">Add manual content</h2>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
            <input
              className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              placeholder="Title"
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
            />
            <input
              className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              placeholder="Slug (required) — e.g. mcp-registry-update"
              value={draft.slug}
              onChange={(event) =>
                setDraft((current) => ({ ...current, slug: event.target.value }))
              }
            />
            <input
              className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              placeholder="Original source URL (optional)"
              value={draft.sourceUrl}
              onChange={(event) => setDraft((current) => ({ ...current, sourceUrl: event.target.value }))}
            />
            <input
              className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              placeholder="Source name (optional)"
              value={draft.sourceName}
              onChange={(event) =>
                setDraft((current) => ({ ...current, sourceName: event.target.value }))
              }
            />
            <input
              className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              placeholder="Thumbnail URL (optional)"
              value={draft.thumbnailUrl}
              onChange={(event) =>
                setDraft((current) => ({ ...current, thumbnailUrl: event.target.value }))
              }
            />
            <select
              className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              value={draft.category}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  category: event.target.value as Article['category'],
                }))
              }
            >
              <option value="MCP">MCP</option>
              <option value="API">API</option>
              <option value="Infra">Infra</option>
              <option value="Tooling">Tooling</option>
              <option value="Opinion">Opinion</option>
            </select>
            <label className="flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={draft.isFeatured}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, isFeatured: event.target.checked }))
                }
              />
              Feature on homepage
            </label>
            <textarea
              className="md:col-span-2 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              rows={3}
              placeholder="Summary"
              value={draft.summary}
              onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))}
            />
            <textarea
              className="md:col-span-2 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              rows={5}
              placeholder="Analysis content"
              value={draft.content}
              onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))}
            />
            <div className="md:col-span-2 flex items-center justify-between">
              <p className="text-xs text-zinc-400">{formMessage}</p>
              <button
                type="submit"
                className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-cyan-400"
              >
                Add content
              </button>
            </div>
          </form>
        </div>
        <div className="overflow-hidden rounded-lg border border-zinc-800">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-zinc-900 text-zinc-300">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Source link</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Approved</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((article) => (
                <tr key={article.id} className="border-t border-zinc-800">
                  <td className="px-4 py-3 text-zinc-100">{article.title}</td>
                  <td className="px-4 py-3 text-zinc-400">{article.sourceName}</td>
                  <td className="px-4 py-3">
                    {article.sourceUrl ? (
                      <a
                        href={article.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:text-cyan-300"
                      >
                        Open
                      </a>
                    ) : (
                      <span className="text-zinc-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{article.category}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="rounded border border-zinc-700 px-2 py-1 hover:border-zinc-500"
                      onClick={() => {
                        void (async () => {
                          const nextApproved = !article.isApproved
                          try {
                            await updateArticleAdmin(article.id, { is_approved: nextApproved })
                            setArticles((current) =>
                              current.map((entry) =>
                                entry.id === article.id
                                  ? { ...entry, isApproved: nextApproved }
                                  : entry,
                              ),
                            )
                          } catch (e) {
                            setFormMessage(e instanceof Error ? e.message : 'Could not update approval')
                          }
                        })()
                      }}
                    >
                      {article.isApproved ? 'Approved' : 'Pending'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
