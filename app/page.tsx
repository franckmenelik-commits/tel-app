'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import SourceInput from '@/components/SourceInput'
import InsightCard from '@/components/InsightCard'
import EnrichissementPanel from '@/components/EnrichissementPanel'
import { ALL_DEMO_CROSSINGS } from '@/lib/demo-crossings'
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

// ── Rotating loading messages ────────────────────────────────────────────────
const LOADING_MESSAGES = [
  'Extraction du contenu des sources…',
  'Détection des contextes culturels…',
  'Analyse des arcs narratifs…',
  'Croisement des perspectives…',
  'Identification des convergences…',
  'Détection des divergences irréductibles…',
  'Recherche d\'angles morts géographiques…',
  'Formulation du pattern…',
  'Génération de la question inexposée…',
]

const DISCOVERY_MESSAGES = [
  'Analyse de votre source…',
  'Exploration de 194 pays…',
  'Détection d\'une connexion improbable…',
  'Un croisement inattendu émerge…',
]

// ── Source type display labels ───────────────────────────────────────────────
const SOURCE_LABELS: Record<string, string> = {
  youtube: 'YouTube', wikipedia: 'Wikipedia', article: 'Article',
  podcast: 'Podcast', book: 'Document', free_text: 'Témoignage',
  crossing: 'Croisement ×', unknown: 'Source',
}

// ── SSE streaming reader ─────────────────────────────────────────────────────
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
        try { onEvent(JSON.parse(line.slice(6)) as SSEEvent) } catch { /* skip */ }
      }
    }
  }
}

export default function TELPage() {
  // ── App state ──────────────────────────────────────────────────────────────
  const [appState, setAppState] = useState<AppState>('idle')
  const [currentCard, setCurrentCard] = useState<InsightCardType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([])
  const [mapArcs, setMapArcs] = useState<MapArc[]>([])
  const [souffleNiveaux, setSouffleNiveaux] = useState<SouffleNiveau[]>([1])
  const [sessionHistory, setSessionHistory] = useState<SessionCrossing[]>([])
  const [showingSidebar, setShowingSidebar] = useState(false)
  const [currentResonances, setCurrentResonances] = useState<Resonance[]>([])
  const [isDiscoveryMode, setIsDiscoveryMode] = useState(false)
  const [discoveryInfo, setDiscoveryInfo] = useState<{ titre: string; pourquoi: string } | null>(null)
  const [enrichissementProposal, setEnrichissementProposal] = useState<EnrichissementProposal | null>(null)
  const [pendingInputs, setPendingInputs] = useState<string[]>([])
  const [pendingContexte, setPendingContexte] = useState<SouffleContexte>('exploration')

  // ── Demo carousel ──────────────────────────────────────────────────────────
  const [demoIndex, setDemoIndex] = useState(0)
  const [demoVisible, setDemoVisible] = useState(true)

  // ── Loading message rotation ───────────────────────────────────────────────
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0)
  const [loadingMsgVisible, setLoadingMsgVisible] = useState(true)

  const formRef = useRef<HTMLDivElement>(null)
  const sessionHistoryRef = useRef<SessionCrossing[]>([])
  sessionHistoryRef.current = sessionHistory

  // ── Load session from localStorage on mount ────────────────────────────────
  useEffect(() => {
    const saved = chargerSession()
    if (saved.length > 0) setSessionHistory(saved)
  }, [])

  // ── Demo carousel auto-rotation ────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      setDemoVisible(false)
      setTimeout(() => {
        setDemoIndex(i => (i + 1) % ALL_DEMO_CROSSINGS.length)
        setDemoVisible(true)
      }, 400)
    }, 8000)
    return () => clearInterval(timer)
  }, [])

  // ── Loading message rotation ───────────────────────────────────────────────
  useEffect(() => {
    if (appState !== 'loading' && appState !== 'analysing') return
    const msgs = isDiscoveryMode ? DISCOVERY_MESSAGES : LOADING_MESSAGES
    setLoadingMsgIndex(0)
    setLoadingMsgVisible(true)
    const interval = setInterval(() => {
      setLoadingMsgVisible(false)
      setTimeout(() => {
        setLoadingMsgIndex(i => (i + 1) % msgs.length)
        setLoadingMsgVisible(true)
      }, 300)
    }, 2000)
    return () => clearInterval(interval)
  }, [appState, isDiscoveryMode])

  // ── Discovery mode (single source) ────────────────────────────────────────
  const runDiscovery = useCallback(async (source: string) => {
    setAppState('loading')
    setIsDiscoveryMode(true)
    setDiscoveryInfo(null)
    setCurrentCard(null)
    setCurrentResonances([])
    try {
      const res = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      const card: InsightCardType = data.insight
      if (!card) throw new Error('Aucun insight reçu')
      if (data.discovery) {
        setDiscoveryInfo({ titre: data.discovery.titre, pourquoi: data.discovery.pourquoi })
      }
      setCurrentCard(card)
      const newCrossing: SessionCrossing = {
        id: card.id, theme: card.theme, sourceCount: card.sources.length,
        souffleNiveaux: [1], createdAt: Date.now(), card,
      }
      const newHistory = [newCrossing, ...sessionHistoryRef.current.slice(0, 19)]
      setSessionHistory(newHistory)
      sauvegarderSession(newHistory)
      setAppState('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setAppState('error')
    } finally {
      setIsDiscoveryMode(false)
    }
  }, [])

  // ── Step 1: analyse + enrichissement ──────────────────────────────────────
  const handleCross = useCallback(
    async (inputs: string[], contexte: SouffleContexte) => {
      // Single source → Discovery Mode
      if (inputs.length === 1) {
        await runDiscovery(inputs[0])
        return
      }
      setAppState('analysing')
      setDiscoveryInfo(null)
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
          if (proposal.sourcesProposees && proposal.sourcesProposees.length > 0) {
            setEnrichissementProposal(proposal)
            setAppState('enrichissement')
            return
          }
        }
      } catch { /* proceed directly */ }
      await runCrossing(inputs, contexte)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [runDiscovery]
  )

  // ── Step 2: SOUFFLE crossing ───────────────────────────────────────────────
  const runCrossing = useCallback(
    async (inputs: string[], contexte: SouffleContexte) => {
      setAppState('loading')
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
              const d = event.data as { niveauxActifs: SouffleNiveau[] }
              if (d.niveauxActifs) setSouffleNiveaux(d.niveauxActifs)
              break
            }
            case 'crossing_level': {
              const d = event.data as { niveau: SouffleNiveau }
              if (d?.niveau) setSouffleNiveaux(prev => Array.from(new Set([...prev, d.niveau])) as SouffleNiveau[])
              break
            }
            case 'angles_morts': {
              latestAnglesMorts = event.data as AnglesMortsAnalyse
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
        if (result.souffleNiveaux) setSouffleNiveaux(result.souffleNiveaux)
        setCurrentCard(card)

        // Session + resonances
        const newCrossing: SessionCrossing = {
          id: card.id, theme: card.theme, sourceCount: card.sources.length,
          souffleNiveaux: result.souffleNiveaux || [1], createdAt: Date.now(), card,
        }
        const newHistory = [newCrossing, ...sessionHistoryRef.current.slice(0, 19)]
        setSessionHistory(newHistory)
        sauvegarderSession(newHistory)
        if (sessionHistoryRef.current.length > 0) {
          setCurrentResonances(detecterResonances(card, sessionHistoryRef.current))
        }

        // Living Map
        const now = Date.now()
        const newPoints: MapPoint[] = card.sourceCoordinates.map((coord, i) => ({
          id: `src-${card.id}-${i}`, lat: coord.lat, lng: coord.lng,
          type: 'source' as const, label: coord.region, pulsePhase: i * 1.4, createdAt: now,
        }))
        if (card.sourceCoordinates.length >= 2) {
          const midLat = card.sourceCoordinates.reduce((s, c) => s + c.lat, 0) / card.sourceCoordinates.length
          const midLng = card.sourceCoordinates.reduce((s, c) => s + c.lng, 0) / card.sourceCoordinates.length
          newPoints.push({ id: `cross-${card.id}`, lat: midLat, lng: midLng, type: 'crossing', label: card.theme, pulsePhase: 0, createdAt: now })
          const newArcs: MapArc[] = []
          for (let i = 0; i < card.sourceCoordinates.length - 1; i++) {
            for (let j = i + 1; j < card.sourceCoordinates.length; j++) {
              newArcs.push({
                id: `arc-${card.id}-${i}-${j}`,
                from: { lat: card.sourceCoordinates[i].lat, lng: card.sourceCoordinates[i].lng },
                to: { lat: card.sourceCoordinates[j].lat, lng: card.sourceCoordinates[j].lng },
                progress: 0, createdAt: now,
              })
            }
          }
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
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
        setAppState('error')
      }
    },
    []
  )

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

  const handleCombler = useCallback((newInputs: string[]) => {
    setCurrentCard(null)
    setCurrentResonances([])
    setAppState('idle')
    setTimeout(() => handleCross(newInputs, 'culturel_profond'), 100)
  }, [handleCross])

  const handleMetaCroisement = useCallback((ids: string[]) => {
    const crossings = ids.map(id => sessionHistoryRef.current.find(c => c.id === id)).filter(Boolean) as SessionCrossing[]
    if (crossings.length < 2) return
    setCurrentCard(null)
    setCurrentResonances([])
    setTimeout(() => handleCross(crossings.map(c => c.theme), 'culturel_profond'), 100)
  }, [handleCross])

  const handleReset = useCallback(() => {
    setAppState('idle')
    setCurrentCard(null)
    setError(null)
    setCurrentResonances([])
    setEnrichissementProposal(null)
    setDiscoveryInfo(null)
  }, [])

  const handleLoadFromHistory = useCallback((item: SessionCrossing) => {
    setCurrentCard(item.card)
    setSouffleNiveaux(item.souffleNiveaux)
    setCurrentResonances(detecterResonances(item.card, sessionHistoryRef.current.filter(c => c.id !== item.id)))
    setAppState('result')
    setShowingSidebar(false)
  }, [])

  const crossingCount = mapPoints.filter(p => p.type === 'crossing').length
  const souffleIndicator = '•'.repeat(Math.min(3, Math.max(1, souffleNiveaux.length)))
  const demo = ALL_DEMO_CROSSINGS[demoIndex]
  const demoSourceA = demo.sources[0]
  const demoSourceB = demo.sources[1]

  return (
    <main className="relative min-h-screen" style={{ background: '#0A0A0F', overflowX: 'hidden' }}>

      {/* ── Living Map ── */}
      <LiveMap points={mapPoints} arcs={mapArcs} />

      {/* ── Vignette ── */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(10,10,15,0.75) 100%)', zIndex: 5 }} />

      {/* ── Session sidebar ── */}
      {showingSidebar && (
        <div className="fixed left-0 top-0 bottom-0 z-30 flex flex-col" style={{ width: '280px', background: 'rgba(10,10,15,0.96)', borderRight: '1px solid rgba(201,168,76,0.1)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'rgba(201,168,76,0.08)' }}>
            <span className="text-xs uppercase tracking-widest" style={{ color: '#C9A84C', fontFamily: 'ui-monospace, monospace' }}>Session</span>
            <button onClick={() => setShowingSidebar(false)} style={{ color: '#333', cursor: 'pointer', background: 'none', border: 'none', fontSize: '1rem' }}>×</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {sessionHistory.length === 0 && (
              <p className="text-xs text-center mt-4" style={{ color: '#222', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Aucun croisement dans cette session.</p>
            )}
            {sessionHistory.map(item => (
              <button key={item.id} onClick={() => handleLoadFromHistory(item)}
                className="text-left p-3 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'border-color 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.2)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)' }}
              >
                <p className="text-xs mb-1" style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.4 }}>{item.theme}</p>
                <p className="text-xs" style={{ color: '#222', fontFamily: 'ui-monospace, monospace' }}>{item.sourceCount} sources · {'•'.repeat(item.souffleNiveaux.length)} · {new Date(item.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Main layout ── */}
      <div className="relative z-10 min-h-screen flex flex-col">

        {/* ─── Header ──────────────────────────────────────────────────── */}
        <header className="flex-shrink-0 px-6 py-5 md:px-10 md:py-6">
          <div className="flex items-center justify-between">
            <button onClick={handleReset} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
              <h1 className="text-xl md:text-2xl tracking-widest uppercase" style={{ fontFamily: 'Georgia, serif', background: 'linear-gradient(135deg, #C9A84C 0%, #F5ECD7 55%, #C9A84C 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '0.3em' }}>TEL</h1>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(201,168,76,0.3)', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.18em' }}>The Experience Layer</p>
            </button>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowingSidebar(!showingSidebar)}
                className="px-2 py-1 rounded"
                style={{ border: '1px solid rgba(201,168,76,0.15)', color: '#333', background: 'transparent', fontFamily: 'ui-monospace, monospace', fontSize: '0.65rem', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#C9A84C'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#333'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.15)' }}
              >
                Mes croisements{sessionHistory.length > 0 ? ` (${sessionHistory.length})` : ''}
              </button>
              {crossingCount > 0 && (
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#C9A84C', boxShadow: '0 0 5px #C9A84C', animation: 'pulse 2.5s infinite' }} />
              )}
            </div>
          </div>
        </header>

        {/* ─── Central content ──────────────────────────────────────────── */}
        <div className="flex-1">

          {/* ══ IDLE — Landing page ══════════════════════════════════════ */}
          {appState === 'idle' && (
            <div>

              {/* HERO */}
              <section className="px-6 pt-10 pb-14 md:px-10 md:pt-16 md:pb-20 text-center" style={{ maxWidth: '760px', margin: '0 auto' }}>
                <h2
                  className="text-3xl md:text-5xl mb-6"
                  style={{ color: '#F5ECD7', fontFamily: 'Georgia, serif', lineHeight: 1.25, fontStyle: 'italic' }}
                >
                  Croisez deux sources.<br />Voyez ce qu&apos;elles cachent ensemble.
                </h2>
                <p
                  className="text-base md:text-lg mb-10 leading-relaxed"
                  style={{ color: '#555', fontFamily: 'Georgia, serif', lineHeight: 1.85 }}
                >
                  Entrez deux sources pour les croiser — ou une seule, et laissez TEL vous surprendre.
                </p>
                <button
                  onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '14px 36px', borderRadius: '12px',
                    background: 'rgba(201,168,76,0.10)', border: '1px solid rgba(201,168,76,0.35)',
                    color: '#C9A84C', fontFamily: 'ui-monospace, monospace', fontSize: '0.82rem',
                    letterSpacing: '0.08em', cursor: 'pointer', transition: 'all 0.25s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.18)'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.6)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.10)'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.35)' }}
                >
                  Essayer maintenant →
                </button>
              </section>

              {/* DEMO CAROUSEL */}
              <section className="px-6 pb-12 md:px-10" style={{ maxWidth: '680px', margin: '0 auto' }}>
                <p className="text-xs uppercase tracking-widest text-center mb-7" style={{ color: '#252525', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.22em' }}>
                  Ce que TEL a déjà trouvé
                </p>

                {/* Card */}
                <div
                  style={{
                    background: 'rgba(10,10,15,0.88)', border: '1px solid rgba(201,168,76,0.1)',
                    borderRadius: '16px', padding: '1.75rem 2rem', backdropFilter: 'blur(20px)',
                    opacity: demoVisible ? 1 : 0, transition: 'opacity 0.4s ease',
                    minHeight: '180px',
                  }}
                >
                  {/* Source badges */}
                  <div className="flex items-center gap-3 flex-wrap mb-5">
                    {[demoSourceA, demoSourceB].map((src, i) => (
                      <span key={i} className="text-xs px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#777', fontFamily: 'ui-monospace, monospace', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#C9A84C', fontSize: '0.55rem' }}>●</span>
                        <span style={{ color: '#444', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{SOURCE_LABELS[src.type] || src.type}</span>
                        {(src.title || src.url).slice(0, 42)}{(src.title || src.url).length > 42 ? '…' : ''}
                      </span>
                    ))}
                    <span style={{ color: '#222', fontFamily: 'Georgia, serif', fontSize: '1rem', flexShrink: 0 }}>×</span>
                  </div>

                  {/* Question révélée */}
                  <p style={{ color: '#F5ECD7', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1.05rem', lineHeight: 1.75 }}>
                    &ldquo;{demo.questionNoOneHasAsked}&rdquo;
                  </p>
                  <p className="text-xs mt-3" style={{ color: '#222', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.04em' }}>
                    — {demo.theme}
                  </p>
                </div>

                {/* Dot navigation */}
                <div className="flex items-center justify-center gap-2 mt-5">
                  {ALL_DEMO_CROSSINGS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => { setDemoVisible(false); setTimeout(() => { setDemoIndex(i); setDemoVisible(true) }, 200) }}
                      style={{
                        width: i === demoIndex ? '22px' : '6px', height: '6px',
                        borderRadius: '3px', border: 'none', cursor: 'pointer', padding: 0,
                        background: i === demoIndex ? '#C9A84C' : 'rgba(201,168,76,0.18)',
                        transition: 'all 0.3s ease',
                      }}
                    />
                  ))}
                </div>
              </section>

              {/* HOW IT WORKS */}
              <section className="px-6 pb-12 md:px-10" style={{ maxWidth: '760px', margin: '0 auto' }}>
                <p className="text-xs uppercase tracking-widest text-center mb-8" style={{ color: '#252525', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.22em' }}>
                  Comment ça fonctionne
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {[
                    {
                      num: '①',
                      title: 'Entrez vos sources',
                      desc: 'URL YouTube ou article web, texte libre, mot-clé, ou deux concepts à croiser directement. TEL accepte tout.',
                    },
                    {
                      num: '②',
                      title: 'LOGOS analyse et croise',
                      desc: 'Contextes culturels, arcs narratifs, angles morts géographiques. Trois niveaux d\'analyse selon la complexité.',
                    },
                    {
                      num: '③',
                      title: 'Un insight émerge',
                      desc: 'Convergences, divergences irréductibles — et la question que personne n\'avait encore osé formuler.',
                    },
                  ].map(step => (
                    <div key={step.num} className="p-5 rounded-xl" style={{ background: 'rgba(10,10,15,0.72)', border: '1px solid rgba(255,255,255,0.045)', backdropFilter: 'blur(12px)' }}>
                      <p className="text-2xl mb-3" style={{ color: '#C9A84C', fontFamily: 'Georgia, serif' }}>{step.num}</p>
                      <p className="text-sm mb-2" style={{ color: '#DDD', fontFamily: 'Georgia, serif', fontWeight: 500 }}>{step.title}</p>
                      <p className="text-xs leading-relaxed" style={{ color: '#444', fontFamily: 'Georgia, serif', lineHeight: 1.8 }}>{step.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* INPUT FORM */}
              <section ref={formRef} className="px-6 pb-20 md:px-10" style={{ maxWidth: '680px', margin: '0 auto' }}>
                <div className="p-6 md:p-8 rounded-2xl" style={{ background: 'rgba(10,10,15,0.92)', border: '1px solid rgba(201,168,76,0.12)', backdropFilter: 'blur(28px)' }}>
                  <p className="text-xs uppercase tracking-widest mb-6 text-center" style={{ color: '#2a2a2a', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.2em' }}>
                    Nouveau croisement
                  </p>
                  <SourceInput onCross={handleCross} isLoading={false} />
                </div>
                {sessionHistory.length > 0 && (
                  <div className="text-center mt-4">
                    <button
                      onClick={() => setShowingSidebar(true)}
                      style={{ color: '#252525', fontFamily: 'ui-monospace, monospace', fontSize: '0.7rem', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.06em', transition: 'color 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#C9A84C' }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#252525' }}
                    >
                      Revoir vos {sessionHistory.length} croisement{sessionHistory.length > 1 ? 's' : ''} →
                    </button>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* ══ ANALYSING + LOADING — rotating messages ══════════════════ */}
          {(appState === 'analysing' || appState === 'loading') && (
            <div className="flex items-center justify-center" style={{ minHeight: '70vh', padding: '2rem' }}>
              <div className="text-center" style={{ maxWidth: '420px' }}>
                {/* Spinner */}
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%', margin: '0 auto 2.5rem',
                  border: '1px solid rgba(201,168,76,0.15)',
                  borderTopColor: 'rgba(201,168,76,0.55)',
                  animation: 'spin 1.2s linear infinite',
                }} />

                {/* Rotating message */}
                <p style={{
                  color: '#C9A84C', fontFamily: 'ui-monospace, monospace',
                  fontSize: '0.8rem', letterSpacing: '0.06em',
                  opacity: loadingMsgVisible ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                  minHeight: '1.4em',
                  marginBottom: '1.5rem',
                }}>
                  {(isDiscoveryMode ? DISCOVERY_MESSAGES : LOADING_MESSAGES)[loadingMsgIndex]}
                </p>

                {/* SOUFFLE indicator */}
                <p style={{ color: '#1e1e1e', fontFamily: 'ui-monospace, monospace', fontSize: '0.65rem', letterSpacing: '0.3em' }}>
                  SOUFFLE&nbsp;{souffleIndicator}
                </p>
              </div>
            </div>
          )}

          {/* ══ ENRICHISSEMENT ════════════════════════════════════════════ */}
          {appState === 'enrichissement' && enrichissementProposal && (
            <div className="flex items-center justify-center px-4 py-10" style={{ minHeight: '70vh' }}>
              <div style={{ width: '100%', maxWidth: '680px' }}>
                <div className="text-center mb-5">
                  <p className="text-xs uppercase tracking-widest" style={{ color: '#C9A84C', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.2em' }}>Enrichissement automatique</p>
                  <p className="text-xs mt-1" style={{ color: '#333', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>TEL a trouvé des sources complémentaires</p>
                </div>
                <EnrichissementPanel
                  proposal={enrichissementProposal}
                  onEnrichirEtCroiser={handleEnrichirEtCroiser}
                  onSelectionnerEtCroiser={handleSelectionnerEtCroiser}
                  onCroiserSansEnrichir={handleCroiserSansEnrichir}
                />
              </div>
            </div>
          )}

          {/* ══ ERROR ════════════════════════════════════════════════════ */}
          {appState === 'error' && (
            <div className="flex items-center justify-center px-4" style={{ minHeight: '70vh' }}>
              <div className="text-center" style={{ maxWidth: '480px', background: 'rgba(10,10,15,0.92)', backdropFilter: 'blur(28px)', border: '1px solid rgba(139,58,58,0.2)', borderRadius: '20px', padding: '2.5rem' }}>
                <p className="text-lg mb-3" style={{ color: '#8B3A3A', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                  Le croisement n&apos;a pas pu avoir lieu.
                </p>
                <p className="text-sm mb-6 leading-relaxed" style={{ color: '#aaa', fontFamily: 'Georgia, serif', lineHeight: 1.7 }}>
                  {error}
                </p>
                <p className="text-xs mb-6" style={{ color: '#555', fontFamily: 'ui-monospace, monospace' }}>
                  Exécutez <code style={{ color: '#C9A84C' }}>npm run check-souffle</code> pour diagnostiquer.
                </p>
                <button onClick={handleReset}
                  style={{ padding: '10px 28px', border: '1px solid rgba(201,168,76,0.25)', color: '#C9A84C', background: 'transparent', fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem', letterSpacing: '0.15em', cursor: 'pointer', borderRadius: '8px', transition: 'all 0.25s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.08)'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.5)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.25)' }}
                >
                  Réessayer
                </button>
              </div>
            </div>
          )}

          {/* ══ RESULT — InsightCard ═════════════════════════════════════ */}
          {appState === 'result' && currentCard && (
            <div className="flex items-center justify-center px-4 py-8" style={{ minHeight: '70vh' }}>
              <div style={{ width: '100%', maxWidth: '680px' }}>
                {/* Discovery banner */}
                {discoveryInfo && (
                  <div className="mb-4 px-4 py-3 rounded-xl" style={{ background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.12)' }}>
                    <p className="text-xs mb-1" style={{ color: '#C9A84C', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.15em' }}>
                      LOGOS A DÉCOUVERT
                    </p>
                    <p className="text-xs" style={{ color: '#888', fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.6 }}>
                      <span style={{ color: '#F5ECD7' }}>{discoveryInfo.titre}</span>
                      {' — '}{discoveryInfo.pourquoi}
                    </p>
                  </div>
                )}
                <InsightCard
                  card={currentCard}
                  onClose={handleReset}
                  streaming={true}
                  resonances={currentResonances}
                  onCombler={handleCombler}
                  onMetaCroisement={handleMetaCroisement}
                />
              </div>
            </div>
          )}

        </div>

        {/* ─── Footer ──────────────────────────────────────────────────── */}
        <footer className="flex-shrink-0 px-6 py-4 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.025)' }}>
          <p className="text-xs mb-2" style={{ color: '#111', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.08em' }}>
            theexperiencelayer.org · Babel a dispersé les langages. TEL rassemble les vécus.
          </p>
          <a
            href="/education"
            style={{ color: '#2a2a2a', fontFamily: 'ui-monospace, monospace', fontSize: '0.65rem', letterSpacing: '0.12em', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#C9A84C' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#2a2a2a' }}
          >
            Pour les enseignants — TEL Éducation →
          </a>
        </footer>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  )
}
