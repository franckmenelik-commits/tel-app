/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for Docker deployment
  output: 'standalone',

  experimental: {
    serverComponentsExternalPackages: ['youtube-transcript', 'cheerio'],
  },

  async headers() {
    const isDev = process.env.NODE_ENV !== 'production'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://theexperiencelayer.org'

    return [
      {
        // ── API routes — CORS ─────────────────────────────────────────
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: isDev ? '*' : appUrl },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
      {
        // ── All pages — security headers ──────────────────────────────
        source: '/(.*)',
        headers: [
          // Prevent clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // Prevent MIME type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Referrer policy — privacy-first
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Permissions policy — disable unnecessary APIs
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Scripts: self + inline (needed for Next.js) + Umami analytics
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://analytics.umami.is",
              // Styles: self + inline (needed for Tailwind/inline styles)
              "style-src 'self' 'unsafe-inline'",
              // Images: self + data URIs
              "img-src 'self' data: blob: https:",
              // Fonts: self
              "font-src 'self'",
              // Connect: self + AI APIs + Wikipedia + YouTube oEmbed
              [
                "connect-src 'self'",
                'https://api.mistral.ai',
                'https://api.anthropic.com',
                'https://*.wikipedia.org',
                'https://www.youtube.com',
                'https://www.googleapis.com',
                'http://localhost:11434',
                'https://analytics.umami.is',
              ].join(' '),
              // Media: blob for canvas
              "media-src 'self' blob:",
              // Worker: self + blob
              "worker-src 'self' blob:",
              // Frame: none
              "frame-src 'none'",
              // Object: none
              "object-src 'none'",
            ].join('; '),
          },
        ],
      },
    ]
  },

  // Disable x-powered-by header
  poweredByHeader: false,

  // Compress responses
  compress: true,
}

module.exports = nextConfig
