import type { Article } from '../types'

export const mockArticles: Article[] = [
  {
    id: 'agent-stack-explained',
    slug: 'agent-stack-explained',
    title: 'The Agent Stack Explained: From Models to Production Loops',
    url: '/article/agent-stack-explained',
    sourceUrl: 'https://agentstack.fyi/deep-dives/agent-stack-explained',
    sourceName: 'AgentStack Editorial',
    sourceDomain: 'agentstack.fyi',
    thumbnailUrl: '',
    summary:
      'A practical breakdown of how orchestration, tools, memory, and runtime guardrails combine into an effective agent architecture.',
    category: 'Infra',
    publishedAt: '2026-04-13T08:00:00.000Z',
    isApproved: true,
    isFeatured: true,
    content:
      'Agent systems are no longer just prompt wrappers. Durable agent products combine planning, tool execution, state, and evaluation. This piece maps the stack from model APIs through orchestration, memory, and production observability.',
  },
  {
    id: 'mcp-moving-to-standard',
    slug: 'mcp-moving-to-standard',
    title: 'MCP Is Becoming the Default Interface for Agent Tooling',
    url: '/article/mcp-moving-to-standard',
    sourceUrl: 'https://modelcontextprotocol.io',
    sourceName: 'MCP Spec',
    sourceDomain: 'modelcontextprotocol.io',
    thumbnailUrl: '',
    summary:
      'Protocol-level interoperability is reducing integration cost across CLIs, IDE agents, and hosted runtimes.',
    category: 'MCP',
    publishedAt: '2026-04-12T16:00:00.000Z',
    isApproved: true,
    isFeatured: false,
    content:
      'As MCP adoption expands, developers are consolidating around a common way for agents to discover and invoke tools. This significantly improves portability and integration speed.',
  },
  {
    id: 'apis-vs-agents',
    slug: 'apis-vs-agents',
    title: 'APIs vs Agents: Why Product Surfaces Are Shifting',
    url: '/article/apis-vs-agents',
    sourceUrl: 'https://agentstack.fyi/deep-dives/apis-vs-agents',
    sourceName: 'AgentStack Editorial',
    sourceDomain: 'agentstack.fyi',
    thumbnailUrl: '',
    summary:
      'APIs remain foundational, but interaction is moving up a layer where autonomous workflows drive value.',
    category: 'Opinion',
    publishedAt: '2026-04-12T10:30:00.000Z',
    isApproved: true,
    isFeatured: false,
    content:
      'The interface is shifting from deterministic endpoint invocation to goal-driven execution. Teams still need robust APIs, but the primary user experience is becoming agentic.',
  },
]
