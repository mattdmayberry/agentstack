import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Article } from '../types'
import { getArticleThumbnailCandidates } from '../lib/articleThumbnails'

/**
 * Resolves article hero/thumbnail URL with a finite fallback chain (no onError ping-pong).
 */
export function useArticleThumbnail(article: Article) {
  const candidates = useMemo(() => getArticleThumbnailCandidates(article), [article])
  const [index, setIndex] = useState(0)
  const exhausted = useRef(false)

  useEffect(() => {
    setIndex(0)
    exhausted.current = false
  }, [article.id, article.slug, article.thumbnailUrl, article.category, candidates])

  const src = candidates[Math.min(index, candidates.length - 1)] ?? candidates[0]

  const onError = useCallback(() => {
    if (exhausted.current) return
    setIndex((i) => {
      if (i >= candidates.length - 1) {
        exhausted.current = true
        return i
      }
      return i + 1
    })
  }, [candidates.length])

  return { src, onError }
}
