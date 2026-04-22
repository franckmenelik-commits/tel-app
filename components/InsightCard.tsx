'use client'

import { useEffect, useState } from 'react'
import ConfidenceBar from './ConfidenceBar'
import type { InsightCard as InsightCardType, Resonance } from '@/lib/types'
import { t, type Lang } from '@/lib/i18n'

// ─── Constants ────────────────────────────────────────────────────────────────

const SOURCE_TYPE_STATIC: Record<string, string> = {
  youtube: 'YouTube',
  wikipedia: 'Wikipedia',
  instagram: 'Instagram',
  article: 'Article',
  podcast: 'Podcast',
  book: 'Document',
  unknown: 'Source',
}

// ─── Short-ID share helpers ────────────────────────────────────────────────────

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
  } catch { /* localStorage unavailable */ }
}

function buildGammaOutline(card: InsightCardType): string {
  const lines: string[] = []
  lines.push(`# ${card.theme}`)
  lines.push('')
  lines.push('## Sources croisées')
  ;(card.sources ?? []).forEach(s => lines.push(`- **${s.title}** — ${s.geographicContext}`))
  lines.push('')
  lines.push('## Le pattern révélé')
  lines.push(card.revealedPattern)
  lines.push('')
  lines.push('## Convergences')
  ;(card.convergenceZones ?? []).forEach(z => lines.push(`- ${z}`))
  lines.push('')
  lines.push('## Divergences irréductibles')
  ;(card.divergenceZones ?? []).forEach(z => lines.push(`- ${z}`))
  lines.push('')
  if (card.actionables) {
    lines.push('## Ce que ça permet')
    lines.push(`**Individu :** ${card.actionables.individu}`)
    lines.push('')
    lines.push(`**Chercheur :** ${card.actionables.chercheur}`)
    lines.push('')
    lines.push(`**Institution :** ${card.actionables.institution}`)
    lines.push('')
  }
  lines.push("## L'indicible")
  lines.push(`*${card.theUnspeakable}*`)
  lines.push('')
  lines.push("## La question")
  lines.push(`*${card.questionNoOneHasAsked}*`)
  lines.push('')
  lines.push('---')
  lines.push('*TEL — The Experience Layer · theexperiencelayer.org*')
  return lines.join('\n')
}

// ─── Design tokens ─────────────────────────────────────────────────────────────

const CARD_BG = '#111113'
const BORDER = 'rgba(255,255,255,0.047)'
const BORDER_SUBTLE = 'rgba(255,255,255,0.031)'
const TEXT_PRIMARY = '#e0e0e0'
const TEXT_MUTED = '#555'
const TEXT_FAINT = '#333'
const GOLD = '#C9A84C'

// ─── Props ────────────────────────────────────────────────────────────────────

interface InsightCardProps {
  card: InsightCardType
  onClose: () => void
  streaming?: boolean
  resonances?: Resonance[]
  onCombler?: (inputs: string[]) => void
  onMetaCroisement?: (ids: string[]) => void
  lang?: Lang
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: '10px',
      textTransform: 'uppercase',
      letterSpacing: '0.15em',
      color: TEXT_PRIMARY,
      opacity: 0.4,
      marginBottom: '12px',
    }}>
      {children}
    </p>
  )
}

function Divider() {
  return (
    <div style={{ height: '1px', background: BORDER_SUBTLE, margin: '24px 0' }} />
  )
}

function Section({
  children,
  index,
  visible,
}: {
  children: React.ReactNode
  index: number
  visible: boolean
}) {
  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(6px)',
      transition: `opacity 400ms ease ${index * 60}ms, transform 400ms ease ${index * 60}ms`,
    }}>
      {children}
    </div>
  )
}

// Ghost action button
function ActionBtn({
  onClick,
  loading = false,
  disabled = false,
  children,
  title,
  gold = false,
}: {
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  children: React.ReactNode
  title?: string
  gold?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      title={title}
      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs"
      style={{
        background: gold ? GOLD : 'transparent',
        border: gold ? 'none' : `1px solid rgba(255,255,255,0.071)`,
        color: gold ? '#09090b' : (loading || disabled ? TEXT_FAINT : TEXT_MUTED),
        fontWeight: gold ? 500 : 400,
        cursor: loading || disabled ? 'not-allowed' : 'pointer',
        letterSpacing: '0.04em',
        transition: 'all 200ms ease',
        textAlign: 'center',
      }}
      onMouseEnter={(e) => {
        if (!loading && !disabled) {
          if (gold) {
            e.currentTarget.style.background = '#d4b05a'
          } else {
            e.currentTarget.style.background = 'rgba(255,255,255,0.031)'
            e.currentTarget.style.color = TEXT_PRIMARY
          }
        }
      }}
      onMouseLeave={(e) => {
        if (gold) {
          e.currentTarget.style.background = GOLD
        } else {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = loading || disabled ? TEXT_FAINT : TEXT_MUTED
        }
      }}
    >
      {loading ? <span style={{ opacity: 0.35 }}>…</span> : children}
    </button>
  )
}

function SmallBtn({
  onClick,
  children,
  title,
}: {
  onClick: () => void
  children: React.ReactNode
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="text-xs px-2 py-1 rounded"
      style={{
        background: 'transparent',
        border: `1px solid rgba(255,255,255,0.071)`,
        color: TEXT_MUTED,
        cursor: 'pointer',
        transition: 'all 200ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.031)'
        e.currentTarget.style.color = TEXT_PRIMARY
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = TEXT_MUTED
      }}
    >
      {children}
    </button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function InsightCard({
  card,
  onClose,
  streaming = false,
  resonances = [],
  onCombler,
  onMetaCroisement,
  lang = 'fr',
}: InsightCardProps) {
  const L = lang  // short alias

  const SOURCE_TYPE_LABELS: Record<string, string> = {
    ...SOURCE_TYPE_STATIC,
    free_text: t('card.source.type.testimony', L),
    crossing: t('card.source.type.crossing', L),
  }

  const ANGLE_TYPE_LABELS: Record<string, string> = {
    geographique: t('card.angle.geo', L),
    temporel: t('card.angle.temporal', L),
    genre_posture: t('card.angle.gender', L),
    silence: t('card.angle.silence', L),
  }

  const SCRIPT_LOADING_MSGS = lang === 'en'
    ? ['Structuring the narrative…', 'Writing the hook…', 'Sequencing visual shots…', 'Calibrating the rhythm…', 'Formulating the open question…']
    : ['Structuration de la narration…', "Écriture de l'accroche…", 'Séquençage des plans visuels…', 'Calibrage du rythme…', 'Formulation de la question ouverte…']

  const DEBATE_LOADING_MSGS = lang === 'en'
    ? ['Building act 1…', 'Inverting the perspective…', 'Building tension…', 'Writing the open conclusion…']
    : ["Construction de l'acte 1…", 'Inversion de la perspective…', 'Mise en tension…', "Écriture de la conclusion ouverte…"]

  const COUNTER_LOADING_MSGS = lang === 'en'
    ? ['Searching contradictory perspectives…', 'Analysing pattern flaws…', 'Building the counter-argument…', 'Evaluating robustness…']
    : ['Recherche de perspectives contradictoires…', 'Analyse des failles du pattern…', 'Construction du contre-argument…', 'Évaluation de la robustesse…']
  const [visibleSections, setVisibleSections] = useState<number[]>([])

  const [isGeneratingScript, setIsGeneratingScript] = useState(false)
  const [scriptModal, setScriptModal] = useState<string | null>(null)
  const [scriptCopied, setScriptCopied] = useState(false)
  const [scriptMsgIndex, setScriptMsgIndex] = useState(0)
  const [scriptMsgVisible, setScriptMsgVisible] = useState(true)

  const [gammaCopied, setGammaCopied] = useState(false)

  const [isGeneratingCounter, setIsGeneratingCounter] = useState(false)
  const [counterInsight, setCounterInsight] = useState<string | null>(null)
  const [counterScriptLoading, setCounterScriptLoading] = useState(false)
  const [counterShareToast, setCounterShareToast] = useState(false)
  const [counterMsgIndex, setCounterMsgIndex] = useState(0)
  const [counterMsgVisible, setCounterMsgVisible] = useState(true)

  const [isGeneratingDebate, setIsGeneratingDebate] = useState(false)
  const [debateModal, setDebateModal] = useState<string | null>(null)
  const [debateCopied, setDebateCopied] = useState(false)
  const [debateMsgIndex, setDebateMsgIndex] = useState(0)
  const [debateMsgVisible, setDebateMsgVisible] = useState(true)

  const [shareToast, setShareToast] = useState(false)
  const [feedbackState, setFeedbackState] = useState<'idle' | 'resonates' | 'inaccurate'>('idle')
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!streaming) {
      setVisibleSections([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
      return
    }
    const SECTION_COUNT = 13
    let i = 0
    const interval = setInterval(() => {
      if (i < SECTION_COUNT) {
        setVisibleSections(prev => [...prev, i])
        i++
      } else {
        clearInterval(interval)
      }
    }, 120)
    return () => clearInterval(interval)
  }, [streaming])

  useEffect(() => {
    if (!isGeneratingScript) return
    setScriptMsgIndex(0); setScriptMsgVisible(true)
    const interval = setInterval(() => {
      setScriptMsgVisible(false)
      setTimeout(() => { setScriptMsgIndex(i => (i + 1) % SCRIPT_LOADING_MSGS.length); setScriptMsgVisible(true) }, 300)
    }, 2000)
    return () => clearInterval(interval)
  }, [isGeneratingScript])

  useEffect(() => {
    if (!isGeneratingDebate) return
    setDebateMsgIndex(0); setDebateMsgVisible(true)
    const interval = setInterval(() => {
      setDebateMsgVisible(false)
      setTimeout(() => { setDebateMsgIndex(i => (i + 1) % DEBATE_LOADING_MSGS.length); setDebateMsgVisible(true) }, 300)
    }, 2000)
    return () => clearInterval(interval)
  }, [isGeneratingDebate])

  useEffect(() => {
    if (!isGeneratingCounter) return
    setCounterMsgIndex(0); setCounterMsgVisible(true)
    const interval = setInterval(() => {
      setCounterMsgVisible(false)
      setTimeout(() => { setCounterMsgIndex(i => (i + 1) % COUNTER_LOADING_MSGS.length); setCounterMsgVisible(true) }, 300)
    }, 2000)
    return () => clearInterval(interval)
  }, [isGeneratingCounter])

  const date = card.createdAt instanceof Date ? card.createdAt : new Date(card.createdAt)
  const formattedDate = date.toLocaleDateString(L === 'en' ? 'en-US' : 'fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  const isVisible = (index: number) => visibleSections.includes(index)
  const anglesMorts = card.anglesMorts
  const hasAnglesMorts = anglesMorts && anglesMorts.anglesDetectes.length > 0
  const hasResonances = resonances.length > 0
  const hasActionables = !!card.actionables
  const hasPublicVoices = !!card.publicVoices && card.publicVoices.length > 0
  const hasResonanceMemory = !!card.resonanceCount && card.resonanceCount > 0

  // ── Action handlers ────────────────────────────────────────────────────────

  const handleGenerateScript = async (overrideCard?: InsightCardType) => {
    setIsGeneratingScript(true)
    try {
      const res = await fetch('/api/script', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insight: overrideCard ?? card }),
      })
      const data = await res.json()
      setScriptModal(data.script || data.error || 'Erreur lors de la génération.')
    } catch {
      setScriptModal('Erreur réseau. Réessayez.')
    } finally {
      setIsGeneratingScript(false)
    }
  }

  const handleGenerateCounter = async () => {
    setIsGeneratingCounter(true); setCounterInsight(null)
    try {
      const res = await fetch('/api/counter', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insight: card }),
      })
      const data = await res.json()
      setCounterInsight(data.counter || data.error || 'Erreur lors de la génération.')
    } catch {
      setCounterInsight('Erreur réseau. Réessayez.')
    } finally {
      setIsGeneratingCounter(false)
    }
  }

  const handleGenerateDebate = async () => {
    if (!counterInsight) return
    setIsGeneratingDebate(true); setDebateModal(null)
    try {
      const res = await fetch('/api/debate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insight: card, counter: counterInsight }),
      })
      const data = await res.json()
      setDebateModal(data.debate || data.error || 'Erreur lors de la génération.')
    } catch {
      setDebateModal('Erreur réseau. Réessayez.')
    } finally {
      setIsGeneratingDebate(false)
    }
  }

  const makeCounterCard = (): InsightCardType => ({
    ...card,
    id: `counter-${card.id}`,
    theme: `⁻ ${card.theme}`,
    revealedPattern: counterInsight ?? '',
    convergenceZones: [],
    divergenceZones: [],
    actionables: undefined,
    questionNoOneHasAsked: L === 'en'
      ? "What if this crossing is fundamentally biased?"
      : "Et si ce croisement était fondamentalement biaisé ?",
  })

  const handleCounterScript = async () => {
    if (!counterInsight) return
    setCounterScriptLoading(true)
    try {
      const res = await fetch('/api/script', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insight: makeCounterCard() }),
      })
      const data = await res.json()
      setScriptModal(data.script || data.error || 'Erreur.')
    } catch {
      setScriptModal('Erreur réseau.')
    } finally {
      setCounterScriptLoading(false)
    }
  }

  const handleCounterPresenter = () => {
    if (!counterInsight) return
    const id = generateShortId(); storeSharedInsight(id, makeCounterCard())
    window.open(`/i/${id}`, '_blank')
  }

  const handleCounterShare = async () => {
    if (!counterInsight) return
    const id = generateShortId(); storeSharedInsight(id, makeCounterCard())
    const url = `${window.location.origin}/i/${id}`
    try {
      await navigator.clipboard.writeText(url)
      setCounterShareToast(true); setTimeout(() => setCounterShareToast(false), 3000)
    } catch { window.prompt('Copiez ce lien :', url) }
  }

  const handleApprofondir = () => {
    const urls = (card.sources ?? []).map(s => s.url).filter(Boolean)
    try { sessionStorage.setItem('tel:approfondir', JSON.stringify(urls)) } catch { /* ok */ }
    onClose()
  }

  const handlePresenter = () => {
    const id = generateShortId(); storeSharedInsight(id, card)
    window.open(`/i/${id}`, '_blank')
  }

  const handleGammaExport = async () => {
    const outline = buildGammaOutline(card)
    try {
      await navigator.clipboard.writeText(outline)
      setGammaCopied(true)
      setTimeout(() => { window.open('https://gamma.app/create', '_blank') }, 1500)
      setTimeout(() => setGammaCopied(false), 5000)
    } catch { window.prompt('Contenu à coller dans Gamma :', outline) }
  }

  const handleShare = async () => {
    const id = generateShortId(); storeSharedInsight(id, card)
    const url = `${window.location.origin}/i/${id}`
    try {
      await navigator.clipboard.writeText(url)
      setShareToast(true); setTimeout(() => setShareToast(false), 3000)
    } catch { window.prompt('Copiez ce lien :', url) }
  }

  const handleCopyScript = async (text: string | null, setCopied: (v: boolean) => void) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true); setTimeout(() => setCopied(false), 2500)
    } catch { window.prompt('Copiez le script :', text) }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @media print {
          .insight-card-print { max-height: none !important; overflow: visible !important; border: none !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div
        className="w-full max-w-2xl mx-auto insight-card-print"
        style={{
          background: CARD_BG,
          border: `1px solid ${BORDER}`,
          borderRadius: '12px',
          maxHeight: '82vh',
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.06) transparent',
        }}
      >
        {/* ── Sticky header ── */}
        <div
          className="sticky top-0 z-10 flex items-start justify-between px-8 pt-6 pb-5 no-print"
          style={{ background: CARD_BG, borderBottom: `1px solid ${BORDER}` }}
        >
          <div className="flex-1 pr-4">
            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: TEXT_PRIMARY, opacity: 0.4, marginBottom: '8px' }}>
              {t('card.logos', L)}
            </p>
            <h2 className="tel-italic" style={{ fontSize: '18px', lineHeight: 1.35, color: '#ffffff' }}>
              {card.theme}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center no-print"
            style={{ border: `1px solid ${BORDER}`, color: '#444', background: 'transparent', fontSize: '1rem', cursor: 'pointer', transition: 'all 200ms ease' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = TEXT_MUTED }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = '#444' }}
            title={t('card.close', L)}
          >×</button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '28px 32px' }}>

          {/* SOURCES CROISÉES */}
          <Section index={0} visible={isVisible(0)}>
            <SectionLabel>{t('card.section.sources', L)}</SectionLabel>
            <div className="flex flex-col gap-2">
              {(card.sources ?? []).map((source, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER}` }}>
                  <span style={{ flexShrink: 0, fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.025)', color: '#666', border: `1px solid ${BORDER}`, whiteSpace: 'nowrap', letterSpacing: '0.06em' }}>
                    {SOURCE_TYPE_LABELS[source.type] || source.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate mb-1" style={{ fontSize: '14px', color: TEXT_PRIMARY }}>{source.title || source.url}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <p style={{ fontSize: '11px', color: TEXT_FAINT }}>{source.geographicContext}</p>
                      <div className="flex items-center gap-1" style={{ minWidth: '80px' }}>
                        <ConfidenceBar value={source.geographicConfidence} showValue={false} size="sm" />
                        <span style={{ fontSize: '10px', color: '#2a2a2a' }}>{source.geographicConfidence}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Divider />

          {/* RESONANCE MEMORY INDICATOR */}
          {hasResonanceMemory && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '8px 14px', borderRadius: '6px', background: 'rgba(100,100,200,0.04)', border: '1px solid rgba(100,100,200,0.1)' }}>
              <span style={{ fontSize: '12px', color: '#7777BB' }}>◈</span>
              <p style={{ fontSize: '11px', color: '#555', letterSpacing: '0.04em' }}>
                {t('card.resonances.found', L)} <span style={{ color: '#7777BB', fontWeight: 500 }}>{card.resonanceCount}</span> {t('card.resonances.in.memory', L)}
              </p>
            </div>
          )}

          {/* LA QUESTION — affichée en premier, en or, grande */}
          <Section index={1} visible={isVisible(1)}>
            <div className="tel-question-reveal" style={{ padding: '36px 28px', borderRadius: '10px', background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.15)', marginBottom: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', color: GOLD, opacity: 0.6, marginBottom: '18px', fontFamily: '-apple-system, sans-serif' }}>
                {t('card.question.label', L)}
              </p>
              <p className="tel-italic" style={{ fontSize: 'clamp(22px, 3.5vw, 28px)', lineHeight: 1.55, color: GOLD, fontFamily: 'Georgia, serif' }}>
                {card.questionNoOneHasAsked}
              </p>
            </div>

            {/* Condensed pattern preview — visible when NOT expanded */}
            {!expanded && card.revealedPattern && (
              <p style={{ fontSize: '15px', lineHeight: 1.75, color: 'rgba(255,255,255,0.55)', fontFamily: 'system-ui, sans-serif', marginBottom: '16px' }}>
                {(() => {
                  const sentences = card.revealedPattern.split(/(?<=[.!?])\s+/)
                  const preview = sentences.slice(0, 3).join(' ')
                  const words = preview.split(/\s+/)
                  return words.length > 150 ? words.slice(0, 150).join(' ') + '…' : (sentences.length > 3 ? preview + '…' : preview)
                })()}
              </p>
            )}

            <button
              onClick={() => setExpanded(v => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', fontSize: '12px', letterSpacing: '0.06em', padding: 0, transition: 'color 200ms ease' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}
            >
              {expanded ? t('card.collapse', L) : t('card.expand', L)}
            </button>
          </Section>

          {/* LE PATTERN RÉVÉLÉ — et toute la suite — visible seulement si expanded */}
          {expanded && <>
          <Divider />

          {/* LE PATTERN RÉVÉLÉ */}
          <Section index={1} visible={true}>
            <SectionLabel>{t('card.section.pattern', L)}</SectionLabel>
            <p className="tel-serif" style={{ fontSize: '15px', lineHeight: 1.75, color: TEXT_PRIMARY, whiteSpace: 'pre-wrap' }}>
              {card.revealedPattern}
            </p>
          </Section>

          <Divider />

          {/* CONVERGENCES × DIVERGENCES — SPLITVIEW */}
          <Section index={2} visible={isVisible(2)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-6">
              {/* Convergences column */}
              <div style={{ borderLeft: `2px solid rgba(201,168,76,0.25)`, paddingLeft: '16px' }}>
                <SectionLabel>{t('card.section.convergences', L)}</SectionLabel>
                <ul className="flex flex-col gap-2.5">
                  {(card.convergenceZones ?? []).map((zone, i) => (
                    <li key={i} className="flex gap-3" style={{ fontSize: '14px', lineHeight: 1.7, color: TEXT_PRIMARY }}>
                      <span style={{ color: GOLD, flexShrink: 0, marginTop: '3px', fontSize: '8px' }}>◆</span>
                      <span className="tel-serif">{zone}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visual tension separator — mobile only */}
              <div className="block md:hidden" style={{ height: '1px', background: BORDER_SUBTLE, margin: '20px 0' }} />

              {/* Divergences column */}
              <div style={{ borderLeft: '2px solid rgba(139,90,43,0.35)', paddingLeft: '16px' }}>
                <SectionLabel>{t('card.section.divergences', L)}</SectionLabel>
                <ul className="flex flex-col gap-3">
                  {(card.divergenceZones ?? []).map((zone, i) => (
                    <li key={i} className="flex gap-3 tel-divergence-item" style={{ fontSize: '14px', lineHeight: 1.7, color: TEXT_PRIMARY, borderLeft: 'none', paddingLeft: 0 }}>
                      <span style={{ color: '#8B5A2B', flexShrink: 0, marginTop: '3px', fontSize: '8px' }}>◇</span>
                      <span className="tel-serif">{zone}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* CE QUE TEL REFUSE DE RÉCONCILIER — spans full width */}
            {card.irreconcilable && (
              <div
                style={{
                  marginTop: '24px',
                  padding: '16px 20px',
                  borderLeft: `2px solid ${GOLD}`,
                  background: 'rgba(201,168,76,0.03)',
                  borderRadius: '0 8px 8px 0',
                }}
              >
                <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: GOLD, opacity: 0.7, marginBottom: '8px' }}>
                  {t('card.irreconcilable', L)}
                </p>
                <p className="tel-serif" style={{ fontSize: '14px', lineHeight: 1.75, color: TEXT_PRIMARY }}>
                  {card.irreconcilable}
                </p>
              </div>
            )}
          </Section>

          <Divider />

          {/* CONFIANCE */}
          <Section index={4} visible={isVisible(4)}>
            <SectionLabel>{t('card.section.confidence', L)}</SectionLabel>
            <ConfidenceBar value={card.globalConfidence} label={t('card.confidence.label', L)} showValue={true} size="lg" />
          </Section>

          <Divider />

          {/* GÉO */}
          <Section index={5} visible={isVisible(5)}>
            <SectionLabel>{t('card.section.geo', L)}</SectionLabel>
            <p className="tel-italic" style={{ fontSize: '14px', lineHeight: 1.75, color: TEXT_MUTED }}>
              {card.geographicRepresentativity}
            </p>
          </Section>

          <Divider />

          {/* L'INDICIBLE */}
          <Section index={6} visible={isVisible(6)}>
            <div style={{ padding: '20px', borderRadius: '8px', background: 'rgba(255,255,255,0.015)', border: `1px solid ${BORDER}` }}>
              <SectionLabel>{t('card.section.unspeakable', L)}</SectionLabel>
              <p className="tel-italic" style={{ fontSize: '14px', lineHeight: 1.8, color: TEXT_MUTED }}>
                &ldquo;{card.theUnspeakable}&rdquo;
              </p>
              <p style={{ fontSize: '11px', marginTop: '10px', color: TEXT_FAINT }}>
                — {t('card.section.unspeakable.sub', L)}
              </p>
            </div>
          </Section>

          {/* ANGLES MORTS */}
          {hasAnglesMorts && (
            <>
              <Divider />
              <Section index={8} visible={isVisible(8)}>
                <div style={{ padding: '20px', borderRadius: '8px', background: 'rgba(139,90,43,0.04)', border: '1px solid rgba(139,90,43,0.18)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <SectionLabel>{t('card.section.blindspots', L)}</SectionLabel>
                    <div style={{
                      padding: '3px 10px', borderRadius: '20px', fontSize: '11px',
                      background: anglesMorts!.scoreEquilibre >= 70 ? 'rgba(26,107,60,0.1)' : 'rgba(201,168,76,0.08)',
                      border: `1px solid ${anglesMorts!.scoreEquilibre >= 70 ? 'rgba(26,107,60,0.3)' : 'rgba(201,168,76,0.25)'}`,
                      color: anglesMorts!.scoreEquilibre >= 70 ? '#1A6B3C' : GOLD,
                    }}>
                      {t('card.section.balance', L)} {anglesMorts!.scoreEquilibre}%
                    </div>
                  </div>
                  <ul className="flex flex-col gap-3 mb-4">
                    {anglesMorts!.anglesDetectes.map((angle, i) => (
                      <li key={i} className="flex gap-3">
                        <span style={{ flexShrink: 0, fontSize: '10px', marginTop: '2px', padding: '2px 7px', borderRadius: '4px', background: 'rgba(139,90,43,0.1)', color: GOLD, border: '1px solid rgba(139,90,43,0.18)', whiteSpace: 'nowrap', letterSpacing: '0.06em' }}>
                          {ANGLE_TYPE_LABELS[angle.type] || angle.type}
                        </span>
                        <p className="tel-serif" style={{ fontSize: '14px', lineHeight: 1.7, color: '#ccc' }}>
                          {angle.description}
                          {angle.suggestion && (
                            <span className="block mt-1" style={{ fontSize: '12px', color: TEXT_MUTED, fontStyle: 'italic' }}>→ {angle.suggestion}</span>
                          )}
                        </p>
                      </li>
                    ))}
                  </ul>
                  {anglesMorts!.perspectivesManquantes.length > 0 && (
                    <div className="mb-4">
                      <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: TEXT_FAINT, marginBottom: '8px' }}>{t('card.section.missing', L)}</p>
                      <div className="flex flex-wrap gap-2">
                        {anglesMorts!.perspectivesManquantes.map((p, i) => (
                          <span key={i} style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '4px', background: 'rgba(255,255,255,0.025)', border: `1px solid ${BORDER}`, color: TEXT_MUTED, fontStyle: 'italic' }}>{p}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {anglesMorts!.questionsEvitees.length > 0 && (
                    <div className="mb-5">
                      <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: TEXT_FAINT, marginBottom: '8px' }}>{t('card.section.avoided', L)}</p>
                      <ul className="flex flex-col gap-1.5">
                        {anglesMorts!.questionsEvitees.map((q, i) => (
                          <li key={i} className="tel-italic" style={{ fontSize: '12px', lineHeight: 1.6, color: TEXT_MUTED }}>· {q}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {onCombler && (
                    <button
                      onClick={() => {
                        const inputs = [...anglesMorts!.perspectivesManquantes, ...anglesMorts!.anglesDetectes.filter(a => a.suggestion).map(a => a.suggestion!)].slice(0, 3)
                        onCombler(inputs.length > 0 ? inputs : ['perspective manquante'])
                      }}
                      className="w-full py-2.5 rounded-lg text-sm"
                      style={{ background: 'rgba(139,90,43,0.08)', border: '1px solid rgba(139,90,43,0.25)', color: GOLD, fontSize: '13px', cursor: 'pointer', transition: 'all 200ms ease' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(139,90,43,0.15)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(139,90,43,0.08)' }}
                    >
                      {t('card.fill.blindspots', L)}
                    </button>
                  )}
                </div>
              </Section>
            </>
          )}

          {/* RÉSONANCES */}
          {hasResonances && (
            <>
              <Divider />
              <Section index={9} visible={isVisible(9)}>
                <div style={{ padding: '20px', borderRadius: '8px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(100,100,200,0.12)' }}>
                  <SectionLabel>{t('card.section.resonances', L)}</SectionLabel>
                  <div className="flex flex-col gap-3">
                    {resonances.map((res, i) => (
                      <div key={i} style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.015)', border: `1px solid ${BORDER}` }}>
                        <div className="flex items-start justify-between gap-3 mb-1.5">
                          <p className="tel-italic" style={{ fontSize: '13px', color: '#AAAACC' }}>{res.themeCommun}</p>
                          <span style={{ flexShrink: 0, fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(100,100,200,0.08)', border: '1px solid rgba(100,100,200,0.18)', color: '#8888BB' }}>{res.scoreSimilarite}%</span>
                        </div>
                        <p className="tel-serif" style={{ fontSize: '12px', lineHeight: 1.6, color: TEXT_MUTED }}>{res.patternCommun}</p>
                        {onMetaCroisement && (
                          <button
                            onClick={() => onMetaCroisement([card.id, res.croisementId])}
                            style={{ marginTop: '8px', fontSize: '11px', padding: '4px 10px', borderRadius: '4px', background: 'rgba(100,100,200,0.05)', border: '1px solid rgba(100,100,200,0.15)', color: '#7777BB', cursor: 'pointer', transition: 'all 200ms ease' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(100,100,200,0.12)'; e.currentTarget.style.color = '#AAAADD' }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(100,100,200,0.05)'; e.currentTarget.style.color = '#7777BB' }}
                          >
                            {t('card.meta.crossing', L)}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </Section>
            </>
          )}

          {/* CE QUE ÇA PERMET */}
          {hasActionables && (
            <>
              <Divider />
              <Section index={10} visible={isVisible(10)}>
                <div style={{ padding: '20px', borderRadius: '8px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(80,140,80,0.12)' }}>
                  <SectionLabel>{t('card.section.actionables', L)}</SectionLabel>
                  <div className="flex flex-col gap-4">
                    {[
                      { icon: '◉', label: t('card.individual', L), text: card.actionables!.individu, color: GOLD },
                      { icon: '◈', label: t('card.researcher', L), text: card.actionables!.chercheur, color: '#7AABB5' },
                      { icon: '◆', label: t('card.institution', L), text: card.actionables!.institution, color: '#9898CC' },
                    ].map(({ icon, label, text, color }) => (
                      <div key={label} className="flex gap-3">
                        <span style={{ color, flexShrink: 0, marginTop: '3px', fontSize: '10px' }}>{icon}</span>
                        <div>
                          <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: TEXT_FAINT, marginBottom: '4px' }}>{label}</p>
                          <p className="tel-serif" style={{ fontSize: '14px', lineHeight: 1.7, color: TEXT_PRIMARY }}>{text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: '11px', color: '#444444', marginTop: '16px', lineHeight: 1.6 }}>
                    {t('card.public.disclaimer', L)}
                  </p>
                </div>
              </Section>
            </>
          )}

          {/* VOIX DU PUBLIC */}
          {hasPublicVoices && (
            <>
              <Divider />
              <Section index={11} visible={isVisible(11)}>
                <div style={{ padding: '20px', borderRadius: '8px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <SectionLabel>{t('card.section.voices', L)}</SectionLabel>
                  <p style={{ fontSize: '11px', color: '#333', fontStyle: 'italic', marginBottom: '14px' }}>
                    {t('card.voices.desc', L)}
                  </p>
                  <div className="flex flex-col gap-3">
                    {card.publicVoices!.slice(0, 2).map((voice, i) => (
                      <div key={i} style={{ padding: '12px 16px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', border: `1px solid rgba(255,255,255,0.047)` }}>
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <p style={{ fontSize: '10px', color: '#444', letterSpacing: '0.06em' }}>{voice.author || 'Anonymous'}</p>
                          {voice.likeCount > 0 && (
                            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: `1px solid rgba(255,255,255,0.06)`, color: '#444' }}>
                              ♥ {voice.likeCount}
                            </span>
                          )}
                        </div>
                        <p className="tel-serif" style={{ fontSize: '13px', lineHeight: 1.7, color: '#aaa' }}>
                          &ldquo;{voice.text.replace(/<[^>]*>/g, '').slice(0, 400)}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </Section>
            </>
          )}

          {/* end of expanded analysis */}
          </>}

          {/* UTILISER CET INSIGHT */}
          <Section index={11} visible={isVisible(11)}>
            <div className="mt-6 no-print" style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '24px' }}>
              <SectionLabel>{t('card.section.use', L)}</SectionLabel>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                <ActionBtn onClick={() => handleGenerateScript()} loading={isGeneratingScript || counterScriptLoading} title={L === 'en' ? 'Generate a 3-4 min video script' : 'Générer un script vidéo 3-4 min'}>
                  {t('card.use.script', L)}
                </ActionBtn>
                <ActionBtn onClick={handlePresenter} title={L === 'en' ? 'Open the Living Insight page' : 'Ouvrir la page Living Insight'}>
                  {t('card.use.present', L)}
                </ActionBtn>
                <ActionBtn onClick={handleGammaExport} title={L === 'en' ? 'Copy structured content for Gamma' : 'Copier le contenu structuré pour Gamma'}>
                  {gammaCopied ? t('card.gamma.copied', L) : t('card.use.gamma', L)}
                </ActionBtn>
                <ActionBtn onClick={() => window.print()} title={L === 'en' ? 'Export as PDF' : 'Exporter en PDF'}>
                  {t('card.use.pdf', L)}
                </ActionBtn>
                <ActionBtn onClick={handleApprofondir} title={L === 'en' ? 'Relaunch with same sources' : 'Relancer avec les mêmes sources'}>
                  {t('card.use.deepen', L)}
                </ActionBtn>
                <ActionBtn onClick={handleGenerateCounter} loading={isGeneratingCounter} title={L === 'en' ? 'Generate the counter-insight' : 'Générer le contre-insight'}>
                  {t('card.use.counter', L)}
                </ActionBtn>
              </div>

              {isGeneratingScript && (
                <div className="mb-3 py-2 text-center">
                  <p style={{ fontSize: '11px', color: TEXT_MUTED, opacity: scriptMsgVisible ? 1 : 0, transition: 'opacity 300ms ease' }}>
                    {SCRIPT_LOADING_MSGS[scriptMsgIndex]}
                  </p>
                </div>
              )}

              {/* Share */}
              <button
                onClick={handleShare}
                className="w-full py-2 rounded-lg"
                style={{
                  background: shareToast ? 'rgba(26,107,60,0.08)' : 'transparent',
                  border: shareToast ? '1px solid rgba(26,107,60,0.25)' : `1px solid ${BORDER}`,
                  color: shareToast ? '#1A6B3C' : TEXT_MUTED,
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  borderRadius: '6px',
                }}
                onMouseEnter={(e) => { if (!shareToast) { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.color = TEXT_PRIMARY } }}
                onMouseLeave={(e) => { if (!shareToast) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = TEXT_MUTED } }}
              >
                {shareToast ? t('card.share.copied', L) : t('card.share.label', L)}
              </button>

              {/* Feedback */}
              <div className="flex gap-2 mt-3 no-print">
                {feedbackState === 'idle' ? (
                  <>
                    <button
                      onClick={() => {
                        setFeedbackState('resonates')
                        try { localStorage.setItem(`tel:feedback:${card.id}`, JSON.stringify({ verdict: 'resonates', theme: card.theme, ts: Date.now() })) } catch { /* ok */ }
                      }}
                      style={{ flex: 1, padding: '7px', fontSize: '11px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: '6px', color: TEXT_FAINT, cursor: 'pointer', transition: 'all 200ms ease' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#1A6B3C'; e.currentTarget.style.borderColor = 'rgba(26,107,60,0.3)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = TEXT_FAINT; e.currentTarget.style.borderColor = BORDER }}
                    >
                      ◎ {t('feedback.resonates', L)}
                    </button>
                    <button
                      onClick={() => {
                        setFeedbackState('inaccurate')
                        try { localStorage.setItem(`tel:feedback:${card.id}`, JSON.stringify({ verdict: 'inaccurate', theme: card.theme, ts: Date.now() })) } catch { /* ok */ }
                      }}
                      style={{ flex: 1, padding: '7px', fontSize: '11px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: '6px', color: TEXT_FAINT, cursor: 'pointer', transition: 'all 200ms ease' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#8B3A3A'; e.currentTarget.style.borderColor = 'rgba(139,58,58,0.3)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = TEXT_FAINT; e.currentTarget.style.borderColor = BORDER }}
                    >
                      ◌ {t('feedback.inaccurate', L)}
                    </button>
                  </>
                ) : (
                  <p style={{ flex: 1, textAlign: 'center', fontSize: '11px', color: feedbackState === 'resonates' ? '#1A6B3C' : '#8B5A2B', fontStyle: 'italic', padding: '7px' }}>
                    {t('card.feedback.thanks', L)}
                  </p>
                )}
              </div>

              {/* Counter-insight panel */}
              {(isGeneratingCounter || counterInsight) && (
                <div className="mt-4 p-4 rounded-lg" style={{ background: 'rgba(80,20,20,0.15)', border: '1px solid rgba(139,58,58,0.2)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#6B3A2A', opacity: 0.8 }}>
                      {t('card.counter.label', L)}
                    </p>
                    {counterInsight && (
                      <button onClick={() => setCounterInsight(null)} style={{ fontSize: '12px', padding: '2px 8px', color: TEXT_FAINT, background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: '4px', cursor: 'pointer' }}>×</button>
                    )}
                  </div>

                  {isGeneratingCounter && !counterInsight ? (
                    <div className="text-center py-4">
                      <div className="tel-loading-dot" style={{ margin: '0 auto 12px' }} />
                      <p style={{ fontSize: '11px', color: TEXT_MUTED, opacity: counterMsgVisible ? 1 : 0, transition: 'opacity 300ms ease' }}>
                        {COUNTER_LOADING_MSGS[counterMsgIndex]}
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="tel-serif" style={{ fontSize: '14px', lineHeight: 1.8, color: '#AA8888', marginBottom: '16px', whiteSpace: 'pre-wrap' }}>
                        {counterInsight}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-3">
                        <SmallBtn onClick={handleCounterScript} title={L === 'en' ? 'Counter-insight video script' : 'Script vidéo du contre-insight'}>
                          {counterScriptLoading ? '…' : t('card.counter.script', L)}
                        </SmallBtn>
                        <SmallBtn onClick={handleCounterPresenter} title={L === 'en' ? 'Present the counter-insight' : 'Présenter le contre-insight'}>
                          {t('card.counter.present', L)}
                        </SmallBtn>
                        <SmallBtn onClick={() => window.print()} title="PDF">
                          ▣ PDF
                        </SmallBtn>
                        <SmallBtn onClick={handleCounterShare} title={L === 'en' ? 'Share the counter-insight' : 'Partager le contre-insight'}>
                          {counterShareToast ? '✓ ' + t('card.script.copied', L) : t('card.counter.share', L)}
                        </SmallBtn>
                      </div>

                      {/* Script de confrontation — gets gold bg */}
                      <ActionBtn
                        onClick={handleGenerateDebate}
                        loading={isGeneratingDebate}
                        gold={!!counterInsight && !isGeneratingDebate}
                        title={L === 'en' ? 'Generate 2-act confrontation script' : 'Générer le script de confrontation à 2 actes'}
                      >
                        {t('card.generate.debate', L)}
                      </ActionBtn>

                      {isGeneratingDebate && (
                        <div className="mt-2 text-center">
                          <p style={{ fontSize: '11px', color: TEXT_MUTED, opacity: debateMsgVisible ? 1 : 0, transition: 'opacity 300ms ease' }}>
                            {DEBATE_LOADING_MSGS[debateMsgIndex]}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </Section>

          {/* FOOTER */}
          <Section index={12} visible={isVisible(12)}>
            {/* Ethical disclaimer */}
            <p className="tel-ethics-bar">
              {L === 'en'
                ? 'This crossing is an exploration, not a truth. The divergences matter as much as the convergences.'
                : 'Ce croisement est une exploration, pas une vérité. Les divergences comptent autant que les convergences.'}
            </p>
            <div className="mt-2 pt-4 flex items-center justify-between flex-wrap gap-2" style={{ borderTop: `1px solid ${BORDER_SUBTLE}` }}>
              <p style={{ fontSize: '10px', color: '#1a1a1a' }}>{card.id}</p>
              <p style={{ fontSize: '10px', color: '#1a1a1a' }}>{formattedDate}</p>
            </div>
          </Section>

        </div>
      </div>

      {/* ── Script Modal ── */}
      {scriptModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setScriptModal(null) }}
        >
          <div className="w-full max-w-2xl rounded-xl flex flex-col" style={{ background: '#111113', border: `1px solid ${BORDER}`, maxHeight: '80vh' }}>
            <div className="flex items-center justify-between p-5 pb-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: TEXT_PRIMARY, opacity: 0.4 }}>{t('card.script.label', L)}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyScript(scriptModal, setScriptCopied)}
                  style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '6px', background: scriptCopied ? 'rgba(26,107,60,0.1)' : 'transparent', border: `1px solid ${scriptCopied ? 'rgba(26,107,60,0.3)' : BORDER}`, color: scriptCopied ? '#1A6B3C' : TEXT_MUTED, cursor: 'pointer', transition: 'all 200ms ease' }}
                >
                  {scriptCopied ? '✓ ' + t('card.script.copied', L) : t('card.script.copy', L)}
                </button>
                <button onClick={() => setScriptModal(null)} style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${BORDER}`, color: '#444', background: 'transparent', cursor: 'pointer' }}>×</button>
              </div>
            </div>
            <div className="p-5 overflow-y-auto">
              <pre className="tel-serif" style={{ fontSize: '14px', lineHeight: 1.9, color: '#ccc', whiteSpace: 'pre-wrap' }}>
                {scriptModal}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ── Debate Modal ── */}
      {debateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setDebateModal(null) }}
        >
          <div className="w-full max-w-2xl rounded-xl flex flex-col" style={{ background: '#111113', border: `1px solid ${BORDER}`, maxHeight: '80vh' }}>
            <div className="flex items-center justify-between p-5 pb-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: TEXT_PRIMARY, opacity: 0.4 }}>{t('card.debate.label', L)}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyScript(debateModal, setDebateCopied)}
                  style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '6px', background: debateCopied ? 'rgba(26,107,60,0.1)' : 'transparent', border: `1px solid ${debateCopied ? 'rgba(26,107,60,0.3)' : BORDER}`, color: debateCopied ? '#1A6B3C' : TEXT_MUTED, cursor: 'pointer', transition: 'all 200ms ease' }}
                >
                  {debateCopied ? '✓ ' + t('card.debate.copied', L) : t('card.debate.copy', L)}
                </button>
                <button onClick={() => setDebateModal(null)} style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${BORDER}`, color: '#444', background: 'transparent', cursor: 'pointer' }}>×</button>
              </div>
            </div>
            <div className="p-5 overflow-y-auto">
              <pre className="tel-serif" style={{ fontSize: '14px', lineHeight: 1.9, color: '#ccc', whiteSpace: 'pre-wrap' }}>
                {debateModal}
              </pre>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
