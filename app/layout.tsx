import type { Metadata, Viewport } from 'next'
import './globals.css'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://theexperiencelayer.org'
const UMAMI_SITE_ID = process.env.NEXT_PUBLIC_UMAMI_SITE_ID || ''

export const metadata: Metadata = {
  title: 'TEL — The Experience Layer',
  description: 'Narrative Intelligence Cross-Culturelle. Des vécus humains croisés pour révéler la sagesse collective invisible.',
  keywords: ['narrative intelligence', 'cross-cultural', 'lived experience', 'wisdom', 'TEL', 'LOGOS'],
  authors: [{ name: 'The Experience Layer' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TEL',
  },
  openGraph: {
    title: 'TEL — The Experience Layer',
    description: 'Babel a dispersé les langages. TEL rassemble les vécus.',
    url: APP_URL,
    siteName: 'The Experience Layer',
    type: 'website',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TEL — The Experience Layer',
    description: 'Babel a dispersé les langages. TEL rassemble les vécus.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0A0A0F',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* PWA */}
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-192.png" />
        <meta name="color-scheme" content="dark" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* Umami — ethical, privacy-first analytics (no cookies, no Google) */}
        {UMAMI_SITE_ID && (
          <script
            defer
            src="https://analytics.umami.is/script.js"
            data-website-id={UMAMI_SITE_ID}
          />
        )}
      </head>
      <body
        style={{
          background: '#0A0A0F',
          color: '#ffffff',
          minHeight: '100vh',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          overscrollBehavior: 'none',
        }}
      >
        {children}
      </body>
    </html>
  )
}
