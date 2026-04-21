'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import CrossingSpheres from '@/components/CrossingSpheres'
import SourceInput from '@/components/SourceInput'
import InsightCard from '@/components/InsightCard'
import EnrichissementPanel from '@/components/EnrichissementPanel'
import AuthModal from '@/components/AuthModal'
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
import { useLanguage, t } from '@/lib/i18n'
import LanguageSelector from '@/components/LanguageSelector'

// Canvas — no SSR
const LiveMap = dynamic(() => import('@/components/LiveMap'), { ssr: false })

type AppState = 'idle' | 'analysing' | 'enrichissement' | 'loading' | 'result' | 'error'


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
        let parsed: SSEEvent
        try { parsed = JSON.parse(line.slice(6)) as SSEEvent } catch { continue }
        onEvent(parsed) // let errors from onEvent propagate — caught by runCrossing's try/catch
      }
    }
  }
}

export default function TELPage() {
  // ── Language ────────────────────────────────────────────────────────────────
  const [lang, , langDetected] = useLanguage()

  // ── Language register (from localStorage) ──────────────────────────────────
  const [register, setRegister] = useState<string>('standard')
  useEffect(() => {
    try {
      const stored = localStorage.getItem('tel:register')
      if (stored === 'casual' || stored === 'standard' || stored === 'indepth') setRegister(stored)
    } catch { /* ok */ }
  }, [])

  const LOADING_MESSAGES = [
    t('loading.extraction', lang),
    t('loading.cultural', lang),
    t('loading.narrative', lang),
    t('loading.crossing', lang),
    t('loading.convergences', lang),
    t('loading.divergences', lang),
    t('loading.blindspots', lang),
    t('loading.pattern', lang),
    t('loading.question', lang),
  ]
  const DISCOVERY_MESSAGES = [
    t('discovery.analyse', lang),
    t('discovery.explore', lang),
    t('discovery.detect', lang),
    t('discovery.emerge', lang),
  ]
  const SOURCE_LABELS: Record<string, string> = {
    youtube: 'YouTube', wikipedia: 'Wikipedia', article: 'Article',
    podcast: 'Podcast', book: 'Document',
    free_text: t('source.testimony', lang),
    crossing: t('source.crossing', lang),
    unknown: 'Source',
  }

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

  // ── Auth state ─────────────────────────────────────────────────────────────
  const [user, setUser] = useState<string | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  // ── Demo carousel — 3 random crossings per session ─────────────────────────
  const [demoCards, setDemoCards] = useState<typeof ALL_DEMO_CROSSINGS>([])
  const [demoIndex, setDemoIndex] = useState(0)
  const [demoVisible, setDemoVisible] = useState(true)

  // ── Hero typewriter ─────────────────────────────────────────────────────────
  const [heroText, setHeroText] = useState('')
  const [heroLine2Visible, setHeroLine2Visible] = useState(false)
  const [heroCtaVisible, setHeroCtaVisible] = useState(false)
  const heroPlayed = useRef(false)

  // ── Loading message rotation ───────────────────────────────────────────────
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0)
  const [loadingMsgVisible, setLoadingMsgVisible] = useState(true)

  const formRef = useRef<HTMLDivElement>(null)
  const sessionHistoryRef = useRef<SessionCrossing[]>([])
  sessionHistoryRef.current = sessionHistory

  // ── Load session + auth from localStorage on mount ─────────────────────────
  useEffect(() => {
    const saved = chargerSession()
    if (saved.length > 0) setSessionHistory(saved)
    try {
      const savedUser = localStorage.getItem('tel:user:email')
      if (savedUser) setUser(savedUser)
    } catch { /* ok */ }
  }, [])

  // ── Pick 3 random crossings on mount ───────────────────────────────────────
  useEffect(() => {
    const shuffled = [...ALL_DEMO_CROSSINGS].sort(() => Math.random() - 0.5)
    setDemoCards(shuffled.slice(0, 3))
  }, [])

  // ── Demo carousel auto-rotation (cycles through the 3 random) ──────────────
  useEffect(() => {
    if (demoCards.length === 0) return
    const timer = setInterval(() => {
      setDemoVisible(false)
      setTimeout(() => {
        setDemoIndex(i => (i + 1) % demoCards.length)
        setDemoVisible(true)
      }, 300)
    }, 8000)
    return () => clearInterval(timer)
  }, [demoCards])

  // ── Hero typewriter — once per session, after lang is detected ─────────────
  useEffect(() => {
    if (!langDetected) return   // wait for real lang before typing
    if (heroPlayed.current) return
    try {
      if (sessionStorage.getItem('tel:hero-played')) {
        // Already played — show full text immediately
        setHeroText(t('hero.line1', lang))
        setHeroLine2Visible(true)
        setHeroCtaVisible(true)
        return
      }
    } catch { /* ok */ }
    heroPlayed.current = true
    const fullText = t('hero.line1', lang)
    let i = 0
    const type = () => {
      if (i <= fullText.length) {
        setHeroText(fullText.slice(0, i))
        i++
        setTimeout(type, 30)
      } else {
        // Title done — fade in line2 after 800ms, CTA after 1200ms
        setTimeout(() => setHeroLine2Visible(true), 800)
        setTimeout(() => setHeroCtaVisible(true), 1200)
        try { sessionStorage.setItem('tel:hero-played', '1') } catch { /* ok */ }
      }
    }
    setTimeout(type, 400)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, langDetected])

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
    }, 2200)
    return () => clearInterval(interval)
  }, [appState, isDiscoveryMode])

  // ── Auth handlers ──────────────────────────────────────────────────────────
  const handleLogin = useCallback((email: string) => {
    setUser(email)
    setShowAuthModal(false)
    try { localStorage.setItem('tel:user:email', email) } catch { /* ok */ }
  }, [])

  const handleLogout = useCallback(() => {
    setUser(null)
    setShowUserMenu(false)
    try { localStorage.removeItem('tel:user:email') } catch { /* ok */ }
  }, [])

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
      if (data.error) throw new Error(data.error)
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
          body: JSON.stringify({ inputs, contexte, lang, register }),
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

  // ── IntersectionObserver — scroll fade-in ─────────────────────────────────
  useEffect(() => {
    const els = document.querySelectorAll('.tel-animate')
    if (!els.length) return
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('tel-visible') }),
      { threshold: 0.12 }
    )
    els.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [appState])

  const souffleIndicator = '•'.repeat(Math.min(3, Math.max(1, souffleNiveaux.length)))
  const demo = demoCards[demoIndex] ?? ALL_DEMO_CROSSINGS[0]
  const demoSourceA = demo.sources[0]
  const demoSourceB = demo.sources[1]
  const demoQuestion = (lang === 'en' && demo.questionNoOneHasAskedEN) ? demo.questionNoOneHasAskedEN : demo.questionNoOneHasAsked
  const demoTheme = (lang === 'en' && demo.themeEN) ? demo.themeEN : demo.theme
  const [showExplorer, setShowExplorer] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!showExplorer) return
    const close = (e: MouseEvent) => {
      if (!(e.target as Element).closest('[data-explorer]')) setShowExplorer(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [showExplorer])
  const [prefillSources, setPrefillSources] = useState<string[]>([])

  return (
    <main className="relative min-h-screen" style={{ background: '#09090b', overflowX: 'hidden' }}>
      <CrossingSpheres
        isLoading={appState === 'loading' || appState === 'analysing'}
        hasResult={appState === 'result' || appState === 'enrichissement'}
        isResonating={isDiscoveryMode && (appState === 'loading' || appState === 'analysing')}
        isIdle={appState === 'idle'}
      />

      {/* ── Living Map — reduced opacity ── */}
      <div style={{ opacity: 0.15, position: 'fixed', inset: 0, pointerEvents: 'none' }}>
        <LiveMap points={mapPoints} arcs={mapArcs} />
      </div>

      {/* ── Session sidebar — RIGHT side ── */}
      {showingSidebar && (
        <div
          className="fixed right-0 top-0 bottom-0 z-30 flex flex-col animate-slide-in-right"
          style={{ width: '360px', background: '#111113', borderLeft: '1px solid rgba(255,255,255,0.047)' }}
        >
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.047)' }}>
            <span className="tel-label">{t('session.title', lang)}</span>
            <button
              onClick={() => setShowingSidebar(false)}
              style={{ color: '#555', cursor: 'pointer', background: 'none', border: 'none', fontSize: '1.2rem', lineHeight: 1 }}
            >×</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
            {sessionHistory.length === 0 && (
              <p className="text-xs text-center mt-8" style={{ color: '#333', fontStyle: 'italic' }}>
                {t('session.empty', lang)}
              </p>
            )}
            {sessionHistory.map(item => (
              <button
                key={item.id}
                onClick={() => handleLoadFromHistory(item)}
                className="text-left p-3 rounded-lg"
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.047)',
                  cursor: 'pointer',
                  transition: 'border-color 200ms ease',
                  borderRadius: '8px',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.047)' }}
              >
                <p className="text-sm mb-1 leading-snug tel-serif" style={{ color: '#e0e0e0', fontStyle: 'italic' }}>{item.theme}</p>
                <p className="text-xs" style={{ color: '#444' }}>
                  {item.sourceCount} sources · {'•'.repeat(item.souffleNiveaux.length)} · {new Date(item.createdAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'short' })}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Auth Modal ── */}
      {showAuthModal && (
        <AuthModal onLogin={handleLogin} onClose={() => setShowAuthModal(false)} />
      )}

      {/* ── Main layout ── */}
      <div className="relative z-10 min-h-screen flex flex-col">

        {/* ─── Header ──────────────────────────────────────────────────── */}
        <header className="flex-shrink-0 px-6 py-4 md:px-10 md:py-5">
          <div className="flex items-center justify-between">
            <button
              onClick={handleReset}
              style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
            >
              <span
                style={{
                  fontWeight: 500,
                  fontSize: '15px',
                  letterSpacing: '0.2em',
                  color: '#ffffff',
                  textTransform: 'uppercase',
                }}
              >
                TEL
              </span>
            </button>

            <div className="flex items-center gap-2">
              <LanguageSelector />
              {/* Nav — desktop: Explorer dropdown + Manifeste */}
              <nav className="hidden md:flex items-center" style={{ marginRight: '8px', gap: '20px' }}>
                {/* Explorer dropdown */}
                <div
                  data-explorer
                  style={{ position: 'relative' }}
                >
                  <button
                    onClick={() => setShowExplorer(v => !v)}
                    style={{ fontSize: '12px', color: '#666666', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 200ms ease', padding: 0 }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#888' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#666666' }}
                  >
                    {t('nav.explore', lang)} ▾
                  </button>
                  {showExplorer && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 8px)', left: '-12px',
                      background: '#111113', border: '1px solid rgba(255,255,255,0.071)',
                      borderRadius: '8px', padding: '6px', minWidth: '160px', zIndex: 50,
                    }}>
                      {[
                        { href: '/legends', label: t('nav.legends', lang) },
                        { href: '/education', label: t('nav.education', lang) },
                        { href: '/transparency', label: t('nav.transparency', lang) },
                        { href: '/initiative', label: t('nav.initiative', lang) },
                        { href: '/careers', label: t('nav.careers', lang) },
                      ].map(link => (
                        <a
                          key={link.href}
                          href={link.href}
                          style={{
                            display: 'block', padding: '8px 12px', fontSize: '12px',
                            color: '#666', textDecoration: 'none', borderRadius: '6px',
                            transition: 'all 200ms ease',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.031)'; e.currentTarget.style.color = '#e0e0e0' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#666' }}
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <a
                  href="/manifesto"
                  style={{ fontSize: '12px', color: '#666666', textDecoration: 'none', transition: 'color 200ms ease' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#888' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#666666' }}
                >
                  {t('nav.manifesto', lang)}
                </a>
              </nav>

              {/* Mobile hamburger */}
              <button
                className="md:hidden"
                onClick={() => setMobileMenuOpen(v => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: '1.2rem', padding: '4px' }}
              >
                {mobileMenuOpen ? '✕' : '☰'}
              </button>

              {/* Session history */}
              <button
                onClick={() => setShowingSidebar(!showingSidebar)}
                className="tel-ghost-btn"
                style={{ fontSize: '12px' }}
              >
                {t('nav.history', lang)}{sessionHistory.length > 0 ? ` (${sessionHistory.length})` : ''}
              </button>

              {/* Auth */}
              {user ? (
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowUserMenu(v => !v)}
                    className="tel-ghost-btn"
                    style={{ fontSize: '12px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {user}
                  </button>
                  {showUserMenu && (
                    <div
                      style={{
                        position: 'absolute', right: 0, top: 'calc(100% + 6px)',
                        background: '#111113', border: '1px solid rgba(255,255,255,0.047)',
                        borderRadius: '8px', padding: '4px', minWidth: '140px', zIndex: 50,
                      }}
                    >
                      <button
                        onClick={handleLogout}
                        style={{
                          width: '100%', textAlign: 'left', padding: '8px 12px',
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#888', fontSize: '12px', borderRadius: '6px',
                          transition: 'background 200ms ease',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.031)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                      >
                        {t('nav.signout', lang)}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="tel-ghost-btn"
                  style={{ fontSize: '12px' }}
                >
                  {t('nav.signin', lang)}
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Mobile nav menu */}
        {mobileMenuOpen && (
          <div className="md:hidden" style={{ background: '#111113', borderBottom: '1px solid rgba(255,255,255,0.047)', padding: '12px 24px 16px' }}>
            {[
              { href: '/legends', label: t('nav.legends', lang) },
              { href: '/education', label: t('nav.education', lang) },
              { href: '/transparency', label: t('nav.transparency', lang) },
              { href: '/careers', label: t('nav.careers', lang) },
              { href: '/manifesto', label: t('nav.manifesto', lang) },
            ].map(link => (
              <a key={link.href} href={link.href} style={{ display: 'block', padding: '10px 0', fontSize: '13px', color: '#888', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.031)' }}>
                {link.label}
              </a>
            ))}
          </div>
        )}

        {/* ─── Central content ──────────────────────────────────────────── */}
        <div className="flex-1">

          {/* ══ IDLE — Landing page ══════════════════════════════════════ */}
          {appState === 'idle' && (
            <div>

              {/* HERO */}
              <section className="px-6 pt-12 pb-16 md:px-10 md:pt-20 md:pb-24 text-center" style={{ maxWidth: '760px', margin: '0 auto', position: 'relative' }}>
                <h2
                  style={{
                    position: 'relative', zIndex: 1,
                    fontWeight: 300,
                    fontSize: 'clamp(2rem, 5vw, 3rem)',
                    lineHeight: 1.2,
                    letterSpacing: '-0.02em',
                    color: '#ffffff',
                    marginBottom: '1.25rem',
                    minHeight: '1.2em',
                  }}
                >
                  <span>{heroText || '\u00A0'}</span>
                  {heroText && heroText.length < t('hero.line1', lang).length && (
                    <span style={{ borderRight: '2px solid #C9A84C', marginLeft: '2px', animation: 'blink 0.7s step-end infinite' }} />
                  )}
                  <br />
                  <span style={{ opacity: heroLine2Visible ? 1 : 0, transition: 'opacity 600ms ease' }}>
                    {t('hero.line2', lang)}
                  </span>
                </h2>
                <p
                  style={{
                    position: 'relative', zIndex: 1,
                    fontSize: '16px',
                    lineHeight: 1.7,
                    color: '#666666',
                    maxWidth: '480px',
                    margin: '0 auto 2.5rem',
                    opacity: heroLine2Visible ? 1 : 0,
                    transition: 'opacity 600ms ease 200ms',
                  }}
                >
                  {t('hero.desc', lang)}
                </p>
                <div style={{ position: 'relative', zIndex: 1, display: 'inline-block', opacity: heroCtaVisible ? 1 : 0, transition: 'opacity 400ms ease' }}>
                  <button
                    onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                    className="tel-gold-btn"
                    style={{ position: 'relative', zIndex: 1, padding: '12px 32px', fontSize: '14px', transition: 'transform 200ms ease' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
                  >
                    {t('hero.cta', lang)}
                  </button>
                </div>
              </section>

              {/* CITATION */}
              <p style={{
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                fontSize: 'clamp(15px, 2vw, 18px)',
                color: 'rgba(255, 255, 255, 0.45)',
                maxWidth: '560px',
                margin: '8px auto 40px auto',
                textAlign: 'center',
                letterSpacing: '0.01em',
                lineHeight: 1.7,
                padding: '0 24px',
              }}>
                {t('hero.citation', lang)}
              </p>

              {/* DEMO CAROUSEL */}
              <section className="tel-animate px-6 pb-12 md:px-10" style={{ maxWidth: '680px', margin: '0 auto' }}>
                <p className="tel-label text-center mb-6">
                  {t('carousel.title', lang)}
                </p>

                <button
                  className="tel-carousel-card w-full text-left"
                  onClick={() => {
                    const srcs = demo.sources.map(s => s.url || s.title || '').filter(Boolean)
                    setPrefillSources(srcs)
                    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
                  }}
                  style={{
                    background: '#111113',
                    border: '1px solid rgba(255,255,255,0.047)',
                    borderRadius: '12px',
                    padding: '28px 32px',
                    opacity: demoVisible ? 1 : 0,
                    transition: 'opacity 300ms ease',
                    minHeight: '160px',
                    width: '100%',
                  }}
                >
                  <div className="flex items-center gap-3 flex-wrap mb-5">
                    {[demoSourceA, demoSourceB].filter(Boolean).map((src, i) => (
                      <span
                        key={i}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          fontSize: '12px', padding: '4px 10px', borderRadius: '4px',
                          background: 'rgba(255,255,255,0.031)',
                          border: '1px solid rgba(255,255,255,0.047)',
                          color: '#666',
                        }}
                      >
                        <span style={{ color: '#C9A84C', fontSize: '8px' }}>●</span>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#444' }}>{SOURCE_LABELS[src.type] || src.type}</span>
                        {(src.title || src.url).slice(0, 42)}{(src.title || src.url).length > 42 ? '…' : ''}
                      </span>
                    ))}
                    <span style={{ color: '#333', fontSize: '1rem', flexShrink: 0 }}>×</span>
                  </div>

                  <p key={`q-${demoIndex}`} className="tel-italic carousel-question-enter" style={{ color: '#e0e0e0', fontSize: '15px', lineHeight: 1.75 }}>
                    &ldquo;{demoQuestion}&rdquo;
                  </p>
                  <p style={{ fontSize: '11px', marginTop: '12px', color: '#333' }}>
                    — {demoTheme}
                  </p>
                  <p style={{ fontSize: '10px', marginTop: '8px', color: '#C9A84C', opacity: 0.5, letterSpacing: '0.1em' }}>
                    {t('carousel.explore', lang)}
                  </p>
                </button>

                <div className="flex items-center justify-center gap-2 mt-4">
                  {demoCards.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => { setDemoVisible(false); setTimeout(() => { setDemoIndex(i); setDemoVisible(true) }, 200) }}
                      style={{
                        width: i === demoIndex ? '20px' : '5px', height: '5px',
                        borderRadius: '3px', border: 'none', cursor: 'pointer', padding: 0,
                        background: i === demoIndex ? '#C9A84C' : 'rgba(255,255,255,0.12)',
                        transition: 'all 300ms ease',
                      }}
                    />
                  ))}
                </div>
              </section>

              {/* HOW IT WORKS */}
              <section className="tel-animate px-6 pb-12 md:px-10" style={{ maxWidth: '760px', margin: '0 auto' }}>
                <p className="tel-label text-center mb-8">{t('how.title', lang)}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { num: '01', title: t('how.step1.title', lang), desc: t('how.step1.desc', lang) },
                    { num: '02', title: t('how.step2.title', lang), desc: t('how.step2.desc', lang) },
                    { num: '03', title: t('how.step3.title', lang), desc: t('how.step3.desc', lang) },
                  ].map(step => (
                    <div key={step.num} className="tel-how-card" style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.047)', borderRadius: '12px', padding: '24px' }}>
                      <p style={{ fontSize: '11px', color: '#C9A84C', letterSpacing: '0.15em', marginBottom: '12px', opacity: 0.7 }}>{step.num}</p>
                      <p style={{ fontSize: '14px', color: '#e0e0e0', marginBottom: '8px', fontWeight: 500 }}>{step.title}</p>
                      <p style={{ fontSize: '13px', color: '#555', lineHeight: 1.7 }}>{step.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* INPUT FORM */}
              <section ref={formRef} className="tel-animate px-6 pb-20 md:px-10" style={{ maxWidth: '680px', margin: '0 auto' }}>
                <div style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.047)', borderRadius: '12px', padding: '32px' }}>
                  <p className="tel-label text-center mb-6">{t('action.newcrossing', lang)}</p>
                  <SourceInput 
                    onCross={handleCross} 
                    isLoading={false} 
                    prefill={prefillSources} 
                    register={register} 
                    onRegisterChange={(r) => { setRegister(r); try { localStorage.setItem('tel:register', r) } catch { /* ok */ } }}
                    isEmpiricalMode={isEmpiricalMode}
                    onToggleEmpiricalMode={setIsEmpiricalMode}
                  />
                </div>
                {sessionHistory.length > 0 && (
                  <div className="text-center mt-4">
                    <button
                      onClick={() => setShowingSidebar(true)}
                      style={{ color: '#333', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 200ms ease' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#888' }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#333' }}
                    >
                      {t('session.review', lang)} {sessionHistory.length} {t('session.crossings', lang)}{sessionHistory.length > 1 ? 's' : ''} →
                    </button>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* ══ ANALYSING + LOADING ═══════════════════════════════════════ */}
          {(appState === 'analysing' || appState === 'loading') && (
            <div className="flex items-center justify-center" style={{ minHeight: '70vh', padding: '2rem' }}>
              <div className="text-center" style={{ maxWidth: '400px' }}>

                {/* Pulsing dot */}
                <div
                  className="tel-loading-dot"
                  style={{ margin: '0 auto 2rem' }}
                />

                {/* Message */}
                <p style={{
                  color: '#555',
                  fontSize: '13px',
                  opacity: loadingMsgVisible ? 1 : 0,
                  transition: 'opacity 300ms ease',
                  minHeight: '1.4em',
                  marginBottom: '1.5rem',
                }}>
                  {(isDiscoveryMode ? DISCOVERY_MESSAGES : LOADING_MESSAGES)[loadingMsgIndex]}
                </p>

                <p style={{ color: '#222', fontSize: '11px', letterSpacing: '0.3em' }}>
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
                  <p className="tel-label mb-1">{t('enrich.title', lang)}</p>
                  <p style={{ fontSize: '13px', color: '#555', fontStyle: 'italic' }}>{t('enrich.subtitle', lang)}</p>
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
              <div className="text-center" style={{ maxWidth: '480px', background: '#111113', border: '1px solid rgba(139,58,58,0.2)', borderRadius: '12px', padding: '40px 32px' }}>
                <p style={{ fontSize: '16px', color: '#8B3A3A', marginBottom: '12px', fontStyle: 'italic' }}>
                  {t('error.crossing', lang)}
                </p>
                <p style={{ fontSize: '14px', color: '#555', lineHeight: 1.7, marginBottom: '24px' }}>
                  {error}
                </p>
                <button
                  onClick={handleReset}
                  className="tel-ghost-btn"
                  style={{ padding: '10px 28px' }}
                >
                  {t('error.retry', lang)}
                </button>
              </div>
            </div>
          )}

          {/* ══ RESULT — InsightCard ═════════════════════════════════════ */}
          {appState === 'result' && currentCard && (
            <div className="flex items-center justify-center px-4 py-8" style={{ minHeight: '70vh' }}>
              <div style={{ width: '100%', maxWidth: '680px' }}>
                {discoveryInfo && (
                  <div className="mb-4 px-4 py-3 rounded-lg" style={{ background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.1)' }}>
                    <p className="tel-label mb-1">{t('discovery.found', lang)}</p>
                    <p style={{ fontSize: '13px', color: '#666', fontStyle: 'italic', lineHeight: 1.6 }}>
                      <span style={{ color: '#e0e0e0' }}>{discoveryInfo.titre}</span>
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
                  lang={lang}
                />
              </div>
            </div>
          )}

        </div>

        {/* ─── Footer ──────────────────────────────────────────────────── */}
        <footer className="flex-shrink-0 px-6 py-8 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.031)' }}>
          <p style={{ color: '#444', fontSize: '11px', letterSpacing: '0.1em', marginBottom: '10px' }}>
            TEL — The Experience Layer
          </p>
          <div className="flex items-center justify-center flex-wrap" style={{ gap: '6px' }}>
            {[
              { href: '/legends', label: t('nav.legends', lang) },
              { href: '/education', label: t('nav.education', lang) },
              { href: '/transparency', label: t('nav.transparency', lang) },
              { href: '/manifesto', label: t('nav.manifesto', lang) },
              { href: '/careers', label: t('nav.careers', lang) },
            ].map((link, i, arr) => (
              <span key={link.href} className="flex items-center gap-1.5">
                <a
                  href={link.href}
                  style={{ color: '#333', fontSize: '11px', letterSpacing: '0.1em', textDecoration: 'none', transition: 'color 200ms ease' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#888' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#333' }}
                >
                  {link.label}
                </a>
                {i < arr.length - 1 && <span style={{ color: '#222', fontSize: '10px' }}>·</span>}
              </span>
            ))}
          </div>
        </footer>
      </div>

      {isEmpiricalMode && (appState === 'loading' || appState === 'analysing') && (
        <div className="fixed bottom-4 left-4 z-50 pointer-events-none" style={{ fontFamily: 'monospace', fontSize: '9px', color: 'rgba(201,168,76,0.6)', lineHeight: 1.4 }}>
          <div>[SOUFFLE Engine] Asynchronous Proxy Routing Live</div>
          <div>[Omi Audit] Injecting counter-narrative weights: {pendingContexte}</div>
          <div className="animate-pulse" style={{ animationDuration: '1s' }}>[SOUFFLE] Computing systemic divergence vectors...</div>
        </div>
      )}
    </main>
  )
}
