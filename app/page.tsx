'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import SourceInput from '@/components/SourceInput'
import LoadingState from '@/components/LoadingState'
import InsightCard from '@/components/InsightCard'
import EnrichissementPanel from '@/components/EnrichissementPanel'
import type {
  InsightCard as InsightCardType,
  MapPoint,
  MapArc,
  CrossResult,
  SouffleContexte,
  SouffleNiveau,
  SessionCrossing,
  SSEEvent,
  AnglesMortsAnalyse,
  Resonance,
  EnrichissementProposal,
} from '@/lib/types'
import { detecterResonances, sauvegarderSession, chargerSession } from '@/lib/memoire'

// Canvas — no SSR
const LiveMap = dynamic(() => import('@/components/LiveMap'), { ssr: false })

type AppState = 'idle' | 'analysing' | 'enrichissement' | 'loading' | 'result' | 'error'

// ── Hero rotating fragments ───────────────────────────────────────────────────
const HERO_FRAGMENTS = [
  'Il y a des vécus qui ne se rencontreront jamais.',
  'Deux mille langues menacées de disparaître.',
  'Chacune contient une façon unique de voir la douleur.',
  'Un pêcheur au Bangladesh. Une chirurgienne au Mali.',
  'Félix Moumié n\'a jamais rencontré Ambedkar.',
  'Pourtant ils portaient la même blessure.',
  'Les limites de mon langage sont les limites de mon monde.',
  'Babel a dispersé les langages.',
]

// ── SSE streaming reader ──────────────────────────────────────────────────────
async function readSSEStream(
  response: Response,
  onEvent: (event: SSEEvent) => void
): Promise<void> {
  const reader = response.body?.getReader()
  if (!reader) throw new Error('No readable stream')

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const event: SSEEvent = JSON.parse(line.slice(6))
          onEvent(event)
        } catch {
          // ignore malformed SSE
        }
      }
    }
  }
}

export default function TELPage() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [currentCard, setCurrentCard] = useState<InsightCardType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([])
  const [mapArcs, setMapArcs] = useState<MapArc[]>([])
  const [souffleNiveaux, setSouffleNiveaux] = useState<SouffleNiveau[]>([1])
  const [loadingMessage, setLoadingMessage] = useState<string | undefined>()
  const [heroIndex, setHeroIndex] = useState(0)
  const [sessionHistory, setSessionHistory] = useState<SessionCrossing[]>([])
  const [showSidebar, setShowSidebar] = useState(false)
  const [showingSidebar, setShowingSidebar] = useState(false)
  const [currentResonances, setCurrentResonances] = useState<Resonance[]>([])
  const [enrichissementProposal, setEnrichissementProposal] = useState<EnrichissementProposal | null>(null)
  const [pendingInputs, setPendingInputs] = useState<string[]>([])
  const [pendingContexte, setPendingContexte] = useState<SouffleContexte>('exploration')

  // Ref to track sessionHistory inside callbacks
  const sessionHistoryRef = useRef<SessionCrossing[]>([])
  sessionHistoryRef.current = sessionHistory

  // ── Load session from localStorage on mount ───────────────────────────────
  useEffect(() => {
    const saved = chargerSession()
    if (saved.length > 0) {
      setSessionHistory(saved)
    }
  }, [])

  // Auto-rotate hero
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex(i => (i + 1) % HERO_FRAGMENTS.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Show sidebar hint after first crossing
  useEffect(() => {
    if (sessionHistory.length === 1) {
      setShowSidebar(true)
    }
  }, [sessionHistory.length])

  // ── Step 1: User submits inputs → analyse + enrichissement ───────────────
  const handleCross = useCallback(
    async (inputs: string[], contexte: SouffleContexte) => {
      setAppState('analysing')
      setError(null)
      setCurrentCard(null)
      setCurrentResonances([])
      setPendingInputs(inputs)
      setPendingContexte(contexte)

      try {
        const enrichRes = await fetch('/api/enrichir', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inputs }),
        })

        if (enrichRes.ok) {
          const proposal: EnrichissementProposal = await enrichRes.json()
          // Only show enrichissement panel if there are useful proposals
          if (proposal.sourcesProposees && proposal.sourcesProposees.length > 0) {
            setEnrichissementProposal(proposal)
            setAppState('enrichissement')
            return
          }
        }
      } catch {
        // Enrichissement failed — proceed directly to crossing
      }

      // No enrichissement available → go straight to crossing
      await runCrossing(inputs, contexte)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // ── Step 2: Run the actual SOUFFLE crossing ───────────────────────────────
  const runCrossing = useCallback(
    async (inputs: string[], contexte: SouffleContexte) => {
      setAppState('loading')
      setLoadingMessage(undefined)

      // Estimate SOUFFLE levels for loading display
      const niveauxEstimes: SouffleNiveau[] =
        contexte === 'exploration' ? [1]
          : contexte === 'culturel_profond' ? [1, 2]
          : [1, 2, 3]
      setSouffleNiveaux(niveauxEstimes)

      try {
        const res = await fetch('/api/cross', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inputs, contexte }),
        })

        // Handle non-SSE error responses (rate limit, bad request, server error)
        if (!res.ok) {
          const contentType = res.headers.get('content-type') || ''
          if (!contentType.includes('text/event-stream')) {
            let errMsg = `HTTP ${res.status}`
            try { const body = await res.json(); errMsg = body.error || errMsg } catch { /* ignore */ }
            throw new Error(errMsg)
          }
        }

        let finalResult: CrossResult | null = null
        let latestAnglesMorts: AnglesMortsAnalyse | null = null

        await readSSEStream(res, (event) => {
          switch (event.type) {
            case 'souffle_status': {
              const statut = event.data as { niveauxActifs: SouffleNiveau[] }
              if (statut.niveauxActifs) setSouffleNiveaux(statut.niveauxActifs)
              break
            }
            case 'extraction_start':
            case 'extraction_done': {
              const d = event.data as { title?: string }
              setLoadingMessage(event.message || (d?.title ? `Extraction: ${d.title}` : undefined))
              break
            }
            case 'crossing_level': {
              const d = event.data as { niveau: SouffleNiveau }
              if (d?.niveau) setSouffleNiveaux(prev => Array.from(new Set([...prev, d.niveau])) as SouffleNiveau[])
              setLoadingMessage(event.message)
              break
            }
            case 'section_ready': {
              setLoadingMessage('LOGOS construit la carte…')
              break
            }
            case 'angles_morts': {
              latestAnglesMorts = event.data as AnglesMortsAnalyse
              setLoadingMessage(`${latestAnglesMorts.anglesDetectes.length} angle(s) mort(s) détecté(s)`)
              break
            }
            case 'complete': {
              finalResult = event.data as CrossResult
              break
            }
            case 'error': {
              throw new Error(event.message || 'Erreur inconnue')
            }
          }
        })

        if (!finalResult) throw new Error('Aucun résultat reçu')

        const result = finalResult as CrossResult
        const card: InsightCardType = {
          ...result.insight,
          anglesMorts: result.anglesMorts || latestAnglesMorts || undefined,
        }

        if (result.souffleNiveaux) {
          setSouffleNiveaux(result.souffleNiveaux)
        }

        setCurrentCard(card)

        // ── Session history + resonances ──────────────────────────────
        const newCrossing: SessionCrossing = {
          id: card.id,
          theme: card.theme,
          sourceCount: card.sources.length,
          souffleNiveaux: result.souffleNiveaux || [1],
          createdAt: Date.now(),
          card,
        }

        const newHistory = [newCrossing, ...sessionHistoryRef.current.slice(0, 9)]
        setSessionHistory(newHistory)

        // Persist to localStorage
        sauvegarderSession(newHistory)

        // Detect resonances with previous crossings
        if (sessionHistoryRef.current.length > 0) {
          const resonances = detecterResonances(card, sessionHistoryRef.current)
          setCurrentResonances(resonances)
        }

        // ── Living Map ─────────────────────────────────────────────────
        const now = Date.now()
        const newPoints: MapPoint[] = card.sourceCoordinates.map((coord, i) => ({
          id: `src-${card.id}-${i}`,
          lat: coord.lat,
          lng: coord.lng,
          type: 'source' as const,
          label: coord.region,
          pulsePhase: i * 1.4,
          createdAt: now,
        }))

        if (card.sourceCoordinates.length >= 2) {
          const midLat = card.sourceCoordinates.reduce((s, c) => s + c.lat, 0) / card.sourceCoordinates.length
          const midLng = card.sourceCoordinates.reduce((s, c) => s + c.lng, 0) / card.sourceCoordinates.length

          newPoints.push({
            id: `cross-${card.id}`,
            lat: midLat,
            lng: midLng,
            type: 'crossing',
            label: card.theme,
            pulsePhase: 0,
            createdAt: now,
          })

          const newArcs: MapArc[] = []
          for (let i = 0; i < card.sourceCoordinates.length - 1; i++) {
            for (let j = i + 1; j < card.sourceCoordinates.length; j++) {
              newArcs.push({
                id: `arc-${card.id}-${i}-${j}`,
                from: { lat: card.sourceCoordinates[i].lat, lng: card.sourceCoordinates[i].lng },
                to: { lat: card.sourceCoordinates[j].lat, lng: card.sourceCoordinates[j].lng },
                progress: 0,
                createdAt: now,
              })
            }
          }

          // Animate arc drawing
          let progress = 0
          const arcInterval = setInterval(() => {
            progress = Math.min(1, progress + 0.025)
            setMapArcs(prev => [
              ...prev.filter(a => !newArcs.some(na => na.id === a.id)),
              ...newArcs.map(a => ({ ...a, progress })),
            ])
            if (progress >= 1) clearInterval(arcInterval)
          }, 25)
        }

        setMapPoints(prev => [...prev, ...newPoints])
        setAppState('result')
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue'
        setError(message)
        setAppState('error')
      }
    },
    []
  )

  // ── EnrichissementPanel callbacks ─────────────────────────────────────────
  const handleEnrichirEtCroiser = useCallback((allUrls: string[]) => {
    setEnrichissementProposal(null)
    runCrossing([...pendingInputs, ...allUrls], pendingContexte)
  }, [pendingInputs, pendingContexte, runCrossing])

  const handleSelectionnerEtCroiser = useCallback((selectedUrls: string[]) => {
    setEnrichissementProposal(null)
    runCrossing([...pendingInputs, ...selectedUrls], pendingContexte)
  }, [pendingInputs, pendingContexte, runCrossing])

  const handleCroiserSansEnrichir = useCallback(() => {
    setEnrichissementProposal(null)
    runCrossing(pendingInputs, pendingContexte)
  }, [pendingInputs, pendingContexte, runCrossing])

  // ── "Combler ces angles morts" ────────────────────────────────────────────
  const handleCombler = useCallback((newInputs: string[]) => {
    setCurrentCard(null)
    setCurrentResonances([])
    setAppState('idle')
    // After reset, we'd like to pre-fill the form — but SourceInput is self-managed.
    // Instead, auto-trigger a new crossing with the suggested inputs
    setTimeout(() => {
      handleCross(newInputs, 'culturel_profond')
    }, 100)
  }, [handleCross])

  // ── "Méta-croisement" ─────────────────────────────────────────────────────
  const handleMetaCroisement = useCallback((ids: string[]) => {
    const crossings = ids.map(id => sessionHistoryRef.current.find(c => c.id === id)).filter(Boolean) as SessionCrossing[]
    if (crossings.length < 2) return

    const themes = crossings.map(c => c.theme)
    setCurrentCard(null)
    setCurrentResonances([])
    // Trigger a crossing using the two themes as keywords
    setTimeout(() => {
      handleCross(themes, 'culturel_profond')
    }, 100)
  }, [handleCross])

  const handleReset = useCallback(() => {
    setAppState('idle')
    setCurrentCard(null)
    setError(null)
    setLoadingMessage(undefined)
    setCurrentResonances([])
    setEnrichissementProposal(null)
  }, [])

  const handleLoadFromHistory = useCallback((item: SessionCrossing) => {
    setCurrentCard(item.card)
    setSouffleNiveaux(item.souffleNiveaux)
    // Compute resonances for the loaded card
    const others = sessionHistoryRef.current.filter(c => c.id !== item.id)
    setCurrentResonances(detecterResonances(item.card, others))
    setAppState('result')
    setShowingSidebar(false)
  }, [])

  const crossingCount = mapPoints.filter(p => p.type === 'crossing').length

  return (
    <main className="relative min-h-screen overflow-hidden" style={{ background: '#0A0A0F' }}>

      {/* ── Living Map — cosmic background ── */}
      <LiveMap points={mapPoints} arcs={mapArcs} />

      {/* ── Vignette ── */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(10,10,15,0.7) 100%)',
          zIndex: 5,
        }}
      />

      {/* ── Session sidebar (history) ── */}
      {showingSidebar && (
        <div
          className="fixed left-0 top-0 bottom-0 z-30 flex flex-col"
          style={{
            width: '280px',
            background: 'rgba(10,10,15,0.96)',
            borderRight: '1px solid rgba(201,168,76,0.1)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'rgba(201,168,76,0.08)' }}>
            <span className="text-xs uppercase tracking-widest" style={{ color: '#C9A84C', fontFamily: 'ui-monospace, monospace' }}>
              Session
            </span>
            <button
              onClick={() => setShowingSidebar(false)}
              className="text-xs"
              style={{ color: '#333', cursor: 'pointer', background: 'none', border: 'none' }}
            >
              ×
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {sessionHistory.length === 0 && (
              <p className="text-xs text-center mt-4" style={{ color: '#222', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                Aucun croisement dans cette session.
              </p>
            )}
            {sessionHistory.map(item => (
              <button
                key={item.id}
                onClick={() => handleLoadFromHistory(item)}
                className="text-left p-3 rounded-lg transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.2)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)' }}
              >
                <p className="text-xs mb-1" style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.4 }}>
                  {item.theme}
                </p>
                <p className="text-xs" style={{ color: '#222', fontFamily: 'ui-monospace, monospace' }}>
                  {item.sourceCount} sources · {item.souffleNiveaux.map(() => '•').join('')}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Main interface ── */}
      <div className="relative z-10 min-h-screen flex flex-col">

        {/* ─── Header ──────────────────────────────────────────────────── */}
        <header className="flex-shrink-0 px-6 py-5 md:px-10 md:py-7">
          <div className="flex items-start justify-between">
            <div>
              <h1
                className="text-xl md:text-2xl tracking-widest uppercase"
                style={{
                  fontFamily: 'Georgia, serif',
                  background: 'linear-gradient(135deg, #C9A84C 0%, #F5ECD7 55%, #C9A84C 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  letterSpacing: '0.3em',
                }}
              >
                TEL
              </h1>
              <p
                className="text-xs mt-0.5"
                style={{
                  color: 'rgba(201,168,76,0.3)',
                  fontFamily: 'ui-monospace, monospace',
                  letterSpacing: '0.18em',
                }}
              >
                The Experience Layer
              </p>
            </div>

            <div className="flex items-center gap-3 mt-1">
              {/* Session history button */}
              {sessionHistory.length > 0 && (
                <button
                  onClick={() => setShowingSidebar(!showingSidebar)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded transition-all duration-200"
                  style={{
                    border: '1px solid rgba(201,168,76,0.15)',
                    color: '#333',
                    background: 'transparent',
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: '0.65rem',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#C9A84C'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#333'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.15)' }}
                >
                  {sessionHistory.length} croisement{sessionHistory.length > 1 ? 's' : ''}
                </button>
              )}

              {crossingCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: '#C9A84C', boxShadow: '0 0 5px #C9A84C', animation: 'pulse 2.5s infinite' }}
                  />
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ─── Central zone ────────────────────────────────────────────── */}
        <div className="flex-1 flex items-center justify-center px-4 py-4">
          <div className="w-full max-w-2xl">

            {/* ── IDLE — crossing form ── */}
            {appState === 'idle' && (
              <div
                className="animate-fade-in"
                style={{
                  background: 'rgba(10,10,15,0.90)',
                  backdropFilter: 'blur(28px)',
                  border: '1px solid rgba(201,168,76,0.1)',
                  borderRadius: '20px',
                  padding: '2rem',
                }}
              >
                {/* Hero text */}
                <div className="mb-7 text-center">
                  <p
                    className="text-xl md:text-3xl mb-3 leading-relaxed cursor-pointer select-none"
                    onClick={() => setHeroIndex(i => (i + 1) % HERO_FRAGMENTS.length)}
                    style={{
                      color: '#F5ECD7',
                      fontFamily: 'Georgia, serif',
                      fontStyle: 'italic',
                      lineHeight: 1.5,
                      transition: 'opacity 0.4s',
                      textShadow: '0 0 40px rgba(201,168,76,0.08)',
                    }}
                    title="Cliquez pour changer"
                  >
                    {HERO_FRAGMENTS[heroIndex]}
                  </p>

                  <div className="my-4 h-px w-16 mx-auto" style={{ background: 'rgba(201,168,76,0.15)' }} />

                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: '#2e2e2e', fontFamily: 'Georgia, serif', lineHeight: 1.8 }}
                  >
                    TEL est la traduction qui n&apos;a jamais existé.
                    <br />
                    Entrez les sources. Laissez les vécus se croiser.
                  </p>
                </div>

                <SourceInput onCross={handleCross} isLoading={false} />

                <p
                  className="text-center text-xs mt-5"
                  style={{
                    color: '#151515',
                    fontFamily: 'Georgia, serif',
                    fontStyle: 'italic',
                    lineHeight: 1.6,
                  }}
                >
                  Les zones sombres du globe sont les silences de l&apos;humanité —<br />
                  des vécus qui n&apos;ont pas encore de voix dans les données mondiales.
                </p>

                {showSidebar && sessionHistory.length > 0 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => { setShowingSidebar(true); setShowSidebar(false) }}
                      className="text-xs transition-all duration-200"
                      style={{ color: '#2a2a2a', fontFamily: 'ui-monospace, monospace', background: 'none', border: 'none', cursor: 'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#C9A84C' }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#2a2a2a' }}
                    >
                      Revoir vos croisements ({sessionHistory.length})
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── ANALYSING — brief transition ── */}
            {appState === 'analysing' && (
              <div
                className="animate-fade-in text-center"
                style={{
                  background: 'rgba(10,10,15,0.90)',
                  backdropFilter: 'blur(28px)',
                  border: '1px solid rgba(201,168,76,0.1)',
                  borderRadius: '20px',
                  padding: '3rem 2rem',
                }}
              >
                <div
                  className="w-8 h-8 rounded-full mx-auto mb-5"
                  style={{
                    border: '1px solid rgba(201,168,76,0.4)',
                    borderTopColor: '#C9A84C',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                <p
                  className="text-sm"
                  style={{ color: '#C9A84C', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.12em' }}
                >
                  Analyse des sources…
                </p>
                <p
                  className="text-xs mt-2"
                  style={{ color: '#333', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                >
                  TEL recherche des perspectives complémentaires
                </p>
              </div>
            )}

            {/* ── ENRICHISSEMENT — propose additional sources ── */}
            {appState === 'enrichissement' && enrichissementProposal && (
              <div className="animate-fade-in">
                <div className="mb-4 text-center">
                  <p
                    className="text-xs uppercase tracking-widest"
                    style={{ color: '#C9A84C', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.2em' }}
                  >
                    Enrichissement automatique
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: '#333', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                  >
                    TEL a trouvé des sources complémentaires
                  </p>
                </div>
                <EnrichissementPanel
                  proposal={enrichissementProposal}
                  onEnrichirEtCroiser={handleEnrichirEtCroiser}
                  onSelectionnerEtCroiser={handleSelectionnerEtCroiser}
                  onCroiserSansEnrichir={handleCroiserSansEnrichir}
                />
              </div>
            )}

            {/* ── LOADING ── */}
            {appState === 'loading' && (
              <div
                className="animate-fade-in"
                style={{
                  background: 'rgba(10,10,15,0.90)',
                  backdropFilter: 'blur(28px)',
                  border: '1px solid rgba(201,168,76,0.1)',
                  borderRadius: '20px',
                  padding: '2rem',
                }}
              >
                <LoadingState niveauxActifs={souffleNiveaux} message={loadingMessage} />
              </div>
            )}

            {/* ── ERROR ── */}
            {appState === 'error' && (
              <div
                className="animate-fade-in text-center"
                style={{
                  background: 'rgba(10,10,15,0.90)',
                  backdropFilter: 'blur(28px)',
                  border: '1px solid rgba(139,58,58,0.2)',
                  borderRadius: '20px',
                  padding: '2.5rem',
                }}
              >
                <p
                  className="text-lg mb-3"
                  style={{ color: '#8B3A3A', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                >
                  Le croisement n&apos;a pas pu avoir lieu.
                </p>
                <p
                  className="text-sm mb-6 leading-relaxed"
                  style={{ color: '#aaa', fontFamily: 'Georgia, serif', lineHeight: 1.7 }}
                >
                  {error}
                </p>
                <p className="text-xs mb-6" style={{ color: '#555', fontFamily: 'ui-monospace, monospace' }}>
                  Exécutez <code style={{ color: '#C9A84C' }}>npm run check-souffle</code> pour diagnostiquer.
                </p>
                <button
                  onClick={handleReset}
                  className="px-6 py-2.5 text-xs uppercase tracking-widest rounded-lg transition-all duration-300"
                  style={{
                    border: '1px solid rgba(201,168,76,0.25)',
                    color: '#C9A84C',
                    background: 'transparent',
                    fontFamily: 'Georgia, serif',
                    letterSpacing: '0.2em',
                    cursor: 'pointer',
                  }}
                >
                  Réessayer
                </button>
              </div>
            )}

            {/* ── RESULT — InsightCard ── */}
            {appState === 'result' && currentCard && (
              <InsightCard
                card={currentCard}
                onClose={handleReset}
                streaming={true}
                resonances={currentResonances}
                onCombler={handleCombler}
                onMetaCroisement={handleMetaCroisement}
              />
            )}
          </div>
        </div>

        {/* ─── Footer ──────────────────────────────────────────────────── */}
        <footer className="flex-shrink-0 px-6 py-3 flex flex-wrap items-center justify-between gap-2">
          <p
            className="text-xs"
            style={{ color: '#121212', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.1em' }}
          >
            theexperiencelayer.org
          </p>

          <p
            className="text-xs text-center flex-1"
            style={{ color: '#121212', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            Babel a dispersé les langages. TEL rassemble les vécus.
          </p>

          <p className="text-xs" style={{ color: '#0f0f0f', fontFamily: 'ui-monospace, monospace' }}>
            Helsinki · Hetzner · Phase 1
          </p>
        </footer>
      </div>

      {/* ── Spin keyframe (for analysing state) ── */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  )
}
