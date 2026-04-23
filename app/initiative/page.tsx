'use client'

// TEL — The Experience Layer
// app/initiative/page.tsx — Transformez un problème en plan d'action

import { useState, useRef, useEffect } from 'react'
import { useLanguage, t } from '@/lib/i18n'
import type { InitiativeReport } from '@/app/api/initiative/route'

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG      = '#09090b'
const SURFACE = '#111113'
const BORDER  = 'rgba(255,255,255,0.071)'
const GOLD    = '#C9A84C'
const TEXT1   = '#e0e0e0'
const TEXT2   = '#888888'
const TEXT3   = '#444444'

// ─── Checkbox ─────────────────────────────────────────────────────────────────
function Check({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      onClick={onChange}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
      }}
    >
      <div style={{
        width: '16px', height: '16px', minWidth: '16px',
        borderRadius: '4px',
        border: `1.5px solid ${checked ? GOLD : 'rgba(255,255,255,0.2)'}`,
        background: checked ? GOLD : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 150ms ease',
      }}>
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="#09090b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <span style={{ fontSize: '13px', color: TEXT2, fontFamily: 'system-ui, sans-serif' }}>{label}</span>
    </button>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, color = GOLD, children }: { title: string; color?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: SURFACE,
      border: `1px solid ${BORDER}`,
      borderLeft: `3px solid ${color}`,
      borderRadius: '12px',
      padding: '24px 28px',
      marginBottom: '16px',
    }}>
      <p style={{
        fontSize: '10px', letterSpacing: '0.12em', color,
        fontFamily: 'system-ui, sans-serif', fontWeight: 600,
        textTransform: 'uppercase', marginBottom: '16px',
      }}>{title}</p>
      {children}
    </div>
  )
}

// ─── Body text ────────────────────────────────────────────────────────────────
function Body({ children, size = 14 }: { children: React.ReactNode; size?: number }) {
  return (
    <p style={{
      fontSize: `${size}px`, color: TEXT1, lineHeight: 1.7,
      fontFamily: 'Georgia, serif',
    }}>{children}</p>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: '11px', color: TEXT3, letterSpacing: '0.08em',
      fontFamily: 'system-ui, sans-serif', textTransform: 'uppercase',
      marginBottom: '4px',
    }}>{children}</p>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function InitiativePage() {
  const [probleme, setProbleme]   = useState('')
  const [precedents, setPrecedents]   = useState(true)
  const [perspectives, setPerspectives] = useState(true)
  const [loading, setLoading]     = useState(false)
  const [msgIdx, setMsgIdx]       = useState(0)
  const [msgVisible, setMsgVisible] = useState(true)
  const [report, setReport]       = useState<InitiativeReport | null>(null)
  const [error, setError]         = useState('')
  const msgTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const [lang] = useLanguage()

  const LOADING_MSGS = [
    t('init.loading.1', lang),
    t('init.loading.2', lang),
    t('init.loading.3', lang),
    t('init.loading.4', lang),
    t('init.loading.5', lang),
  ]

  const startMsgRotation = () => {
    setMsgIdx(0)
    let i = 0
    msgTimer.current = setInterval(() => {
      setMsgVisible(false)
      setTimeout(() => {
        i = (i + 1) % LOADING_MSGS.length
        setMsgIdx(i)
        setMsgVisible(true)
      }, 300)
    }, 2200)
  }

  const stopMsgRotation = () => {
    if (msgTimer.current) { clearInterval(msgTimer.current); msgTimer.current = null }
  }

  const handleSubmit = async () => {
    if (!probleme.trim() || probleme.trim().length < 30) {
      setError(t('init.error', lang))
      return
    }
    // Collision animation
    const form = document.querySelector('.tel-initiative-form')
    if (form) {
      form.classList.remove('tel-bubble-collide')
      void (form as HTMLElement).offsetWidth
      form.classList.add('tel-bubble-collide')
    }

    setError('')
    setReport(null)
    setLoading(true)
    startMsgRotation()

    try {
      const res = await fetch('/api/initiative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          probleme: probleme.trim(),
          cherchePrecedents: precedents,
          generePerspecives: perspectives,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Erreur serveur')
      setReport(data.report)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue.')
    } finally {
      setLoading(false)
      stopMsgRotation()
    }
  }

  const handleReset = () => {
    setReport(null)
    setError('')
    setProbleme('')
  }

  // ── Export helpers ──────────────────────────────────────────────────────────
  const handleShare = async () => {
    if (!report) return
    try {
      await navigator.share?.({
        title: 'TEL Initiative',
        text: `Problème : ${probleme}\n\nDiagnostic : ${report.diagnostic.reformulation}`,
        url: window.location.href,
      })
    } catch { /* ok — share not supported */ }
  }

  const handleVideoScript = () => {
    if (!report) return
    const script = [
      `SCRIPT VIDÉO — TEL Initiative`,
      ``,
      `[ACCROCHE — 0-5s]`,
      `${report.diagnostic.enjeuCentral}`,
      ``,
      `[CONTEXTE — 5-30s]`,
      `${report.diagnostic.reformulation}`,
      ``,
      `[DONNÉES — 30-45s]`,
      `${report.diagnostic.donnees}`,
      ``,
      `[PRÉCÉDENTS — 45-90s]`,
      ...report.precedents.map(p => `• ${p.titre} (${p.pays}, ${p.annee}) : ${p.description}`),
      ``,
      `[APPEL À L'ACTION — 90-120s]`,
      `${report.argumentsParAudience.citoyen}`,
      ``,
      `[PREMIÈRES ÉTAPES]`,
      ...report.premieresEtapes.map(e => `${e.numero}. ${e.action} — ${e.delai}${e.contact ? ` (${e.contact})` : ''}`),
      ``,
      `[COALITION — APPEL À LA COLLABORATION]`,
      ...report.coalitionPotentielle.map(c => `• ${c.nom} (${c.pays})${c.lien ? ` — ${c.lien}` : ''} : ${c.description}`),
    ].join('\n')

    const blob = new Blob([script], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'tel-initiative-script.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  const handlePDF = () => {
    window.print()
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT1 }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        padding: '16px 24px', borderBottom: `1px solid ${BORDER}`,
        background: BG, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: '15px', fontWeight: 500, color: TEXT1, letterSpacing: '0.05em' }}>TEL</span>
        </a>
        {report && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handlePDF} style={ghostBtn}>PDF</button>
            <button onClick={handleShare} style={ghostBtn}>{t('init.share', lang)}</button>
            <button onClick={handleVideoScript} style={ghostBtn}>{t('init.script', lang)}</button>
            <button onClick={handleReset} style={{ ...ghostBtn, color: TEXT3, borderColor: TEXT3 }}>{t('init.new', lang)}</button>
          </div>
        )}
      </div>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Title */}
        <div style={{ marginBottom: '48px', textAlign: 'center' }}>
          <p style={{
            fontSize: '10px', letterSpacing: '0.18em', color: GOLD,
            fontFamily: 'system-ui, sans-serif', fontWeight: 600,
            textTransform: 'uppercase', marginBottom: '12px',
          }}>{t('init.title', lang)}</p>
          <h1 style={{
            fontSize: 'clamp(26px, 4vw, 38px)',
            fontWeight: 300, color: TEXT1,
            fontFamily: 'Georgia, serif',
            letterSpacing: '-0.02em', lineHeight: 1.2,
            marginBottom: '12px',
          }}>
            {t('init.heading', lang).split('\n').map((line, i) => i === 0 ? <span key={i}>{line}<br /></span> : <span key={i}>{line}</span>)}
          </h1>
          <p style={{ fontSize: '14px', color: TEXT2, fontFamily: 'system-ui, sans-serif', lineHeight: 1.6 }}>
            {t('init.desc', lang)}
          </p>
        </div>

        {/* Form */}
        {!report && (
          <div className="tel-initiative-form tel-bubble-filled">
            <textarea
              value={probleme}
              onChange={e => setProbleme(e.target.value)}
              placeholder={t('init.placeholder', lang)}
              rows={6}
              style={{
                width: '100%', padding: '18px', borderRadius: '12px',
                background: SURFACE, border: `1px solid ${BORDER}`,
                color: TEXT1, fontSize: '14px', lineHeight: 1.7,
                fontFamily: 'Georgia, serif',
                resize: 'vertical', outline: 'none',
                transition: 'border-color 200ms ease',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.35)' }}
              onBlur={e => { e.currentTarget.style.borderColor = BORDER }}
              disabled={loading}
            />
          </div>

            {/* Options */}
            <div style={{
              display: 'flex', gap: '24px', flexWrap: 'wrap',
              margin: '16px 0 24px',
            }}>
              <Check
                checked={precedents}
                onChange={() => setPrecedents(v => !v)}
                label={t('init.check.prec', lang)}
              />
              <Check
                checked={perspectives}
                onChange={() => setPerspectives(v => !v)}
                label={t('init.check.persp', lang)}
              />
            </div>

            {/* CTA */}
            <button
              onClick={handleSubmit}
              disabled={loading || !probleme.trim()}
              style={{
                width: '100%', padding: '16px',
                background: loading || !probleme.trim() ? 'rgba(201,168,76,0.15)' : GOLD,
                color: loading || !probleme.trim() ? GOLD : '#09090b',
                border: 'none', borderRadius: '10px',
                fontSize: '14px', fontWeight: 600,
                fontFamily: 'system-ui, sans-serif',
                cursor: loading || !probleme.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 200ms ease',
              }}
            >
              {loading ? LOADING_MSGS[msgIdx] : t('init.launch', lang)}
            </button>

            {error && (
              <p style={{ color: '#e05c5c', fontSize: '13px', marginTop: '12px', fontFamily: 'system-ui, sans-serif' }}>
                {error}
              </p>
            )}

            {/* Loading animation */}
            {loading && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '6px', marginTop: '20px',
                opacity: msgVisible ? 1 : 0, transition: 'opacity 300ms ease',
              }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: '5px', height: '5px', borderRadius: '50%',
                    background: GOLD, opacity: 0.6,
                    animation: `loadingDot 1.4s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Results ────────────────────────────────────────────────────────── */}
        {report && (
          <div>
            {/* Problem recap */}
            <div style={{
              padding: '16px 20px', background: 'rgba(201,168,76,0.05)',
              border: `1px solid rgba(201,168,76,0.15)`, borderRadius: '10px',
              marginBottom: '32px',
            }}>
              <p style={{ fontSize: '11px', color: GOLD, letterSpacing: '0.1em', fontFamily: 'system-ui, sans-serif', textTransform: 'uppercase', marginBottom: '6px' }}>{t('init.problem', lang)}</p>
              <p style={{ fontSize: '13px', color: TEXT2, fontFamily: 'Georgia, serif', lineHeight: 1.6 }}>{probleme}</p>
            </div>

            {/* 1 — DIAGNOSTIC */}
            <Section title={t('init.s1', lang)}>
              <Body size={15}>{report.diagnostic.reformulation}</Body>
              <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <Label>{t('init.s1.central', lang)}</Label>
                  <Body size={13}>{report.diagnostic.enjeuCentral}</Body>
                </div>
                <div>
                  <Label>{t('init.s1.affected', lang)}</Label>
                  <Body size={13}>{report.diagnostic.populationsAffectees}</Body>
                </div>
              </div>
              {report.diagnostic.donnees && (
                <div style={{ marginTop: '16px', padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: `2px solid ${GOLD}` }}>
                  <Label>{t('init.s1.data', lang)}</Label>
                  <Body size={13}>{report.diagnostic.donnees}</Body>
                </div>
              )}
            </Section>

            {/* 2 — PRÉCÉDENTS */}
            <Section title={t('init.s2', lang)} color="#4A9EFF">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {report.precedents.map((p, i) => (
                  <div key={i} style={{
                    padding: '16px', background: 'rgba(255,255,255,0.025)',
                    borderRadius: '8px', border: `1px solid ${BORDER}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '13px', fontWeight: 600, color: TEXT1,
                        fontFamily: 'system-ui, sans-serif',
                      }}>{p.titre}</span>
                      <span style={{
                        fontSize: '11px', color: TEXT3, fontFamily: 'system-ui, sans-serif',
                        background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '20px',
                      }}>{p.pays} · {p.annee}</span>
                      {p.notoriete === 'obscur' && (
                        <span style={{
                          fontSize: '10px', color: '#4A7CC9', fontFamily: 'system-ui, sans-serif',
                          fontWeight: 600, letterSpacing: '0.08em',
                          background: 'rgba(74,124,201,0.12)', padding: '2px 7px', borderRadius: '20px',
                          border: '1px solid rgba(74,124,201,0.25)',
                          textTransform: 'uppercase',
                        }}>{t('init.rare', lang)}</span>
                      )}
                    </div>
                    <Body size={13}>{p.description}</Body>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '11px', color: '#00B894', fontFamily: 'system-ui, sans-serif', fontWeight: 600, marginTop: '1px', whiteSpace: 'nowrap' }}>{t('init.s2.result', lang)}</span>
                      <Body size={13}>{p.resultat}</Body>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* 3 — PERSPECTIVES MANQUANTES */}
            <Section title={t('init.s3', lang)} color="#E84393">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {report.perspectivesManquantes.map((pv, i) => (
                  <div key={i} style={{
                    padding: '14px 16px', background: 'rgba(232,67,147,0.04)',
                    border: `1px solid rgba(232,67,147,0.12)`, borderRadius: '8px',
                  }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#E84393', fontFamily: 'system-ui, sans-serif', marginBottom: '6px' }}>
                      {pv.voix}
                    </p>
                    <Body size={13}>{pv.silence}</Body>
                    <p style={{ fontSize: '12px', color: TEXT3, fontFamily: 'system-ui, sans-serif', marginTop: '6px', fontStyle: 'italic' }}>
                      {t('init.s3.angle', lang)} {pv.angle}
                    </p>
                  </div>
                ))}
              </div>
            </Section>

            {/* 4 — ARGUMENTS PAR AUDIENCE */}
            <Section title={t('init.s4', lang)} color="#6C5CE7">
              {(
                [
                  { key: 'depute',    label: t('init.s4.a1', lang) },
                  { key: 'media',     label: t('init.s4.a2', lang) },
                  { key: 'fondation', label: t('init.s4.a3', lang) },
                  { key: 'citoyen',   label: t('init.s4.a4', lang) },
                ] as const
              ).map(({ key, label }) => (
                <div key={key} style={{ marginBottom: '20px' }}>
                  <p style={{
                    fontSize: '12px', color: '#6C5CE7', fontFamily: 'system-ui, sans-serif',
                    fontWeight: 600, marginBottom: '8px',
                  }}>{label}</p>
                  <Body size={13}>{report.argumentsParAudience[key]}</Body>
                </div>
              ))}
            </Section>

            {/* 5 — PREMIÈRES ÉTAPES */}
            <Section title={t('init.s5', lang)} color="#00B894">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {report.premieresEtapes.map((e, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: '16px', alignItems: 'flex-start',
                    padding: '14px 16px', background: 'rgba(0,184,148,0.04)',
                    border: `1px solid rgba(0,184,148,0.12)`, borderRadius: '8px',
                  }}>
                    <span style={{
                      fontSize: '18px', fontWeight: 300, color: '#00B894',
                      fontFamily: 'Georgia, serif', minWidth: '28px', lineHeight: 1,
                    }}>{e.numero}</span>
                    <div style={{ flex: 1 }}>
                      <Body size={13}>{e.action}</Body>
                      <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#00B894', fontFamily: 'system-ui, sans-serif' }}>⏱ {e.delai}</span>
                        <span style={{ fontSize: '11px', color: TEXT3, fontFamily: 'system-ui, sans-serif' }}>🔧 {e.ressources}</span>
                        {e.contact && e.contact.trim() && e.contact !== '...' && (
                          e.contact.startsWith('http') ? (
                            <a
                              href={e.contact}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontSize: '11px', color: '#00B894',
                                fontFamily: 'system-ui, sans-serif',
                                textDecoration: 'underline', textUnderlineOffset: '2px',
                              }}
                            >→ {e.contact.replace(/^https?:\/\//, '')}</a>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#00B894', fontFamily: 'system-ui, sans-serif' }}>→ {e.contact}</span>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* 6 — COALITION POTENTIELLE */}
            {report.coalitionPotentielle?.length > 0 && (
              <Section title={t('init.s6', lang)} color="#C9A84C">
                <p style={{ fontSize: '12px', color: TEXT3, fontFamily: 'system-ui, sans-serif', marginBottom: '16px' }}>
                  {t('init.s6.desc', lang)}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {report.coalitionPotentielle.map((c, i) => (
                    <div key={i} style={{
                      padding: '16px', background: 'rgba(201,168,76,0.04)',
                      border: `1px solid rgba(201,168,76,0.15)`, borderRadius: '8px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        <div>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: TEXT1, fontFamily: 'system-ui, sans-serif' }}>
                            {c.nom}
                          </span>
                          <span style={{ fontSize: '11px', color: TEXT3, fontFamily: 'system-ui, sans-serif', marginLeft: '10px' }}>
                            {c.pays}
                          </span>
                        </div>
                        {c.lien && c.lien.startsWith('http') && (
                          <a
                            href={c.lien}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: '11px', color: GOLD, fontFamily: 'system-ui, sans-serif',
                              textDecoration: 'none',
                              padding: '4px 10px',
                              border: `1px solid rgba(201,168,76,0.3)`,
                              borderRadius: '20px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {t('init.s6.visit', lang)}
                          </a>
                        )}
                      </div>
                      <Body size={13}>{c.description}</Body>
                      <p style={{
                        fontSize: '12px', color: GOLD, fontFamily: 'system-ui, sans-serif',
                        marginTop: '8px', fontStyle: 'italic',
                      }}>
                        {t('init.s6.why', lang)} {c.pourquoi}
                      </p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Export bar */}
            <div style={{
              display: 'flex', gap: '10px', justifyContent: 'center',
              marginTop: '40px', flexWrap: 'wrap',
            }}>
              <button onClick={handlePDF} style={solidBtn}>{t('init.export', lang)}</button>
              <button onClick={handleShare} style={ghostBtn}>{t('init.share', lang)}</button>
              <button onClick={handleVideoScript} style={ghostBtn}>{t('init.script', lang)}</button>
              <button onClick={handleReset} style={{ ...ghostBtn, color: TEXT3, borderColor: TEXT3 }}>
                {t('init.new', lang)}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes loadingDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
        @media print {
          button, nav { display: none !important; }
          body { background: white !important; color: black !important; }
        }
      `}</style>
    </div>
  )
}

// ─── Button styles ────────────────────────────────────────────────────────────
const ghostBtn: React.CSSProperties = {
  padding: '9px 18px', background: 'transparent',
  border: `1px solid rgba(255,255,255,0.15)`,
  borderRadius: '8px', color: '#888',
  fontSize: '12px', fontFamily: 'system-ui, sans-serif',
  cursor: 'pointer', transition: 'all 200ms ease',
}

const solidBtn: React.CSSProperties = {
  padding: '9px 20px', background: GOLD,
  border: 'none', borderRadius: '8px', color: '#09090b',
  fontSize: '12px', fontWeight: 600,
  fontFamily: 'system-ui, sans-serif',
  cursor: 'pointer', transition: 'all 200ms ease',
}
