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
  geographique: 'Géographique',
  temporel: 'Temporel',
  genre_posture: 'Posture / Genre',
  silence: 'Silence',
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

const COUNTER_LOADING_MSGS = [
  'Recherche de perspectives contradictoires…',
  'Analyse des failles du pattern…',
  'Construction du contre-argument…',
  'Évaluation de la robustesse…',
]

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
}: InsightCardProps) {
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
  const formattedDate = date.toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
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
    questionNoOneHasAsked: "Et si ce croisement était fondamentalement biaisé ?",
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
    const urls = card.sources.map(s => s.url).filter(Boolean)
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
              LOGOS · Insight Card
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
            title="Fermer"
          >×</button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '28px 32px' }}>

          {/* SOURCES CROISÉES */}
          <Section index={0} visible={isVisible(0)}>
            <SectionLabel>Sources croisées</SectionLabel>
            <div className="flex flex-col gap-2">
              {card.sources.map((source, i) => (
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

          {/* LE PATTERN RÉVÉLÉ */}
          <Section index={1} visible={isVisible(1)}>
            <SectionLabel>Le pattern révélé</SectionLabel>
            <p className="tel-serif" style={{ fontSize: '15px', lineHeight: 1.75, color: TEXT_PRIMARY, whiteSpace: 'pre-wrap' }}>
              {card.revealedPattern}
            </p>
          </Section>

          <Divider />

          {/* CONVERGENCES */}
          <Section index={2} visible={isVisible(2)}>
            <SectionLabel>Zones de convergence</SectionLabel>
            <ul className="flex flex-col gap-2.5">
              {card.convergenceZones.map((zone, i) => (
                <li key={i} className="flex gap-3" style={{ fontSize: '14px', lineHeight: 1.7, color: TEXT_PRIMARY }}>
                  <span style={{ color: GOLD, flexShrink: 0, marginTop: '3px', fontSize: '8px' }}>◆</span>
                  <span className="tel-serif">{zone}</span>
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
                <li key={i} className="flex gap-3" style={{ fontSize: '14px', lineHeight: 1.7, color: TEXT_PRIMARY }}>
                  <span style={{ color: '#6B4226', flexShrink: 0, marginTop: '3px', fontSize: '8px' }}>◇</span>
                  <span className="tel-serif">{zone}</span>
                </li>
              ))}
            </ul>

            {/* CE QUE TEL REFUSE DE RÉCONCILIER */}
            {card.irreconcilable && (
              <div
                style={{
                  marginTop: '20px',
                  padding: '16px 20px',
                  borderLeft: `2px solid ${GOLD}`,
                  background: 'rgba(201,168,76,0.03)',
                  borderRadius: '0 8px 8px 0',
                }}
              >
                <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: GOLD, opacity: 0.7, marginBottom: '8px' }}>
                  Ce que TEL refuse de réconcilier
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
            <SectionLabel>Niveau de confiance global</SectionLabel>
            <ConfidenceBar value={card.globalConfidence} label="Confiance du croisement" showValue={true} size="lg" />
          </Section>

          <Divider />

          {/* GÉO */}
          <Section index={5} visible={isVisible(5)}>
            <SectionLabel>Représentativité géographique</SectionLabel>
            <p className="tel-italic" style={{ fontSize: '14px', lineHeight: 1.75, color: TEXT_MUTED }}>
              {card.geographicRepresentativity}
            </p>
          </Section>

          <Divider />

          {/* L'INDICIBLE */}
          <Section index={6} visible={isVisible(6)}>
            <div style={{ padding: '20px', borderRadius: '8px', background: 'rgba(255,255,255,0.015)', border: `1px solid ${BORDER}` }}>
              <SectionLabel>L&apos;indicible</SectionLabel>
              <p className="tel-italic" style={{ fontSize: '14px', lineHeight: 1.8, color: TEXT_MUTED }}>
                &ldquo;{card.theUnspeakable}&rdquo;
              </p>
              <p style={{ fontSize: '11px', marginTop: '10px', color: TEXT_FAINT }}>
                — Ce que ce croisement ne peut pas capturer
              </p>
            </div>
          </Section>

          <Divider />

          {/* LA QUESTION */}
          <Section index={7} visible={isVisible(7)}>
            <div style={{ padding: '20px', borderRadius: '8px', background: 'rgba(201,168,76,0.03)', border: '1px solid rgba(201,168,76,0.12)' }}>
              <SectionLabel>Question que personne n&apos;a encore posée</SectionLabel>
              <p className="tel-italic" style={{ fontSize: '15px', lineHeight: 1.85, color: '#e8e8e8' }}>
                {card.questionNoOneHasAsked}
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
                    <SectionLabel>Angles morts détectés</SectionLabel>
                    <div style={{
                      padding: '3px 10px', borderRadius: '20px', fontSize: '11px',
                      background: anglesMorts!.scoreEquilibre >= 70 ? 'rgba(26,107,60,0.1)' : 'rgba(201,168,76,0.08)',
                      border: `1px solid ${anglesMorts!.scoreEquilibre >= 70 ? 'rgba(26,107,60,0.3)' : 'rgba(201,168,76,0.25)'}`,
                      color: anglesMorts!.scoreEquilibre >= 70 ? '#1A6B3C' : GOLD,
                    }}>
                      Équilibre {anglesMorts!.scoreEquilibre}%
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
                      <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: TEXT_FAINT, marginBottom: '8px' }}>Perspectives manquantes</p>
                      <div className="flex flex-wrap gap-2">
                        {anglesMorts!.perspectivesManquantes.map((p, i) => (
                          <span key={i} style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '4px', background: 'rgba(255,255,255,0.025)', border: `1px solid ${BORDER}`, color: TEXT_MUTED, fontStyle: 'italic' }}>{p}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {anglesMorts!.questionsEvitees.length > 0 && (
                    <div className="mb-5">
                      <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: TEXT_FAINT, marginBottom: '8px' }}>Questions évitées par les sources</p>
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
                <div style={{ padding: '20px', borderRadius: '8px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(100,100,200,0.12)' }}>
                  <SectionLabel>Résonances de session</SectionLabel>
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
                <div style={{ padding: '20px', borderRadius: '8px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(80,140,80,0.12)' }}>
                  <SectionLabel>Ce que ça permet</SectionLabel>
                  <div className="flex flex-col gap-4">
                    {[
                      { icon: '◉', label: 'Individu', text: card.actionables!.individu, color: GOLD },
                      { icon: '◈', label: 'Chercheur · Praticien', text: card.actionables!.chercheur, color: '#7AABB5' },
                      { icon: '◆', label: 'Institution · Collectif', text: card.actionables!.institution, color: '#9898CC' },
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
                    Cette Insight Card est une version publique. Les versions institutionnelles incluent scénarios d&apos;action et recommandations ciblées.
                  </p>
                </div>
              </Section>
            </>
          )}

          {/* UTILISER CET INSIGHT */}
          <Section index={11} visible={isVisible(11)}>
            <div className="mt-6 no-print" style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '24px' }}>
              <SectionLabel>Utiliser cet insight</SectionLabel>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                <ActionBtn onClick={() => handleGenerateScript()} loading={isGeneratingScript || counterScriptLoading} title="Générer un script vidéo 3-4 min">
                  ▶ Script vidéo
                </ActionBtn>
                <ActionBtn onClick={handlePresenter} title="Ouvrir la page Living Insight">
                  ⊞ Présenter
                </ActionBtn>
                <ActionBtn onClick={handleGammaExport} title="Copier le contenu structuré pour Gamma">
                  {gammaCopied ? '✓ Copié' : 'Gamma'}
                </ActionBtn>
                <ActionBtn onClick={() => window.print()} title="Exporter en PDF">
                  ▣ PDF
                </ActionBtn>
                <ActionBtn onClick={handleApprofondir} title="Relancer avec les mêmes sources">
                  ↗ Approfondir
                </ActionBtn>
                <ActionBtn onClick={handleGenerateCounter} loading={isGeneratingCounter} title="Générer le contre-insight">
                  ⁻ Et si faux ?
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
                {shareToast ? 'Lien copié' : 'Partager — copier le lien'}
              </button>

              {/* Counter-insight panel */}
              {(isGeneratingCounter || counterInsight) && (
                <div className="mt-4 p-4 rounded-lg" style={{ background: 'rgba(80,20,20,0.15)', border: '1px solid rgba(139,58,58,0.2)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#6B3A2A', opacity: 0.8 }}>
                      Et si c&apos;était faux ?
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
                        <SmallBtn onClick={handleCounterScript} title="Script vidéo du contre-insight">
                          {counterScriptLoading ? '…' : '▶ Script'}
                        </SmallBtn>
                        <SmallBtn onClick={handleCounterPresenter} title="Présenter le contre-insight">
                          ⊞ Présenter
                        </SmallBtn>
                        <SmallBtn onClick={() => window.print()} title="PDF">
                          ▣ PDF
                        </SmallBtn>
                        <SmallBtn onClick={handleCounterShare} title="Partager le contre-insight">
                          {counterShareToast ? '✓ Copié' : '⊕ Partager'}
                        </SmallBtn>
                      </div>

                      {/* Script de confrontation — gets gold bg */}
                      <ActionBtn
                        onClick={handleGenerateDebate}
                        loading={isGeneratingDebate}
                        gold={!!counterInsight && !isGeneratingDebate}
                        title="Générer le script de confrontation à 2 actes"
                      >
                        Script de confrontation — 2 actes
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
            <div className="mt-6 pt-4 flex items-center justify-between flex-wrap gap-2" style={{ borderTop: `1px solid ${BORDER_SUBTLE}` }}>
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
              <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: TEXT_PRIMARY, opacity: 0.4 }}>Script vidéo</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyScript(scriptModal, setScriptCopied)}
                  style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '6px', background: scriptCopied ? 'rgba(26,107,60,0.1)' : 'transparent', border: `1px solid ${scriptCopied ? 'rgba(26,107,60,0.3)' : BORDER}`, color: scriptCopied ? '#1A6B3C' : TEXT_MUTED, cursor: 'pointer', transition: 'all 200ms ease' }}
                >
                  {scriptCopied ? '✓ Copié' : 'Copier'}
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
              <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: TEXT_PRIMARY, opacity: 0.4 }}>Script de confrontation — 2 actes</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyScript(debateModal, setDebateCopied)}
                  style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '6px', background: debateCopied ? 'rgba(26,107,60,0.1)' : 'transparent', border: `1px solid ${debateCopied ? 'rgba(26,107,60,0.3)' : BORDER}`, color: debateCopied ? '#1A6B3C' : TEXT_MUTED, cursor: 'pointer', transition: 'all 200ms ease' }}
                >
                  {debateCopied ? '✓ Copié' : 'Copier'}
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
