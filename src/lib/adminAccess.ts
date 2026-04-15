export function isAdminHostname(hostname: string) {
  return hostname === 'admin.agentstack.fyi' || hostname.startsWith('admin.')
}

export function canAccessAdmin(hostname: string) {
  return isAdminHostname(hostname) || hostname === 'localhost'
}

/**
 * URL path segment(s) for the admin UI, e.g. "agent-ops-704" or "internal/panel".
 * Only honored on admin hostnames (see canAccessAdmin). Consumer domains never mount this route.
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
