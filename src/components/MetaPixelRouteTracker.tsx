import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { isMetaPixelEnabled, isMetaPixelSuppressedPath, trackMetaPageView } from '../lib/metaPixel'

/** Fires Meta Pixel PageView on initial load and client-side route changes. */
export function MetaPixelRouteTracker() {
  const location = useLocation()

  useEffect(() => {
    if (!isMetaPixelEnabled()) return
    if (isMetaPixelSuppressedPath(location.pathname, window.location.hostname)) return
    trackMetaPageView()
  }, [location.pathname])

  return null
}
