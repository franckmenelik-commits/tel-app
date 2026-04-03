// TEL — The Experience Layer
// app/opengraph-image.tsx
// Dynamic OG image — 1200×630 — served automatically by Next.js at /opengraph-image

import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'TEL — Cross two sources. See what they hide together.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0A0A0F',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px',
          position: 'relative',
        }}
      >
        {/* Subtle grid background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(circle at 30% 40%, rgba(201,168,76,0.08) 0%, transparent 60%), radial-gradient(circle at 70% 60%, rgba(122,171,181,0.06) 0%, transparent 60%)',
          }}
        />

        {/* Top label */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '48px',
            opacity: 0.5,
          }}
        >
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C9A84C' }} />
          <span style={{ color: '#C9A84C', fontSize: '14px', letterSpacing: '3px', fontFamily: 'monospace' }}>
            THE EXPERIENCE LAYER
          </span>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C9A84C' }} />
        </div>

        {/* TEL logotype */}
        <div
          style={{
            fontSize: '96px',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-4px',
            lineHeight: 1,
            marginBottom: '32px',
            fontFamily: 'serif',
          }}
        >
          TEL
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '28px',
            color: 'rgba(255,255,255,0.7)',
            textAlign: 'center',
            lineHeight: 1.4,
            maxWidth: '800px',
            fontFamily: 'sans-serif',
          }}
        >
          Croisez deux sources.{' '}
          <span style={{ color: '#C9A84C' }}>Voyez ce qu'elles cachent ensemble.</span>
        </div>

        {/* Crossing symbol */}
        <div
          style={{
            marginTop: '48px',
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          <div
            style={{
              width: '120px',
              height: '1px',
              background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.4))',
            }}
          />
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '28px' }}>×</span>
          <div
            style={{
              width: '120px',
              height: '1px',
              background: 'linear-gradient(to left, transparent, rgba(201,168,76,0.4))',
            }}
          />
        </div>

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            color: 'rgba(255,255,255,0.2)',
            fontSize: '13px',
            letterSpacing: '2px',
            fontFamily: 'monospace',
          }}
        >
          theexperiencelayer.org
        </div>
      </div>
    ),
    { ...size }
  )
}
