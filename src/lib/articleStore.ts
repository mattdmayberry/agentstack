import { mockArticles } from '../data/mockArticles'
import type { Article } from '../types'

const STORAGE_KEY = 'agentstack_articles'

export function getStoredArticles(): Article[] {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(mockArticles))
    return mockArticles
  }

  try {
    const parsed = JSON.parse(raw) as Article[]
    if (!Array.isArray(parsed)) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(mockArticles))
      return mockArticles
    }
    return parsed
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(mockArticles))
    return mockArticles
  }
}

export function saveStoredArticles(articles: Article[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(articles))
}
