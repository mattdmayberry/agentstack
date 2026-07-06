import { canAccessAdmin, getAdminRoutePath, isAdminHostname } from './adminAccess'

const DEFAULT_PIXEL_ID = '2201968007045521'

type Fbq = {
  (...args: unknown[]): void
  callMethod?: (...args: unknown[]) => void
  queue: unknown[]
  push: Fbq
  loaded: boolean
  version: string
}

declare global {
  interface Window {
    fbq?: Fbq
    _fbq?: Fbq
  }
}

let initialized = false

function metaPixelId(): string {
  const fromEnv = (import.meta.env.VITE_META_PIXEL_ID as string | undefined)?.trim()
  if (fromEnv === '') return ''
  return fromEnv || DEFAULT_PIXEL_ID
}

export function isMetaPixelEnabled(): boolean {
  return import.meta.env.PROD && metaPixelId().length > 0
}

export function isMetaPixelSuppressedPath(pathname: string, hostname: string): boolean {
  if (isAdminHostname(hostname)) return true
  if (canAccessAdmin(hostname)) {
    const adminPath = `/${getAdminRoutePath()}`
    if (pathname === adminPath || pathname.startsWith(`${adminPath}/`)) {
      return true
    }
  }
  return false
}

function injectMetaPixelScript(): void {
  if (typeof window === 'undefined' || window.fbq) return

  const fbq: Fbq = function (...args: unknown[]) {
    if (fbq.callMethod) {
      fbq.callMethod.apply(fbq, args)
    } else {
      fbq.queue.push(args)
    }
  } as Fbq

  fbq.push = fbq
  fbq.loaded = true
  fbq.version = '2.0'
  fbq.queue = []

  window.fbq = fbq
  if (!window._fbq) window._fbq = fbq

  const script = document.createElement('script')
  script.async = true
  script.src = 'https://connect.facebook.net/en_US/fbevents.js'
  const firstScript = document.getElementsByTagName('script')[0]
  firstScript.parentNode?.insertBefore(script, firstScript)
}

export function initMetaPixel(): void {
  if (initialized || !isMetaPixelEnabled()) return

  injectMetaPixelScript()
  window.fbq?.('init', metaPixelId())
  initialized = true
}

export function trackMetaPageView(): void {
  if (!isMetaPixelEnabled()) return
  if (isMetaPixelSuppressedPath(window.location.pathname, window.location.hostname)) return

  initMetaPixel()
  window.fbq?.('track', 'PageView')
}
