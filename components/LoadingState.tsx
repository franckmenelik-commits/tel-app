'use client'

import { useEffect, useState } from 'react'
import type { SouffleNiveau } from '@/lib/types'

// Loading phases — map to SOUFFLE levels
const PHASES: { texte: string; niveau: SouffleNiveau }[] = [
  { texte: 'LOGOS écoute les vécus…',         niveau: 1 },
  { texte: 'LOGOS lit les géographies…',       niveau: 1 },
  { texte: 'LOGOS traverse les cultures…',     niveau: 2 },
  { texte: 'LOGOS détecte les patterns…',      niveau: 2 },
  { texte: "LOGOS nomme l'indicible…",         niveau: 3 },
  { texte: 'LOGOS formule la question…',       niveau: 3 },
  { texte: 'LOGOS calcule la confiance…',      niveau: 2 },
]

interface LoadingStateProps {
  niveauxActifs?: SouffleNiveau[]
  // Optional SSE message
  message?: string
}

export default function LoadingState({ niveauxActifs = [1], message }: LoadingStateProps) {
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const [dots, setDots] = useState('')

  // Filter phases to matching active levels
  const phasesVisibles = PHASES.filter((p) => niveauxActifs.includes(p.niveau))
  const phases = phasesVisibles.length > 0 ? phasesVisibles : PHASES.slice(0, 2)

  // Animate phase text
  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setPhaseIndex((i) => (i + 1) % phases.length)
        setVisible(true)
      }, 320)
    }, 2400)
    return () => clearInterval(interval)
  }, [phases.length])

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.')
    }, 500)
    return () => clearInterval(interval)
  }, [])

  const niveauCourant = phases[phaseIndex]?.niveau ?? 1

  const LEVEL_LABELS: Record<SouffleNiveau, string> = {
    1: "L'Écoute",
    2: 'La Traversée',
    3: 'La Révélation',
  }

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-12">

      {/* ── Pulsing orb ── */}
      <div className="relative w-24 h-24">
        {/* Outer rings */}
        <div
          className="absolute inset-0 rounded-full border animate-ping"
          style={{ borderColor: 'rgba(201,168,76,0.15)', animationDuration: '2.5s' }}
        />
        <div
          className="absolute inset-2 rounded-full border animate-ping"
          style={{ borderColor: 'rgba(201,168,76,0.25)', animationDuration: '2.5s', animationDelay: '0.4s' }}
        />
        <div
          className="absolute inset-4 rounded-full border animate-ping"
          style={{ borderColor: 'rgba(201,168,76,0.35)', animationDuration: '2.5s', animationDelay: '0.8s' }}
        />
        {/* Core */}
        <div
          className="absolute inset-7 rounded-full"
          style={{
            background: 'radial-gradient(circle at 38% 33%, #F5ECD7 0%, #C9A84C 60%, #8B6914 100%)',
            boxShadow: '0 0 20px rgba(201,168,76,0.5), 0 0 40px rgba(201,168,76,0.2)',
            animation: 'pulse 1.8s ease-in-out infinite',
          }}
        />
      </div>

      {/* ── LOGOS indicator ── */}
      <div className="flex flex-col items-center gap-3">
        <span
          className="text-xs uppercase tracking-widest"
          style={{ color: '#2a2a2a', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.35em' }}
        >
          LOGOS
        </span>

        {/* Level dots */}
        <div className="flex gap-2.5 items-center">
          {([1, 2, 3] as SouffleNiveau[]).map((n) => {
            const actif = niveauxActifs.includes(n)
            const courant = n === niveauCourant
            return (
              <div key={n} className="flex flex-col items-center gap-1">
                <div
                  className="rounded-full transition-all duration-500"
                  style={{
                    width: courant ? '10px' : '6px',
                    height: courant ? '10px' : '6px',
                    background: !actif
                      ? 'rgba(255,255,255,0.04)'
                      : courant
                      ? '#C9A84C'
                      : 'rgba(201,168,76,0.3)',
                    boxShadow: courant ? '0 0 10px rgba(201,168,76,0.7)' : 'none',
                    animation: courant && actif ? 'pulse 1.2s ease-in-out infinite' : 'none',
                  }}
                />
              </div>
            )
          })}
        </div>

        {/* Current level label */}
        <span
          className="text-xs transition-all duration-300"
          style={{ color: '#2a2a2a', fontFamily: 'ui-monospace, monospace', minHeight: '16px' }}
        >
          {LEVEL_LABELS[niveauCourant]}
        </span>
      </div>

      {/* ── Phase text ── */}
      <div className="h-8 flex items-center justify-center px-4">
        <p
          className="text-sm text-center tracking-wide"
          style={{
            color: '#C9A84C',
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.32s ease',
          }}
        >
          {message || phases[phaseIndex]?.texte}{dots}
        </p>
      </div>

      {/* ── Wittgenstein ── */}
      <p
        className="text-xs text-center max-w-xs leading-relaxed"
        style={{ color: '#1a1a1a', fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.7 }}
      >
        &ldquo;Les limites de mon langage sont les limites de mon monde.&rdquo;
        <br />
        <span style={{ color: '#141414' }}>— Wittgenstein</span>
      </p>
    </div>
  )
}
