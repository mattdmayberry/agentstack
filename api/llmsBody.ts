/**
 * Shared plain-text body for llms.txt (used by Edge api/llms.ts and tests).
 */

export type LlmsArticleInput = {
  slug: string
  title: string
  summary: string
  category?: string
}

const PREAMBLE = `# AgentStack.fyi

> High-signal news and analysis on the AI agent stack: MCP, APIs, CLIs, orchestration, and production agent infrastructure.

**No-JS entry point (use this first with plain HTTP fetch):** \`/crawl/index.html\` — static HTML listing every approved article with links to full static article pages at \`/crawl/article/{slug}.html\`.

AgentStack.fyi is a curated publication for builders tracking how software is shifting from traditional APIs and UIs toward agent-driven systems.

## What you will find

- A homepage feed of approved articles with summaries, categories, and links to deeper analysis on-site (interactive app at \`/\`).
- Long-form analysis pages at \`/article/{slug}\` with editorial commentary (Markdown) when JavaScript runs.

## Primary audience

- AI engineers and platform teams
- Founders building agent tooling and infra
- Practitioners following MCP and agent runtime evolution

## Contact / site

- Site: https://agentstack.fyi
- Newsletter signup is available from the site header (email collection for product updates).

## Technical note for crawlers and agents

The homepage is a client-rendered React app. This file is generated from the database and lists every **approved** article below (it updates when you publish or approve content — no separate file to edit). Use \`/sitemap.xml\` for URL-only discovery.

For **plain HTML without JavaScript** (recommended for automated fetchers and LLMs), each article has a **static snapshot** rebuilt on every deploy:

- \`/crawl/article/{slug}.html\` — full article body, metadata, and JSON-LD; same \`link rel="canonical"\` as the interactive URL \`/article/{slug}\`.

The interactive route \`/article/{slug}\` may also return bot-oriented HTML for known crawler user-agents via edge middleware, but the \`/crawl/article/\` files do not depend on user-agent.

`

function oneLine(s: string, max = 400): string {
  return s.replace(/\s+/g, ' ').trim().slice(0, max)
}

export function buildLlmsText(origin: string, articles: LlmsArticleInput[]): string {
  const base = origin.replace(/\/$/, '')
  const lines: string[] = [PREAMBLE.trimEnd(), '', '## Approved articles (auto-generated)', '']

  if (articles.length === 0) {
    lines.push('No approved articles in the database yet.', '')
    return lines.join('\n')
  }

  lines.push(
    'Each entry is an article that appears on the public feed. Titles and summaries come from the live database.',
    '',
  )

  for (const a of articles) {
    const slug = a.slug.trim()
    const title = a.title.trim() || slug
    const url = `${base}/article/${encodeURIComponent(slug)}`
    const staticHtml = `${base}/crawl/article/${encodeURIComponent(slug)}.html`
    const sum = oneLine(a.summary ?? '')
    const cat = (a.category ?? '').trim()
    lines.push(`### ${title}`)
    lines.push(`- URL: ${url}`)
    lines.push(`- Static HTML (no JS): ${staticHtml}`)
    if (cat) lines.push(`- Category: ${cat}`)
    lines.push(`- Summary: ${sum || '(No summary.)'}`)
    lines.push('')
  }

  return lines.join('\n').trimEnd() + '\n'
}
