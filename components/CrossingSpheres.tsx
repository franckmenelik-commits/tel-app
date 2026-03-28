'use client'

// TEL — The Experience Layer
// components/CrossingSpheres.tsx — Premium 3D interactive spheres
//
// ARCHITECTURE : imperative DOM updates inside RAF (zero React re-renders per frame)
// STATES : idle → scroll → loading → resonating → result
// MOBILE  : no 3D tilt, smaller spheres, no drag, reduced opacity
// RESULT  : spheres retreat to far corners at opacity 0.05 — never obstructs content

import { useEffect, useRef } from 'react'

interface CrossingSpheresProps {
  isLoading?: boolean
  hasResult?: boolean
  isResonating?: boolean
}

// ── Constants ─────────────────────────────────────────────────────────────────
const A0 = { x: 16, y: 26 }
const B0 = { x: 84, y: 74 }
const CX = 50

const RESO = [
  { sx: -8,  sy: 50,  color: '#E84393', light: '#FF8ED4' },
  { sx: 108, sy: 12,  color: '#00B894', light: '#55EFC4' },
  { sx: 50,  sy: 110, color: '#6C5CE7', light: '#A29BFE' },
] as const

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }
function easeOut(t: number) { return 1 - (1 - t) ** 3 }

// Softer spring — less overshoot, more fluid
function spring(pos: number, target: number, vel: number, k = 0.048, d = 0.84): [number, number] {
  const v = (vel + (target - pos) * k) * d
  return [pos + v, v]
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CrossingSpheres({
  isLoading    = false,
  hasResult    = false,
  isResonating = false,
}: CrossingSpheresProps) {

  // ── DOM refs — no React state in the RAF loop ─────────────────────────────
  const sceneRef   = useRef<HTMLDivElement>(null)
  const sphereARef = useRef<HTMLDivElement>(null)
  const sphereBRef = useRef<HTMLDivElement>(null)
  const centerRef  = useRef<HTMLDivElement>(null)
  const resoRefs   = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ]

  // ── Physics state refs ────────────────────────────────────────────────────
  const pA  = useRef({ x: A0.x, y: A0.y, vx: 0, vy: 0 })
  const pB  = useRef({ x: B0.x, y: B0.y, vx: 0, vy: 0 })

  // ── Input refs ─────────────────────────────────────────────────────────────
  const mouse       = useRef({ x: 50, y: 50 })
  const drag        = useRef<'A' | 'B' | null>(null)
  const dragOff     = useRef({ x: 0, y: 0 })
  const histA       = useRef<{ x: number; y: number; t: number }[]>([])
  const histB       = useRef<{ x: number; y: number; t: number }[]>([])
  const pinA        = useRef<{ x: number; y: number } | null>(null)
  const pinB        = useRef<{ x: number; y: number } | null>(null)

  // ── Prop refs (sync without re-running RAF) ────────────────────────────────
  const loadingRef    = useRef(isLoading)
  const resultRef     = useRef(hasResult)
  const resonatingRef = useRef(isResonating)
  const flashRef      = useRef(false)
  const raf           = useRef<number>(0)
  const t0            = useRef(Date.now())

  useEffect(() => { loadingRef.current    = isLoading    }, [isLoading])
  useEffect(() => { resultRef.current     = hasResult    }, [hasResult])
  useEffect(() => { resonatingRef.current = isResonating }, [isResonating])

  // ── Result flash ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasResult) return
    pinA.current = null
    pinB.current = null
    flashRef.current = true
    const id = setTimeout(() => { flashRef.current = false }, 500)
    return () => clearTimeout(id)
  }, [hasResult])

  // ── Window-level drag (works even with spheres behind content) ────────────
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const mx = (e.clientX / window.innerWidth)  * 100
      const my = (e.clientY / window.innerHeight) * 100
      mouse.current = { x: mx, y: my }

      if (drag.current === 'A') {
        const pos = { x: mx - dragOff.current.x, y: my - dragOff.current.y }
        pinA.current = pos
        histA.current.push({ ...pos, t: Date.now() })
        histA.current = histA.current.filter(p => Date.now() - p.t < 100)
      } else if (drag.current === 'B') {
        const pos = { x: mx - dragOff.current.x, y: my - dragOff.current.y }
        pinB.current = pos
        histB.current.push({ ...pos, t: Date.now() })
        histB.current = histB.current.filter(p => Date.now() - p.t < 100)
      }
    }

    const onDown = (e: PointerEvent) => {
      if (resultRef.current || loadingRef.current || resonatingRef.current) return
      if (window.innerWidth < 768) return  // no drag on mobile
      const mx = (e.clientX / window.innerWidth)  * 100
      const my = (e.clientY / window.innerHeight) * 100
      const dA = Math.hypot(mx - pA.current.x, my - pA.current.y)
      const dB = Math.hypot(mx - pB.current.x, my - pB.current.y)
      const HIT = 18  // % of viewport
      if (dA < HIT && dA <= dB) {
        drag.current = 'A'
        dragOff.current = { x: mx - pA.current.x, y: my - pA.current.y }
      } else if (dB < HIT) {
        drag.current = 'B'
        dragOff.current = { x: mx - pB.current.x, y: my - pB.current.y }
      }
    }

    const onUp = () => {
      const released = drag.current
      drag.current = null
      if (!released) return
      const hist = released === 'A' ? histA.current : histB.current
      const p = released === 'A' ? pA.current : pB.current
      if (hist.length >= 2) {
        const dt = (hist[hist.length - 1].t - hist[0].t) / 1000
        if (dt > 0) {
          p.vx = ((hist[hist.length - 1].x - hist[0].x) / dt) * 0.09
          p.vy = ((hist[hist.length - 1].y - hist[0].y) / dt) * 0.09
        }
      }
      if (released === 'A') histA.current = []
      else histB.current = []
      // Spring back to natural after 2s
      setTimeout(() => {
        if (released === 'A') pinA.current = null
        else pinB.current = null
      }, 2200)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup',   onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup',   onUp)
    }
  }, [])

  // ── Main RAF loop — 100% imperative DOM updates ───────────────────────────
  useEffect(() => {
    function tick() {
      const t          = (Date.now() - t0.current) / 1000
      const mx         = mouse.current.x
      const my         = mouse.current.y
      const loading    = loadingRef.current
      const result     = resultRef.current
      const resonating = resonatingRef.current
      const isMobile   = window.innerWidth < 768

      const maxS   = document.documentElement.scrollHeight - window.innerHeight
      const scroll = maxS > 0 ? Math.min(1, window.scrollY / maxS) : 0
      const merge  = Math.min(1, scroll * 2)

      // ── Target positions ─────────────────────────────────────────────────
      let tAx: number, tAy: number, tBx: number, tBy: number

      if (result) {
        // Retreat to far corners — never obstructs InsightCard content
        tAx = 5;  tAy = 8
        tBx = 95; tBy = 92
      } else if (resonating) {
        tAx = CX; tAy = CX
        const orb = t * (Math.PI * 2 / 5)
        tBx = CX + Math.cos(orb) * 10
        tBy = CX + Math.sin(orb) * 10
      } else if (loading) {
        const a = t * (Math.PI * 2 / 3)
        tAx = CX + Math.cos(a)           * 7
        tAy = CX + Math.sin(a)           * 7
        tBx = CX + Math.cos(a + Math.PI) * 7
        tBy = CX + Math.sin(a + Math.PI) * 7
      } else {
        const bAx = lerp(A0.x, CX, merge)
        const bAy = lerp(A0.y, CX, merge)
        const bBx = lerp(B0.x, CX, merge)
        const bBy = lerp(B0.y, CX, merge)
        const pull = 1 - merge

        // COUNTERBALANCE:
        // Sphere A attracted toward cursor
        // Sphere B attracted toward OPPOSITE of cursor
        // → Moving mouse left pushes A left, B right — they diverge
        if (pinA.current) { tAx = pinA.current.x; tAy = pinA.current.y }
        else {
          tAx = lerp(bAx, mx,       0.13 * pull)
          tAy = lerp(bAy, my,       0.09 * pull)
        }
        if (pinB.current) { tBx = pinB.current.x; tBy = pinB.current.y }
        else {
          tBx = lerp(bBx, 100 - mx, 0.08 * pull)
          tBy = lerp(bBy, 100 - my, 0.06 * pull)
        }
      }

      // ── Spring physics ────────────────────────────────────────────────────
      const fastK  = (loading || resonating || result) ? 0.09 : 0.048
      const [nAx, nAvx] = spring(pA.current.x, tAx, pA.current.vx, fastK)
      const [nAy, nAvy] = spring(pA.current.y, tAy, pA.current.vy, fastK)
      pA.current = { x: nAx, y: nAy, vx: nAvx, vy: nAvy }

      const [nBx, nBvx] = spring(pB.current.x, tBx, pB.current.vx, fastK)
      const [nBy, nBvy] = spring(pB.current.y, tBy, pB.current.vy, fastK)
      pB.current = { x: nBx, y: nBy, vx: nBvx, vy: nBvy }

      // ── Derived values ────────────────────────────────────────────────────
      const speedA = Math.hypot(nAvx, nAvy)
      const speedB = Math.hypot(nBvx, nBvy)

      const baseBlur = isMobile ? 22 : 36
      const aBlur = clamp(baseBlur - merge * 8 + speedA * 10, 10, 55)
      const bBlur = clamp(baseBlur - merge * 8 + speedB * 10, 10, 55)

      const TWO_PI = Math.PI * 2
      const aScale = (loading || resonating) ? 1 : 1 + Math.sin(t * (TWO_PI / 6)) * 0.08
      const bScale = (loading || resonating) ? 1 : 1 + Math.sin((t - 3) * (TWO_PI / 6)) * 0.08

      // 3D lighting — gradient tracks cursor relative to sphere
      const aGX = clamp(50 + (mx - nAx) * 0.42, 18, 82)
      const aGY = clamp(50 + (my - nAy) * 0.42, 18, 82)
      const bGX = clamp(50 + (mx - nBx) * 0.42, 18, 82)
      const bGY = clamp(50 + (my - nBy) * 0.42, 18, 82)

      // Container tilt — disabled on mobile (causes jitter)
      const tF  = isMobile ? 0 : 1
      const cRx = resonating ? 0 : ((my - 50) * 0.09 + scroll * 14) * tF
      const cRy = resonating ? 0 : (mx - 50) * -0.07 * tF

      // Sphere 3D rotation on scroll — disabled on mobile
      const arx = -scroll * 16 * tF;  const ary = scroll * 11 * tF
      const brx =  scroll * 16 * tF;  const bry = -scroll * 11 * tF
      const az  = merge * 40;  const bz = merge * 28

      // Opacity
      const baseOp = result
        ? (flashRef.current ? 0.45 : 0.05)
        : isMobile ? 0.20 : 0.26

      // Sphere size — responsive
      const SZ   = isMobile ? '150px' : 'clamp(200px, 28vw, 340px)'
      const HALF = isMobile ? '75px'  : 'clamp(100px, 14vw, 170px)'

      // ── Apply to DOM ──────────────────────────────────────────────────────
      if (sphereARef.current) {
        const el = sphereARef.current
        el.style.width  = SZ
        el.style.height = SZ
        el.style.left   = `calc(${nAx}% - ${HALF})`
        el.style.top    = `calc(${nAy}% - ${HALF})`
        el.style.filter = `blur(${aBlur}px)`
        el.style.opacity = String(baseOp)
        el.style.background = `radial-gradient(circle at ${aGX}% ${aGY}%, #FFE599 0%, #D4A843 28%, #C9A84C 50%, transparent 72%)`
        el.style.transform  = `translateZ(${az}px) rotateX(${arx}deg) rotateY(${ary}deg) scale(${aScale})`
        el.style.cursor = (loading || result || resonating || isMobile) ? 'default' : 'grab'
        el.style.pointerEvents = (loading || result || resonating || isMobile) ? 'none' : 'auto'
      }

      if (sphereBRef.current) {
        const el = sphereBRef.current
        el.style.width  = SZ
        el.style.height = SZ
        el.style.left   = `calc(${nBx}% - ${HALF})`
        el.style.top    = `calc(${nBy}% - ${HALF})`
        el.style.filter = `blur(${bBlur}px)`
        el.style.opacity = String(baseOp)
        el.style.background = `radial-gradient(circle at ${bGX}% ${bGY}%, #A8C8FF 0%, #5A8FD4 28%, #4A7CC9 50%, transparent 72%)`
        el.style.transform  = `translateZ(${bz}px) rotateX(${brx}deg) rotateY(${bry}deg) scale(${bScale})`
        el.style.cursor = (loading || result || resonating || isMobile) ? 'default' : 'grab'
        el.style.pointerEvents = (loading || result || resonating || isMobile) ? 'none' : 'auto'
      }

      if (sceneRef.current) {
        sceneRef.current.style.transform = `rotateX(${cRx}deg) rotateY(${cRy}deg)`
      }

      // Center glow
      if (centerRef.current) {
        const cOp = resonating ? 0.20 : loading ? 0.16 : merge * 0.16
        centerRef.current.style.opacity = String(cOp)
      }

      // ── Resonance spheres ─────────────────────────────────────────────────
      const CYCLE  = 9
      const tMod   = t % CYCLE
      const TRAVEL = 2.8

      resoRefs.forEach((ref, i) => {
        const el = ref.current
        if (!el) return
        if (!resonating) { el.style.opacity = '0'; return }

        const winStart = i * 3
        const progress = clamp((tMod - winStart) / TRAVEL, 0, 1)
        const eased    = easeOut(progress)
        const s        = RESO[i]
        let rx: number, ry: number, rop: number

        if (progress <= 0) {
          rx = s.sx; ry = s.sy
          rop = 0.10 + Math.sin(t * 3 + i) * 0.04
        } else if (progress >= 1) {
          const da = t * 0.4 + i * (Math.PI * 2 / 3)
          rx  = CX + Math.cos(da) * 3.5
          ry  = CX + Math.sin(da) * 3.5
          const arrived = tMod - (winStart + TRAVEL)
          rop = (arrived >= 0 && arrived < 0.4) ? 0.55 : 0.20
        } else {
          rx  = lerp(s.sx, CX, eased)
          ry  = lerp(s.sy, CX, eased)
          rop = 0.25 + eased * 0.12
        }

        el.style.left    = `calc(${rx}% - 30px)`
        el.style.top     = `calc(${ry}% - 30px)`
        el.style.opacity = String(rop)
      })

      raf.current = requestAnimationFrame(tick)
    }

    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, []) // intentionally empty — all props sync via refs

  // ── Static initial styles — RAF overwrites from first frame ──────────────
  const initSZ   = 'clamp(200px, 28vw, 340px)'
  const initHALF = 'clamp(100px, 14vw, 170px)'

  return (
    <div style={{
      position: 'fixed', inset: 0,
      zIndex: 11,
      overflow: 'hidden',
      pointerEvents: 'none',
      perspective: '900px',
      perspectiveOrigin: '50% 38%',
    }}>
      <div
        ref={sceneRef}
        style={{
          position: 'absolute', inset: 0,
          transformStyle: 'preserve-3d',
          transform: 'rotateX(0deg) rotateY(0deg)',
        }}
      >
        {/* Sphere A — Gold */}
        <div
          ref={sphereARef}
          style={{
            position: 'absolute',
            width: initSZ, height: initSZ,
            left: `calc(${A0.x}% - ${initHALF})`,
            top:  `calc(${A0.y}% - ${initHALF})`,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 35%, #FFE599 0%, #D4A843 28%, #C9A84C 50%, transparent 72%)',
            filter: 'blur(36px)',
            mixBlendMode: 'screen',
            opacity: 0.26,
            willChange: 'transform, opacity, left, top, filter',
            pointerEvents: 'none',
            touchAction: 'none',
            userSelect: 'none',
          }}
        />

        {/* Sphere B — Blue */}
        <div
          ref={sphereBRef}
          style={{
            position: 'absolute',
            width: initSZ, height: initSZ,
            left: `calc(${B0.x}% - ${initHALF})`,
            top:  `calc(${B0.y}% - ${initHALF})`,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 60% 65%, #A8C8FF 0%, #5A8FD4 28%, #4A7CC9 50%, transparent 72%)',
            filter: 'blur(36px)',
            mixBlendMode: 'screen',
            opacity: 0.26,
            willChange: 'transform, opacity, left, top, filter',
            pointerEvents: 'none',
            touchAction: 'none',
            userSelect: 'none',
          }}
        />

        {/* Resonance spheres — hidden until isResonating */}
        {RESO.map((s, i) => (
          <div
            key={i}
            ref={resoRefs[i]}
            style={{
              position: 'absolute',
              width: '60px', height: '60px',
              left: `calc(${s.sx}% - 30px)`,
              top:  `calc(${s.sy}% - 30px)`,
              borderRadius: '50%',
              background: `radial-gradient(circle at 38% 38%, ${s.light} 0%, ${s.color} 45%, transparent 72%)`,
              filter: 'blur(12px)',
              mixBlendMode: 'screen',
              opacity: 0,
              willChange: 'left, top, opacity',
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Center convergence glow — 400px */}
        <div
          ref={centerRef}
          style={{
            position: 'absolute',
            left: 'calc(50% - 200px)', top: 'calc(50% - 200px)',
            width: '400px', height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)',
            filter: 'blur(60px)',
            mixBlendMode: 'screen',
            opacity: 0,
            transform: 'translateZ(22px)',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  )
}
