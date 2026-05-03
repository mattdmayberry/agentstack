/**
 * Shared plain-text body for llms.txt (used by Edge api/llms.ts and tests).
 */

export type LlmsArticleInput = {
  slug: string
  title: string
  summary: string
  category?: string
}

const PREAMBLE = `AgentStack.fyi — file for LLMs and automated fetchers (plain text; no JavaScript; no login)

START HERE (static HTML, works with curl and dumb HTTP clients):
- Crawl index listing all articles: append your site origin + /crawl/index.html  (example: https://agentstack.fyi/crawl/index.html)
- About / what this site is (static HTML): /crawl/about.html
- Full text of each article (static HTML): /crawl/article/{slug}.html

This /llms.txt file is written to disk at deploy time (and mirrored by /api/llms for local dev). It is not a client-rendered app. The same body is available at /.well-known/llms.txt (HTTP redirect to this path) for clients that probe well-known URLs.

# AgentStack.fyi

> High-signal news and analysis on the AI agent stack: MCP, APIs, CLIs, orchestration, and production agent infrastructure.

**Primary no-JS entry:** \`/crawl/index.html\` — lists every approved article with links to full static pages at \`/crawl/article/{slug}.html\`.

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

The public homepage (\`/\`) is a client-rendered React shell, but **you do not need to run JavaScript** to read our content: use \`/crawl/index.html\`, \`/crawl/about.html\`, and \`/crawl/article/{slug}.html\` instead.

This file lists every **approved** article below (embedded at deploy from our database). For URL-only discovery see \`/sitemap.xml\`. For RSS see \`/rss.xml\`.

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
