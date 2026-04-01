'use client'

// TEL — The Experience Layer
// components/CrossingSpheres.tsx — Premium 3D interactive spheres
//
// ARCHITECTURE : imperative DOM updates inside RAF (zero React re-renders per frame)
// STATES : idle → scroll → loading (approach→merge→pulse) → resonating → result
// DRAG   : pin stays wherever you drop it — no auto-return
// MOBILE : no 3D tilt, smaller spheres, no drag, reduced opacity
// RESULT : spheres retreat to far corners at opacity 0.05 — never obstructs content

import { useEffect, useRef } from 'react'

interface CrossingSpheresProps {
  isLoading?: boolean
  hasResult?: boolean
  isResonating?: boolean
  isIdle?: boolean
}

// ── Constants ─────────────────────────────────────────────────────────────────
const A0 = { x: 16, y: 26 }
const B0 = { x: 84, y: 74 }
const CX = 50

// Loading animation phases (seconds from loading start)
const APPROACH_END = 1.4   // both spheres reach center-top
const MERGE_DUR    = 0.6   // B fades, A swells
const MERGE_END    = APPROACH_END + MERGE_DUR  // 2.0s — A alone, pulses

const RESO = [
  { sx: -8,  sy: 50,  color: '#E84393', light: '#FF8ED4' },
  { sx: 108, sy: 12,  color: '#00B894', light: '#55EFC4' },
  { sx: 50,  sy: 110, color: '#6C5CE7', light: '#A29BFE' },
] as const

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }
function easeOut(t: number) { return 1 - (1 - t) ** 3 }

// Responsive spring — snappy but not jittery
function spring(pos: number, target: number, vel: number, k = 0.065, d = 0.80): [number, number] {
  const v = (vel + (target - pos) * k) * d
  return [pos + v, v]
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CrossingSpheres({
  isLoading    = false,
  hasResult    = false,
  isResonating = false,
  isIdle       = false,
}: CrossingSpheresProps) {

  // ── DOM refs — no React state in the RAF loop ─────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef   = useRef<HTMLDivElement>(null)
  const sphereARef = useRef<HTMLDivElement>(null)
  const sphereBRef = useRef<HTMLDivElement>(null)
  const centerRef  = useRef<HTMLDivElement>(null)
  const earthRef   = useRef<HTMLDivElement>(null)
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
  const loadingRef      = useRef(isLoading)
  const resultRef       = useRef(hasResult)
  const resonatingRef   = useRef(isResonating)
  const idleRef         = useRef(isIdle)
  const loadingStartRef = useRef<number | null>(null)
  const flashRef        = useRef(false)
  const raf             = useRef<number>(0)
  const t0              = useRef(Date.now())

  useEffect(() => { loadingRef.current    = isLoading    }, [isLoading])
  useEffect(() => { resultRef.current     = hasResult    }, [hasResult])
  useEffect(() => { resonatingRef.current = isResonating }, [isResonating])
  useEffect(() => { idleRef.current       = isIdle       }, [isIdle])

  // ── Loading start — record time, clear drag pins ──────────────────────────
  useEffect(() => {
    if (isLoading) {
      loadingStartRef.current = Date.now()
      pinA.current = null
      pinB.current = null
    } else {
      loadingStartRef.current = null
    }
  }, [isLoading])

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
      const HIT = 26  // % of viewport — larger hit zone, easier to grab
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
      // Apply throw velocity — sphere stays wherever you release it (no auto-return)
      const hist = released === 'A' ? histA.current : histB.current
      const p = released === 'A' ? pA.current : pB.current
      if (hist.length >= 2) {
        const dt = (hist[hist.length - 1].t - hist[0].t) / 1000
        if (dt > 0) {
          p.vx = ((hist[hist.length - 1].x - hist[0].x) / dt) * 0.14
          p.vy = ((hist[hist.length - 1].y - hist[0].y) / dt) * 0.14
        }
      }
      if (released === 'A') histA.current = []
      else histB.current = []
      // Pin stays — sphere remains where you dropped it until next state change
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
      const isTablet   = !isMobile && window.innerWidth < 1100

      // Loading elapsed time
      const lt = loading && loadingStartRef.current
        ? (Date.now() - loadingStartRef.current) / 1000
        : 0

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
        // Phases: approach → merge → pulse
        const cx = 50, cy = 26
        if (lt < MERGE_END) {
          // Approach + merge: spread shrinks linearly to 0
          const spread = Math.max(0, (MERGE_END - lt) / MERGE_END) * 5
          tAx = cx - spread; tAy = cy
          tBx = cx + spread; tBy = cy
        } else {
          // Post-merge: A orbits slowly at center-top, B stays hidden at center
          const a = (lt - MERGE_END) * (Math.PI * 2 / 7)
          tAx = cx + Math.cos(a) * 1.8
          tAy = cy + Math.sin(a) * 1.8
          tBx = cx; tBy = cy
        }
      } else {
        const idle = idleRef.current
        const bAx = lerp(A0.x, CX, merge)
        const bAy = lerp(A0.y, CX, merge)
        const bBx = lerp(B0.x, CX, merge)
        const bBy = lerp(B0.y, CX, merge)
        const pull = 1 - merge

        if (idle && merge < 0.05) {
          // Earth orbit mode — spheres orbit center at scroll=0
          const orbitR = isMobile ? 18 : 22
          const speedA_orbit = 0.4
          const speedB_orbit = -0.28
          const angA = t * speedA_orbit
          const angB = t * speedB_orbit + Math.PI
          if (pinA.current) { tAx = pinA.current.x; tAy = pinA.current.y }
          else { tAx = 50 + Math.cos(angA) * orbitR; tAy = 50 + Math.sin(angA) * orbitR * 0.55 }
          if (pinB.current) { tBx = pinB.current.x; tBy = pinB.current.y }
          else { tBx = 50 + Math.cos(angB) * orbitR; tBy = 50 + Math.sin(angB) * orbitR * 0.55 }
        } else if (idle && merge < 0.6) {
          // Transition out of orbit — blend between orbit and normal positions
          const blendT = merge / 0.6
          const orbitR = isMobile ? 18 : 22
          const speedA_orbit = 0.4
          const speedB_orbit = -0.28
          const angA = t * speedA_orbit
          const angB = t * speedB_orbit + Math.PI
          const orbitAx = 50 + Math.cos(angA) * orbitR
          const orbitAy = 50 + Math.sin(angA) * orbitR * 0.55
          const orbitBx = 50 + Math.cos(angB) * orbitR
          const orbitBy = 50 + Math.sin(angB) * orbitR * 0.55
          const normalAx = lerp(bAx, mx, 0.22 * pull)
          const normalAy = lerp(bAy, my, 0.16 * pull)
          const normalBx = lerp(bBx, 100 - mx, 0.14 * pull)
          const normalBy = lerp(bBy, 100 - my, 0.10 * pull)
          if (pinA.current) { tAx = pinA.current.x; tAy = pinA.current.y }
          else { tAx = lerp(orbitAx, normalAx, blendT); tAy = lerp(orbitAy, normalAy, blendT) }
          if (pinB.current) { tBx = pinB.current.x; tBy = pinB.current.y }
          else { tBx = lerp(orbitBx, normalBx, blendT); tBy = lerp(orbitBy, normalBy, blendT) }
        } else {
          // Normal idle — counterbalance with cursor
          if (pinA.current) { tAx = pinA.current.x; tAy = pinA.current.y }
          else {
            tAx = lerp(bAx, mx, 0.22 * pull)
            tAy = lerp(bAy, my, 0.16 * pull)
          }
          if (pinB.current) { tBx = pinB.current.x; tBy = pinB.current.y }
          else {
            tBx = lerp(bBx, 100 - mx, 0.14 * pull)
            tBy = lerp(bBy, 100 - my, 0.10 * pull)
          }
        }
      }

      // ── Dynamic z-index ───────────────────────────────────────────────────
      if (containerRef.current) {
        containerRef.current.style.zIndex = (result || loading) ? '0' : '11'
      }

      // ── Spring physics ────────────────────────────────────────────────────
      const fastK  = (loading || resonating || result) ? 0.10 : 0.065
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

      // 3D lighting — gradient tracks cursor relative to sphere
      const aGX = clamp(50 + (mx - nAx) * 0.60, 15, 85)
      const aGY = clamp(50 + (my - nAy) * 0.60, 15, 85)
      const bGX = clamp(50 + (mx - nBx) * 0.60, 15, 85)
      const bGY = clamp(50 + (my - nBy) * 0.60, 15, 85)

      // Container tilt — only in idle; disabled during loading, resonating, mobile
      const tF  = isMobile ? 0 : 1
      const cRx = (resonating || loading || result) ? 0 : ((my - 50) * 0.15 + scroll * 20) * tF
      const cRy = (resonating || loading || result) ? 0 : (mx - 50) * -0.12 * tF

      // Sphere 3D rotation — suppressed during loading/result/resonating
      const arx = (loading || result || resonating) ? 0 : -scroll * 28 * tF
      const ary = (loading || result || resonating) ? 0 :  scroll * 18 * tF
      const brx = (loading || result || resonating) ? 0 :  scroll * 28 * tF
      const bry = (loading || result || resonating) ? 0 : -scroll * 18 * tF
      const az  = merge * 40;  const bz = merge * 28

      // ── Per-sphere opacity and scale ──────────────────────────────────────
      let opA: number, opB: number, scA: number, scB: number

      if (result) {
        opA = opB = flashRef.current ? 0.45 : 0.05
        scA = scB = 1
      } else if (loading) {
        const baseLoad = isMobile || isTablet ? 0.10 : 0.14
        if (lt < APPROACH_END) {
          // Both approaching — equal and visible
          opA = opB = baseLoad
          scA = scB = 1
        } else if (lt < MERGE_END) {
          // Merge phase — B fades, A swells
          const mp = clamp((lt - APPROACH_END) / MERGE_DUR, 0, 1)
          const me = easeOut(mp)
          opA = baseLoad + me * 0.18
          opB = baseLoad * (1 - me)
          scA = 1 + me * 0.45
          scB = 1 - me * 0.65
        } else {
          // Post-merge — A alone, slow breathing pulse
          const pulse = 0.5 + Math.sin((lt - MERGE_END) * (TWO_PI / 2.5)) * 0.5
          opA = baseLoad + 0.08 + pulse * 0.12
          opB = 0
          scA = 1.25 + pulse * 0.22
          scB = 0
        }
      } else if (resonating) {
        opA = opB = isMobile ? 0.14 : isTablet ? 0.22 : 0.28
        scA = scB = 1
      } else {
        opA = opB = isMobile ? 0.14 : isTablet ? 0.22 : 0.28
        scA = 1 + Math.sin(t * (TWO_PI / 6)) * 0.08
        scB = 1 + Math.sin((t - 3) * (TWO_PI / 6)) * 0.08
      }

      // Sphere size — small during loading, large in idle
      const SZ = loading
        ? (isMobile ? '90px' : isTablet ? '110px' : 'clamp(110px, 12vw, 160px)')
        : isMobile ? '160px'
        : isTablet ? 'clamp(180px, 24vw, 280px)'
        : 'clamp(240px, 32vw, 400px)'

      const HALF = loading
        ? (isMobile ? '45px' : isTablet ? '55px' : 'clamp(55px, 6vw, 80px)')
        : isMobile ? '80px'
        : isTablet ? 'clamp(90px, 12vw, 140px)'
        : 'clamp(120px, 16vw, 200px)'

      // ── Apply to DOM ──────────────────────────────────────────────────────
      if (sphereARef.current) {
        const el = sphereARef.current
        el.style.width  = SZ
        el.style.height = SZ
        el.style.left   = `calc(${nAx}% - ${HALF})`
        el.style.top    = `calc(${nAy}% - ${HALF})`
        el.style.filter = `blur(${aBlur}px)`
        el.style.opacity = String(opA)
        el.style.background = `radial-gradient(circle at ${aGX}% ${aGY}%, #FFE599 0%, #D4A843 28%, #C9A84C 50%, transparent 72%)`
        el.style.transform  = `translateZ(${az}px) rotateX(${arx}deg) rotateY(${ary}deg) scale(${scA})`
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
        el.style.opacity = String(opB)
        el.style.background = `radial-gradient(circle at ${bGX}% ${bGY}%, #A8C8FF 0%, #5A8FD4 28%, #4A7CC9 50%, transparent 72%)`
        el.style.transform  = `translateZ(${bz}px) rotateX(${brx}deg) rotateY(${bry}deg) scale(${scB})`
        el.style.cursor = (loading || result || resonating || isMobile) ? 'default' : 'grab'
        el.style.pointerEvents = (loading || result || resonating || isMobile) ? 'none' : 'auto'
      }

      if (sceneRef.current) {
        sceneRef.current.style.transform = `rotateX(${cRx}deg) rotateY(${cRy}deg)`
      }

      // Center convergence glow — flares during merge
      if (centerRef.current) {
        let cOp: number
        if (resonating) {
          cOp = 0.20
        } else if (loading && lt >= APPROACH_END && lt < MERGE_END) {
          // Merge flash
          const mp = clamp((lt - APPROACH_END) / MERGE_DUR, 0, 1)
          cOp = 0.16 + easeOut(mp) * 0.28
        } else if (loading) {
          cOp = 0.16
        } else {
          cOp = merge * 0.16
        }
        centerRef.current.style.opacity = String(cOp)
      }

      // ── Earth — visible only in idle at scroll=0 ──────────────────────────────
      if (earthRef.current) {
        const idle = idleRef.current
        const earthOp = (idle && !loading && !result && !resonating)
          ? Math.max(0, 1 - merge * 3) * (isMobile ? 0.06 : 0.10)
          : 0
        earthRef.current.style.opacity = String(earthOp)
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
  const initSZ   = 'clamp(240px, 32vw, 400px)'
  const initHALF = 'clamp(120px, 16vw, 200px)'

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed', inset: 0,
        zIndex: 11,
        overflow: 'hidden',
        pointerEvents: 'none',
        perspective: '900px',
        perspectiveOrigin: '50% 38%',
      }}
    >
      <div
        ref={sceneRef}
        style={{
          position: 'absolute', inset: 0,
          transformStyle: 'preserve-3d',
          transform: 'rotateX(0deg) rotateY(0deg)',
        }}
      >
        {/* Earth — center glow, visible in idle at scroll=0 */}
        <div
          ref={earthRef}
          style={{
            position: 'absolute',
            width: 'clamp(160px, 22vw, 320px)',
            height: 'clamp(160px, 22vw, 320px)',
            left: 'calc(50% - clamp(80px, 11vw, 160px))',
            top: 'calc(50% - clamp(80px, 11vw, 160px))',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 42% 38%, #4A9EFF 0%, #1A4A8F 30%, #0D2B5E 55%, #040E1F 80%, transparent 100%)',
            filter: 'blur(8px)',
            mixBlendMode: 'screen',
            opacity: 0,
            willChange: 'opacity',
            pointerEvents: 'none',
          }}
        />

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
