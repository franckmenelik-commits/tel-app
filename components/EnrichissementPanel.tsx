'use client'

import { useState } from 'react'
import type { EnrichissementProposal, SourceProposee } from '@/lib/types'

interface EnrichissementPanelProps {
  proposal: EnrichissementProposal
  onEnrichirEtCroiser: (allUrls: string[]) => void
  onSelectionnerEtCroiser: (selectedUrls: string[]) => void
  onCroiserSansEnrichir: () => void
}

// ── Type icon ─────────────────────────────────────────────────────────────────
function SourceIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    wikipedia: 'W',
    youtube: '▶',
    article: '○',
    book: '▣',
    podcast: '◎',
  }
  return <span>{icons[type] || '·'}</span>
}

// ── Region label ──────────────────────────────────────────────────────────────
function RegionBadge({ region, isSudGlobal }: { region: string; isSudGlobal?: boolean }) {
  const labels: Record<string, string> = {
    afrique: 'Afrique',
    asie: 'Asie',
    amerique_latine: 'Amér. Latine',
    moyen_orient: 'Monde arabe',
    europe: 'Europe',
    amerique_nord: 'Amér. du Nord',
    oceanie: 'Océanie',
    global: 'Global',
    inconnue: '?',
  }
  return (
    <span
      style={{
        color: isSudGlobal ? 'rgba(80,180,120,0.8)' : 'rgba(180,180,180,0.5)',
        fontFamily: 'ui-monospace, monospace',
        fontSize: '0.55rem',
        letterSpacing: '0.06em',
      }}
    >
      {isSudGlobal ? '🌍 ' : ''}{labels[region] || region}
    </span>
  )
}

export default function EnrichissementPanel({
  proposal,
  onEnrichirEtCroiser,
  onSelectionnerEtCroiser,
  onCroiserSansEnrichir,
}: EnrichissementPanelProps) {
  const [mode, setMode] = useState<'overview' | 'selection'>('overview')
  const [selected, setSelected] = useState<Set<string>>(
    new Set(proposal.sourcesProposees.map(s => s.url))
  )

  const toggleSource = (url: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(url)) next.delete(url)
      else next.add(url)
      return next
    })
  }

  const { sourcesProposees, contexte, nombreTrouvees } = proposal

  const allUrls = sourcesProposees.map(s => s.url)
  const selectedUrls = sourcesProposees.filter(s => selected.has(s.url)).map(s => s.url)

  const DOMAIN_LABELS: Record<string, string> = {
    histoire: 'Histoire', science: 'Science', social: 'Social', art: 'Art',
    politique: 'Politique', economie: 'Économie', religion: 'Religion',
    technologie: 'Technologie', environnement: 'Environnement', inconnu: '—',
  }
  const REGION_LABELS: Record<string, string> = {
    afrique: 'Afrique', asie: 'Asie', amerique_latine: 'Amér. Latine',
    moyen_orient: 'Monde arabe', europe: 'Europe', amerique_nord: 'Amér. du Nord',
    oceanie: 'Océanie', global: 'Global', inconnue: '?',
  }

  return (
    <div
      className="animate-fade-in w-full"
      style={{
        background: 'rgba(10,10,15,0.95)',
        backdropFilter: 'blur(28px)',
        border: '1px solid rgba(201,168,76,0.15)',
        borderRadius: '20px',
        overflow: 'hidden',
      }}
    >
      {/* ── Header ── */}
      <div
        className="px-6 py-5"
        style={{ borderBottom: '1px solid rgba(201,168,76,0.08)' }}
      >
        <div className="flex items-start gap-3 mb-3">
          <div
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs"
            style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)' }}
          >
            <span style={{ color: '#C9A84C' }}>✦</span>
          </div>
          <div>
            <h2
              className="text-sm uppercase tracking-widest"
              style={{ color: '#C9A84C', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.2em' }}
            >
              LOGOS a trouvé {nombreTrouvees} source{nombreTrouvees > 1 ? 's' : ''} complémentaire{nombreTrouvees > 1 ? 's' : ''}
            </h2>
            <p
              className="text-xs mt-1"
              style={{ color: 'rgba(201,168,76,0.4)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            >
              Ces sources enrichiraient le croisement avant qu&apos;il n&apos;ait lieu.
            </p>
          </div>
        </div>

        {/* Context tags */}
        {contexte && (
          <div className="flex flex-wrap gap-2 text-xs" style={{ fontFamily: 'ui-monospace, monospace' }}>
            {contexte.domaine !== 'inconnu' && (
              <span className="px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(200,200,200,0.5)', fontSize: '0.6rem' }}>
                domaine : {DOMAIN_LABELS[contexte.domaine] || contexte.domaine}
              </span>
            )}
            {contexte.region !== 'global' && contexte.region !== 'inconnue' && (
              <span className="px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(200,200,200,0.5)', fontSize: '0.6rem' }}>
                région : {REGION_LABELS[contexte.region] || contexte.region}
              </span>
            )}
            {contexte.langueDetectee && (
              <span className="px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(200,200,200,0.5)', fontSize: '0.6rem' }}>
                langue : {contexte.langueDetectee}
              </span>
            )}
            {contexte.entitesCles.length > 0 && (
              <span className="px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(200,200,200,0.5)', fontSize: '0.6rem' }}>
                entités : {contexte.entitesCles.slice(0, 3).join(', ')}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Source list ── */}
      <div className="p-4 flex flex-col gap-2.5" style={{ maxHeight: '280px', overflowY: 'auto' }}>
        {sourcesProposees.map((source, i) => {
          const isSelected = mode === 'selection' ? selected.has(source.url) : true
          return (
            <SourceCard
              key={source.url}
              source={source}
              index={i}
              selectable={mode === 'selection'}
              selected={isSelected}
              onToggle={() => toggleSource(source.url)}
            />
          )
        })}
      </div>

      {/* ── Actions ── */}
      <div
        className="px-5 py-4 flex flex-col gap-2"
        style={{ borderTop: '1px solid rgba(201,168,76,0.08)' }}
      >
        {mode === 'overview' ? (
          <>
            {/* Enrichir et croiser */}
            <button
              onClick={() => onEnrichirEtCroiser(allUrls)}
              className="w-full py-3 rounded-lg text-xs uppercase tracking-widest transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.28))',
                border: '1px solid rgba(201,168,76,0.4)',
                color: '#C9A84C',
                fontFamily: 'Georgia, serif',
                letterSpacing: '0.18em',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 20px rgba(201,168,76,0.15)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
            >
              ✦ Enrichir et croiser ({allUrls.length + 2} sources)
            </button>

            {/* Sélectionner */}
            <button
              onClick={() => setMode('selection')}
              className="w-full py-2.5 rounded-lg text-xs transition-all duration-300"
              style={{
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(200,200,200,0.6)',
                background: 'transparent',
                fontFamily: 'ui-monospace, monospace',
                fontSize: '0.7rem',
                letterSpacing: '0.08em',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.25)'; e.currentTarget.style.color = '#C9A84C' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(200,200,200,0.6)' }}
            >
              Sélectionner les sources à ajouter
            </button>

            {/* Croiser sans enrichir */}
            <button
              onClick={onCroiserSansEnrichir}
              className="w-full py-2 text-xs transition-all duration-200"
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(100,100,100,0.6)',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'rgba(180,180,180,0.7)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(100,100,100,0.6)' }}
            >
              Croiser sans enrichir
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onSelectionnerEtCroiser(selectedUrls)}
              disabled={selectedUrls.length === 0}
              className="w-full py-3 rounded-lg text-xs uppercase tracking-widest transition-all duration-300"
              style={{
                background: selectedUrls.length > 0
                  ? 'linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.28))'
                  : 'rgba(255,255,255,0.03)',
                border: `1px solid ${selectedUrls.length > 0 ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.06)'}`,
                color: selectedUrls.length > 0 ? '#C9A84C' : '#333',
                fontFamily: 'Georgia, serif',
                letterSpacing: '0.18em',
                cursor: selectedUrls.length > 0 ? 'pointer' : 'not-allowed',
              }}
            >
              Croiser avec {selectedUrls.length} source{selectedUrls.length > 1 ? 's' : ''} sélectionnée{selectedUrls.length > 1 ? 's' : ''}
            </button>
            <button
              onClick={() => setMode('overview')}
              className="w-full py-2 text-xs"
              style={{ background: 'none', border: 'none', color: '#333', fontFamily: 'ui-monospace, monospace', cursor: 'pointer' }}
            >
              ← Retour
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Source card ────────────────────────────────────────────────────────────────

function SourceCard({
  source, index, selectable, selected, onToggle,
}: {
  source: SourceProposee
  index: number
  selectable: boolean
  selected: boolean
  onToggle: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      onClick={selectable ? onToggle : undefined}
      style={{
        background: selected ? 'rgba(201,168,76,0.04)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${selected ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.05)'}`,
        borderRadius: '12px',
        padding: '12px 14px',
        cursor: selectable ? 'pointer' : 'default',
        transition: 'all 0.2s',
        animation: `sectionReveal 0.3s ease ${index * 0.06}s both`,
      }}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox or index */}
        <div
          className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-xs"
          style={{
            background: selected ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${selected ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.08)'}`,
            color: selected ? '#C9A84C' : '#2a2a2a',
            fontFamily: 'ui-monospace, monospace',
            fontSize: '0.6rem',
            marginTop: '1px',
          }}
        >
          {selectable ? (selected ? '✓' : '') : <SourceIcon type={source.type} />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span
              className="text-xs leading-tight"
              style={{ color: '#d4c4a0', fontFamily: 'Georgia, serif', lineHeight: 1.4 }}
            >
              {source.titre}
            </span>
            {source.pertinence >= 80 && (
              <span style={{ color: 'rgba(201,168,76,0.6)', fontSize: '0.55rem', fontFamily: 'ui-monospace, monospace' }}>
                ●{source.pertinence}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mb-1">
            <RegionBadge region={source.region} isSudGlobal={source.isSudGlobal} />
            <span style={{ color: 'rgba(100,100,100,0.6)', fontSize: '0.55rem', fontFamily: 'ui-monospace, monospace' }}>
              {source.langue.toUpperCase()}
            </span>
          </div>

          <p style={{ color: 'rgba(120,120,120,0.7)', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.65rem', lineHeight: 1.5 }}>
            {source.raison}
          </p>

          {source.extrait && (
            <div className="mt-1.5">
              <button
                onClick={e => { e.stopPropagation(); setExpanded(!expanded) }}
                style={{ background: 'none', border: 'none', color: 'rgba(100,100,100,0.5)', fontSize: '0.58rem', fontFamily: 'ui-monospace, monospace', cursor: 'pointer', padding: 0 }}
              >
                {expanded ? '▲ masquer extrait' : '▼ voir extrait'}
              </button>
              {expanded && (
                <p style={{ marginTop: '6px', color: 'rgba(150,150,150,0.6)', fontSize: '0.62rem', fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.6 }}>
                  {source.extrait}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
