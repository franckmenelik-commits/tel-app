'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { SouffleContexte } from '@/lib/types'
import { detectInputMode, getModeLabel } from '@/lib/detect-mode'
import type { InputMode } from '@/lib/detect-mode'

interface SourceInputProps {
  onCross: (inputs: string[], contexte: SouffleContexte) => void
  isLoading: boolean
}

function detectUrlMeta(url: string): { icon: string; color: string; label: string } {
  const u = url.toLowerCase()
  if (u.includes('youtube.com') || u.includes('youtu.be'))
    return { icon: '▶', color: '#C9A84C', label: 'YouTube' }
  if (u.includes('wikipedia.org'))
    return { icon: 'W', color: '#7AABB5', label: 'Wikipedia' }
  if (u.includes('instagram.com'))
    return { icon: '◈', color: '#9898CC', label: 'Instagram' }
  if (u.includes('.pdf'))
    return { icon: '▣', color: '#888', label: 'Document' }
  if (u.startsWith('http'))
    return { icon: '○', color: '#888', label: 'Article' }
  return { icon: '·', color: '#444', label: 'URL' }
}

function getModeIcon(mode: InputMode): string {
  switch (mode) {
    case 'url': return '○'
    case 'free_text': return '❝'
    case 'keyword': return '⊕'
    case 'crossing': return '×'
  }
}

function getModeColor(mode: InputMode): string {
  switch (mode) {
    case 'url': return '#888'
    case 'free_text': return '#888'
    case 'keyword': return '#C9A84C'
    case 'crossing': return '#C9A84C'
  }
}

const CONTEXTES: { value: SouffleContexte; label: string; niveaux: string; description: string }[] = [
  { value: 'exploration', label: 'Exploration', niveaux: '•', description: 'Découverte libre, 2 sources' },
  { value: 'culturel_profond', label: 'Croisement profond', niveaux: '••', description: '3+ sources, complexité culturelle' },
  { value: 'institutionnel', label: 'Décision institutionnelle', niveaux: '•••', description: 'Politique, organisation, gouvernance' },
  { value: 'langue_en_danger', label: 'Langue en danger', niveaux: '•••', description: 'Langues menacées, mémoire culturelle' },
  { value: 'vecu_traumatique', label: 'Vécu fragile', niveaux: '•••', description: 'Mémoire douloureuse, dignité humaine' },
]

export default function SourceInput({ onCross, isLoading }: SourceInputProps) {
  const [mode, setMode] = useState<'cross' | 'resonate'>('cross')
  const [vecu, setVecu] = useState('')
  const [resonanceResult, setResonanceResult] = useState<null | {
    structureProfonde: string
    resonances: { titre: string; contexte: string; lienStructurel: string; difference: string }[]
    revelationCroisee: string
    questionInexposee: string
    indicible: string
  }>(null)
  const [resonanceLoading, setResonanceLoading] = useState(false)
  const [resonanceError, setResonanceError] = useState<string | null>(null)

  const [inputs, setInputs] = useState<string[]>(['', ''])
  const [contexte, setContexte] = useState<SouffleContexte>('exploration')

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('tel:approfondir')
      if (stored) {
        const urls = JSON.parse(stored) as string[]
        sessionStorage.removeItem('tel:approfondir')
        if (Array.isArray(urls) && urls.length > 0) {
          setInputs(urls.length >= 2 ? urls : [...urls, ''])
        }
      }
    } catch { /* ok */ }
  }, [])

  const [error, setError] = useState<string | null>(null)
  const [showContexte, setShowContexte] = useState(false)
  const inputRefs = useRef<(HTMLTextAreaElement | null)[]>([])

  const updateInput = useCallback((index: number, value: string) => {
    setInputs(prev => {
      const next = [...prev]
      next[index] = value
      return next
    })
    setError(null)
  }, [])

  const addSource = useCallback(() => {
    setInputs(prev => [...prev, ''])
  }, [])

  const removeSource = useCallback((index: number) => {
    setInputs(prev => {
      if (prev.length <= 2) return prev
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  const handlePaste = useCallback((index: number, e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').trim()
    updateInput(index, text)
  }, [updateInput])

  const handleCross = useCallback(() => {
    const validInputs = inputs.map(i => i.trim()).filter(i => i.length > 0)
    if (validInputs.length < 1) {
      setError('Entrez au moins une source, un mot-clé, ou un croisement (A × B).')
      return
    }
    setError(null)
    onCross(validInputs, contexte)
  }, [inputs, contexte, onCross])

  const contexteChoisi = CONTEXTES.find((c) => c.value === contexte)!
  const nonEmptyCount = inputs.filter(i => i.trim().length > 0).length

  async function handleResonate() {
    if (vecu.trim().length < 30) {
      setResonanceError('Décrivez votre vécu en au moins 30 caractères.')
      return
    }
    setResonanceError(null)
    setResonanceResult(null)
    setResonanceLoading(true)
    try {
      const res = await fetch('/api/resonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vecu: vecu.trim() }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Erreur')
      setResonanceResult(data.result)
    } catch (err) {
      setResonanceError(err instanceof Error ? err.message : 'Erreur réseau')
    } finally {
      setResonanceLoading(false)
    }
  }

  const GOLD = '#C9A84C'
  const BORDER = 'rgba(255,255,255,0.071)'
  const SURFACE = 'rgba(255,255,255,0.025)'

  return (
    <div className="w-full max-w-2xl mx-auto">

      {/* ── Mode tabs ── */}
      <div className="flex gap-1 mb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.047)', paddingBottom: '0' }}>
        {([
          { key: 'cross', label: 'Croiser des sources' },
          { key: 'resonate', label: '◎ Mon vécu' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => { setMode(tab.key); setResonanceResult(null); setResonanceError(null) }}
            style={{
              padding: '8px 16px',
              fontSize: '12px',
              background: 'none',
              border: 'none',
              borderBottom: mode === tab.key ? `2px solid ${GOLD}` : '2px solid transparent',
              color: mode === tab.key ? GOLD : '#444',
              cursor: 'pointer',
              transition: 'all 200ms ease',
              marginBottom: '-1px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Mode Croise-moi ── */}
      {mode === 'resonate' && (
        <div>
          <p style={{ fontSize: '12px', color: '#444', lineHeight: 1.6, marginBottom: '16px', fontStyle: 'italic' }}>
            Décrivez votre situation, votre expérience, ou ce que vous traversez. TEL trouvera des résonances dans la mémoire du monde.
          </p>
          <textarea
            value={vecu}
            onChange={e => { setVecu(e.target.value); setResonanceError(null) }}
            rows={5}
            placeholder="Décrivez votre situation, votre expérience, ou ce que vous traversez…"
            disabled={resonanceLoading}
            style={{
              width: '100%',
              padding: '14px 16px',
              fontSize: '14px',
              background: SURFACE,
              border: `1px solid ${vecu.trim() ? 'rgba(201,168,76,0.25)' : BORDER}`,
              borderRadius: '8px',
              color: '#e0e0e0',
              lineHeight: 1.7,
              resize: 'vertical' as const,
              outline: 'none',
              fontFamily: 'Georgia, Times New Roman, serif',
              marginBottom: '12px',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)' }}
            onBlur={e => { e.currentTarget.style.borderColor = vecu.trim() ? 'rgba(201,168,76,0.25)' : BORDER }}
          />
          {resonanceError && (
            <p style={{ fontSize: '12px', color: '#8B3A3A', fontStyle: 'italic', marginBottom: '10px' }}>{resonanceError}</p>
          )}
          <button
            onClick={handleResonate}
            disabled={resonanceLoading}
            style={{
              width: '100%',
              padding: '12px',
              background: resonanceLoading ? 'rgba(201,168,76,0.04)' : GOLD,
              border: resonanceLoading ? '1px solid rgba(201,168,76,0.15)' : 'none',
              color: resonanceLoading ? 'rgba(201,168,76,0.3)' : '#09090b',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: resonanceLoading ? 'not-allowed' : 'pointer',
              transition: 'all 200ms ease',
              marginBottom: '24px',
            }}
          >
            {resonanceLoading ? 'Recherche de résonances dans le monde…' : 'Trouver des résonances'}
          </button>

          {/* Résultat */}
          {resonanceResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Structure profonde */}
              <div style={{ padding: '20px', borderRadius: '8px', background: SURFACE, border: '1px solid rgba(201,168,76,0.12)' }}>
                <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: GOLD, opacity: 0.7, marginBottom: '10px' }}>
                  Structure profonde de votre vécu
                </p>
                <p style={{ fontSize: '14px', lineHeight: 1.75, color: '#e0e0e0', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                  {resonanceResult.structureProfonde}
                </p>
              </div>

              {/* Résonances */}
              {resonanceResult.resonances.map((r, i) => (
                <div key={i} style={{ padding: '20px', borderRadius: '8px', background: SURFACE, border: `1px solid ${BORDER}` }}>
                  <p style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#666', marginBottom: '6px' }}>
                    Résonance {i + 1} — {r.contexte}
                  </p>
                  <p style={{ fontSize: '15px', color: '#e0e0e0', fontWeight: 500, marginBottom: '10px' }}>{r.titre}</p>
                  <p style={{ fontSize: '13px', lineHeight: 1.7, color: '#aaa', marginBottom: '8px' }}>
                    <span style={{ color: GOLD, opacity: 0.7, marginRight: '6px' }}>Ce qui résonne :</span>
                    {r.lienStructurel}
                  </p>
                  <p style={{ fontSize: '13px', lineHeight: 1.7, color: '#666', fontStyle: 'italic' }}>
                    <span style={{ opacity: 0.7, marginRight: '6px' }}>Ce qui diffère :</span>
                    {r.difference}
                  </p>
                </div>
              ))}

              {/* Révélation */}
              <div style={{ padding: '20px', borderRadius: '8px', background: 'rgba(201,168,76,0.03)', border: '1px solid rgba(201,168,76,0.12)' }}>
                <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: GOLD, opacity: 0.7, marginBottom: '10px' }}>
                  Ce que ce croisement révèle
                </p>
                <p style={{ fontSize: '14px', lineHeight: 1.75, color: '#e0e0e0', fontFamily: 'Georgia, serif' }}>
                  {resonanceResult.revelationCroisee}
                </p>
              </div>

              {/* Question */}
              <div style={{ padding: '20px', borderRadius: '8px', background: 'rgba(255,255,255,0.015)', border: `1px solid ${BORDER}` }}>
                <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: GOLD, opacity: 0.7, marginBottom: '10px' }}>
                  Question inexposée
                </p>
                <p style={{ fontSize: '15px', lineHeight: 1.75, color: '#f0f0f0', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                  {resonanceResult.questionInexposee}
                </p>
              </div>

              {/* Indicible */}
              <p style={{ fontSize: '12px', color: '#444', fontStyle: 'italic', lineHeight: 1.6, textAlign: 'center' as const, padding: '0 16px' }}>
                {resonanceResult.indicible}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Mode croisement (normal) ── */}
      {mode === 'cross' && <>

      {/* ── Mode hints ── */}
      <div className="flex flex-wrap gap-3 mb-5" style={{ fontSize: '11px', color: '#333' }}>
        {[
          { mode: 'url' as InputMode, example: 'youtube.com/…' },
          { mode: 'keyword' as InputMode, example: 'décolonisation' },
          { mode: 'crossing' as InputMode, example: 'Darwin × bouddhisme' },
          { mode: 'free_text' as InputMode, example: 'Texte (>50 mots)' },
        ].map(({ mode, example }) => (
          <span key={mode} className="flex items-center gap-1">
            <span style={{ color: getModeColor(mode) }}>{getModeIcon(mode)}</span>
            <span style={{ color: '#444' }}>{getModeLabel(mode)}</span>
            <span style={{ color: '#2a2a2a' }}>— {example}</span>
          </span>
        ))}
      </div>

      {/* ── Source inputs ── */}
      <div className="flex flex-col gap-2 mb-3">
        {inputs.map((input, i) => {
          const trimmed = input.trim()
          const detected = trimmed ? detectInputMode(trimmed) : null
          const isUrl = detected?.mode === 'url'
          const urlMeta = isUrl ? detectUrlMeta(trimmed) : null
          const isValid = trimmed.length > 0

          return (
            <div key={i} className="relative group flex items-start gap-2">
              {/* Mode badge */}
              <div
                className="flex-shrink-0 w-7 h-7 mt-1 rounded-full flex items-center justify-center text-xs"
                style={{
                  background: isValid ? 'rgba(201,168,76,0.06)' : 'rgba(255,255,255,0.025)',
                  color: isValid ? (urlMeta?.color ?? getModeColor(detected?.mode ?? 'keyword')) : '#2a2a2a',
                  border: `1px solid ${isValid ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.047)'}`,
                  fontSize: '0.65rem',
                  transition: 'all 200ms ease',
                }}
              >
                {detected
                  ? (isUrl ? urlMeta!.icon : getModeIcon(detected.mode))
                  : String(i + 1)}
              </div>

              {/* Input */}
              <textarea
                ref={(el) => { inputRefs.current[i] = el }}
                value={input}
                onChange={(e) => updateInput(i, e.target.value)}
                onPaste={(e) => handlePaste(i, e)}
                rows={detected?.mode === 'free_text' ? 4 : 1}
                placeholder={
                  i === 0
                    ? 'URL, mot-clé, "A × B", ou témoignage direct (>50 mots)…'
                    : i === 1
                    ? 'Deuxième source — le vécu à croiser'
                    : `Source ${i + 1}`
                }
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  fontSize: '13px',
                  background: 'rgba(255,255,255,0.025)',
                  border: `1px solid ${isValid ? 'rgba(201,168,76,0.25)' : 'rgba(255,255,255,0.071)'}`,
                  borderRadius: '8px',
                  color: isValid ? '#e0e0e0' : '#444',
                  lineHeight: 1.6,
                  minHeight: detected?.mode === 'free_text' ? '96px' : '38px',
                  resize: 'none',
                  outline: 'none',
                  transition: 'border-color 200ms ease',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)' }}
                onBlur={e => { e.currentTarget.style.borderColor = isValid ? 'rgba(201,168,76,0.25)' : 'rgba(255,255,255,0.071)' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && detected?.mode !== 'free_text') {
                    e.preventDefault()
                    if (i < inputs.length - 1) {
                      inputRefs.current[i + 1]?.focus()
                    } else {
                      handleCross()
                    }
                  }
                }}
              />

              {/* Type label */}
              {isValid && detected && (
                <div className="flex-shrink-0 flex flex-col items-end gap-1 mt-1">
                  <span
                    className="hidden sm:block whitespace-nowrap"
                    style={{
                      fontSize: '10px', padding: '3px 6px', borderRadius: '4px',
                      background: 'rgba(255,255,255,0.025)',
                      color: urlMeta?.color ?? getModeColor(detected.mode),
                      letterSpacing: '0.06em',
                    }}
                  >
                    {isUrl ? urlMeta!.label : getModeLabel(detected.mode)}
                  </span>
                  {detected.mode === 'crossing' && detected.crossingTerms && (
                    <span
                      className="hidden sm:block whitespace-nowrap"
                      style={{ color: '#2a2a2a', fontSize: '10px' }}
                    >
                      {detected.crossingTerms[0]} × {detected.crossingTerms[1]}
                    </span>
                  )}
                </div>
              )}

              {/* Remove button */}
              {inputs.length > 2 && !isLoading && (
                <button
                  onClick={() => removeSource(i)}
                  className="absolute -right-5 top-2 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{
                    background: 'rgba(100,40,40,0.4)',
                    color: '#8B3A3A',
                    border: '1px solid rgba(139,58,58,0.3)',
                    fontSize: '0.6rem',
                  }}
                >
                  ×
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Add source ── */}
      {!isLoading && (
        <button
          onClick={addSource}
          className="w-full py-2 text-xs mb-4"
          style={{
            color: '#333',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '12px',
            transition: 'color 200ms ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#666' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#333' }}
        >
          + ajouter une source
        </button>
      )}

      {/* ── Contexte SOUFFLE ── */}
      <div className="mb-5">
        <button
          onClick={() => setShowContexte(!showContexte)}
          className="flex items-center gap-2"
          style={{
            color: showContexte ? '#C9A84C' : '#333',
            background: 'none', border: 'none',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'color 200ms ease',
          }}
        >
          <span style={{ display: 'inline-block', transform: showContexte ? 'rotate(90deg)' : 'none', transition: 'transform 200ms ease', fontSize: '8px' }}>▶</span>
          <span>Contexte SOUFFLE</span>
          <span style={{
            color: contexteChoisi.niveaux === '•••' ? '#C9A84C'
              : contexteChoisi.niveaux === '••' ? 'rgba(201,168,76,0.55)'
              : 'rgba(255,255,255,0.15)',
            letterSpacing: '0.05em',
          }}>
            {contexteChoisi.niveaux}
          </span>
          <span style={{ color: '#222' }}>— {contexteChoisi.label}</span>
        </button>

        {showContexte && (
          <div className="mt-2 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.047)' }}>
            <p style={{ fontSize: '12px', color: '#333', fontStyle: 'italic', marginBottom: '10px', lineHeight: 1.6 }}>
              Le contexte détermine le niveau SOUFFLE activé.
            </p>
            <div className="flex flex-col gap-1">
              {CONTEXTES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => { setContexte(c.value); setShowContexte(false) }}
                  className="flex items-center gap-3 px-3 py-2 rounded text-left"
                  style={{
                    background: contexte === c.value ? 'rgba(201,168,76,0.06)' : 'transparent',
                    border: `1px solid ${contexte === c.value ? 'rgba(201,168,76,0.15)' : 'transparent'}`,
                    cursor: 'pointer',
                    borderRadius: '6px',
                    transition: 'all 200ms ease',
                  }}
                >
                  <span style={{
                    fontSize: '11px', width: '20px', flexShrink: 0,
                    color: c.niveaux === '•••' ? '#C9A84C' : c.niveaux === '••' ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.15)',
                  }}>
                    {c.niveaux}
                  </span>
                  <div>
                    <p style={{ fontSize: '13px', color: contexte === c.value ? '#e0e0e0' : '#555' }}>{c.label}</p>
                    <p style={{ fontSize: '11px', color: '#2a2a2a' }}>{c.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <p style={{ fontSize: '12px', color: '#8B3A3A', fontStyle: 'italic', textAlign: 'center', marginBottom: '12px' }}>
          {error}
        </p>
      )}

      {/* ── Cross button ── */}
      <button
        onClick={handleCross}
        disabled={isLoading}
        className="w-full py-3 rounded-lg text-sm"
        style={{
          background: isLoading ? 'rgba(201,168,76,0.04)' : '#C9A84C',
          border: isLoading ? '1px solid rgba(201,168,76,0.15)' : 'none',
          color: isLoading ? 'rgba(201,168,76,0.3)' : '#09090b',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontWeight: 500,
          fontSize: '14px',
          borderRadius: '6px',
          transition: 'all 200ms ease',
        }}
        onMouseEnter={(e) => {
          if (!isLoading) e.currentTarget.style.background = '#d4b05a'
        }}
        onMouseLeave={(e) => {
          if (!isLoading) e.currentTarget.style.background = '#C9A84C'
        }}
      >
        {isLoading ? '— LOGOS travaille —' : nonEmptyCount === 1 ? 'Laisser TEL vous surprendre' : 'Croiser les vécus'}
      </button>

      {/* ── Status ── */}
      <p style={{ textAlign: 'center', fontSize: '11px', color: '#222', marginTop: '10px' }}>
        {nonEmptyCount} source{nonEmptyCount !== 1 ? 's' : ''}
        {inputs.length > nonEmptyCount && (
          <span style={{ color: '#1a1a1a' }}> · {inputs.length - nonEmptyCount} en attente</span>
        )}
      </p>

      </> /* end mode === 'cross' */}
    </div>
  )
}
