export function isAdminHostname(hostname: string) {
  return hostname === 'admin.agentstack.fyi' || hostname.startsWith('admin.')
}

/** Hostnames that may load admin without admin.* (comma-separated in VITE_ADMIN_EXTRA_HOSTS). */
function extraAdminHosts(): string[] {
  const raw = (import.meta.env.VITE_ADMIN_EXTRA_HOSTS as string | undefined)?.trim()
  if (!raw) return []
  return raw.split(',').map((h) => h.trim().toLowerCase()).filter(Boolean)
}

export function canAccessAdmin(hostname: string) {
  const h = hostname.toLowerCase()
  if (extraAdminHosts().includes(h)) {
    return true
  }
  return (
    isAdminHostname(hostname) ||
    h === 'localhost' ||
    h === '127.0.0.1'
  )
}

/**
 * URL path segment(s) for the admin UI, e.g. "agent-ops-704" or "internal/panel".
 * Only honored on hosts where canAccessAdmin is true (admin.*, localhost, or VITE_ADMIN_EXTRA_HOSTS).
 * If unset, defaults to "admin" for local/dev convenience.
 */
export function getAdminRoutePath(): string {
  const raw = (import.meta.env.VITE_ADMIN_ROUTE as string | undefined)?.trim()
  if (!raw) return 'admin'
  const path = raw.replace(/^\/+/, '').replace(/\/+$/g, '')
  if (!/^[a-zA-Z0-9-]+(?:\/[a-zA-Z0-9-]+)*$/.test(path)) {
    return 'admin'
  }
  return path
}

/**
 * Full URL users should open for the admin UI (admin hostname + configured path).
 * Use when the app is loaded from a consumer hostname so we can show a working link.
 */
export function getPublicAdminEntryUrl(): string {
  const path = getAdminRoutePath()
  const configured = (import.meta.env.VITE_PUBLIC_ADMIN_ORIGIN as string | undefined)?.trim()
  if (configured) {
    return `${configured.replace(/\/$/, '')}/${path}`
  }
  if (typeof window === 'undefined') {
    return `https://admin.agentstack.fyi/${path}`
  }
  const { protocol, hostname, port } = window.location
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const p = port || '8080'
    return `${protocol}//${hostname}:${p}/${path}`
  }
  if (hostname.startsWith('admin.')) {
    return `${window.location.origin}/${path}`
  }
  if (extraAdminHosts().includes(hostname.toLowerCase())) {
    return `${window.location.origin}/${path}`
  }
  const apex = hostname.replace(/^www\./, '')
  return `https://admin.${apex}/${path}`
}
