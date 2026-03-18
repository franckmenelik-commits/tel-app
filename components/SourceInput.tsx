'use client'

import { useState, useCallback, useRef } from 'react'
import type { SouffleContexte } from '@/lib/types'
import { detectInputMode, getModeLabel } from '@/lib/detect-mode'
import type { InputMode } from '@/lib/detect-mode'

interface SourceInputProps {
  onCross: (inputs: string[], contexte: SouffleContexte) => void
  isLoading: boolean
}

// Source type icon/color by URL
function detectUrlMeta(url: string): { icon: string; color: string; label: string } {
  const u = url.toLowerCase()
  if (u.includes('youtube.com') || u.includes('youtu.be'))
    return { icon: '▶', color: 'rgba(201,168,76,0.9)', label: 'YouTube' }
  if (u.includes('wikipedia.org'))
    return { icon: 'W', color: 'rgba(180,200,220,0.9)', label: 'Wikipedia' }
  if (u.includes('instagram.com'))
    return { icon: '◈', color: 'rgba(200,150,200,0.9)', label: 'Instagram' }
  if (u.includes('.pdf'))
    return { icon: '▣', color: 'rgba(180,180,120,0.9)', label: 'Document' }
  if (u.startsWith('http'))
    return { icon: '○', color: 'rgba(150,150,180,0.9)', label: 'Article' }
  return { icon: '·', color: 'rgba(80,80,80,0.9)', label: 'URL' }
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
    case 'url': return 'rgba(150,150,180,0.9)'
    case 'free_text': return 'rgba(180,200,180,0.9)'
    case 'keyword': return 'rgba(201,168,76,0.9)'
    case 'crossing': return 'rgba(220,160,120,0.9)'
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
  const [inputs, setInputs] = useState<string[]>(['', ''])
  const [contexte, setContexte] = useState<SouffleContexte>('exploration')
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
    const validInputs = inputs
      .map(i => i.trim())
      .filter(i => i.length > 0)

    if (validInputs.length < 1) {
      setError('Entrez au moins une source, un mot-clé, ou un croisement (A × B).')
      return
    }

    // Single keyword auto-expands to Wikipedia FR + EN (2 sources) — valid.
    // Single crossing "A × B" uses LOGOS direct knowledge — valid.
    // No early-return needed; let the API validate source count after resolution.

    setError(null)
    onCross(validInputs, contexte)
  }, [inputs, contexte, onCross])

  const contexteChoisi = CONTEXTES.find((c) => c.value === contexte)!
  const nonEmptyCount = inputs.filter(i => i.trim().length > 0).length

  return (
    <div className="w-full max-w-2xl mx-auto">

      {/* ── Mode explanation bar ── */}
      <div
        className="flex flex-wrap gap-3 mb-4 text-xs"
        style={{ color: '#2a2a2a', fontFamily: 'ui-monospace, monospace' }}
      >
        {[
          { mode: 'url' as InputMode, example: 'youtube.com/…' },
          { mode: 'keyword' as InputMode, example: 'décolonisation' },
          { mode: 'crossing' as InputMode, example: 'Darwin × bouddhisme' },
          { mode: 'free_text' as InputMode, example: 'Texte (>50 mots)' },
        ].map(({ mode, example }) => (
          <span key={mode} className="flex items-center gap-1" style={{ color: getModeColor(mode) }}>
            <span>{getModeIcon(mode)}</span>
            <span style={{ color: '#222' }}>{getModeLabel(mode)}</span>
            <span style={{ color: '#1a1a1a' }}>— {example}</span>
          </span>
        ))}
      </div>

      {/* ── Source inputs ── */}
      <div className="flex flex-col gap-2.5 mb-3">
        {inputs.map((input, i) => {
          const trimmed = input.trim()
          const detected = trimmed ? detectInputMode(trimmed) : null
          const isUrl = detected?.mode === 'url'
          const urlMeta = isUrl ? detectUrlMeta(trimmed) : null
          const modeColor = detected ? getModeColor(detected.mode) : 'rgba(255,255,255,0.06)'
          const isValid = trimmed.length > 0

          return (
            <div key={i} className="relative group flex items-start gap-2">
              {/* Mode badge */}
              <div
                className="flex-shrink-0 w-7 h-7 mt-1 rounded-full flex items-center justify-center text-xs transition-all duration-300"
                style={{
                  background: isValid ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.03)',
                  color: isValid ? (urlMeta?.color ?? modeColor) : '#1a1a1a',
                  border: `1px solid ${isValid ? 'rgba(201,168,76,0.25)' : 'rgba(255,255,255,0.06)'}`,
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: '0.65rem',
                }}
              >
                {detected
                  ? (isUrl ? urlMeta!.icon : getModeIcon(detected.mode))
                  : String(i + 1)}
              </div>

              {/* Input — textarea for free_text, input for others */}
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
                className="flex-1 px-3 py-2 text-xs rounded-lg outline-none transition-all duration-300 font-mono resize-none"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: `1px solid ${isValid ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.07)'}`,
                  color: isValid ? '#e8e8e8' : '#444',
                  lineHeight: 1.6,
                  minHeight: detected?.mode === 'free_text' ? '96px' : '36px',
                }}
                onKeyDown={(e) => {
                  // Enter in single-line mode submits (not for free_text)
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
                    className="text-xs px-1.5 py-0.5 rounded hidden sm:block whitespace-nowrap"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      color: urlMeta?.color ?? modeColor,
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: '0.58rem',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {isUrl ? urlMeta!.label : getModeLabel(detected.mode)}
                  </span>
                  {detected.mode === 'crossing' && detected.crossingTerms && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded hidden sm:block whitespace-nowrap"
                      style={{
                        color: '#2a2a2a',
                        fontFamily: 'ui-monospace, monospace',
                        fontSize: '0.55rem',
                      }}
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
                  className="absolute -right-5 top-2 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs"
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
          className="w-full py-2 text-xs rounded-lg mb-4 transition-all duration-300"
          style={{
            color: '#1f1f1f',
            border: '1px dashed rgba(255,255,255,0.06)',
            background: 'transparent',
            fontFamily: 'ui-monospace, monospace',
            letterSpacing: '0.12em',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(201,168,76,0.2)'
            e.currentTarget.style.color = '#C9A84C'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
            e.currentTarget.style.color = '#1f1f1f'
          }}
        >
          + ajouter une source
        </button>
      )}

      {/* ── Contexte SOUFFLE ── */}
      <div className="mb-5">
        <button
          onClick={() => setShowContexte(!showContexte)}
          className="flex items-center gap-2 text-xs transition-all duration-200"
          style={{
            color: showContexte ? '#C9A84C' : '#2a2a2a',
            background: 'none',
            border: 'none',
            fontFamily: 'ui-monospace, monospace',
            letterSpacing: '0.1em',
            cursor: 'pointer',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              transform: showContexte ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          >
            ▶
          </span>
          <span>Contexte SOUFFLE</span>
          <span
            style={{
              color: contexteChoisi.niveaux === '•••'
                ? '#C9A84C'
                : contexteChoisi.niveaux === '••'
                ? 'rgba(201,168,76,0.55)'
                : 'rgba(255,255,255,0.12)',
              letterSpacing: '0.05em',
            }}
          >
            {contexteChoisi.niveaux}
          </span>
          <span style={{ color: '#1f1f1f' }}>— {contexteChoisi.label}</span>
        </button>

        {showContexte && (
          <div
            className="mt-2 p-3 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <p
              className="text-xs mb-3"
              style={{ color: '#2a2a2a', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            >
              Le contexte détermine le niveau SOUFFLE activé — et la profondeur du croisement.
            </p>
            <div className="flex flex-col gap-1.5">
              {CONTEXTES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => { setContexte(c.value); setShowContexte(false) }}
                  className="flex items-center gap-3 px-3 py-2 rounded text-left transition-all duration-200"
                  style={{
                    background: contexte === c.value ? 'rgba(201,168,76,0.07)' : 'transparent',
                    border: `1px solid ${contexte === c.value ? 'rgba(201,168,76,0.2)' : 'transparent'}`,
                    cursor: 'pointer',
                  }}
                >
                  <span
                    className="text-xs w-6 flex-shrink-0"
                    style={{
                      color: c.niveaux === '•••' ? '#C9A84C' : c.niveaux === '••' ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.12)',
                    }}
                  >
                    {c.niveaux}
                  </span>
                  <div>
                    <p
                      className="text-xs"
                      style={{
                        color: contexte === c.value ? '#F5ECD7' : '#666',
                        fontFamily: 'Georgia, serif',
                      }}
                    >
                      {c.label}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: '#1f1f1f', fontFamily: 'ui-monospace, monospace' }}
                    >
                      {c.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <p
          className="text-xs text-center mb-4"
          style={{ color: '#8B3A3A', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
        >
          {error}
        </p>
      )}

      {/* ── Cross button ── */}
      <button
        onClick={handleCross}
        disabled={isLoading}
        className="w-full py-4 rounded-lg text-sm uppercase tracking-widest transition-all duration-300"
        style={{
          background: isLoading
            ? 'rgba(201,168,76,0.04)'
            : 'linear-gradient(135deg, rgba(201,168,76,0.1), rgba(201,168,76,0.2))',
          border: '1px solid rgba(201,168,76,0.35)',
          color: isLoading ? 'rgba(201,168,76,0.3)' : '#C9A84C',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          letterSpacing: '0.2em',
          fontFamily: 'Georgia, serif',
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(201,168,76,0.18), rgba(201,168,76,0.32))'
            e.currentTarget.style.boxShadow = '0 0 24px rgba(201,168,76,0.12)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(201,168,76,0.1), rgba(201,168,76,0.2))'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        {isLoading ? '— LOGOS travaille —' : 'Croiser les vécus'}
      </button>

      {/* ── Status ── */}
      <p
        className="text-center text-xs mt-3"
        style={{ color: '#151515', fontFamily: 'ui-monospace, monospace' }}
      >
        {nonEmptyCount} source{nonEmptyCount !== 1 ? 's' : ''}
        {inputs.length > nonEmptyCount && (
          <span style={{ color: '#0f0f0f' }}> · {inputs.length - nonEmptyCount} en attente</span>
        )}
      </p>
    </div>
  )
}
