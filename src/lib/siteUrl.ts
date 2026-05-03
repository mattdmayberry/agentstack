/**
 * Canonical public origin (no trailing slash). Prefer `VITE_PUBLIC_SITE_URL` in
 * production when you want a fixed host in metadata. If unset, uses the current
 * browser origin so both apex and `www` work the same at runtime.
 */
export function getPublicSiteOrigin(): string {
  const raw = import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined
  const fromEnv = raw?.trim()
  if (fromEnv && /^https?:\/\//i.test(fromEnv)) {
    return fromEnv.replace(/\/$/, '')
  }
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return ''
}
