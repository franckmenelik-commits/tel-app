// TEL — The Experience Layer
// app/manifesto/page.tsx — Static manifesto page

import Link from 'next/link'

export const metadata = {
  title: 'Manifeste — TEL',
  description: "TEL n'est pas une IA. C'est une interface qui utilise l'IA pour vous redonner votre humanité.",
}

export default function ManifestoPage() {
  return (
    <main style={{ background: '#09090b', minHeight: '100vh', color: '#e0e0e0' }}>

      {/* ── Header ── */}
      <header style={{ padding: '20px 40px', borderBottom: '1px solid rgba(255,255,255,0.047)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link
            href="/"
            style={{
              fontWeight: 500,
              fontSize: '15px',
              letterSpacing: '0.2em',
              color: '#ffffff',
              textTransform: 'uppercase' as const,
              textDecoration: 'none',
            }}
          >
            TEL
          </Link>
          <nav style={{ display: 'flex', gap: '24px' }}>
            {[
              { href: '/legends', label: 'Légendes' },
              { href: '/education', label: 'Éducation' },
              { href: '/transparency', label: 'Transparence' },
              { href: '/careers', label: 'Métiers' },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                style={{ fontSize: '12px', color: '#666666', textDecoration: 'none' }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Content ── */}
      <article
        style={{
          maxWidth: '640px',
          margin: '0 auto',
          padding: '80px 40px 120px',
        }}
      >
        {/* Label */}
        <p style={{
          fontSize: '10px',
          fontWeight: 500,
          letterSpacing: '0.15em',
          textTransform: 'uppercase' as const,
          opacity: 0.4,
          color: '#e0e0e0',
          marginBottom: '48px',
        }}>
          The Experience Layer
        </p>

        {/* Title */}
        <h1 style={{
          fontFamily: 'Georgia, Times New Roman, serif',
          fontWeight: 400,
          fontSize: '32px',
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
          color: '#ffffff',
          marginBottom: '64px',
        }}>
          Manifeste
        </h1>

        {/* Body */}
        <div
          style={{
            fontFamily: 'Georgia, Times New Roman, serif',
            fontSize: '17px',
            lineHeight: 1.85,
            color: '#c8c8c8',
          }}
        >
          <p style={{ marginBottom: '32px' }}>
            TEL n&apos;est pas une IA. C&apos;est une interface qui utilise l&apos;IA pour vous redonner votre humanité.
          </p>

          <p style={{ marginBottom: '32px' }}>
            Le monde n&apos;a pas besoin de plus de vitesse. Il a besoin de plus de résonance.
          </p>

          <p style={{ marginBottom: '32px' }}>
            Babel a dispersé les langages. TEL rassemble les vécus.
          </p>

          <p style={{ marginBottom: '32px' }}>
            Nous ne vendons pas des réponses. Nous vendons la capacité à ne pas mentir.
          </p>

          <p style={{ marginBottom: '32px' }}>
            Nous ne simulons pas l&apos;humain. Nous révélons ce que l&apos;humain sait sans savoir qu&apos;il le sait.
          </p>

          <p style={{ marginBottom: '48px' }}>
            TEL est dans le système. Il refuse d&apos;en être l&apos;alibi moral.
          </p>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.047)', margin: '48px 0' }} />

          <p style={{ marginBottom: '24px', fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif', fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase' as const, opacity: 0.4 }}>
            Ce que TEL fait
          </p>

          <ul style={{ listStyle: 'none', padding: 0, marginBottom: '48px' }}>
            {[
              'Il rend visibles les tensions irréductibles sans chercher à les dissoudre.',
              'Il montre ses propres angles morts.',
              "Il s'auto-critique avant que vous ne le fassiez.",
            ].map((item, i) => (
              <li key={i} style={{ marginBottom: '16px', paddingLeft: '20px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, color: '#C9A84C', fontSize: '12px' }}>—</span>
                {item}
              </li>
            ))}
          </ul>

          <p style={{ marginBottom: '24px', fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif', fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase' as const, opacity: 0.4 }}>
            Ce que TEL ne fait pas
          </p>

          <ul style={{ listStyle: 'none', padding: 0, marginBottom: '48px' }}>
            {[
              "Il ne prétend pas réconcilier l'humanité.",
              'Il ne vend pas de la sagesse comme un produit.',
              "Il ne réduit pas un être humain à une donnée.",
              "Il ne simule pas. Il révèle.",
            ].map((item, i) => (
              <li key={i} style={{ marginBottom: '16px', paddingLeft: '20px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, color: 'rgba(255,255,255,0.2)', fontSize: '12px' }}>—</span>
                {item}
              </li>
            ))}
          </ul>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.047)', margin: '48px 0' }} />

          <p style={{ marginBottom: '32px', fontStyle: 'italic', color: '#aaaaaa' }}>
            Avant d&apos;être une donnée pour un algorithme, avant d&apos;être un dossier pour une institution, avant d&apos;être une statistique pour un gouvernement — une personne est un être humain.
          </p>

          <p style={{ color: '#888888' }}>
            TEL est construit sur ce principe. Ou il ne vaut rien.
          </p>
        </div>

        {/* Footer note */}
        <div style={{ marginTop: '80px', paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.047)' }}>
          <Link
            href="/"
            style={{
              fontSize: '12px',
              color: '#333',
              textDecoration: 'none',
              fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
            }}
          >
            ← theexperiencelayer.org
          </Link>
        </div>
      </article>
    </main>
  )
}
