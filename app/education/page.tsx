'use client'

// TEL — The Experience Layer
// /education — TEL Éducation : perspectives culturelles pour enseignants

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage, t } from '@/lib/i18n'

// ─── Constants ────────────────────────────────────────────────────────────────

const ORIGINS_LIST = [
  'Cameroun', 'Haïti', 'France', 'Algérie', 'Maroc', 'Sénégal', "Côte d'Ivoire",
  'Congo', 'Liban', 'Chine', 'Japon', 'Corée', 'Inde', 'Vietnam', 'Mexique',
  'Colombie', 'Brésil', 'Russie', 'Ukraine', 'Turquie', 'Iran', 'Italie',
  'Allemagne', 'Canada anglophone', 'États-Unis',
]


// ─── Types ────────────────────────────────────────────────────────────────────

interface PerspectiveCard {
  origine: string
  titre: string
  perspective: string[]
  revelation: string
  tension?: string
}

interface EducationResult {
  cartes: PerspectiveCard[]
  questionsDialogue: string[]
  anglesMortsProgramme: string[]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#C9A84C', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.2em' }}>
      {children}
    </p>
  )
}

function Divider() {
  return (
    <div className="my-8 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.12), transparent)' }} />
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EducationPage() {
  const router = useRouter()
  const [lang] = useLanguage()

  const LOADING_MSGS = [
    t('edu.loading.1', lang),
    t('edu.loading.2', lang),
    t('edu.loading.3', lang),
    t('edu.loading.4', lang),
  ]

  const NIVEAUX = [
    { value: 'Primaire',       label: t('edu.level.primary', lang) },
    { value: 'Secondaire',     label: t('edu.level.secondary', lang) },
    { value: 'Cégep / Lycée',  label: t('edu.level.cegep', lang) },
    { value: 'Universitaire',  label: t('edu.level.university', lang) },
  ]

  // Form state
  const [sujet, setSujet] = useState('')
  const [selectedOrigins, setSelectedOrigins] = useState<string[]>([])
  const [autreText, setAutreText] = useState('')
  const [showAutre, setShowAutre] = useState(false)
  const [niveau, setNiveau] = useState('')

  // Loading state
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0)
  const [loadingMsgVisible, setLoadingMsgVisible] = useState(true)

  // Result state
  const [result, setResult] = useState<EducationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Export state
  const [scriptModal, setScriptModal] = useState<string | null>(null)
  const [scriptCopied, setScriptCopied] = useState(false)
  const [shareToast, setShareToast] = useState(false)

  // ── Loading rotation ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading) return
    setLoadingMsgIndex(0)
    setLoadingMsgVisible(true)
    const interval = setInterval(() => {
      setLoadingMsgVisible(false)
      setTimeout(() => {
        setLoadingMsgIndex(i => (i + 1) % LOADING_MSGS.length)
        setLoadingMsgVisible(true)
      }, 300)
    }, 2200)
    return () => clearInterval(interval)
  }, [isLoading])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const toggleOrigin = (origin: string) => {
    setSelectedOrigins(prev =>
      prev.includes(origin) ? prev.filter(o => o !== origin) : [...prev, origin]
    )
  }

  const addAutre = () => {
    const trimmed = autreText.trim()
    if (trimmed && !selectedOrigins.includes(trimmed)) {
      setSelectedOrigins(prev => [...prev, trimmed])
      setAutreText('')
      setShowAutre(false)
    }
  }

  const allOrigins = [...selectedOrigins.filter(o => !ORIGINS_LIST.includes(o))]
  const selectedSet = new Set(selectedOrigins)

  const handleSubmit = async () => {
    if (!sujet.trim()) { setError(t('edu.error.subject', lang)); return }
    if (selectedOrigins.length < 2) { setError(t('edu.error.origins', lang)); return }
    if (!niveau) { setError(t('edu.error.level', lang)); return }
    setError(null)
    setIsLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/education', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sujet: sujet.trim(), origines: selectedOrigins, niveau }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`)
      if (!data.cartes) throw new Error('Réponse inattendue du serveur.')
      setResult(data as EducationResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsLoading(false)
    }
  }

  const buildPedagogicalScript = (): string => {
    if (!result) return ''
    const lines: string[] = []
    lines.push(`SCRIPT PÉDAGOGIQUE — ${sujet}`)
    lines.push(`Niveau : ${niveau}`)
    lines.push(`Origines représentées : ${selectedOrigins.join(', ')}`)
    lines.push('')
    lines.push('─────────────────────────────')
    lines.push('PERSPECTIVES PAR ORIGINE')
    lines.push('─────────────────────────────')
    result.cartes.forEach(carte => {
      lines.push('')
      lines.push(`[ ${carte.origine.toUpperCase()} ]`)
      lines.push(carte.titre)
      carte.perspective.forEach(p => lines.push(p))
      lines.push(`Révélation : ${carte.revelation}`)
      if (carte.tension) lines.push(`Point de tension : ${carte.tension}`)
    })
    lines.push('')
    lines.push('─────────────────────────────')
    lines.push('QUESTIONS POUR LA CLASSE')
    lines.push('─────────────────────────────')
    result.questionsDialogue.forEach((q, i) => lines.push(`${i + 1}. ${q}`))
    lines.push('')
    lines.push('─────────────────────────────')
    lines.push('ANGLES MORTS DU PROGRAMME')
    lines.push('─────────────────────────────')
    result.anglesMortsProgramme.forEach(a => lines.push(`- ${a}`))
    lines.push('')
    lines.push('Généré par TEL Éducation — theexperiencelayer.org')
    return lines.join('\n')
  }

  const handleGenerateScript = async () => {
    const script = buildPedagogicalScript()
    setScriptModal(script)
  }

  const handleShare = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      setShareToast(true)
      setTimeout(() => setShareToast(false), 3000)
    } catch {
      window.prompt('Copiez ce lien :', url)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media print {
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
        }
      `}</style>

      <main className="min-h-screen" style={{ background: '#0A0A0F', color: '#F5ECD7' }}>

        {/* ── Top bar ── */}
        <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 no-print"
          style={{ background: 'rgba(10,10,15,0.96)', borderBottom: '1px solid rgba(201,168,76,0.08)', backdropFilter: 'blur(20px)' }}>
          <button onClick={() => router.push('/')}
            className="flex items-center gap-2 text-xs transition-all duration-200"
            style={{ color: '#333', fontFamily: 'ui-monospace, monospace', background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#C9A84C' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#333' }}>
            ← TEL
          </button>
          <span className="text-xs uppercase tracking-widest" style={{ color: '#222', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.22em' }}>
            {t('edu.header', lang)}
          </span>
          <div style={{ width: '60px' }} />
        </header>

        <div className="max-w-3xl mx-auto px-6 py-14">

          {/* ── Hero ── */}
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#333', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.25em' }}>
              {t('edu.label', lang)}
            </p>
            <h1 className="text-3xl md:text-4xl mb-4" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.3 }}>
              {t('edu.title', lang)}
            </h1>
            <p className="text-base leading-relaxed" style={{ color: '#666', fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.8 }}>
              {t('edu.subtitle', lang)}
            </p>
          </div>

          {/* ── Form ── */}
          {!result && !isLoading && (
            <div className="p-6 md:p-8 rounded-2xl" style={{ background: 'rgba(10,10,15,0.92)', border: '1px solid rgba(201,168,76,0.12)', backdropFilter: 'blur(28px)' }}>

              {/* Sujet */}
              <div className="mb-7">
                <SectionLabel>{t('edu.form.subject', lang)}</SectionLabel>
                <input
                  type="text"
                  value={sujet}
                  onChange={e => setSujet(e.target.value)}
                  placeholder={t('edu.form.subject.ph', lang)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: sujet.trim() ? '1px solid rgba(201,168,76,0.3)' : '1px solid rgba(255,255,255,0.07)',
                    color: '#F5ECD7',
                    fontFamily: 'Georgia, serif',
                  }}
                  onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
                />
              </div>

              {/* Niveau */}
              <div className="mb-7">
                <SectionLabel>{t('edu.form.level', lang)}</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {NIVEAUX.map(({ value, label }) => (
                    <button key={value} onClick={() => setNiveau(value)}
                      className="px-4 py-2 rounded-lg text-xs transition-all duration-200"
                      style={{
                        background: niveau === value ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.025)',
                        border: niveau === value ? '1px solid rgba(201,168,76,0.4)' : '1px solid rgba(255,255,255,0.06)',
                        color: niveau === value ? '#C9A84C' : '#555',
                        fontFamily: 'ui-monospace, monospace',
                        cursor: 'pointer',
                      }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Origines */}
              <div className="mb-7">
                <SectionLabel>
                  {t('edu.form.origins', lang)}
                  {selectedOrigins.length >= 2 && (
                    <span style={{ color: '#555', marginLeft: '8px', letterSpacing: '0.04em' }}>
                      — {selectedOrigins.length} {t('edu.form.selected', lang)}
                    </span>
                  )}
                </SectionLabel>
                <div className="flex flex-wrap gap-2 mb-3">
                  {ORIGINS_LIST.map(origin => {
                    const selected = selectedSet.has(origin)
                    return (
                      <button key={origin} onClick={() => toggleOrigin(origin)}
                        className="px-3 py-1.5 rounded-lg text-xs transition-all duration-150"
                        style={{
                          background: selected ? 'rgba(201,168,76,0.10)' : 'rgba(255,255,255,0.02)',
                          border: selected ? '1px solid rgba(201,168,76,0.35)' : '1px solid rgba(255,255,255,0.05)',
                          color: selected ? '#C9A84C' : '#555',
                          fontFamily: 'ui-monospace, monospace',
                          cursor: 'pointer',
                        }}>
                        {origin}
                      </button>
                    )
                  })}

                  {/* Custom additions */}
                  {allOrigins.map(origin => (
                    <button key={origin} onClick={() => toggleOrigin(origin)}
                      className="px-3 py-1.5 rounded-lg text-xs transition-all duration-150"
                      style={{
                        background: 'rgba(201,168,76,0.10)',
                        border: '1px solid rgba(201,168,76,0.35)',
                        color: '#C9A84C',
                        fontFamily: 'ui-monospace, monospace',
                        cursor: 'pointer',
                      }}>
                      {origin} ×
                    </button>
                  ))}

                  {/* Autre */}
                  {showAutre ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={autreText}
                        onChange={e => setAutreText(e.target.value)}
                        placeholder={t('edu.form.other.ph', lang)}
                        autoFocus
                        className="px-3 py-1.5 rounded-lg text-xs outline-none"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.25)', color: '#F5ECD7', fontFamily: 'ui-monospace, monospace', width: '140px' }}
                        onKeyDown={e => { if (e.key === 'Enter') addAutre(); if (e.key === 'Escape') setShowAutre(false) }}
                      />
                      <button onClick={addAutre}
                        className="px-3 py-1.5 rounded-lg text-xs"
                        style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', color: '#C9A84C', fontFamily: 'ui-monospace, monospace', cursor: 'pointer' }}>
                        {t('edu.form.other.add', lang)}
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setShowAutre(true)}
                      className="px-3 py-1.5 rounded-lg text-xs transition-all duration-150"
                      style={{ background: 'rgba(255,255,255,0.015)', border: '1px dashed rgba(255,255,255,0.08)', color: '#333', fontFamily: 'ui-monospace, monospace', cursor: 'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#C9A84C'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.2)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#333'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}>
                      {t('edu.form.other.btn', lang)}
                    </button>
                  )}
                </div>
                <p className="text-xs" style={{ color: '#1f1f1f', fontFamily: 'ui-monospace, monospace' }}>
                  {t('edu.form.min', lang)}
                </p>
              </div>

              {/* Error */}
              {error && (
                <p className="text-xs text-center mb-4" style={{ color: '#8B3A3A', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                  {error}
                </p>
              )}

              {/* Submit */}
              <button onClick={handleSubmit}
                className="w-full py-4 rounded-xl text-sm uppercase tracking-widest transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(201,168,76,0.1), rgba(201,168,76,0.2))',
                  border: '1px solid rgba(201,168,76,0.35)',
                  color: '#C9A84C',
                  cursor: 'pointer',
                  letterSpacing: '0.2em',
                  fontFamily: 'Georgia, serif',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(201,168,76,0.18), rgba(201,168,76,0.32))' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(201,168,76,0.1), rgba(201,168,76,0.2))' }}>
                {t('edu.cta', lang)}
              </button>
            </div>
          )}

          {/* ── Loading ── */}
          {isLoading && (
            <div className="flex items-center justify-center" style={{ minHeight: '50vh' }}>
              <div className="text-center">
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%', margin: '0 auto 2.5rem',
                  border: '1px solid rgba(201,168,76,0.15)',
                  borderTopColor: 'rgba(201,168,76,0.55)',
                  animation: 'spin 1.2s linear infinite',
                }} />
                <p style={{
                  color: '#C9A84C', fontFamily: 'ui-monospace, monospace',
                  fontSize: '0.8rem', letterSpacing: '0.06em',
                  opacity: loadingMsgVisible ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                  minHeight: '1.4em',
                }}>
                  {LOADING_MSGS[loadingMsgIndex]}
                </p>
              </div>
            </div>
          )}

          {/* ── Result ── */}
          {result && !isLoading && (
            <div>
              {/* Reset + export bar */}
              <div className="flex items-center justify-between mb-8 no-print flex-wrap gap-3">
                <button onClick={() => { setResult(null); setError(null) }}
                  className="text-xs px-4 py-2 rounded-lg transition-all duration-200"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#555', fontFamily: 'ui-monospace, monospace', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#C9A84C'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.25)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#555'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}>
                  {t('edu.reset', lang)}
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={handleGenerateScript}
                    className="text-xs px-4 py-2 rounded-lg transition-all duration-200"
                    style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', color: '#C9A84C', fontFamily: 'ui-monospace, monospace', cursor: 'pointer' }}>
                    {t('edu.script', lang)}
                  </button>
                  <button onClick={() => window.print()}
                    className="text-xs px-4 py-2 rounded-lg transition-all duration-200"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#555', fontFamily: 'ui-monospace, monospace', cursor: 'pointer' }}>
                    PDF
                  </button>
                  <button onClick={handleShare}
                    className="text-xs px-4 py-2 rounded-lg transition-all duration-200"
                    style={{
                      background: shareToast ? 'rgba(26,107,60,0.10)' : 'rgba(255,255,255,0.03)',
                      border: shareToast ? '1px solid rgba(26,107,60,0.3)' : '1px solid rgba(255,255,255,0.07)',
                      color: shareToast ? '#1A6B3C' : '#555',
                      fontFamily: 'ui-monospace, monospace', cursor: 'pointer',
                    }}>
                    {shareToast ? t('edu.copied', lang) : t('edu.share', lang)}
                  </button>
                </div>
              </div>

              {/* Header */}
              <div className="mb-10 text-center">
                <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#333', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.2em' }}>
                  {niveau} · {selectedOrigins.length} {t('edu.perspectives', lang)}
                </p>
                <h2 className="text-2xl md:text-3xl" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#F5ECD7', lineHeight: 1.3 }}>
                  {sujet}
                </h2>
              </div>

              {/* Perspective cards */}
              <SectionLabel>{t('edu.section.perspectives', lang)}</SectionLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                {result.cartes.map((carte, i) => (
                  <div key={i} className="p-5 rounded-xl" style={{ background: '#0F0F18', border: '1px solid rgba(201,168,76,0.15)', backdropFilter: 'blur(12px)' }}>
                    {/* Origin badge */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(201,168,76,0.08)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.18)', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.06em' }}>
                        {carte.origine}
                      </span>
                    </div>

                    {/* Title */}
                    <p className="text-sm mb-3" style={{ color: '#F5ECD7', fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.5 }}>
                      {carte.titre}
                    </p>

                    {/* Perspective paragraphs */}
                    <div className="flex flex-col gap-2 mb-4">
                      {(Array.isArray(carte.perspective) ? carte.perspective : [carte.perspective]).map((p, j) => (
                        <p key={j} className="text-xs leading-relaxed" style={{ color: '#AAAAAA', fontFamily: 'Georgia, serif', lineHeight: 1.75 }}>
                          {p}
                        </p>
                      ))}
                    </div>

                    {/* Revelation */}
                    <div className="pt-3 mb-3" style={{ borderTop: '1px solid rgba(201,168,76,0.08)' }}>
                      <p className="text-xs mb-1" style={{ color: '#555', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.08em' }}>
                        {t('edu.section.reveals', lang)}
                      </p>
                      <p className="text-xs" style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.6 }}>
                        {carte.revelation}
                      </p>
                    </div>

                    {/* Tension */}
                    {carte.tension && (
                      <div className="pt-3" style={{ borderTop: '1px solid rgba(139,58,58,0.12)' }}>
                        <p className="text-xs mb-1" style={{ color: '#555', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.08em' }}>
                          {t('edu.section.tension', lang)}
                        </p>
                        <p className="text-xs" style={{ color: '#8B6A50', fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.6 }}>
                          {carte.tension}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <Divider />

              {/* Questions pour la classe */}
              <div className="mb-10">
                <SectionLabel>{t('edu.section.questions', lang)}</SectionLabel>
                <p className="text-xs mb-5" style={{ color: '#2a2a2a', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                  {t('edu.section.questions.sub', lang)}
                </p>
                <ol className="flex flex-col gap-4">
                  {result.questionsDialogue.map((q, i) => (
                    <li key={i} className="flex gap-4 p-4 rounded-xl" style={{ background: 'rgba(201,168,76,0.03)', border: '1px solid rgba(201,168,76,0.08)' }}>
                      <span style={{ color: '#C9A84C', fontFamily: 'ui-monospace, monospace', fontSize: '0.7rem', flexShrink: 0, marginTop: '2px' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <p className="text-sm leading-relaxed" style={{ color: '#DDDDDD', fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.75 }}>
                        {q}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>

              <Divider />

              {/* Angles morts du programme */}
              <div className="mb-10">
                <SectionLabel>{t('edu.section.blindspots', lang)}</SectionLabel>
                <div className="p-5 rounded-xl" style={{ background: 'rgba(139,90,43,0.06)', border: '1px solid rgba(139,90,43,0.2)' }}>
                  <ul className="flex flex-col gap-3">
                    {result.anglesMortsProgramme.map((a, i) => (
                      <li key={i} className="flex gap-3">
                        <span style={{ color: '#8B5A2B', flexShrink: 0, marginTop: '3px', fontFamily: 'ui-monospace, monospace', fontSize: '0.7rem' }}>—</span>
                        <p className="text-sm leading-relaxed" style={{ color: '#BBBBBB', fontFamily: 'Georgia, serif', lineHeight: 1.7 }}>
                          {a}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                <p className="text-xs" style={{ color: '#1a1a1a', fontFamily: 'ui-monospace, monospace' }}>
                  {t('edu.footer', lang)}
                </p>
              </div>
            </div>
          )}

        </div>

        {/* ── Script Modal ── */}
        {scriptModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print"
            style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)' }}
            onClick={e => { if (e.target === e.currentTarget) setScriptModal(null) }}
          >
            <div className="w-full max-w-2xl rounded-2xl flex flex-col" style={{ background: 'rgba(10,10,15,0.98)', border: '1px solid rgba(201,168,76,0.2)', maxHeight: '80vh' }}>
              <div className="flex items-center justify-between p-5 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-xs uppercase tracking-widest" style={{ color: '#C9A84C', fontFamily: 'ui-monospace, monospace' }}>
                  {t('edu.script.modal', lang)}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText(scriptModal)
                      setScriptCopied(true)
                      setTimeout(() => setScriptCopied(false), 2500)
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg"
                    style={{
                      background: scriptCopied ? 'rgba(26,107,60,0.15)' : 'rgba(201,168,76,0.08)',
                      border: scriptCopied ? '1px solid rgba(26,107,60,0.4)' : '1px solid rgba(201,168,76,0.25)',
                      color: scriptCopied ? '#1A6B3C' : '#C9A84C',
                      fontFamily: 'ui-monospace, monospace', cursor: 'pointer',
                    }}>
                    {scriptCopied ? t('edu.script.copied', lang) : t('edu.script.copy', lang)}
                  </button>
                  <button onClick={() => setScriptModal(null)}
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ border: '1px solid rgba(255,255,255,0.08)', color: '#444', background: 'transparent', cursor: 'pointer' }}>
                    ×
                  </button>
                </div>
              </div>
              <div className="p-5 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(201,168,76,0.2) transparent' }}>
                <pre className="text-sm whitespace-pre-wrap" style={{ color: '#CCCCCC', fontFamily: 'ui-monospace, monospace', lineHeight: 1.8, fontSize: '0.78rem' }}>
                  {scriptModal}
                </pre>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
