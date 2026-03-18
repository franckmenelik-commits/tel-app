'use client'

// TEL — The Experience Layer
// /i/[slug] — Living Insight page
// Scroll-animated presentation of a full InsightCard, with presentation mode
// and Gamma deck export.

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useRef, useCallback } from 'react'
import type { InsightCard } from '@/lib/types'

// ─── Decode slug ──────────────────────────────────────────────────────────────

function decodeInsight(slug: string): InsightCard | null {
  // Try localStorage first (short 8-char ID from share/presenter flow)
  try {
    const stored = localStorage.getItem(`tel:shared:${slug}`)
    if (stored) {
      const data = JSON.parse(stored)
      return { ...data, createdAt: new Date(data.createdAt) }
    }
  } catch { /* localStorage unavailable or not a stored insight */ }

  // Fall back to base64 decode (legacy long-URL slugs)
  try {
    const b64 = slug.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(atob(b64))
    const data = JSON.parse(json)
    return { ...data, createdAt: new Date(data.createdAt) }
  } catch {
    return null
  }
}

// ─── IntersectionObserver hook ────────────────────────────────────────────────

function useInView(threshold = 0.12): [React.RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true) },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return [ref, inView]
}

// ─── Animated block ───────────────────────────────────────────────────────────

function Block({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const [ref, inView] = useInView()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.75s ease ${delay}ms, transform 0.75s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

// ─── Presentation slide definitions ──────────────────────────────────────────

interface Slide {
  label: string
  content: string
  sublabel?: string
  large?: boolean
  italic?: boolean
}

function buildSlides(insight: InsightCard): Slide[] {
  return [
    {
      label: 'THÈME',
      content: insight.theme,
      large: true,
      italic: true,
    },
    {
      label: 'SOURCES CROISÉES',
      content: insight.sources.map(s => `${s.title}\n${s.geographicContext}`).join('\n\n'),
      sublabel: `${insight.sources.length} sources`,
    },
    {
      label: 'LE PATTERN RÉVÉLÉ',
      content: insight.revealedPattern,
    },
    {
      label: 'CONVERGENCES',
      content: insight.convergenceZones.map(z => `◆ ${z}`).join('\n\n'),
    },
    {
      label: 'DIVERGENCES IRRÉDUCTIBLES',
      content: insight.divergenceZones.map(z => `◇ ${z}`).join('\n\n'),
    },
    {
      label: "L'INDICIBLE",
      content: insight.theUnspeakable,
      italic: true,
    },
    {
      label: 'LA QUESTION QUE PERSONNE N\'A ENCORE POSÉE',
      content: insight.questionNoOneHasAsked,
      large: true,
      italic: true,
    },
    ...(insight.actionables ? [{
      label: 'CE QUE ÇA PERMET',
      content: [
        `◉ Individu\n${insight.actionables.individu}`,
        `◈ Chercheur · Praticien\n${insight.actionables.chercheur}`,
        `◆ Institution · Collectif\n${insight.actionables.institution}`,
      ].join('\n\n'),
    }] : []),
  ]
}

// ─── Gamma outline builder ────────────────────────────────────────────────────

function buildGammaOutline(insight: InsightCard): string {
  const sections: string[] = []

  sections.push(`# ${insight.theme}`)
  sections.push('')

  sections.push('## Sources croisées')
  insight.sources.forEach(s => {
    sections.push(`- **${s.title}** — ${s.geographicContext}`)
  })
  sections.push('')

  sections.push('## Le pattern révélé')
  sections.push(insight.revealedPattern)
  sections.push('')

  sections.push('## Zones de convergence')
  insight.convergenceZones.forEach(z => sections.push(`- ${z}`))
  sections.push('')

  sections.push('## Divergences irréductibles')
  insight.divergenceZones.forEach(z => sections.push(`- ${z}`))
  sections.push('')

  if (insight.actionables) {
    sections.push('## Ce que ça permet')
    sections.push(`**Individu :** ${insight.actionables.individu}`)
    sections.push('')
    sections.push(`**Chercheur :** ${insight.actionables.chercheur}`)
    sections.push('')
    sections.push(`**Institution :** ${insight.actionables.institution}`)
    sections.push('')
  }

  sections.push("## L'indicible")
  sections.push(`*${insight.theUnspeakable}*`)
  sections.push('')

  sections.push("## La question que personne n'a encore posée")
  sections.push(`*${insight.questionNoOneHasAsked}*`)
  sections.push('')

  sections.push('---')
  sections.push('*Généré par TEL — The Experience Layer · theexperiencelayer.org*')

  return sections.join('\n')
}

// ─── Presentation mode overlay ────────────────────────────────────────────────

function PresentationOverlay({
  slides,
  currentSlide,
  onNext,
  onPrev,
  onClose,
}: {
  slides: Slide[]
  currentSlide: number
  onNext: () => void
  onPrev: () => void
  onClose: () => void
}) {
  const slide = slides[currentSlide]

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault()
        onNext()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        onPrev()
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onNext, onPrev, onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'rgba(4,4,8,0.98)' }}
    >
      {/* Top bar */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-4"
        style={{ borderBottom: '1px solid rgba(201,168,76,0.08)' }}
      >
        <span
          className="text-xs uppercase tracking-widest"
          style={{ color: '#333', fontFamily: 'ui-monospace, monospace' }}
        >
          LOGOS · Insight Card
        </span>
        <div className="flex items-center gap-4">
          <span
            className="text-xs"
            style={{ color: '#333', fontFamily: 'ui-monospace, monospace' }}
          >
            {currentSlide + 1} / {slides.length}
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#444',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-12 py-20 w-full max-w-4xl text-center">
        <p
          className="text-xs uppercase tracking-widest mb-6"
          style={{ color: '#444', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.25em' }}
        >
          {slide.label}
        </p>
        {slide.sublabel && (
          <p
            className="text-xs mb-4"
            style={{ color: '#333', fontFamily: 'ui-monospace, monospace' }}
          >
            {slide.sublabel}
          </p>
        )}
        <p
          style={{
            color: '#F5ECD7',
            fontFamily: 'Georgia, serif',
            fontStyle: slide.italic ? 'italic' : 'normal',
            fontSize: slide.large ? '1.65rem' : '1.05rem',
            lineHeight: slide.large ? 1.4 : 1.85,
            whiteSpace: 'pre-wrap',
            maxWidth: '720px',
          }}
        >
          {slide.content}
        </p>
      </div>

      {/* Navigation */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-8 py-5"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        <button
          onClick={onPrev}
          disabled={currentSlide === 0}
          className="flex items-center gap-2 text-xs transition-all duration-200"
          style={{
            color: currentSlide === 0 ? '#1a1a1a' : '#444',
            fontFamily: 'ui-monospace, monospace',
            background: 'none',
            border: 'none',
            cursor: currentSlide === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          ← Précédent
        </button>

        {/* Progress dots */}
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <div
              key={i}
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: i === currentSlide
                  ? '#C9A84C'
                  : 'rgba(255,255,255,0.1)',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>

        <button
          onClick={onNext}
          disabled={currentSlide === slides.length - 1}
          className="flex items-center gap-2 text-xs transition-all duration-200"
          style={{
            color: currentSlide === slides.length - 1 ? '#1a1a1a' : '#C9A84C',
            fontFamily: 'ui-monospace, monospace',
            background: 'none',
            border: 'none',
            cursor: currentSlide === slides.length - 1 ? 'not-allowed' : 'pointer',
          }}
        >
          Suivant →
        </button>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LivingInsightPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string

  const [insight, setInsight] = useState<InsightCard | null>(null)
  const [error, setError] = useState(false)
  const [presentationMode, setPresentationMode] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [gammaCopied, setGammaCopied] = useState(false)
  const [shareToast, setShareToast] = useState(false)

  useEffect(() => {
    if (!slug) return
    const decoded = decodeInsight(slug)
    if (decoded) {
      setInsight(decoded)
      document.title = `${decoded.theme} — TEL`
    } else {
      setError(true)
    }
  }, [slug])

  const slides = insight ? buildSlides(insight) : []

  const handleNext = useCallback(() => {
    setCurrentSlide(p => Math.min(p + 1, slides.length - 1))
  }, [slides.length])

  const handlePrev = useCallback(() => {
    setCurrentSlide(p => Math.max(p - 1, 0))
  }, [])

  const handleGammaExport = async () => {
    if (!insight) return
    const outline = buildGammaOutline(insight)
    try {
      await navigator.clipboard.writeText(outline)
      setGammaCopied(true)
      setTimeout(() => { window.open('https://gamma.app/create', '_blank') }, 1500)
      setTimeout(() => setGammaCopied(false), 5000)
    } catch {
      window.prompt('Copiez ce contenu dans Gamma.app :', outline)
    }
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

  // ── Error state ────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-8"
        style={{ background: '#050508', color: '#444' }}
      >
        <p
          className="text-xs uppercase tracking-widest mb-4"
          style={{ fontFamily: 'ui-monospace, monospace', color: '#333' }}
        >
          LOGOS · Lien invalide
        </p>
        <p
          className="text-lg mb-8"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#666' }}
        >
          Ce lien ne correspond à aucun insight valide.
        </p>
        <button
          onClick={() => router.push('/')}
          className="text-xs px-5 py-2.5 rounded-lg"
          style={{
            background: 'rgba(201,168,76,0.08)',
            border: '1px solid rgba(201,168,76,0.25)',
            color: '#C9A84C',
            fontFamily: 'ui-monospace, monospace',
            cursor: 'pointer',
            letterSpacing: '0.1em',
          }}
        >
          ← Retour à TEL
        </button>
      </div>
    )
  }

  // ── Loading state ──────────────────────────────────────────────────────────

  if (!insight) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#050508' }}
      >
        <p className="text-xs" style={{ color: '#2a2a2a', fontFamily: 'ui-monospace, monospace' }}>
          Décodage de l&apos;insight…
        </p>
      </div>
    )
  }

  const date = insight.createdAt instanceof Date
    ? insight.createdAt
    : new Date(insight.createdAt)

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <>
      {/* Presentation mode overlay */}
      {presentationMode && (
        <PresentationOverlay
          slides={slides}
          currentSlide={currentSlide}
          onNext={handleNext}
          onPrev={handlePrev}
          onClose={() => { setPresentationMode(false); setCurrentSlide(0) }}
        />
      )}

      <div
        className="min-h-screen"
        style={{ background: '#050508', color: '#F5ECD7' }}
      >
        {/* ── Top bar ── */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
          style={{
            background: 'rgba(5,5,8,0.95)',
            borderBottom: '1px solid rgba(201,168,76,0.08)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-xs transition-all duration-200"
            style={{
              color: '#333',
              fontFamily: 'ui-monospace, monospace',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#C9A84C')}
            onMouseLeave={e => (e.currentTarget.style.color = '#333')}
          >
            ← TEL
          </button>

          <span
            className="text-xs uppercase tracking-widest"
            style={{ color: '#222', fontFamily: 'ui-monospace, monospace' }}
          >
            LOGOS · Living Insight
          </span>

          <div className="flex items-center gap-2">
            {/* Share */}
            <button
              onClick={handleShare}
              className="text-xs px-3 py-1.5 rounded-lg transition-all duration-200"
              style={{
                background: shareToast ? 'rgba(26,107,60,0.1)' : 'rgba(255,255,255,0.03)',
                border: shareToast ? '1px solid rgba(26,107,60,0.3)' : '1px solid rgba(255,255,255,0.06)',
                color: shareToast ? '#1A6B3C' : '#444',
                fontFamily: 'ui-monospace, monospace',
                cursor: 'pointer',
              }}
            >
              {shareToast ? 'Lien copié' : 'Partager'}
            </button>

            {/* Gamma */}
            <button
              onClick={handleGammaExport}
              className="text-xs px-3 py-1.5 rounded-lg transition-all duration-200"
              style={{
                background: gammaCopied ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.03)',
                border: gammaCopied ? '1px solid rgba(201,168,76,0.4)' : '1px solid rgba(255,255,255,0.06)',
                color: gammaCopied ? '#C9A84C' : '#444',
                fontFamily: 'ui-monospace, monospace',
                cursor: 'pointer',
              }}
            >
              {gammaCopied ? 'Contenu copié — ouvrez Gamma' : 'Exporter Gamma'}
            </button>

            {/* Presentation mode */}
            <button
              onClick={() => { setCurrentSlide(0); setPresentationMode(true) }}
              className="text-xs px-3 py-1.5 rounded-lg transition-all duration-200"
              style={{
                background: 'rgba(201,168,76,0.08)',
                border: '1px solid rgba(201,168,76,0.25)',
                color: '#C9A84C',
                fontFamily: 'ui-monospace, monospace',
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(201,168,76,0.15)'
                e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(201,168,76,0.08)'
                e.currentTarget.style.borderColor = 'rgba(201,168,76,0.25)'
              }}
            >
              ⊞ Présenter
            </button>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="max-w-2xl mx-auto px-6 py-16">

          {/* Hero — theme */}
          <Block delay={0} className="mb-16 text-center">
            <p
              className="text-xs uppercase tracking-widest mb-4"
              style={{ color: '#444', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.25em' }}
            >
              LOGOS · Insight Card
            </p>
            <h1
              className="text-3xl sm:text-4xl leading-snug mb-6"
              style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#F5ECD7' }}
            >
              {insight.theme}
            </h1>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {insight.sources.map((s, i) => (
                <span
                  key={i}
                  className="text-xs px-3 py-1 rounded-full"
                  style={{
                    background: 'rgba(201,168,76,0.06)',
                    border: '1px solid rgba(201,168,76,0.15)',
                    color: '#888',
                    fontFamily: 'ui-monospace, monospace',
                  }}
                >
                  {s.title.slice(0, 50)}
                </span>
              ))}
            </div>
          </Block>

          {/* Pattern */}
          <Block delay={100} className="mb-14">
            <p
              className="text-xs uppercase tracking-widest mb-4"
              style={{ color: '#C9A84C', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.2em' }}
            >
              Le pattern révélé
            </p>
            <p
              className="text-base leading-relaxed"
              style={{
                fontFamily: 'Georgia, serif',
                color: '#DDDDDD',
                lineHeight: 1.9,
                whiteSpace: 'pre-wrap',
              }}
            >
              {insight.revealedPattern}
            </p>
          </Block>

          {/* Convergences */}
          <Block delay={150} className="mb-14">
            <p
              className="text-xs uppercase tracking-widest mb-4"
              style={{ color: '#C9A84C', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.2em' }}
            >
              Zones de convergence
            </p>
            <ul className="flex flex-col gap-3">
              {insight.convergenceZones.map((z, i) => (
                <li key={i} className="flex gap-3">
                  <span style={{ color: '#C9A84C', flexShrink: 0, marginTop: '3px' }}>◆</span>
                  <p style={{ fontFamily: 'Georgia, serif', color: '#CCCCCC', lineHeight: 1.7 }}>{z}</p>
                </li>
              ))}
            </ul>
          </Block>

          {/* Divergences */}
          <Block delay={200} className="mb-14">
            <p
              className="text-xs uppercase tracking-widest mb-4"
              style={{ color: '#C9A84C', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.2em' }}
            >
              Zones de divergence irréductible
            </p>
            <ul className="flex flex-col gap-3">
              {insight.divergenceZones.map((z, i) => (
                <li key={i} className="flex gap-3">
                  <span style={{ color: '#8B5A2B', flexShrink: 0, marginTop: '3px' }}>◇</span>
                  <p style={{ fontFamily: 'Georgia, serif', color: '#CCCCCC', lineHeight: 1.7 }}>{z}</p>
                </li>
              ))}
            </ul>
          </Block>

          {/* Confiance */}
          <Block delay={250} className="mb-14">
            <p
              className="text-xs uppercase tracking-widest mb-4"
              style={{ color: '#C9A84C', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.2em' }}
            >
              Niveau de confiance — {insight.globalConfidence}%
            </p>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${insight.globalConfidence}%`,
                  background: `linear-gradient(90deg, rgba(201,168,76,0.4), rgba(201,168,76,0.8))`,
                }}
              />
            </div>
            <p
              className="text-xs mt-3 italic"
              style={{ fontFamily: 'Georgia, serif', color: '#555' }}
            >
              {insight.geographicRepresentativity}
            </p>
          </Block>

          {/* L'indicible */}
          <Block delay={300} className="mb-14">
            <div
              className="p-8 rounded-2xl"
              style={{
                background: 'rgba(15,15,25,0.7)',
                border: '1px solid rgba(201,168,76,0.06)',
              }}
            >
              <p
                className="text-xs uppercase tracking-widest mb-4"
                style={{ color: '#333', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.2em' }}
              >
                L&apos;indicible
              </p>
              <p
                className="text-base leading-relaxed"
                style={{
                  fontFamily: 'Georgia, serif',
                  fontStyle: 'italic',
                  color: '#666',
                  lineHeight: 1.9,
                }}
              >
                &ldquo;{insight.theUnspeakable}&rdquo;
              </p>
            </div>
          </Block>

          {/* La question */}
          <Block delay={350} className="mb-14">
            <div
              className="p-8 rounded-2xl"
              style={{
                background: 'rgba(201,168,76,0.03)',
                border: '1px solid rgba(201,168,76,0.15)',
              }}
            >
              <p
                className="text-xs uppercase tracking-widest mb-4"
                style={{ color: '#C9A84C', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.2em' }}
              >
                Question que personne n&apos;a encore posée
              </p>
              <p
                className="text-xl leading-relaxed"
                style={{
                  fontFamily: 'Georgia, serif',
                  fontStyle: 'italic',
                  color: '#F5ECD7',
                  lineHeight: 1.7,
                }}
              >
                {insight.questionNoOneHasAsked}
              </p>
            </div>
          </Block>

          {/* Ce que ça permet */}
          {insight.actionables && (
            <Block delay={400} className="mb-14">
              <div
                className="p-8 rounded-2xl"
                style={{
                  background: 'rgba(12,18,12,0.6)',
                  border: '1px solid rgba(80,140,80,0.15)',
                }}
              >
                <p
                  className="text-xs uppercase tracking-widest mb-6"
                  style={{ color: '#C9A84C', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.2em' }}
                >
                  Ce que ça permet
                </p>
                <div className="flex flex-col gap-6">
                  {[
                    { icon: '◉', label: 'Individu', text: insight.actionables.individu, color: '#C9A84C' },
                    { icon: '◈', label: 'Chercheur · Praticien', text: insight.actionables.chercheur, color: '#7AABB5' },
                    { icon: '◆', label: 'Institution · Collectif', text: insight.actionables.institution, color: '#9898CC' },
                  ].map(({ icon, label, text, color }) => (
                    <div key={label} className="flex gap-4">
                      <span style={{ color, flexShrink: 0, marginTop: '3px', fontSize: '0.75rem' }}>{icon}</span>
                      <div>
                        <p
                          className="text-xs uppercase tracking-widest mb-1.5"
                          style={{ color: '#444', fontFamily: 'ui-monospace, monospace' }}
                        >
                          {label}
                        </p>
                        <p style={{ fontFamily: 'Georgia, serif', color: '#BBBBBB', lineHeight: 1.75 }}>
                          {text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Block>
          )}

          {/* Footer */}
          <Block delay={450}>
            <div
              className="pt-10 mt-10 flex flex-col sm:flex-row items-center justify-between gap-4"
              style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
            >
              <p
                className="text-xs text-center sm:text-left"
                style={{ color: '#222', fontFamily: 'ui-monospace, monospace' }}
              >
                {insight.id} · {date.toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              <p
                className="text-xs text-center sm:text-right"
                style={{ color: '#1a1a1a', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
              >
                TEL — The Experience Layer · theexperiencelayer.org
              </p>
            </div>
          </Block>

        </div>
      </div>
    </>
  )
}
