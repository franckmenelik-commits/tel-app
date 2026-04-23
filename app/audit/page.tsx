'use client'

// TEL — The Experience Layer
// app/transparency/page.tsx — Audit algorithmique de textes institutionnels

import { useState, useEffect, useRef } from 'react'
import { useLanguage, t } from '@/lib/i18n'
import { REFERENCE_TEXTS } from '@/lib/reference-texts'
import { PRELOADED_AUDITS } from '@/lib/preloaded-audits'
import type { AuditReport } from '@/app/api/audit/route'

const GOLD = '#C9A84C'
const BG = '#09090b'
const SURFACE = '#111113'
const BORDER = 'rgba(255,255,255,0.047)'
const TEXT_PRIMARY = '#e0e0e0'
const TEXT_SECONDARY = '#888888'
const TEXT_MUTED = '#555555'

// ─── Section component ────────────────────────────────────────────────────────

function ReportSection({
  label,
  content,
  accent,
}: {
  label: string
  content: string
  accent?: string
}) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <p style={{
        fontSize: '10px',
        fontWeight: 600,
        letterSpacing: '0.15em',
        textTransform: 'uppercase' as const,
        color: accent || TEXT_MUTED,
        marginBottom: '12px',
        fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
      }}>
        {label}
      </p>
      <div style={{
        fontFamily: 'Georgia, Times New Roman, serif',
        fontSize: '15px',
        lineHeight: 1.85,
        color: TEXT_PRIMARY,
      }}>
        {content.split('\n').filter(Boolean).map((paragraph, i) => (
          <p key={i} style={{ marginBottom: '16px' }}>{paragraph}</p>
        ))}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AuditPage() {
  const [textToAudit, setTextToAudit] = useState('')
  const [selectedRefs, setSelectedRefs] = useState<string[]>([])
  const [freeReference, setFreeReference] = useState('')
  const [showFreeRef, setShowFreeRef] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [loadingVisible, setLoadingVisible] = useState(true)
  const [report, setReport] = useState<AuditReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [shareToast, setShareToast] = useState(false)
  const [lang] = useLanguage()

  // ─── Universal Input State ───
  const [isBookMode, setIsBookMode] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [uploading, setUploading] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const LOADING_STEPS = [
    t('audit.loading.1', lang),
    t('audit.loading.2', lang),
    t('audit.loading.3', lang),
    t('audit.loading.4', lang),
    t('audit.loading.5', lang),
  ]

  const RISK_CONFIG = {
    faible:   { color: '#4CAF50', label: t('audit.risk.low', lang) },
    modéré:   { color: '#FF9800', label: t('audit.risk.mod', lang) },
    élevé:    { color: '#FF5722', label: t('audit.risk.high', lang) },
    critique: { color: '#F44336', label: t('audit.risk.crit', lang) },
  }

  // Loading message rotation
  useEffect(() => {
    if (!loading) return
    setLoadingStep(0)
    setLoadingVisible(true)
    const interval = setInterval(() => {
      setLoadingVisible(false)
      setTimeout(() => {
        setLoadingStep(i => (i + 1) % LOADING_STEPS.length)
        setLoadingVisible(true)
      }, 300)
    }, 2400)
    return () => clearInterval(interval)
  }, [loading])

  // ─── Input Handlers ───
  const startRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      audioChunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      mr.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const formData = new FormData()
        formData.append('audio', audioBlob)
        setUploading(true)
        try {
          const res = await fetch('/api/transcribe', { method: 'POST', body: formData })
          const data = await res.json()
          if (data.text) setTextToAudit(prev => prev ? prev + '\n' + data.text : data.text)
        } catch (err) { console.error('Transcription error:', err) }
        finally { setUploading(false) }
      }
      mr.start()
      setIsRecording(true)
    } catch (err) { console.error('Mic access denied:', err) }
  }

  const handleFileUpload = async (file: File) => {
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.text) setTextToAudit(prev => prev ? prev + '\n' + data.text : data.text)
    } catch (err) { console.error('Upload error:', err) }
    finally { setUploading(false) }
  }

  // Toggle reference selection
  function toggleRef(id: string) {
    setSelectedRefs(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    )
  }

  // Audit handler
  async function handleAudit() {
    if (!textToAudit.trim() || textToAudit.trim().length < 50) {
      setError(t('audit.error.short', lang))
      return
    }
    if (selectedRefs.length === 0 && !freeReference.trim()) {
      setError(t('audit.error.noref', lang))
      return
    }

    // Collision animation
    const form = document.querySelector('.tel-audit-form')
    if (form) {
      form.classList.remove('tel-bubble-collide')
      void (form as HTMLElement).offsetWidth
      form.classList.add('tel-bubble-collide')
    }

    setError(null)
    setReport(null)
    setLoading(true)

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textToAudit,
          referenceIds: selectedRefs,
          freeReference: freeReference.trim() || undefined,
          lang,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || t('audit.error.generic', lang))
      }

      setReport(data.report)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  // Partager — génère un ID court, stocke dans localStorage, copie l'URL
  async function handleShare() {
    if (!report) return
    const id = Math.random().toString(36).slice(2, 10)
    try {
      localStorage.setItem(`tel:shared:audit:${id}`, JSON.stringify(report))
    } catch { /* localStorage plein */ }
    const url = `${window.location.origin}/audit/${id}`
    try {
      await navigator.clipboard.writeText(url)
      setShareToast(true)
      setTimeout(() => setShareToast(false), 3000)
    } catch {
      window.prompt('Copiez ce lien :', url)
    }
  }

  function handlePrint() {
    window.print()
  }

  const riskConfig = report ? RISK_CONFIG[report.riskLevel] || RISK_CONFIG.modéré : null

  return (
    <main style={{ background: BG, minHeight: '100vh', color: TEXT_PRIMARY }}>

      {/* ── Header ── */}
      <header style={{
        padding: '20px 40px',
        borderBottom: `1px solid ${BORDER}`,
        position: 'sticky',
        top: 0,
        background: BG,
        zIndex: 50,
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{
            fontWeight: 600,
            fontSize: '15px',
            letterSpacing: '0.2em',
            color: '#ffffff',
            textTransform: 'uppercase' as const,
            textDecoration: 'none',
          }}>
            TEL
          </a>
          <nav style={{ display: 'flex', gap: '24px' }}>
            {[
              { href: '/legends', label: t('nav.legends', lang) },
              { href: '/education', label: t('nav.education', lang) },
              { href: '/manifesto', label: t('nav.manifesto', lang) },
              { href: '/careers', label: t('nav.careers', lang) },
            ].map(link => (
              <a
                key={link.href}
                href={link.href}
                style={{ fontSize: '12px', color: '#666666', textDecoration: 'none' }}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '64px 40px 120px' }}>

        {/* ── Hero ── */}
        <div style={{ marginBottom: '64px' }}>
          <p style={{
            fontSize: '10px',
            fontWeight: 500,
            letterSpacing: '0.15em',
            textTransform: 'uppercase' as const,
            color: TEXT_MUTED,
            marginBottom: '24px',
            fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
          }}>
            {t('audit.header', lang)}
          </p>
          <h1 style={{
            fontFamily: 'Georgia, Times New Roman, serif',
            fontWeight: 400,
            fontSize: '36px',
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
            color: '#ffffff',
            marginBottom: '20px',
          }}>
            {t('audit.title', lang)}
          </h1>
          <p style={{
            fontFamily: 'Georgia, Times New Roman, serif',
            fontSize: '18px',
            lineHeight: 1.7,
            color: TEXT_SECONDARY,
          }}>
            {t('audit.subtitle', lang)}
          </p>
        </div>

        {/* ── Audits pré-chargés ── */}
        {!report && (
          <div style={{ marginBottom: '56px' }}>
            <p style={{
              fontSize: '10px', fontWeight: 600, letterSpacing: '0.15em',
              textTransform: 'uppercase' as const, color: TEXT_MUTED,
              marginBottom: '20px', fontFamily: '-apple-system, sans-serif',
            }}>
              {t('audit.recent', lang)}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
              {PRELOADED_AUDITS.map(audit => {
                const risk = (({ faible: '#4CAF50', modéré: '#FF9800', élevé: '#FF5722', critique: '#F44336' } as Record<string, string>)[audit.report.riskLevel]) || '#FF9800'
                return (
                  <button
                    key={audit.id}
                    onClick={() => setReport(audit.report)}
                    style={{
                      background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '12px',
                      padding: '20px', textAlign: 'left' as const, cursor: 'pointer',
                      transition: 'all 200ms ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '18px', color: GOLD }}>{audit.icon}</span>
                      <span style={{
                        fontSize: '10px', padding: '2px 8px', borderRadius: '20px',
                        background: `${risk}18`, border: `1px solid ${risk}44`,
                        color: risk, letterSpacing: '0.08em', fontFamily: 'system-ui',
                      }}>
                        {audit.report.riskLevel.toUpperCase()}
                      </span>
                    </div>
                    <p style={{ fontSize: '15px', color: '#e0e0e0', fontWeight: 500, marginBottom: '4px' }}>{audit.name}</p>
                    <p style={{ fontSize: '12px', color: TEXT_MUTED, lineHeight: 1.5 }}>{audit.subtitle}</p>
                    <p style={{ fontSize: '12px', color: '#444', marginTop: '10px', lineHeight: 1.5, fontStyle: 'italic' }}>
                      &ldquo;{audit.report.questionNoOneHasAsked.slice(0, 80)}&hellip;&rdquo;
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Form ── */}
        {!report && (
          <div className="tel-audit-form tel-bubble-filled" style={{ display: 'flex', flexDirection: 'column' as const, gap: '32px' }}>

            {/* Textarea */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase' as const,
                color: TEXT_MUTED,
                marginBottom: '12px',
                fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
              }}>
                {t('audit.label', lang)}
              </label>
              {isBookMode ? (
                <div className="flex flex-col gap-4 p-5 rounded-xl" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
                  <input
                    type="text"
                    placeholder={t('input.book.title', lang)}
                    value={textToAudit.split(' — ')[0] || ''}
                    onChange={(e) => {
                      const parts = textToAudit.split(' — ')
                      setTextToAudit(`${e.target.value} — ${parts[1] || ''} — ${parts[2] || ''}`)
                    }}
                    className="bg-transparent border-none focus:ring-0 text-lg tel-serif font-medium"
                    style={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}
                  />
                  <div className="flex gap-6">
                    <input
                      type="text"
                      placeholder={t('input.book.author', lang)}
                      value={textToAudit.split(' — ')[1] || ''}
                      onChange={(e) => {
                        const parts = textToAudit.split(' — ')
                        setTextToAudit(`${parts[0] || ''} — ${e.target.value} — ${parts[2] || ''}`)
                      }}
                      className="bg-transparent border-none focus:ring-0 text-sm tel-serif italic flex-1"
                      style={{ color: '#aaa' }}
                    />
                    <input
                      type="text"
                      placeholder={t('input.book.page', lang)}
                      value={textToAudit.split(' — ')[2] || ''}
                      onChange={(e) => {
                        const parts = textToAudit.split(' — ')
                        setTextToAudit(`${parts[0] || ''} — ${parts[1] || ''} — ${e.target.value}`)
                      }}
                      className="bg-transparent border-none focus:ring-0 text-sm tel-serif flex-1"
                      style={{ color: '#666', textAlign: 'right' }}
                    />
                  </div>
                </div>
              ) : (
                <textarea
                  value={textToAudit}
                  onChange={e => setTextToAudit(e.target.value)}
                  placeholder={t('audit.placeholder', lang)}
                  rows={12}
                  style={{
                    width: '100%',
                    background: SURFACE,
                    border: `1px solid ${BORDER}`,
                    borderRadius: '12px',
                    padding: '20px',
                    color: TEXT_PRIMARY,
                    fontFamily: 'Georgia, Times New Roman, serif',
                    fontSize: '14px',
                    lineHeight: 1.7,
                    resize: 'vertical' as const,
                    outline: 'none',
                    boxSizing: 'border-box' as const,
                    transition: 'border-color 200ms ease',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = BORDER }}
                />
              )}

              {/* Input Row Footer */}
              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={startRecording}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontSize: '10px', padding: '6px 12px', borderRadius: '100px',
                    background: isRecording ? 'rgba(232,93,74,0.1)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isRecording ? 'rgba(232,93,74,0.3)' : 'transparent'}`,
                    color: isRecording ? '#E85D4A' : '#666',
                    cursor: 'pointer', transition: 'all 200ms ease',
                    textTransform: 'uppercase', letterSpacing: '0.05em'
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  </svg>
                  <span>Vocal</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontSize: '10px', padding: '6px 12px', borderRadius: '100px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid transparent', color: '#666',
                    cursor: 'pointer', transition: 'all 200ms ease',
                    textTransform: 'uppercase', letterSpacing: '0.05em'
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  <span>Fichier</span>
                </button>

                <button
                  onClick={() => setIsBookMode(!isBookMode)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontSize: '10px', padding: '6px 12px', borderRadius: '100px',
                    background: isBookMode ? 'rgba(122,171,181,0.08)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isBookMode ? 'rgba(122,171,181,0.25)' : 'transparent'}`,
                    color: isBookMode ? '#7AABB5' : '#666',
                    cursor: 'pointer', transition: 'all 200ms ease',
                    textTransform: 'uppercase', letterSpacing: '0.05em'
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                  <span>Livre</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.pptx,.png,.jpg"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file)
                    e.target.value = ''
                  }}
                />
              </div>
              {textToAudit && (
                <p style={{ fontSize: '11px', color: TEXT_MUTED, marginTop: '8px', fontFamily: 'system-ui' }}>
                  {textToAudit.length.toLocaleString()} {t('audit.chars', lang)}
                </p>
              )}
            </div>

            {/* References */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase' as const,
                color: TEXT_MUTED,
                marginBottom: '16px',
                fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
              }}>
                {t('audit.crosswith', lang)}
              </label>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
                {REFERENCE_TEXTS.map(ref => {
                  const selected = selectedRefs.includes(ref.id)
                  return (
                    <button
                      key={ref.id}
                      onClick={() => toggleRef(ref.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '14px 16px',
                        background: selected ? 'rgba(201,168,76,0.06)' : SURFACE,
                        border: `1px solid ${selected ? 'rgba(201,168,76,0.25)' : BORDER}`,
                        borderRadius: '10px',
                        cursor: 'pointer',
                        textAlign: 'left' as const,
                        transition: 'all 150ms ease',
                        width: '100%',
                      }}
                    >
                      {/* Checkbox */}
                      <div style={{
                        width: '16px',
                        height: '16px',
                        minWidth: '16px',
                        borderRadius: '4px',
                        border: `1.5px solid ${selected ? GOLD : 'rgba(255,255,255,0.2)'}`,
                        background: selected ? GOLD : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 150ms ease',
                      }}>
                        {selected && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="#09090b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <div>
                        <p style={{
                          fontSize: '13px',
                          color: selected ? '#ffffff' : TEXT_PRIMARY,
                          fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                          fontWeight: selected ? 500 : 400,
                          marginBottom: '2px',
                        }}>
                          {ref.label}
                        </p>
                        <p style={{
                          fontSize: '11px',
                          color: TEXT_MUTED,
                          fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                        }}>
                          {ref.source}
                        </p>
                      </div>
                    </button>
                  )
                })}

                {/* Free reference toggle */}
                <button
                  onClick={() => setShowFreeRef(v => !v)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 16px',
                    background: showFreeRef ? 'rgba(201,168,76,0.06)' : SURFACE,
                    border: `1px solid ${showFreeRef ? 'rgba(201,168,76,0.25)' : BORDER}`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    textAlign: 'left' as const,
                    transition: 'all 150ms ease',
                    width: '100%',
                  }}
                >
                  <div style={{
                    width: '16px',
                    height: '16px',
                    minWidth: '16px',
                    borderRadius: '4px',
                    border: `1.5px solid ${showFreeRef ? GOLD : 'rgba(255,255,255,0.2)'}`,
                    background: showFreeRef ? GOLD : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 150ms ease',
                  }}>
                    {showFreeRef && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="#09090b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <p style={{
                    fontSize: '13px',
                    color: TEXT_PRIMARY,
                    fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                  }}>
                    {t('audit.addfree', lang)}
                  </p>
                </button>

                {showFreeRef && (
                  <textarea
                    value={freeReference}
                    onChange={e => setFreeReference(e.target.value)}
                    placeholder={t('audit.freeph', lang)}
                    rows={6}
                    style={{
                      width: '100%',
                      background: SURFACE,
                      border: `1px solid ${BORDER}`,
                      borderRadius: '10px',
                      padding: '16px',
                      color: TEXT_PRIMARY,
                      fontFamily: 'Georgia, Times New Roman, serif',
                      fontSize: '13px',
                      lineHeight: 1.7,
                      resize: 'vertical' as const,
                      outline: 'none',
                      boxSizing: 'border-box' as const,
                    }}
                  />
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <p style={{
                padding: '12px 16px',
                background: 'rgba(244,67,54,0.08)',
                border: '1px solid rgba(244,67,54,0.2)',
                borderRadius: '8px',
                color: '#ef9a9a',
                fontSize: '13px',
                fontFamily: 'system-ui',
              }}>
                {error}
              </p>
            )}

            {/* Submit */}
            <div>
              <button
                onClick={handleAudit}
                disabled={loading || !textToAudit.trim()}
                style={{
                  padding: '14px 32px',
                  background: loading || !textToAudit.trim() ? 'rgba(201,168,76,0.3)' : GOLD,
                  color: loading || !textToAudit.trim() ? 'rgba(9,9,11,0.5)' : '#09090b',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: loading || !textToAudit.trim() ? 'not-allowed' : 'pointer',
                  fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                  transition: 'all 200ms ease',
                  letterSpacing: '0.02em',
                }}
              >
                {loading ? t('audit.auditing', lang) : t('audit.audit', lang)}
              </button>
            </div>
          </div>
        )}

        {/* ── Loading state ── */}
        {loading && (
          <div style={{
            marginTop: '48px',
            padding: '40px',
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            borderRadius: '16px',
            textAlign: 'center' as const,
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              margin: '0 auto 24px',
              border: `2px solid ${BORDER}`,
              borderTopColor: GOLD,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            <p
              style={{
                fontFamily: 'Georgia, Times New Roman, serif',
                fontSize: '15px',
                color: TEXT_SECONDARY,
                opacity: loadingVisible ? 1 : 0,
                transition: 'opacity 300ms ease',
              }}
            >
              {LOADING_STEPS[loadingStep]}
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* ── Report ── */}
        {report && !loading && (
          <div>
            {/* Back button */}
            <button
              onClick={() => { setReport(null); setError(null) }}
              style={{
                background: 'none',
                border: 'none',
                color: TEXT_MUTED,
                cursor: 'pointer',
                fontSize: '12px',
                fontFamily: 'system-ui',
                padding: 0,
                marginBottom: '40px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {t('audit.back', lang)}
            </button>

            {/* Report card */}
            <div style={{
              background: SURFACE,
              border: `1px solid ${BORDER}`,
              borderRadius: '16px',
              overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{
                padding: '32px 40px',
                borderBottom: `1px solid ${BORDER}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' as const }}>
                  <div>
                    <p style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase' as const,
                      color: GOLD,
                      marginBottom: '8px',
                      fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                    }}>
                      {t('audit.audit.label', lang)}
                    </p>
                    <h2 style={{
                      fontFamily: 'Georgia, Times New Roman, serif',
                      fontWeight: 400,
                      fontSize: '22px',
                      color: '#ffffff',
                      lineHeight: 1.3,
                    }}>
                      {report.documentType}
                    </h2>
                  </div>
                  {riskConfig && (
                    <div style={{
                      padding: '6px 14px',
                      background: `${riskConfig.color}15`,
                      border: `1px solid ${riskConfig.color}40`,
                      borderRadius: '100px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <div style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: riskConfig.color,
                      }} />
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        letterSpacing: '0.12em',
                        color: riskConfig.color,
                        fontFamily: 'system-ui',
                      }}>
                        {riskConfig.label}
                      </span>
                    </div>
                  )}
                </div>
                {report.riskSummary && (
                  <p style={{
                    marginTop: '16px',
                    fontSize: '14px',
                    color: TEXT_SECONDARY,
                    fontFamily: 'Georgia, Times New Roman, serif',
                    lineHeight: 1.6,
                  }}>
                    {report.riskSummary}
                  </p>
                )}
              </div>

              {/* Sections */}
              <div style={{ padding: '40px' }}>
                <ReportSection
                  label={t('audit.says', lang)}
                  content={report.whatItSays}
                />
                <div style={{ height: '1px', background: BORDER, margin: '8px 0 32px' }} />

                <ReportSection
                  label={t('audit.hides', lang)}
                  content={report.whatItHides}
                  accent="#FF9800"
                />
                <div style={{ height: '1px', background: BORDER, margin: '8px 0 32px' }} />

                <ReportSection
                  label={t('audit.contradicts', lang)}
                  content={report.whatContradictsReferences}
                  accent="#FF5722"
                />
                <div style={{ height: '1px', background: BORDER, margin: '8px 0 32px' }} />

                {/* L'indicible */}
                <div style={{
                  padding: '20px 24px',
                  background: 'rgba(201,168,76,0.03)',
                  borderLeft: `2px solid ${GOLD}`,
                  borderRadius: '0 10px 10px 0',
                  marginBottom: '32px',
                }}>
                  <p style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase' as const,
                    color: GOLD,
                    marginBottom: '12px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                    opacity: 0.8,
                  }}>
                    {t('audit.unspeakable', lang)}
                  </p>
                  <div style={{
                    fontFamily: 'Georgia, Times New Roman, serif',
                    fontSize: '15px',
                    lineHeight: 1.85,
                    color: TEXT_PRIMARY,
                    fontStyle: 'italic',
                  }}>
                    {report.theUnspeakable.split('\n').filter(Boolean).map((p, i) => (
                      <p key={i} style={{ marginBottom: '12px' }}>{p}</p>
                    ))}
                  </div>
                </div>

                {/* Question inexposée */}
                <div style={{
                  padding: '24px',
                  background: SURFACE,
                  border: `1px solid ${BORDER}`,
                  borderRadius: '12px',
                  marginBottom: '32px',
                }}>
                  <p style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase' as const,
                    color: TEXT_MUTED,
                    marginBottom: '16px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                  }}>
                    {t('audit.question', lang)}
                  </p>
                  <p style={{
                    fontFamily: 'Georgia, Times New Roman, serif',
                    fontSize: '18px',
                    lineHeight: 1.6,
                    color: '#ffffff',
                    fontStyle: 'italic',
                  }}>
                    &ldquo;{report.questionNoOneHasAsked}&rdquo;
                  </p>
                </div>

                {/* Versions institutionnelles */}
                <p style={{ fontSize: '11px', color: '#444444', lineHeight: 1.6, marginBottom: '32px', fontFamily: 'system-ui' }}>
                  {t('audit.disclaimer', lang)}
                </p>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const }}>
                  <button
                    onClick={handlePrint}
                    style={{
                      padding: '10px 20px',
                      background: 'rgba(255,255,255,0.04)',
                      border: `1px solid ${BORDER}`,
                      borderRadius: '8px',
                      color: TEXT_PRIMARY,
                      fontSize: '12px',
                      fontFamily: 'system-ui',
                      cursor: 'pointer',
                      transition: 'background 150ms ease',
                    }}
                  >
                    PDF
                  </button>
                  <button
                    onClick={handleShare}
                    style={{
                      padding: '10px 20px',
                      background: shareToast ? 'rgba(26,107,60,0.08)' : 'rgba(255,255,255,0.04)',
                      border: shareToast ? '1px solid rgba(26,107,60,0.3)' : `1px solid ${BORDER}`,
                      borderRadius: '8px',
                      color: shareToast ? '#1A6B3C' : TEXT_PRIMARY,
                      fontSize: '12px',
                      fontFamily: 'system-ui',
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                    }}
                  >
                    {shareToast ? t('audit.copied', lang) : t('audit.share', lang)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
