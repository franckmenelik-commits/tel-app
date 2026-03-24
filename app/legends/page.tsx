'use client'

// TEL — The Experience Layer
// app/legends/page.tsx — Les 5 Croisements Fondateurs

import { useState } from 'react'
import Link from 'next/link'
import { FOUNDATIONAL_CROSSINGS } from '@/lib/legends-data'
import type { InsightCard as InsightCardType } from '@/lib/types'

// ─── Design tokens ────────────────────────────────────────────────────────────
const CARD_BG = '#111113'
const BORDER = 'rgba(255,255,255,0.047)'
const GOLD = '#C9A84C'
const TEXT_PRIMARY = '#e0e0e0'
const TEXT_MUTED = '#555'
const TEXT_FAINT = '#333'

// ─── Source type labels ───────────────────────────────────────────────────────
const SOURCE_LABELS: Record<string, string> = {
  book: 'Document', article: 'Article', free_text: 'Témoignage',
  academic: 'Académique', fiction: 'Fiction', testimony: 'Témoignage',
  youtube: 'YouTube', wikipedia: 'Wikipedia', podcast: 'Podcast',
  crossing: 'Croisement ×', unknown: 'Source',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateShortId(): string {
  return Math.random().toString(36).slice(2, 10)
}

function storeSharedInsight(id: string, insight: InsightCardType): void {
  try {
    localStorage.setItem(`tel:shared:${id}`, JSON.stringify({
      ...insight,
      createdAt: insight.createdAt instanceof Date
        ? insight.createdAt.toISOString()
        : insight.createdAt,
    }))
  } catch { /* ok */ }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: TEXT_PRIMARY, opacity: 0.4, marginBottom: '12px' }}>
      {children}
    </p>
  )
}

function Divider() {
  return <div style={{ height: '1px', background: 'rgba(255,255,255,0.031)', margin: '24px 0' }} />
}

function GhostBtn({
  onClick, children, loading = false, gold = false, title,
}: {
  onClick: () => void
  children: React.ReactNode
  loading?: boolean
  gold?: boolean
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      title={title}
      style={{
        padding: '7px 14px',
        fontSize: '12px',
        borderRadius: '6px',
        cursor: loading ? 'not-allowed' : 'pointer',
        background: gold ? GOLD : 'transparent',
        border: gold ? 'none' : `1px solid rgba(255,255,255,0.071)`,
        color: gold ? '#09090b' : TEXT_MUTED,
        fontWeight: gold ? 500 : 400,
        transition: 'all 200ms ease',
        letterSpacing: '0.03em',
      }}
      onMouseEnter={e => {
        if (loading) return
        if (gold) { e.currentTarget.style.background = '#d4b05a' }
        else { e.currentTarget.style.background = 'rgba(255,255,255,0.031)'; e.currentTarget.style.color = TEXT_PRIMARY }
      }}
      onMouseLeave={e => {
        if (gold) { e.currentTarget.style.background = GOLD }
        else { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = TEXT_MUTED }
      }}
    >
      {loading ? '…' : children}
    </button>
  )
}

// ─── LegendCard ───────────────────────────────────────────────────────────────

function LegendCard({ card, index }: { card: InsightCardType; index: number }) {
  const [scriptLoading, setScriptLoading] = useState(false)
  const [scriptText, setScriptText] = useState<string | null>(null)
  const [scriptOpen, setScriptOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)

  const num = String(index + 1).padStart(3, '0')

  const handleScript = async () => {
    setScriptLoading(true)
    try {
      const res = await fetch('/api/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insight: card }),
      })
      const data = await res.json()
      setScriptText(data.script || data.error || 'Erreur lors de la génération.')
      setScriptOpen(true)
    } catch {
      setScriptText('Erreur réseau.')
      setScriptOpen(true)
    } finally {
      setScriptLoading(false)
    }
  }

  const handlePresenter = () => {
    const id = generateShortId()
    storeSharedInsight(id, card)
    window.open(`/i/${id}`, '_blank')
  }

  const handleShare = async () => {
    const id = generateShortId()
    storeSharedInsight(id, card)
    const url = `${window.location.origin}/i/${id}`
    try {
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 3000)
    } catch { window.prompt('Copiez ce lien :', url) }
  }

  const handleCopyScript = async () => {
    if (!scriptText) return
    try {
      await navigator.clipboard.writeText(scriptText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch { window.prompt('Copiez le script :', scriptText) }
  }

  return (
    <article
      id={`legend-${num}`}
      style={{
        background: CARD_BG,
        border: `1px solid ${BORDER}`,
        borderRadius: '12px',
        padding: '36px 40px',
        marginBottom: '32px',
      }}
    >
      {/* Card header */}
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '11px', color: GOLD, letterSpacing: '0.2em', opacity: 0.8, marginBottom: '12px' }}>
          LÉGENDE {num}
        </p>
        <h2
          style={{
            fontFamily: 'Georgia, Times New Roman, serif',
            fontWeight: 400,
            fontSize: '22px',
            lineHeight: 1.3,
            color: '#ffffff',
            fontStyle: 'italic',
          }}
        >
          {card.theme}
        </h2>
      </div>

      {/* Sources */}
      <div style={{ marginBottom: '28px' }}>
        <Label>Sources croisées</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {card.sources.map((src, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                padding: '10px 14px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER}`,
              }}
            >
              <span style={{
                flexShrink: 0, fontSize: '10px', padding: '2px 8px', borderRadius: '4px',
                background: 'rgba(255,255,255,0.025)', color: '#555',
                border: `1px solid ${BORDER}`, letterSpacing: '0.06em', whiteSpace: 'nowrap',
              }}>
                {SOURCE_LABELS[src.type] || src.type}
              </span>
              <div>
                <p style={{ fontSize: '14px', color: TEXT_PRIMARY, marginBottom: '2px' }}>{src.title}</p>
                <p style={{ fontSize: '11px', color: TEXT_FAINT }}>{src.geographicContext}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Divider />

      {/* Pattern */}
      <div style={{ marginBottom: '28px' }}>
        <Label>Le pattern révélé</Label>
        <p className="tel-serif" style={{ fontSize: '15px', lineHeight: 1.8, color: TEXT_PRIMARY, whiteSpace: 'pre-wrap' }}>
          {card.revealedPattern}
        </p>
      </div>

      <Divider />

      {/* Convergences */}
      <div style={{ marginBottom: '28px' }}>
        <Label>Zones de convergence</Label>
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {card.convergenceZones.map((zone, i) => (
            <li key={i} style={{ display: 'flex', gap: '12px', fontSize: '14px', lineHeight: 1.7, color: TEXT_PRIMARY }}>
              <span style={{ color: GOLD, flexShrink: 0, marginTop: '3px', fontSize: '8px' }}>◆</span>
              <span className="tel-serif">{zone}</span>
            </li>
          ))}
        </ul>
      </div>

      <Divider />

      {/* Divergences */}
      <div style={{ marginBottom: '28px' }}>
        <Label>Zones de divergence irréductible</Label>
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {card.divergenceZones.map((zone, i) => (
            <li key={i} style={{ display: 'flex', gap: '12px', fontSize: '14px', lineHeight: 1.7, color: TEXT_PRIMARY }}>
              <span style={{ color: '#6B4226', flexShrink: 0, marginTop: '3px', fontSize: '8px' }}>◇</span>
              <span className="tel-serif">{zone}</span>
            </li>
          ))}
        </ul>

        {/* Ce que TEL refuse de réconcilier */}
        {card.irreconcilable && (
          <div style={{
            marginTop: '20px',
            padding: '16px 20px',
            borderLeft: `2px solid ${GOLD}`,
            background: 'rgba(201,168,76,0.03)',
            borderRadius: '0 8px 8px 0',
          }}>
            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: GOLD, opacity: 0.7, marginBottom: '8px' }}>
              Ce que TEL refuse de réconcilier
            </p>
            <p className="tel-serif" style={{ fontSize: '14px', lineHeight: 1.75, color: TEXT_PRIMARY }}>
              {card.irreconcilable}
            </p>
          </div>
        )}
      </div>

      <Divider />

      {/* L'indicible */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ padding: '18px', borderRadius: '8px', background: 'rgba(255,255,255,0.015)', border: `1px solid ${BORDER}` }}>
          <Label>L&apos;indicible</Label>
          <p className="tel-italic" style={{ fontSize: '14px', lineHeight: 1.8, color: TEXT_MUTED }}>
            &ldquo;{card.theUnspeakable}&rdquo;
          </p>
        </div>
      </div>

      {/* La question */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ padding: '18px', borderRadius: '8px', background: 'rgba(201,168,76,0.03)', border: '1px solid rgba(201,168,76,0.12)' }}>
          <Label>Question que personne n&apos;a encore posée</Label>
          <p className="tel-italic" style={{ fontSize: '15px', lineHeight: 1.85, color: '#e8e8e8' }}>
            {card.questionNoOneHasAsked}
          </p>
        </div>
      </div>

      {/* Ce que ça permet */}
      {card.actionables && (
        <>
          <Divider />
          <div style={{ marginBottom: '28px' }}>
            <div style={{ padding: '18px', borderRadius: '8px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(80,140,80,0.12)' }}>
              <Label>Ce que ça permet</Label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { icon: '◉', label: 'Individu', text: card.actionables.individu, color: GOLD },
                  { icon: '◈', label: 'Chercheur · Praticien', text: card.actionables.chercheur, color: '#7AABB5' },
                  { icon: '◆', label: 'Institution · Collectif', text: card.actionables.institution, color: '#9898CC' },
                ].map(({ icon, label, text, color }) => (
                  <div key={label} style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ color, flexShrink: 0, marginTop: '3px', fontSize: '10px' }}>{icon}</span>
                    <div>
                      <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: TEXT_FAINT, marginBottom: '4px' }}>{label}</p>
                      <p className="tel-serif" style={{ fontSize: '14px', lineHeight: 1.7, color: TEXT_PRIMARY }}>{text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '11px', color: '#444', marginTop: '16px', lineHeight: 1.6 }}>
                Cette Insight Card est une version publique. Les versions institutionnelles incluent scénarios d&apos;action et recommandations ciblées.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Action buttons */}
      <Divider />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        <GhostBtn onClick={handleScript} loading={scriptLoading} title="Générer un script vidéo 3-4 min">
          ▶ Script vidéo
        </GhostBtn>
        <GhostBtn onClick={handlePresenter} title="Ouvrir la page Living Insight">
          ⊞ Présenter
        </GhostBtn>
        <GhostBtn onClick={() => window.print()} title="Exporter en PDF">
          ▣ PDF
        </GhostBtn>
        <GhostBtn onClick={handleShare} title="Copier le lien de partage">
          {shareCopied ? '✓ Lien copié' : '⊕ Partager'}
        </GhostBtn>
      </div>

      {/* Script modal */}
      {scriptOpen && scriptText && (
        <div style={{
          marginTop: '20px', padding: '20px', borderRadius: '8px',
          background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <Label>Script vidéo</Label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <GhostBtn onClick={handleCopyScript}>
                {copied ? '✓ Copié' : 'Copier'}
              </GhostBtn>
              <GhostBtn onClick={() => setScriptOpen(false)}>×</GhostBtn>
            </div>
          </div>
          <pre style={{
            fontFamily: 'Georgia, Times New Roman, serif',
            fontSize: '13px', lineHeight: 1.8, color: '#cccccc',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {scriptText}
          </pre>
        </div>
      )}
    </article>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LegendsPage() {
  return (
    <main style={{ background: '#09090b', minHeight: '100vh', color: TEXT_PRIMARY }}>

      {/* Header */}
      <header style={{ padding: '20px 40px', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link
            href="/"
            style={{
              fontWeight: 500, fontSize: '15px', letterSpacing: '0.2em',
              color: '#ffffff', textTransform: 'uppercase', textDecoration: 'none',
            }}
          >
            TEL
          </Link>
          <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            {[
              { href: '/education', label: 'Éducation' },
              { href: '/manifesto', label: 'Manifeste' },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                style={{ fontSize: '12px', color: '#666', textDecoration: 'none' }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: '720px', margin: '0 auto', padding: '64px 40px 48px' }}>
        <p style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.4, marginBottom: '20px' }}>
          LOGOS · Croisements Fondateurs
        </p>
        <h1 style={{
          fontWeight: 300, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
          lineHeight: 1.2, letterSpacing: '-0.02em', color: '#ffffff', marginBottom: '16px',
        }}>
          Les Croisements Fondateurs
        </h1>
        <p style={{ fontSize: '16px', lineHeight: 1.7, color: '#666666', maxWidth: '480px' }}>
          5 révélations que TEL a produites. Aucune n&apos;existait avant.
        </p>
      </section>

      {/* Cards */}
      <section style={{ maxWidth: '720px', margin: '0 auto', padding: '0 40px 80px' }}>
        {FOUNDATIONAL_CROSSINGS.map((legend, i) => (
          <LegendCard key={legend.id} card={legend} index={i} />
        ))}
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid rgba(255,255,255,0.031)`, padding: '20px 40px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <Link href="/" style={{ fontSize: '12px', color: '#333', textDecoration: 'none' }}>
            theexperiencelayer.org
          </Link>
          <span style={{ color: '#1a1a1a', fontSize: '10px' }}>·</span>
          <Link href="/education" style={{ fontSize: '12px', color: '#333', textDecoration: 'none' }}>
            TEL Éducation
          </Link>
          <span style={{ color: '#1a1a1a', fontSize: '10px' }}>·</span>
          <Link href="/manifesto" style={{ fontSize: '12px', color: '#333', textDecoration: 'none' }}>
            Manifeste
          </Link>
        </div>
      </footer>
    </main>
  )
}
