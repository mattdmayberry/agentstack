# AgentStack.fyi — MVP Product Requirements Document

## 1. Overview

AgentStack.fyi is a news + analysis platform focused on the emerging AI Agent Stack — including APIs, CLIs, MCP (Model Context Protocol), and agent infrastructure.

The product combines:
- A high-frequency curated news feed (fast, scannable)
- With deep, technical analysis content (authoritative, evergreen)

Core Thesis:
Software is shifting from APIs and UIs → agent-driven systems.  
AgentStack.fyi is the default destination to track and understand that shift.

---

## 2. Goals

### Primary Goals
- Establish AgentStack.fyi as the category-defining publication for the AI Agent Stack
- Create a daily habit product via curated news feed
- Build credibility with technical audiences via deep analysis

### Secondary Goals
- Capture emails for newsletter
- Build foundation for future monetization

---

## 3. Non-Goals (MVP)

- Comments / social features
- Personalization / recommendation engine
- Full newsletter system
- Complex CMS workflows

---

## 4. Target Audience

- AI engineers and developers
- Infra / platform PMs
- Founders building agent tooling
- Early adopters tracking MCP and agent infra

---

## 5. User Jobs to Be Done

- Show me what matters in AI agents today
- Summarize key infra updates quickly
- Help me understand MCP / APIs evolution
- Give me high-signal, technical insights

---

## 6. Product Principles

1. Signal over noise
2. Speed on the surface, depth underneath
3. Mobile-first consumption
4. Minimal, fast UX
5. Authority > virality

---

## 7. Core Product Experience

### 7.1 Homepage Feed

- Card-based layout
- Title (links to source)
- Source name
- Thumbnail (OG → favicon → placeholder)
- AI summary (2–3 sentences)
- Timestamp
- Category tag

Behavior:
- Infinite scroll
- Fast load
- Mobile-first

---

### 7.2 Deep Content

- Minimal UI
- Large typography
- Essay-style layout

Content Types:
- Deep dives
- System diagrams
- Opinionated essays

---

## 8. Content Ingestion System

### Sources
- RSS feeds via Feedly
- Anthropic, OpenAI, Hugging Face blogs
- MCP spec site
- AI newsletters

### Pipeline
1. Pull RSS
2. Filter by keywords
3. Extract metadata
4. Generate summary + tags
5. Store in DB
6. Approve for publishing

### Requirements
- Deduplication
- Canonical URL handling
- Error handling

---

## 9. Admin System

- Hidden route (/admin)
- Auth protected

Capabilities:
- Approve/reject articles
- Edit summary, thumbnail, category
- Pin featured
- Add manual content

---

## 10. Newsletter Signup

- Homepage hero
- Inline in feed
- Footer

Fields:
- Email only

Stored in database

---

## 11. Tech Stack

Frontend:
- React (Vite)
- Tailwind CSS

Backend:
- Supabase

Hosting:
- Vercel

---

## 12. Data Model

### articles
- id
- title
- url
- source_name
- source_domain
- thumbnail_url
- summary
- category
- published_at
- created_at
- is_approved
- is_featured

### newsletter_subscribers
- id
- email
- created_at

---

## 13. Key Screens

1. Homepage
2. Article Page
3. Admin Panel

---

## 14. Design System

Homepage:
- Fast, dense, card-based

Articles:
- Minimal, reading-focused

Brand:
- Technical
- Credible
- Insider

---

## 15. MVP Content Strategy

Launch with 20–25 articles:

Evergreen:
- What is MCP?
- The Agent Stack Explained
- APIs vs Agents

Curated:
- Recent AI infra updates

---

## 16. Success Metrics

- Articles per session
- Scroll depth
- CTR
- Newsletter conversion
- Returning users

---

## 17. Risks

- Deduplication issues
- Weak summaries
- Low differentiation if too shallow

---

## 18. Future

- Newsletter system
- Original reporting
- Filters
- Trending
- Monetization

---

## Final Positioning

Scan the agent ecosystem in seconds.  
Understand it in depth when it matters.
