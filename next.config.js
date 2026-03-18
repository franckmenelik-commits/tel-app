/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for Docker / Coolify deployment
  output: 'standalone',

  experimental: {
    serverComponentsExternalPackages: ['youtube-transcript', 'cheerio'],
  },

  // Disable x-powered-by header
  poweredByHeader: false,

  // Compress responses
  compress: true,

  async headers() {
    const isProd = process.env.NODE_ENV === 'production'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://theexperiencelayer.org'

    // Build connect-src: common APIs + Ollama only in dev
    const connectSrc = [
      "'self'",
      'https://api.mistral.ai',
      'https://api.anthropic.com',
      'https://*.wikipedia.org',
      'https://www.youtube.com',
      'https://www.googleapis.com',
      'https://analytics.umami.is',
      // Ollama local only allowed in dev to avoid mixed-content warnings
      ...(isProd ? [] : ['http://localhost:11434']),
    ].join(' ')

    // script-src: unsafe-eval needed only in dev (Next.js hot reload uses eval)
    const scriptSrc = isProd
      ? "'self' 'unsafe-inline' https://analytics.umami.is"
      : "'self' 'unsafe-inline' 'unsafe-eval'"

    const csp = [
      "default-src 'self'",
      `script-src ${scriptSrc}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      `connect-src ${connectSrc}`,
      "media-src 'self' blob:",
      "worker-src 'self' blob:",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')

    return [
      {
        // API routes — CORS
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: isProd ? appUrl : '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
          // SSE — disable buffering at Next.js level
          { key: 'X-Accel-Buffering', value: 'no' },
          { key: 'Cache-Control', value: 'no-cache, no-transform' },
        ],
      },
      {
        // All pages — security headers
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ]
  },
}

module.exports = nextConfig
