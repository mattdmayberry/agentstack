/**
 * Vercel Edge: dynamic 1200×630 Open Graph image for articles without a thumbnail.
 */
import { ImageResponse } from '@vercel/og'

export const config = { runtime: 'edge' }

const BG = '#09090b'
const CYAN = '#22d3ee'
const MUTED = '#a1a1aa'

function safeText(raw: string | null, max: number): string {
  if (!raw) return ''
  return raw
    .replace(/[\u0000-\u001f<>]/g, ' ')
    .trim()
    .slice(0, max)
}

export default function handler(request: Request): Response {
  const url = new URL(request.url)
  const title = safeText(url.searchParams.get('title'), 140) || 'AgentStack.fyi'
  const category = safeText(url.searchParams.get('category'), 36)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: BG,
          padding: 56,
          position: 'relative',
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: 72,
            top: '50%',
            marginTop: -140,
            width: 280,
            height: 280,
            borderRadius: '50%',
            border: `2px solid rgba(34, 211, 238, 0.25)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 112,
            top: '50%',
            marginTop: -100,
            width: 200,
            height: 200,
            borderRadius: '50%',
            border: `1px solid rgba(34, 211, 238, 0.15)`,
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 4,
              background: CYAN,
            }}
          />
          <span style={{ fontSize: 22, fontWeight: 700, color: '#fafafa', letterSpacing: '-0.02em' }}>
            AgentStack
          </span>
        </div>

        {category ? (
          <div
            style={{
              alignSelf: 'flex-start',
              fontSize: 14,
              fontWeight: 600,
              color: CYAN,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              marginBottom: 20,
              border: `1px solid rgba(34, 211, 238, 0.45)`,
              padding: '8px 14px',
              borderRadius: 999,
            }}
          >
            {category}
          </div>
        ) : null}

        <div
          style={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'center',
            maxWidth: 900,
            gap: 16,
          }}
        >
          <div
            style={{
              width: 72,
              height: 3,
              background: CYAN,
              marginBottom: 8,
            }}
          />
          <div
            style={{
              fontSize: title.length > 90 ? 44 : 56,
              fontWeight: 700,
              color: '#fafafa',
              lineHeight: 1.12,
              letterSpacing: '-0.03em',
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 26, color: MUTED, lineHeight: 1.35, maxWidth: 820 }}>
            High-signal AI agent infrastructure coverage — MCP, APIs, and tooling without the noise.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            alignSelf: 'flex-start',
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: 999,
            padding: '12px 22px',
            marginTop: 24,
          }}
        >
          <span style={{ color: CYAN, fontSize: 20, fontWeight: 600 }}>{'>'}_</span>
          <span style={{ color: '#fafafa', fontSize: 20, fontWeight: 600 }}>agentstack.fyi</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
