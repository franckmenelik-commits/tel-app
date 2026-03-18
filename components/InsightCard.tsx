'use client'

import { useEffect, useState } from 'react'
import ConfidenceBar from './ConfidenceBar'
import type { InsightCard as InsightCardType, Resonance } from '@/lib/types'

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

interface InsightCardProps {
  card: InsightCardType
  onClose: () => void
  streaming?: boolean
  resonances?: Resonance[]
  onCombler?: (inputs: string[]) => void
  onMetaCroisement?: (ids: string[]) => void
}

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

// Animate sections in with a staggered delay
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

export default function InsightCard({
  card,
  onClose,
  streaming = false,
  resonances = [],
  onCombler,
  onMetaCroisement,
}: InsightCardProps) {
  const [visibleSections, setVisibleSections] = useState<number[]>([])

  // Stagger section reveal
  useEffect(() => {
    if (!streaming) {
      // All at once if not streaming
      setVisibleSections([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      return
    }
    const SECTION_COUNT = 11
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

  const date = new Date(card.createdAt)
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

  return (
    <div
      className="w-full max-w-2xl mx-auto"
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
        className="sticky top-0 z-10 flex items-start justify-between p-6 pb-4"
        style={{
          background: 'rgba(10,10,15,0.97)',
          borderBottom: '1px solid rgba(201,168,76,0.08)',
          backdropFilter: 'blur(24px)',
        }}
      >
        <div className="flex-1 pr-4">
          <p
            className="text-xs uppercase tracking-widest mb-2"
            style={{ color: '#333', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.25em' }}
          >
            LOGOS · Insight Card
          </p>

          {/* 1. THÈME DU CROISEMENT */}
          <h2
            className="text-xl leading-snug"
            style={{
              color: '#F5ECD7',
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
            }}
          >
            {card.theme}
          </h2>
        </div>

        <button
          onClick={onClose}
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
          style={{
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#444',
            background: 'transparent',
            fontSize: '1rem',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(201,168,76,0.35)'
            e.currentTarget.style.color = '#C9A84C'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
            e.currentTarget.style.color = '#444'
          }}
          title="Fermer"
        >
          ×
        </button>
      </div>

      {/* ── Body ── */}
      <div className="p-6 pt-5">

        {/* 2. SOURCES CROISÉES */}
        <Section index={0} visible={isVisible(0)}>
          <SectionLabel>Sources croisées</SectionLabel>
          <div className="flex flex-col gap-2 mb-0">
            {card.sources.map((source, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <span
                  className="flex-shrink-0 text-xs px-2 py-0.5 rounded"
                  style={{
                    background: 'rgba(201,168,76,0.08)',
                    color: '#C9A84C',
                    fontFamily: 'ui-monospace, monospace',
                    border: '1px solid rgba(201,168,76,0.15)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {SOURCE_TYPE_LABELS[source.type] || source.type}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate mb-1" style={{ color: '#FFFFFF' }}>
                    {source.title || source.url}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className="text-xs"
                      style={{ color: '#444', fontFamily: 'ui-monospace, monospace' }}
                    >
                      {source.geographicContext}
                    </p>
                    <div className="flex items-center gap-1">
                      <ConfidenceBar value={source.geographicConfidence} showValue={false} size="sm" />
                      <span className="text-xs" style={{ color: '#2a2a2a', fontFamily: 'ui-monospace, monospace' }}>
                        {source.geographicConfidence}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Divider />

        {/* 3. LE PATTERN RÉVÉLÉ */}
        <Section index={1} visible={isVisible(1)}>
          <SectionLabel>Le pattern révélé</SectionLabel>
          <p
            className="text-sm leading-relaxed"
            style={{
              color: '#F5ECD7',
              fontFamily: 'Georgia, serif',
              lineHeight: 1.85,
              whiteSpace: 'pre-wrap',
            }}
          >
            {card.revealedPattern}
          </p>
        </Section>

        <Divider />

        {/* 4. ZONES DE CONVERGENCE */}
        <Section index={2} visible={isVisible(2)}>
          <SectionLabel>Zones de convergence</SectionLabel>
          <ul className="flex flex-col gap-2.5">
            {card.convergenceZones.map((zone, i) => (
              <li
                key={i}
                className="flex gap-3 text-sm leading-relaxed"
                style={{ color: '#CCCCCC', fontFamily: 'Georgia, serif' }}
              >
                <span style={{ color: '#C9A84C', flexShrink: 0, marginTop: '2px' }}>◆</span>
                {zone}
              </li>
            ))}
          </ul>
        </Section>

        <Divider />

        {/* 5. ZONES DE DIVERGENCE IRRÉDUCTIBLE */}
        <Section index={3} visible={isVisible(3)}>
          <SectionLabel>Zones de divergence irréductible</SectionLabel>
          <ul className="flex flex-col gap-2.5">
            {card.divergenceZones.map((zone, i) => (
              <li
                key={i}
                className="flex gap-3 text-sm leading-relaxed"
                style={{ color: '#CCCCCC', fontFamily: 'Georgia, serif' }}
              >
                <span style={{ color: '#8B5A2B', flexShrink: 0, marginTop: '2px' }}>◇</span>
                {zone}
              </li>
            ))}
          </ul>
        </Section>

        <Divider />

        {/* 6. NIVEAU DE CONFIANCE GLOBAL */}
        <Section index={4} visible={isVisible(4)}>
          <SectionLabel>Niveau de confiance global</SectionLabel>
          <ConfidenceBar
            value={card.globalConfidence}
            label="Confiance du croisement"
            showValue={true}
            size="lg"
          />
        </Section>

        <Divider />

        {/* 7. REPRÉSENTATIVITÉ GÉOGRAPHIQUE */}
        <Section index={5} visible={isVisible(5)}>
          <SectionLabel>Représentativité géographique</SectionLabel>
          <p
            className="text-sm leading-relaxed"
            style={{ color: '#777', fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.75 }}
          >
            {card.geographicRepresentativity}
          </p>
        </Section>

        <Divider />

        {/* 8. L'INDICIBLE */}
        <Section index={6} visible={isVisible(6)}>
          <div
            className="p-5 rounded-xl"
            style={{
              background: 'rgba(20,20,36,0.5)',
              border: '1px solid rgba(201,168,76,0.08)',
            }}
          >
            <SectionLabel>L&apos;indicible</SectionLabel>
            <p
              className="text-sm leading-relaxed"
              style={{
                color: '#777',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                lineHeight: 1.8,
              }}
            >
              &ldquo;{card.theUnspeakable}&rdquo;
            </p>
            <p
              className="text-xs mt-3"
              style={{ color: '#2a2a2a', fontFamily: 'ui-monospace, monospace' }}
            >
              — Ce que ce croisement ne peut pas capturer
            </p>
          </div>
        </Section>

        <Divider />

        {/* 9. QUESTION QUE PERSONNE N'A ENCORE POSÉE */}
        <Section index={7} visible={isVisible(7)}>
          <div
            className="p-5 rounded-xl"
            style={{
              background: 'rgba(201,168,76,0.04)',
              border: '1px solid rgba(201,168,76,0.18)',
            }}
          >
            <SectionLabel>Question que personne n&apos;a encore posée</SectionLabel>
            <p
              className="text-base leading-relaxed"
              style={{
                color: '#F5ECD7',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                lineHeight: 1.85,
              }}
            >
              {card.questionNoOneHasAsked}
            </p>
          </div>
        </Section>

        {/* 10. ANGLES MORTS DÉTECTÉS (Niveau 3) */}
        {hasAnglesMorts && (
          <>
            <Divider />
            <Section index={8} visible={isVisible(8)}>
              <div
                className="p-5 rounded-xl"
                style={{
                  background: 'rgba(139,90,43,0.06)',
                  border: '1px solid rgba(139,90,43,0.25)',
                }}
              >
                {/* Header row */}
                <div className="flex items-center justify-between mb-4">
                  <SectionLabel>Angles morts détectés</SectionLabel>
                  {/* Équilibre score badge */}
                  <div
                    className="flex items-center gap-2 px-3 py-1 rounded-full"
                    style={{
                      background: anglesMorts!.scoreEquilibre >= 70
                        ? 'rgba(26,107,60,0.15)'
                        : anglesMorts!.scoreEquilibre >= 40
                        ? 'rgba(201,168,76,0.10)'
                        : 'rgba(139,90,43,0.15)',
                      border: `1px solid ${anglesMorts!.scoreEquilibre >= 70
                        ? 'rgba(26,107,60,0.4)'
                        : anglesMorts!.scoreEquilibre >= 40
                        ? 'rgba(201,168,76,0.35)'
                        : 'rgba(139,90,43,0.4)'}`,
                    }}
                  >
                    <span
                      className="text-xs font-medium"
                      style={{
                        fontFamily: 'ui-monospace, monospace',
                        color: anglesMorts!.scoreEquilibre >= 70
                          ? '#1A6B3C'
                          : anglesMorts!.scoreEquilibre >= 40
                          ? '#C9A84C'
                          : '#8B5A2B',
                      }}
                    >
                      Équilibre {anglesMorts!.scoreEquilibre}%
                    </span>
                  </div>
                </div>

                {/* Angles list */}
                <ul className="flex flex-col gap-3 mb-4">
                  {anglesMorts!.anglesDetectes.map((angle, i) => (
                    <li key={i} className="flex gap-3">
                      <span
                        className="text-xs flex-shrink-0 mt-0.5 px-2 py-0.5 rounded"
                        style={{
                          background: 'rgba(139,90,43,0.12)',
                          color: '#C9A84C',
                          fontFamily: 'ui-monospace, monospace',
                          border: '1px solid rgba(139,90,43,0.2)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {ANGLE_TYPE_LABELS[angle.type] || angle.type}
                      </span>
                      <p className="text-sm leading-relaxed" style={{ color: '#BBBBBB', fontFamily: 'Georgia, serif' }}>
                        {angle.description}
                        {angle.suggestion && (
                          <span className="block mt-1 text-xs" style={{ color: '#666', fontStyle: 'italic' }}>
                            → {angle.suggestion}
                          </span>
                        )}
                      </p>
                    </li>
                  ))}
                </ul>

                {/* Perspectives manquantes */}
                {anglesMorts!.perspectivesManquantes.length > 0 && (
                  <div className="mb-4">
                    <p
                      className="text-xs uppercase tracking-widest mb-2"
                      style={{ color: '#555', fontFamily: 'ui-monospace, monospace' }}
                    >
                      Perspectives manquantes
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {anglesMorts!.perspectivesManquantes.map((p, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 rounded"
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            color: '#888',
                            fontFamily: 'Georgia, serif',
                            fontStyle: 'italic',
                          }}
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Questions évitées */}
                {anglesMorts!.questionsEvitees.length > 0 && (
                  <div className="mb-5">
                    <p
                      className="text-xs uppercase tracking-widest mb-2"
                      style={{ color: '#555', fontFamily: 'ui-monospace, monospace' }}
                    >
                      Questions évitées par les sources
                    </p>
                    <ul className="flex flex-col gap-1.5">
                      {anglesMorts!.questionsEvitees.map((q, i) => (
                        <li
                          key={i}
                          className="text-xs leading-relaxed"
                          style={{ color: '#666', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                        >
                          · {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* CTA — Combler ces angles morts */}
                {onCombler && (
                  <button
                    onClick={() => {
                      const inputs = [
                        ...anglesMorts!.perspectivesManquantes,
                        ...anglesMorts!.anglesDetectes
                          .filter(a => a.suggestion)
                          .map(a => a.suggestion!)
                      ].slice(0, 3)
                      onCombler(inputs.length > 0 ? inputs : ['perspective manquante'])
                    }}
                    className="w-full py-2.5 rounded-lg text-sm transition-all duration-200"
                    style={{
                      background: 'rgba(139,90,43,0.12)',
                      border: '1px solid rgba(139,90,43,0.35)',
                      color: '#C9A84C',
                      fontFamily: 'ui-monospace, monospace',
                      letterSpacing: '0.05em',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(139,90,43,0.22)'
                      e.currentTarget.style.borderColor = 'rgba(201,168,76,0.5)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(139,90,43,0.12)'
                      e.currentTarget.style.borderColor = 'rgba(139,90,43,0.35)'
                    }}
                  >
                    ↗ Combler ces angles morts
                  </button>
                )}
              </div>
            </Section>
          </>
        )}

        {/* 11. RÉSONANCES ENTRE CROISEMENTS (Niveau 4) */}
        {hasResonances && (
          <>
            <Divider />
            <Section index={9} visible={isVisible(9)}>
              <div
                className="p-5 rounded-xl"
                style={{
                  background: 'rgba(10,10,30,0.5)',
                  border: '1px solid rgba(100,100,200,0.15)',
                }}
              >
                <SectionLabel>Résonances de session</SectionLabel>

                <div className="flex flex-col gap-3">
                  {resonances.map((res, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(100,100,200,0.10)',
                      }}
                    >
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <p
                          className="text-sm"
                          style={{ color: '#AAAACC', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                        >
                          {res.themeCommun}
                        </p>
                        <span
                          className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full"
                          style={{
                            background: 'rgba(100,100,200,0.10)',
                            border: '1px solid rgba(100,100,200,0.2)',
                            color: '#8888BB',
                            fontFamily: 'ui-monospace, monospace',
                          }}
                        >
                          {res.scoreSimilarite}%
                        </span>
                      </div>
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: '#555', fontFamily: 'Georgia, serif' }}
                      >
                        {res.patternCommun}
                      </p>

                      {/* Méta-croisement CTA */}
                      {onMetaCroisement && (
                        <button
                          onClick={() => onMetaCroisement([card.id, res.croisementId])}
                          className="mt-2 text-xs px-3 py-1 rounded transition-all duration-200"
                          style={{
                            background: 'rgba(100,100,200,0.06)',
                            border: '1px solid rgba(100,100,200,0.18)',
                            color: '#7777BB',
                            fontFamily: 'ui-monospace, monospace',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(100,100,200,0.14)'
                            e.currentTarget.style.borderColor = 'rgba(100,100,200,0.35)'
                            e.currentTarget.style.color = '#AAAADD'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(100,100,200,0.06)'
                            e.currentTarget.style.borderColor = 'rgba(100,100,200,0.18)'
                            e.currentTarget.style.color = '#7777BB'
                          }}
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

        {/* Footer */}
        <Section index={10} visible={isVisible(10)}>
          <div
            className="mt-6 pt-4 flex items-center justify-between flex-wrap gap-2"
            style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}
          >
            <p
              className="text-xs"
              style={{ color: '#1a1a1a', fontFamily: 'ui-monospace, monospace' }}
            >
              {card.id}
            </p>
            <p
              className="text-xs"
              style={{ color: '#1a1a1a', fontFamily: 'ui-monospace, monospace' }}
            >
              {formattedDate}
            </p>
          </div>
        </Section>

      </div>
    </div>
  )
}
