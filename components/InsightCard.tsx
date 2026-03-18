'use client'

import { useEffect, useState } from 'react'
import ConfidenceBar from './ConfidenceBar'
import type { InsightCard as InsightCardType, Resonance } from '@/lib/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const SOURCE_TYPE_LABELS: Record<string, string> = {
  youtube: 'YouTube',
  wikipedia: 'Wikipedia',
  instagram: 'Instagram',
  article: 'Article',
  podcast: 'Podcast',
  book: 'Document',
  free_text: 'Témoignage',
  crossing: 'Croisement ×',
  unknown: 'Source',
}

const ANGLE_TYPE_LABELS: Record<string, string> = {
  geographique: '🌍 Géographique',
  temporel: '⏳ Temporel',
  genre_posture: '👁 Posture / Genre',
  silence: '🔇 Silence',
}

const SCRIPT_LOADING_MSGS = [
  'Structuration de la narration…',
  "Écriture de l'accroche…",
  'Séquençage des plans visuels…',
  'Calibrage du rythme…',
  'Formulation de la question ouverte…',
]

const DEBATE_LOADING_MSGS = [
  "Construction de l'acte 1…",
  'Inversion de la perspective…',
  'Mise en tension…',
  "Écriture de la conclusion ouverte…",
]

// ─── Slug builder ─────────────────────────────────────────────────────────────

function buildSlug(card: InsightCardType): string {
  try {
    const compact = {
      id: card.id,
      theme: card.theme,
      revealedPattern: card.revealedPattern.slice(0, 400),
      convergenceZones: card.convergenceZones.slice(0, 3).map(z => z.slice(0, 200)),
      divergenceZones: card.divergenceZones.slice(0, 2).map(z => z.slice(0, 200)),
      globalConfidence: card.globalConfidence,
      geographicRepresentativity: card.geographicRepresentativity.slice(0, 200),
      theUnspeakable: card.theUnspeakable.slice(0, 250),
      questionNoOneHasAsked: card.questionNoOneHasAsked.slice(0, 250),
      sources: card.sources.map(s => ({
        title: s.title.slice(0, 100),
        type: s.type,
        url: s.url,
        geographicContext: s.geographicContext,
      })),
      createdAt: card.createdAt instanceof Date
        ? card.createdAt.toISOString()
        : String(card.createdAt),
      actionables: card.actionables,
    }
    return btoa(encodeURIComponent(JSON.stringify(compact)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  } catch {
    return card.id
  }
}

// Gamma outline builder (used both in InsightCard and /i/[slug])
function buildGammaOutline(card: InsightCardType): string {
  const lines: string[] = []
  lines.push(`# ${card.theme}`)
  lines.push('')
  lines.push('## Sources croisées')
  card.sources.forEach(s => lines.push(`- **${s.title}** — ${s.geographicContext}`))
  lines.push('')
  lines.push('## Le pattern révélé')
  lines.push(card.revealedPattern)
  lines.push('')
  lines.push('## Convergences')
  card.convergenceZones.forEach(z => lines.push(`- ${z}`))
  lines.push('')
  lines.push('## Divergences irréductibles')
  card.divergenceZones.forEach(z => lines.push(`- ${z}`))
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

// ─── Props ────────────────────────────────────────────────────────────────────

interface InsightCardProps {
  card: InsightCardType
  onClose: () => void
  streaming?: boolean
  resonances?: Resonance[]
  onCombler?: (inputs: string[]) => void
  onMetaCroisement?: (ids: string[]) => void
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-xs uppercase tracking-widest mb-3"
      style={{ color: '#C9A84C', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.2em' }}
    >
      {children}
    </p>
  )
}

function Divider() {
  return (
    <div
      className="my-6 h-px w-full"
      style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.15), transparent)' }}
    />
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
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: `opacity 0.5s ease ${index * 0.08}s, transform 0.5s ease ${index * 0.08}s`,
      }}
    >
      {children}
    </div>
  )
}

function ActionBtn({
  onClick,
  loading = false,
  disabled = false,
  children,
  title,
}: {
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  children: React.ReactNode
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      title={title}
      className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs transition-all duration-200"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        color: loading || disabled ? '#333' : '#888',
        fontFamily: 'ui-monospace, monospace',
        cursor: loading || disabled ? 'not-allowed' : 'pointer',
        letterSpacing: '0.04em',
        textAlign: 'center',
      }}
      onMouseEnter={(e) => {
        if (!loading && !disabled) {
          e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)'
          e.currentTarget.style.color = '#C9A84C'
          e.currentTarget.style.background = 'rgba(201,168,76,0.05)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
        e.currentTarget.style.color = loading || disabled ? '#333' : '#888'
        e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
      }}
    >
      {loading ? <span style={{ opacity: 0.35 }}>…</span> : children}
    </button>
  )
}

// Small secondary button style for counter actions
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
      className="text-xs px-2 py-1 rounded transition-all duration-200"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        color: '#555',
        fontFamily: 'ui-monospace, monospace',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(139,90,43,0.3)'
        e.currentTarget.style.color = '#C9A84C'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
        e.currentTarget.style.color = '#555'
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
}: InsightCardProps) {
  // ── Section reveal state ───────────────────────────────────────────────────
  const [visibleSections, setVisibleSections] = useState<number[]>([])

  // ── Script generation ──────────────────────────────────────────────────────
  const [isGeneratingScript, setIsGeneratingScript] = useState(false)
  const [scriptModal, setScriptModal] = useState<string | null>(null)
  const [scriptCopied, setScriptCopied] = useState(false)
  const [scriptMsgIndex, setScriptMsgIndex] = useState(0)
  const [scriptMsgVisible, setScriptMsgVisible] = useState(true)

  // ── Gamma export ───────────────────────────────────────────────────────────
  const [gammaCopied, setGammaCopied] = useState(false)

  // ── Counter-insight ────────────────────────────────────────────────────────
  const [isGeneratingCounter, setIsGeneratingCounter] = useState(false)
  const [counterInsight, setCounterInsight] = useState<string | null>(null)
  const [counterScriptLoading, setCounterScriptLoading] = useState(false)
  const [counterShareToast, setCounterShareToast] = useState(false)

  // ── Debate ─────────────────────────────────────────────────────────────────
  const [isGeneratingDebate, setIsGeneratingDebate] = useState(false)
  const [debateModal, setDebateModal] = useState<string | null>(null)
  const [debateCopied, setDebateCopied] = useState(false)
  const [debateMsgIndex, setDebateMsgIndex] = useState(0)
  const [debateMsgVisible, setDebateMsgVisible] = useState(true)

  // ── Share ──────────────────────────────────────────────────────────────────
  const [shareToast, setShareToast] = useState(false)

  // ── Section stagger ────────────────────────────────────────────────────────
  // Indices: 0–7 always, 8 angles, 9 resonances, 10 actionables, 11 UTILISER, 12 footer
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
    }, 150)
    return () => clearInterval(interval)
  }, [streaming])

  // ── Script loading rotation ────────────────────────────────────────────────
  useEffect(() => {
    if (!isGeneratingScript) return
    setScriptMsgIndex(0)
    setScriptMsgVisible(true)
    const interval = setInterval(() => {
      setScriptMsgVisible(false)
      setTimeout(() => {
        setScriptMsgIndex(i => (i + 1) % SCRIPT_LOADING_MSGS.length)
        setScriptMsgVisible(true)
      }, 300)
    }, 2000)
    return () => clearInterval(interval)
  }, [isGeneratingScript])

  // ── Debate loading rotation ────────────────────────────────────────────────
  useEffect(() => {
    if (!isGeneratingDebate) return
    setDebateMsgIndex(0)
    setDebateMsgVisible(true)
    const interval = setInterval(() => {
      setDebateMsgVisible(false)
      setTimeout(() => {
        setDebateMsgIndex(i => (i + 1) % DEBATE_LOADING_MSGS.length)
        setDebateMsgVisible(true)
      }, 300)
    }, 2000)
    return () => clearInterval(interval)
  }, [isGeneratingDebate])

  const date = card.createdAt instanceof Date ? card.createdAt : new Date(card.createdAt)
  const formattedDate = date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const isVisible = (index: number) => visibleSections.includes(index)
  const anglesMorts = card.anglesMorts
  const hasAnglesMorts = anglesMorts && anglesMorts.anglesDetectes.length > 0
  const hasResonances = resonances.length > 0
  const hasActionables = !!card.actionables

  // ── Action handlers ────────────────────────────────────────────────────────

  const handleGenerateScript = async (overrideCard?: InsightCardType) => {
    setIsGeneratingScript(true)
    try {
      const res = await fetch('/api/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    setIsGeneratingCounter(true)
    setCounterInsight(null)
    try {
      const res = await fetch('/api/counter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    setIsGeneratingDebate(true)
    setDebateModal(null)
    try {
      const res = await fetch('/api/debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    questionNoOneHasAsked: "Et si ce croisement était fondamentalement biaisé ?",
  })

  const handleCounterScript = async () => {
    if (!counterInsight) return
    setCounterScriptLoading(true)
    try {
      const res = await fetch('/api/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insight: makeCounterCard() }),
      })
      const data = await res.json()
      setScriptModal(data.script || data.error || 'Erreur lors de la génération.')
    } catch {
      setScriptModal('Erreur réseau. Réessayez.')
    } finally {
      setCounterScriptLoading(false)
    }
  }

  const handleCounterPresenter = () => {
    if (!counterInsight) return
    const slug = buildSlug(makeCounterCard())
    window.open(`/i/${slug}`, '_blank')
  }

  const handleCounterShare = async () => {
    if (!counterInsight) return
    const slug = buildSlug(makeCounterCard())
    const url = `${window.location.origin}/i/${slug}`
    try {
      await navigator.clipboard.writeText(url)
      setCounterShareToast(true)
      setTimeout(() => setCounterShareToast(false), 3000)
    } catch {
      window.prompt('Copiez ce lien :', url)
    }
  }

  const handleApprofondir = () => {
    const urls = card.sources.map(s => s.url).filter(Boolean)
    try { sessionStorage.setItem('tel:approfondir', JSON.stringify(urls)) } catch { /* ok */ }
    onClose()
  }

  const handlePresenter = () => {
    window.open(`/i/${buildSlug(card)}`, '_blank')
  }

  const handleGammaExport = async () => {
    const outline = buildGammaOutline(card)
    try {
      await navigator.clipboard.writeText(outline)
      setGammaCopied(true)
      setTimeout(() => setGammaCopied(false), 4000)
      window.open('https://gamma.app', '_blank')
    } catch {
      window.prompt('Contenu à coller dans Gamma :', outline)
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/i/${buildSlug(card)}`
    try {
      await navigator.clipboard.writeText(url)
      setShareToast(true)
      setTimeout(() => setShareToast(false), 3000)
    } catch {
      window.prompt('Copiez ce lien :', url)
    }
  }

  const handleCopyScript = async (text: string | null, setCopied: (v: boolean) => void) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      window.prompt('Copiez le script :', text)
    }
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
          background: 'rgba(10,10,15,0.94)',
          border: '1px solid rgba(201,168,76,0.18)',
          borderRadius: '16px',
          backdropFilter: 'blur(24px)',
          maxHeight: '80vh',
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(201,168,76,0.2) transparent',
        }}
      >
        {/* ── Sticky header ── */}
        <div
          className="sticky top-0 z-10 flex items-start justify-between p-6 pb-4 no-print"
          style={{
            background: 'rgba(10,10,15,0.97)',
            borderBottom: '1px solid rgba(201,168,76,0.08)',
            backdropFilter: 'blur(24px)',
          }}
        >
          <div className="flex-1 pr-4">
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#333', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.25em' }}>
              LOGOS · Insight Card
            </p>
            <h2 className="text-xl leading-snug" style={{ color: '#F5ECD7', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              {card.theme}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 no-print"
            style={{ border: '1px solid rgba(255,255,255,0.08)', color: '#444', background: 'transparent', fontSize: '1rem' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.35)'; e.currentTarget.style.color = '#C9A84C' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#444' }}
            title="Fermer"
          >
            ×
          </button>
        </div>

        {/* ── Body ── */}
        <div className="p-6 pt-5">

          {/* SOURCES CROISÉES */}
          <Section index={0} visible={isVisible(0)}>
            <SectionLabel>Sources croisées</SectionLabel>
            <div className="flex flex-col gap-2">
              {card.sources.map((source, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(201,168,76,0.08)', color: '#C9A84C', fontFamily: 'ui-monospace, monospace', border: '1px solid rgba(201,168,76,0.15)', whiteSpace: 'nowrap' }}>
                    {SOURCE_TYPE_LABELS[source.type] || source.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate mb-1" style={{ color: '#FFFFFF' }}>{source.title || source.url}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs" style={{ color: '#444', fontFamily: 'ui-monospace, monospace' }}>{source.geographicContext}</p>
                      <div className="flex items-center gap-1">
                        <ConfidenceBar value={source.geographicConfidence} showValue={false} size="sm" />
                        <span className="text-xs" style={{ color: '#2a2a2a', fontFamily: 'ui-monospace, monospace' }}>{source.geographicConfidence}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Divider />

          {/* LE PATTERN RÉVÉLÉ */}
          <Section index={1} visible={isVisible(1)}>
            <SectionLabel>Le pattern révélé</SectionLabel>
            <p className="text-sm leading-relaxed" style={{ color: '#F5ECD7', fontFamily: 'Georgia, serif', lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>
              {card.revealedPattern}
            </p>
          </Section>

          <Divider />

          {/* CONVERGENCES */}
          <Section index={2} visible={isVisible(2)}>
            <SectionLabel>Zones de convergence</SectionLabel>
            <ul className="flex flex-col gap-2.5">
              {card.convergenceZones.map((zone, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed" style={{ color: '#CCCCCC', fontFamily: 'Georgia, serif' }}>
                  <span style={{ color: '#C9A84C', flexShrink: 0, marginTop: '2px' }}>◆</span>
                  {zone}
                </li>
              ))}
            </ul>
          </Section>

          <Divider />

          {/* DIVERGENCES */}
          <Section index={3} visible={isVisible(3)}>
            <SectionLabel>Zones de divergence irréductible</SectionLabel>
            <ul className="flex flex-col gap-2.5">
              {card.divergenceZones.map((zone, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed" style={{ color: '#CCCCCC', fontFamily: 'Georgia, serif' }}>
                  <span style={{ color: '#8B5A2B', flexShrink: 0, marginTop: '2px' }}>◇</span>
                  {zone}
                </li>
              ))}
            </ul>
          </Section>

          <Divider />

          {/* CONFIANCE */}
          <Section index={4} visible={isVisible(4)}>
            <SectionLabel>Niveau de confiance global</SectionLabel>
            <ConfidenceBar value={card.globalConfidence} label="Confiance du croisement" showValue={true} size="lg" />
          </Section>

          <Divider />

          {/* GÉO */}
          <Section index={5} visible={isVisible(5)}>
            <SectionLabel>Représentativité géographique</SectionLabel>
            <p className="text-sm leading-relaxed" style={{ color: '#777', fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.75 }}>
              {card.geographicRepresentativity}
            </p>
          </Section>

          <Divider />

          {/* L'INDICIBLE */}
          <Section index={6} visible={isVisible(6)}>
            <div className="p-5 rounded-xl" style={{ background: 'rgba(20,20,36,0.5)', border: '1px solid rgba(201,168,76,0.08)' }}>
              <SectionLabel>L&apos;indicible</SectionLabel>
              <p className="text-sm leading-relaxed" style={{ color: '#777', fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.8 }}>
                &ldquo;{card.theUnspeakable}&rdquo;
              </p>
              <p className="text-xs mt-3" style={{ color: '#2a2a2a', fontFamily: 'ui-monospace, monospace' }}>
                — Ce que ce croisement ne peut pas capturer
              </p>
            </div>
          </Section>

          <Divider />

          {/* LA QUESTION */}
          <Section index={7} visible={isVisible(7)}>
            <div className="p-5 rounded-xl" style={{ background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.18)' }}>
              <SectionLabel>Question que personne n&apos;a encore posée</SectionLabel>
              <p className="text-base leading-relaxed" style={{ color: '#F5ECD7', fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.85 }}>
                {card.questionNoOneHasAsked}
              </p>
            </div>
          </Section>

          {/* ANGLES MORTS */}
          {hasAnglesMorts && (
            <>
              <Divider />
              <Section index={8} visible={isVisible(8)}>
                <div className="p-5 rounded-xl" style={{ background: 'rgba(139,90,43,0.06)', border: '1px solid rgba(139,90,43,0.25)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <SectionLabel>Angles morts détectés</SectionLabel>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{
                      background: anglesMorts!.scoreEquilibre >= 70 ? 'rgba(26,107,60,0.15)' : anglesMorts!.scoreEquilibre >= 40 ? 'rgba(201,168,76,0.10)' : 'rgba(139,90,43,0.15)',
                      border: `1px solid ${anglesMorts!.scoreEquilibre >= 70 ? 'rgba(26,107,60,0.4)' : anglesMorts!.scoreEquilibre >= 40 ? 'rgba(201,168,76,0.35)' : 'rgba(139,90,43,0.4)'}`,
                    }}>
                      <span className="text-xs font-medium" style={{ fontFamily: 'ui-monospace, monospace', color: anglesMorts!.scoreEquilibre >= 70 ? '#1A6B3C' : anglesMorts!.scoreEquilibre >= 40 ? '#C9A84C' : '#8B5A2B' }}>
                        Équilibre {anglesMorts!.scoreEquilibre}%
                      </span>
                    </div>
                  </div>
                  <ul className="flex flex-col gap-3 mb-4">
                    {anglesMorts!.anglesDetectes.map((angle, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="text-xs flex-shrink-0 mt-0.5 px-2 py-0.5 rounded" style={{ background: 'rgba(139,90,43,0.12)', color: '#C9A84C', fontFamily: 'ui-monospace, monospace', border: '1px solid rgba(139,90,43,0.2)', whiteSpace: 'nowrap' }}>
                          {ANGLE_TYPE_LABELS[angle.type] || angle.type}
                        </span>
                        <p className="text-sm leading-relaxed" style={{ color: '#BBBBBB', fontFamily: 'Georgia, serif' }}>
                          {angle.description}
                          {angle.suggestion && (
                            <span className="block mt-1 text-xs" style={{ color: '#666', fontStyle: 'italic' }}>→ {angle.suggestion}</span>
                          )}
                        </p>
                      </li>
                    ))}
                  </ul>
                  {anglesMorts!.perspectivesManquantes.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#555', fontFamily: 'ui-monospace, monospace' }}>Perspectives manquantes</p>
                      <div className="flex flex-wrap gap-2">
                        {anglesMorts!.perspectivesManquantes.map((p, i) => (
                          <span key={i} className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#888', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{p}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {anglesMorts!.questionsEvitees.length > 0 && (
                    <div className="mb-5">
                      <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#555', fontFamily: 'ui-monospace, monospace' }}>Questions évitées par les sources</p>
                      <ul className="flex flex-col gap-1.5">
                        {anglesMorts!.questionsEvitees.map((q, i) => (
                          <li key={i} className="text-xs leading-relaxed" style={{ color: '#666', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>· {q}</li>
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
                      className="w-full py-2.5 rounded-lg text-sm transition-all duration-200"
                      style={{ background: 'rgba(139,90,43,0.12)', border: '1px solid rgba(139,90,43,0.35)', color: '#C9A84C', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.05em', cursor: 'pointer' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(139,90,43,0.22)'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.5)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(139,90,43,0.12)'; e.currentTarget.style.borderColor = 'rgba(139,90,43,0.35)' }}
                    >
                      ↗ Combler ces angles morts
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
                <div className="p-5 rounded-xl" style={{ background: 'rgba(10,10,30,0.5)', border: '1px solid rgba(100,100,200,0.15)' }}>
                  <SectionLabel>Résonances de session</SectionLabel>
                  <div className="flex flex-col gap-3">
                    {resonances.map((res, i) => (
                      <div key={i} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(100,100,200,0.10)' }}>
                        <div className="flex items-start justify-between gap-3 mb-1.5">
                          <p className="text-sm" style={{ color: '#AAAACC', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{res.themeCommun}</p>
                          <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(100,100,200,0.10)', border: '1px solid rgba(100,100,200,0.2)', color: '#8888BB', fontFamily: 'ui-monospace, monospace' }}>{res.scoreSimilarite}%</span>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: '#555', fontFamily: 'Georgia, serif' }}>{res.patternCommun}</p>
                        {onMetaCroisement && (
                          <button
                            onClick={() => onMetaCroisement([card.id, res.croisementId])}
                            className="mt-2 text-xs px-3 py-1 rounded transition-all duration-200"
                            style={{ background: 'rgba(100,100,200,0.06)', border: '1px solid rgba(100,100,200,0.18)', color: '#7777BB', fontFamily: 'ui-monospace, monospace', cursor: 'pointer' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(100,100,200,0.14)'; e.currentTarget.style.color = '#AAAADD' }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(100,100,200,0.06)'; e.currentTarget.style.color = '#7777BB' }}
                          >
                            ∞ Créer un méta-croisement
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
                <div className="p-5 rounded-xl" style={{ background: 'rgba(12,18,12,0.6)', border: '1px solid rgba(80,140,80,0.18)' }}>
                  <SectionLabel>Ce que ça permet</SectionLabel>
                  <div className="flex flex-col gap-4">
                    {[
                      { icon: '◉', label: 'Individu', text: card.actionables!.individu, color: '#C9A84C' },
                      { icon: '◈', label: 'Chercheur · Praticien', text: card.actionables!.chercheur, color: '#7AABB5' },
                      { icon: '◆', label: 'Institution · Collectif', text: card.actionables!.institution, color: '#9898CC' },
                    ].map(({ icon, label, text, color }) => (
                      <div key={label} className="flex gap-3">
                        <span style={{ color, flexShrink: 0, marginTop: '3px', fontSize: '0.7rem' }}>{icon}</span>
                        <div>
                          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#444', fontFamily: 'ui-monospace, monospace' }}>{label}</p>
                          <p className="text-sm leading-relaxed" style={{ color: '#CCCCCC', fontFamily: 'Georgia, serif', lineHeight: 1.7 }}>{text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Section>
            </>
          )}

          {/* UTILISER CET INSIGHT */}
          <Section index={11} visible={isVisible(11)}>
            <div className="mt-6 p-5 rounded-xl no-print" style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <SectionLabel>Utiliser cet insight</SectionLabel>

              {/* Primary action grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                {/* Script vidéo */}
                <ActionBtn onClick={() => handleGenerateScript()} loading={isGeneratingScript || counterScriptLoading} title="Générer un script vidéo 3-4 min">
                  ▶ Script vidéo
                </ActionBtn>

                {/* Présenter */}
                <ActionBtn onClick={handlePresenter} title="Ouvrir la page Living Insight">
                  ⊞ Présenter
                </ActionBtn>

                {/* Exporter Gamma (secondary, small) */}
                <ActionBtn
                  onClick={handleGammaExport}
                  title="Copier le contenu structuré, puis ouvrir Gamma.app"
                >
                  {gammaCopied ? '✓ Collez dans Gamma' : '⊠ Gamma'}
                </ActionBtn>

                {/* PDF */}
                <ActionBtn onClick={() => window.print()} title="Exporter en PDF">
                  ▣ PDF
                </ActionBtn>

                {/* Approfondir */}
                <ActionBtn onClick={handleApprofondir} title="Relancer avec les mêmes sources">
                  ↗ Approfondir
                </ActionBtn>

                {/* Et si c'était faux */}
                <ActionBtn onClick={handleGenerateCounter} loading={isGeneratingCounter} title="Générer le contre-insight">
                  ⁻ Et si faux ?
                </ActionBtn>
              </div>

              {/* Script loading state */}
              {isGeneratingScript && (
                <div className="mb-3 py-2 text-center">
                  <p style={{ color: '#C9A84C', fontFamily: 'ui-monospace, monospace', fontSize: '0.72rem', opacity: scriptMsgVisible ? 1 : 0, transition: 'opacity 0.3s ease' }}>
                    {SCRIPT_LOADING_MSGS[scriptMsgIndex]}
                  </p>
                </div>
              )}

              {/* Share button */}
              <button
                onClick={handleShare}
                className="w-full py-2 rounded-lg text-xs transition-all duration-200"
                style={{
                  background: shareToast ? 'rgba(26,107,60,0.10)' : 'rgba(201,168,76,0.05)',
                  border: shareToast ? '1px solid rgba(26,107,60,0.3)' : '1px solid rgba(201,168,76,0.15)',
                  color: shareToast ? '#1A6B3C' : '#C9A84C',
                  fontFamily: 'ui-monospace, monospace',
                  cursor: 'pointer',
                  letterSpacing: '0.06em',
                }}
              >
                {shareToast ? '✓ Lien copié dans le presse-papier' : '⊕ Partager — copier le lien /i/[slug]'}
              </button>

              {/* ── Counter-insight panel ── */}
              {(isGeneratingCounter || counterInsight) && (
                <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(80,20,20,0.22)', border: '1px solid rgba(139,58,58,0.28)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs uppercase tracking-widest" style={{ color: '#8B5A2B', fontFamily: 'ui-monospace, monospace' }}>
                      Et si c&apos;était faux ?
                    </p>
                    {counterInsight && (
                      <button onClick={() => setCounterInsight(null)} className="text-xs px-2 py-0.5 rounded" style={{ color: '#444', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}>×</button>
                    )}
                  </div>

                  {isGeneratingCounter && !counterInsight ? (
                    <p className="text-xs" style={{ color: '#444', fontFamily: 'ui-monospace, monospace' }}>Génération du contre-insight…</p>
                  ) : (
                    <>
                      <p className="text-sm leading-relaxed mb-4" style={{ color: '#AA8888', fontFamily: 'Georgia, serif', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                        {counterInsight}
                      </p>

                      {/* Counter action buttons */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <SmallBtn onClick={handleCounterScript} title="Script vidéo du contre-insight">
                          {counterScriptLoading ? '…' : '▶ Script'}
                        </SmallBtn>
                        <SmallBtn onClick={handleCounterPresenter} title="Présenter le contre-insight">
                          ⊞ Présenter
                        </SmallBtn>
                        <SmallBtn onClick={() => window.print()} title="Exporter en PDF">
                          ▣ PDF
                        </SmallBtn>
                        <SmallBtn onClick={handleCounterShare} title="Partager le contre-insight">
                          {counterShareToast ? '✓ Copié' : '⊕ Partager'}
                        </SmallBtn>
                      </div>

                      {/* Script de confrontation */}
                      <button
                        onClick={handleGenerateDebate}
                        disabled={isGeneratingDebate}
                        className="w-full py-2.5 rounded-lg text-xs transition-all duration-200"
                        style={{
                          background: isGeneratingDebate ? 'rgba(201,168,76,0.03)' : 'rgba(201,168,76,0.08)',
                          border: '1px solid rgba(201,168,76,0.22)',
                          color: isGeneratingDebate ? '#333' : '#C9A84C',
                          fontFamily: 'ui-monospace, monospace',
                          letterSpacing: '0.06em',
                          cursor: isGeneratingDebate ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {isGeneratingDebate ? '…' : '⚡ Script de confrontation — 2 actes'}
                      </button>

                      {/* Debate loading messages */}
                      {isGeneratingDebate && (
                        <div className="mt-2 text-center">
                          <p style={{ color: '#C9A84C', fontFamily: 'ui-monospace, monospace', fontSize: '0.7rem', opacity: debateMsgVisible ? 1 : 0, transition: 'opacity 0.3s ease' }}>
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
            <div className="mt-6 pt-4 flex items-center justify-between flex-wrap gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
              <p className="text-xs" style={{ color: '#1a1a1a', fontFamily: 'ui-monospace, monospace' }}>{card.id}</p>
              <p className="text-xs" style={{ color: '#1a1a1a', fontFamily: 'ui-monospace, monospace' }}>{formattedDate}</p>
            </div>
          </Section>

        </div>
      </div>

      {/* ── Script Modal (shared for main + counter) ── */}
      {scriptModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setScriptModal(null) }}
        >
          <div className="w-full max-w-2xl rounded-2xl flex flex-col" style={{ background: 'rgba(10,10,15,0.98)', border: '1px solid rgba(201,168,76,0.2)', maxHeight: '80vh' }}>
            <div className="flex items-center justify-between p-5 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-xs uppercase tracking-widest" style={{ color: '#C9A84C', fontFamily: 'ui-monospace, monospace' }}>
                Script vidéo
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyScript(scriptModal, setScriptCopied)}
                  className="text-xs px-3 py-1.5 rounded-lg transition-all duration-200"
                  style={{ background: scriptCopied ? 'rgba(26,107,60,0.15)' : 'rgba(201,168,76,0.08)', border: scriptCopied ? '1px solid rgba(26,107,60,0.4)' : '1px solid rgba(201,168,76,0.25)', color: scriptCopied ? '#1A6B3C' : '#C9A84C', fontFamily: 'ui-monospace, monospace', cursor: 'pointer' }}
                >
                  {scriptCopied ? '✓ Copié' : 'Copier'}
                </button>
                <button onClick={() => setScriptModal(null)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ border: '1px solid rgba(255,255,255,0.08)', color: '#444', background: 'transparent', cursor: 'pointer' }}>×</button>
              </div>
            </div>
            <div className="p-5 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(201,168,76,0.2) transparent' }}>
              <pre className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#CCCCCC', fontFamily: 'Georgia, serif', lineHeight: 1.9 }}>
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
          style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setDebateModal(null) }}
        >
          <div className="w-full max-w-2xl rounded-2xl flex flex-col" style={{ background: 'rgba(10,10,15,0.98)', border: '1px solid rgba(139,58,58,0.25)', maxHeight: '80vh' }}>
            <div className="flex items-center justify-between p-5 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-xs uppercase tracking-widest" style={{ color: '#C9A84C', fontFamily: 'ui-monospace, monospace' }}>
                Script de confrontation — 2 actes
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyScript(debateModal, setDebateCopied)}
                  className="text-xs px-3 py-1.5 rounded-lg transition-all duration-200"
                  style={{ background: debateCopied ? 'rgba(26,107,60,0.15)' : 'rgba(201,168,76,0.08)', border: debateCopied ? '1px solid rgba(26,107,60,0.4)' : '1px solid rgba(201,168,76,0.25)', color: debateCopied ? '#1A6B3C' : '#C9A84C', fontFamily: 'ui-monospace, monospace', cursor: 'pointer' }}
                >
                  {debateCopied ? '✓ Copié' : 'Copier'}
                </button>
                <button onClick={() => setDebateModal(null)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ border: '1px solid rgba(255,255,255,0.08)', color: '#444', background: 'transparent', cursor: 'pointer' }}>×</button>
              </div>
            </div>
            <div className="p-5 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(201,168,76,0.2) transparent' }}>
              <pre className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#CCCCCC', fontFamily: 'Georgia, serif', lineHeight: 1.9 }}>
                {debateModal}
              </pre>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
