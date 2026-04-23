'use client'

// TEL — The Experience Layer
// app/transparency/[slug]/page.tsx — Rapport d'audit partagé

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { TransparencyReport } from '@/app/api/audit/route'

const GOLD = '#C9A84C'
const BG = '#09090b'
const SURFACE = '#111113'
const BORDER = 'rgba(255,255,255,0.047)'
const TEXT_PRIMARY = '#e0e0e0'
const TEXT_MUTED = '#555555'

const RISK_CONFIG: Record<string, { color: string; label: string }> = {
  faible:   { color: '#4CAF50', label: 'RISQUE FAIBLE' },
  modéré:   { color: '#FF9800', label: 'RISQUE MODÉRÉ' },
  élevé:    { color: '#FF5722', label: 'RISQUE ÉLEVÉ' },
  critique: { color: '#F44336', label: 'RISQUE CRITIQUE' },
}

function ReportSection({ label, content, accent }: { label: string; content: string; accent?: string }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <p style={{
        fontSize: '10px', fontWeight: 600, letterSpacing: '0.15em',
        textTransform: 'uppercase' as const,
        color: accent || TEXT_MUTED, marginBottom: '12px',
        fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
      }}>
        {label}
      </p>
      <p style={{
        fontFamily: 'Georgia, Times New Roman, serif',
        fontSize: '16px', lineHeight: 1.85, color: TEXT_PRIMARY,
        whiteSpace: 'pre-wrap',
      }}>
        {content}
      </p>
    </div>
  )
}

export default function SharedAuditPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string

  const [report, setReport] = useState<TransparencyReport | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    try {
      const stored = localStorage.getItem(`tel:shared:audit:${slug}`) || localStorage.getItem(`tel:shared:transparency:${slug}`)
      if (stored) {
        setReport(JSON.parse(stored) as TransparencyReport)
      } else {
        setNotFound(true)
      }
    } catch {
      setNotFound(true)
    }
  }, [slug])

  // Inject OG meta tags dynamically
  useEffect(() => {
    if (!report) return
    const setMeta = (prop: string, content: string) => {
      let el = document.querySelector(`meta[property="${prop}"]`) as HTMLMetaElement | null
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute('property', prop)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }
    setMeta('og:title', `Audit TEL — ${report.documentType}`)
    setMeta('og:description', report.riskSummary)
    setMeta('og:type', 'article')
    document.title = `Audit — ${report.documentType} — TEL`
  }, [report])

  if (notFound) {
    return (
      <div style={{ background: BG, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#444' }}>
        <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px', color: '#333' }}>
          TEL Audit · Lien invalide
        </p>
        <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '17px', color: '#666', marginBottom: '32px' }}>
          Ce rapport d&apos;audit n&apos;existe plus ou n&apos;a jamais existé.
        </p>
        <button onClick={() => router.push('/audit')}
          style={{ padding: '10px 24px', borderRadius: '6px', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)', color: GOLD, fontFamily: 'ui-monospace, monospace', fontSize: '12px', cursor: 'pointer' }}>
          ← TEL Audit
        </button>
      </div>
    )
  }

  if (!report) {
    return (
      <div style={{ background: BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#2a2a2a', fontFamily: 'ui-monospace, monospace', fontSize: '12px' }}>Chargement du rapport…</p>
      </div>
    )
  }

  const riskConfig = RISK_CONFIG[report.riskLevel] || RISK_CONFIG.modéré

  return (
    <main style={{ background: BG, minHeight: '100vh', color: TEXT_PRIMARY }}>

      {/* Header */}
      <header style={{ padding: '20px 40px', borderBottom: `1px solid ${BORDER}`, position: 'sticky', top: 0, background: BG, zIndex: 50 }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ fontWeight: 600, fontSize: '15px', letterSpacing: '0.2em', color: '#ffffff', textTransform: 'uppercase', textDecoration: 'none' }}>TEL</a>
          <button onClick={() => router.push('/audit')}
            style={{ fontSize: '12px', color: '#666', background: 'none', border: 'none', cursor: 'pointer', fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
            ← Audit
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '64px 40px 120px' }}>

        {/* Label */}
        <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase' as const, opacity: 0.4, color: TEXT_PRIMARY, marginBottom: '24px', fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
          The Experience Layer · Audit partagé
        </p>

        {/* Title */}
        <h1 style={{ fontFamily: 'Georgia, Times New Roman, serif', fontWeight: 400, fontSize: '28px', lineHeight: 1.3, color: '#ffffff', marginBottom: '16px' }}>
          {report.documentType}
        </h1>

        {/* Risk badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', background: `${riskConfig.color}11`, border: `1px solid ${riskConfig.color}44`, marginBottom: '48px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: riskConfig.color }} />
          <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', color: riskConfig.color, fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
            {riskConfig.label}
          </span>
          <span style={{ fontSize: '12px', color: TEXT_MUTED, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{report.riskSummary}</span>
        </div>

        {/* Sections */}
        <div style={{ background: SURFACE, borderRadius: '12px', border: `1px solid ${BORDER}`, padding: '40px' }}>
          <ReportSection label="Ce que le texte dit réellement" content={report.whatItSays} accent={GOLD} />
          <hr style={{ border: 'none', borderTop: `1px solid ${BORDER}`, margin: '32px 0' }} />
          <ReportSection label="Ce que le texte cache" content={report.whatItHides} accent="#FF9800" />
          <hr style={{ border: 'none', borderTop: `1px solid ${BORDER}`, margin: '32px 0' }} />
          <ReportSection label="Ce qui contredit les références" content={report.whatContradictsReferences} accent="#FF5722" />
          <hr style={{ border: 'none', borderTop: `1px solid ${BORDER}`, margin: '32px 0' }} />

          <div style={{ padding: '20px', borderRadius: '8px', background: 'rgba(255,255,255,0.015)', border: `1px solid ${BORDER}`, marginBottom: '32px' }}>
            <ReportSection label="L'indicible" content={report.theUnspeakable} />
          </div>

          <div style={{ padding: '20px', borderRadius: '8px', background: 'rgba(201,168,76,0.03)', border: '1px solid rgba(201,168,76,0.12)' }}>
            <ReportSection label="Question que personne ne pose" content={report.questionNoOneHasAsked} accent={GOLD} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: '11px', color: '#333', fontFamily: 'ui-monospace, monospace' }}>
            TEL Audit · theexperiencelayer.org
          </p>
          <button onClick={() => router.push('/audit')}
            style={{ fontSize: '12px', color: '#333', background: 'none', border: 'none', cursor: 'pointer' }}>
            Créer votre propre audit →
          </button>
        </div>
      </div>
    </main>
  )
}
