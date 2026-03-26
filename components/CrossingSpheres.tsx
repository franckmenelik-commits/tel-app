'use client'

// TEL — The Experience Layer
// components/CrossingSpheres.tsx — Premium 3D interactive spheres
//
// ─────────────────────────────────────────────────────────────────────────────
//  FEATURES
//  • Draggable     — click + hold + drag each sphere independently
//  • Momentum      — release throws sphere; springs back to natural position
//  • 3D lighting   — gradient origin tracks cursor (real orb shading)
//  • Mouse tilt    — full 3D perspective container tilts ±15° with cursor
//  • Scroll 3D     — spheres counter-rotate + come toward viewer as merge
//  • Velocity blur — faster movement = softer edges
//  • z-index 11    — spheres float above content (mix-blend-mode screen)
//  • isResonating  — Croise-moi mode: 3 human-vécus spheres travel to center
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react'

interface CrossingSpheresProps {
  isLoading?: boolean
  hasResult?: boolean
  isResonating?: boolean  // Croise-moi loading: vécus humains viennent au centre
}

// ── Spring physics ────────────────────────────────────────────────────────────
function spring(
  pos: number, target: number, vel: number,
  stiffness = 0.06, damping = 0.78
): [number, number] {
  const newVel = (vel + (target - pos) * stiffness) * damping
  return [pos + newVel, newVel]
}

// ── Constants ─────────────────────────────────────────────────────────────────
const A0 = { x: 15, y: 25 }
const B0 = { x: 85, y: 75 }
const CX = 50

// 3 human-vécu spheres — appear from edges and converge on center
const RESO_SPHERES = [
  { sx: -8,  sy: 50,  color: '#E84393', light: '#FF8ED4' },  // rose — from left
  { sx: 108, sy: 12,  color: '#00B894', light: '#55EFC4' },  // vert — from top-right
  { sx: 50,  sy: 110, color: '#6C5CE7', light: '#A29BFE' },  // violet — from bottom
] as const

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }
function easeOut(t: number) { return 1 - (1 - t) ** 3 }

// ── Visual state ───────────────────────────────────────────────────────────────
interface VS {
  ax: number; ay: number
  bx: number; by: number
  aGX: number; aGY: number
  bGX: number; bGY: number
  aBlur: number; bBlur: number
  aOp: number;  bOp: number
  aScale: number; bScale: number
  az: number; bz: number
  arx: number; ary: number
  brx: number; bry: number
  cRx: number; cRy: number
  centerOp: number
  // Resonance spheres: position (%), opacity
  r1x: number; r1y: number; r1Op: number
  r2x: number; r2y: number; r2Op: number
  r3x: number; r3y: number; r3Op: number
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CrossingSpheres({
  isLoading    = false,
  hasResult    = false,
  isResonating = false,
}: CrossingSpheresProps) {

  const [vs, setVs] = useState<VS>({
    ax: A0.x, ay: A0.y, bx: B0.x, by: B0.y,
    aGX: 40,  aGY: 35,  bGX: 60, bGY: 65,
    aBlur: 38, bBlur: 38,
    aOp: 0.28, bOp: 0.28,
    aScale: 1, bScale: 1,
    az: 0, bz: 0,
    arx: 0, ary: 0, brx: 0, bry: 0,
    cRx: 0, cRy: 0,
    centerOp: 0,
    r1x: RESO_SPHERES[0].sx, r1y: RESO_SPHERES[0].sy, r1Op: 0,
    r2x: RESO_SPHERES[1].sx, r2y: RESO_SPHERES[1].sy, r2Op: 0,
    r3x: RESO_SPHERES[2].sx, r3y: RESO_SPHERES[2].sy, r3Op: 0,
  })

  // ── Physics refs ────────────────────────────────────────────────────────────
  const pA = useRef({ x: A0.x, y: A0.y, vx: 0, vy: 0 })
  const pB = useRef({ x: B0.x, y: B0.y, vx: 0, vy: 0 })

  // ── Input refs ──────────────────────────────────────────────────────────────
  const mouse    = useRef({ x: 50, y: 50 })
  const drag     = useRef<'A' | 'B' | null>(null)
  const dragOff  = useRef({ x: 0, y: 0 })
  const histA    = useRef<{ x: number; y: number; t: number }[]>([])
  const histB    = useRef<{ x: number; y: number; t: number }[]>([])
  const pinA     = useRef<{ x: number; y: number } | null>(null)
  const pinB     = useRef<{ x: number; y: number } | null>(null)

  const loadingRef    = useRef(isLoading)
  const resultRef     = useRef(hasResult)
  const resonatingRef = useRef(isResonating)
  const flashRef      = useRef(false)
  const raf           = useRef<number>(0)
  const t0            = useRef(Date.now())

  useEffect(() => { loadingRef.current    = isLoading    }, [isLoading])
  useEffect(() => { resultRef.current     = hasResult    }, [hasResult])
  useEffect(() => { resonatingRef.current = isResonating }, [isResonating])

  // ── Global pointer events ───────────────────────────────────────────────────
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const mx = (e.clientX / window.innerWidth)  * 100
      const my = (e.clientY / window.innerHeight) * 100
      mouse.current = { x: mx, y: my }

      if (drag.current === 'A') {
        const pos = { x: mx - dragOff.current.x, y: my - dragOff.current.y }
        pinA.current = pos
        histA.current.push({ ...pos, t: Date.now() })
        histA.current = histA.current.filter(p => Date.now() - p.t < 120)
      } else if (drag.current === 'B') {
        const pos = { x: mx - dragOff.current.x, y: my - dragOff.current.y }
        pinB.current = pos
        histB.current.push({ ...pos, t: Date.now() })
        histB.current = histB.current.filter(p => Date.now() - p.t < 120)
      }
    }

    const onUp = () => {
      const released = drag.current
      drag.current = null

      if (released === 'A') {
        const h = histA.current
        if (h.length >= 2) {
          const dt = (h[h.length - 1].t - h[0].t) / 1000
          if (dt > 0) {
            pA.current.vx = ((h[h.length - 1].x - h[0].x) / dt) * 0.12
            pA.current.vy = ((h[h.length - 1].y - h[0].y) / dt) * 0.12
          }
        }
        histA.current = []
        setTimeout(() => { pinA.current = null }, 1800)
      } else if (released === 'B') {
        const h = histB.current
        if (h.length >= 2) {
          const dt = (h[h.length - 1].t - h[0].t) / 1000
          if (dt > 0) {
            pB.current.vx = ((h[h.length - 1].x - h[0].x) / dt) * 0.12
            pB.current.vy = ((h[h.length - 1].y - h[0].y) / dt) * 0.12
          }
        }
        histB.current = []
        setTimeout(() => { pinB.current = null }, 1800)
      }
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup',   onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup',   onUp)
    }
  }, [])

  // ── Result flash ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasResult) return
    pinA.current = null
    pinB.current = null
    flashRef.current = true
    const id = setTimeout(() => { flashRef.current = false }, 400)
    return () => clearTimeout(id)
  }, [hasResult])

  // ── Main RAF loop ──────────────────────────────────────────────────────────
  useEffect(() => {
    function tick() {
      const t          = (Date.now() - t0.current) / 1000
      const mx         = mouse.current.x
      const my         = mouse.current.y
      const loading    = loadingRef.current
      const result     = resultRef.current
      const resonating = resonatingRef.current

      const maxS   = document.documentElement.scrollHeight - window.innerHeight
      const scroll = maxS > 0 ? Math.min(1, window.scrollY / maxS) : 0
      const merge  = Math.min(1, scroll * 2)

      // ── Target positions ───────────────────────────────────────────────────
      let tAx: number, tAy: number, tBx: number, tBy: number

      if (resonating) {
        // RESONATING: gold stays at center, blue orbits slowly around it
        tAx = CX; tAy = CX
        const orbitAngle = t * (Math.PI * 2 / 5) // 5s orbit
        tBx = CX + Math.cos(orbitAngle) * 10
        tBy = CX + Math.sin(orbitAngle) * 10
      } else if (loading) {
        // LOADING: both orbit at center, 3s period
        const a = t * (Math.PI * 2 / 3)
        tAx = CX + Math.cos(a)           * 7
        tAy = CX + Math.sin(a)           * 7
        tBx = CX + Math.cos(a + Math.PI) * 7
        tBy = CX + Math.sin(a + Math.PI) * 7
      } else if (result) {
        tAx = CX; tAy = CX; tBx = CX; tBy = CX + 2
      } else {
        const bAx = lerp(A0.x, CX, merge)
        const bAy = lerp(A0.y, CX, merge)
        const bBx = lerp(B0.x, CX, merge)
        const bBy = lerp(B0.y, CX, merge)
        const pull = 1 - merge

        tAx = pinA.current ? pinA.current.x : lerp(bAx, mx, 0.15 * pull)
        tAy = pinA.current ? pinA.current.y : lerp(bAy, my, 0.10 * pull)
        tBx = pinB.current ? pinB.current.x : lerp(bBx, mx, 0.08 * pull)
        tBy = pinB.current ? pinB.current.y : lerp(bBy, my, 0.06 * pull)
      }

      // ── Spring physics ─────────────────────────────────────────────────────
      const isDraggingA = drag.current === 'A'
      const isDraggingB = drag.current === 'B'
      const stA = (loading || resonating) ? 0.10 : isDraggingA ? 0.88 : 0.055
      const stB = (loading || resonating) ? 0.10 : isDraggingB ? 0.88 : 0.055

      const [nAx, nAvx] = spring(pA.current.x, tAx, pA.current.vx, stA)
      const [nAy, nAvy] = spring(pA.current.y, tAy, pA.current.vy, stA)
      pA.current = { x: nAx, y: nAy, vx: nAvx, vy: nAvy }

      const [nBx, nBvx] = spring(pB.current.x, tBx, pB.current.vx, stB)
      const [nBy, nBvy] = spring(pB.current.y, tBy, pB.current.vy, stB)
      pB.current = { x: nBx, y: nBy, vx: nBvx, vy: nBvy }

      // ── Velocity blur ──────────────────────────────────────────────────────
      const speedA = Math.sqrt(nAvx ** 2 + nAvy ** 2)
      const speedB = Math.sqrt(nBvx ** 2 + nBvy ** 2)
      const aBlur  = clamp(38 - merge * 10 + speedA * 18, 20, 65)
      const bBlur  = clamp(38 - merge * 10 + speedB * 18, 20, 65)

      // ── JS pulse ───────────────────────────────────────────────────────────
      const TWO_PI = Math.PI * 2
      const aScale = (loading || resonating) ? 1 : 1 + Math.sin(t * (TWO_PI / 6)) * 0.09
      const bScale = (loading || resonating) ? 1 : 1 + Math.sin((t - 3) * (TWO_PI / 6)) * 0.09

      // ── 3D lighting ─────────────────────────────────────────────────────────
      const aGX = clamp(50 + (mx - pA.current.x) * 0.45, 18, 82)
      const aGY = clamp(50 + (my - pA.current.y) * 0.45, 18, 82)
      const bGX = clamp(50 + (mx - pB.current.x) * 0.45, 18, 82)
      const bGY = clamp(50 + (my - pB.current.y) * 0.45, 18, 82)

      // ── Container tilt ─────────────────────────────────────────────────────
      const cRx = resonating ? 0 : (my - 50) * 0.14 + scroll * 22
      const cRy = resonating ? 0 : (mx - 50) * -0.10

      // ── Sphere 3D rotation on scroll ───────────────────────────────────────
      const arx = -scroll * 22; const ary = scroll * 16
      const brx =  scroll * 22; const bry = -scroll * 16

      // ── Z-depth ────────────────────────────────────────────────────────────
      const az = merge * 55; const bz = merge * 38

      // ── Resonance spheres — 3 human vécus converging ──────────────────────
      // 9-second cycle: sphere 1 travels s0→3, sphere 2 s3→6, sphere 3 s6→9
      const CYCLE   = 9
      const tMod    = t % CYCLE
      const TRAVEL  = 2.8  // seconds to travel from edge to center

      const rData = RESO_SPHERES.map((s, i) => {
        const windowStart = i * 3
        const progress    = clamp((tMod - windowStart) / TRAVEL, 0, 1)
        const eased       = easeOut(progress)

        let rx: number, ry: number, rop: number

        if (!resonating) {
          // hidden when not resonating
          rx = s.sx; ry = s.sy; rop = 0
        } else if (progress <= 0) {
          // waiting at edge — subtle pulse
          rx = s.sx; ry = s.sy
          rop = 0.12 + Math.sin(t * 3 + i) * 0.05
        } else if (progress >= 1) {
          // arrived — drift slowly near center with soft glow
          const driftAngle = t * 0.4 + i * (Math.PI * 2 / 3)
          rx = CX + Math.cos(driftAngle) * 3.5
          ry = CX + Math.sin(driftAngle) * 3.5
          // flash at moment of arrival (once)
          const arrivedAt = windowStart + TRAVEL
          const timeSinceArrival = tMod - arrivedAt
          const flashWindow = timeSinceArrival >= 0 && timeSinceArrival < 0.4
          rop = flashWindow ? 0.55 : 0.22
        } else {
          // traveling — smooth eased path from edge to center
          rx  = lerp(s.sx, CX, eased)
          ry  = lerp(s.sy, CX, eased)
          rop = 0.28 + eased * 0.10  // brightens as it arrives
        }

        return { rx, ry, rop }
      })

      const baseOp = flashRef.current ? 0.58 : 0.28

      setVs({
        ax: pA.current.x, ay: pA.current.y,
        bx: pB.current.x, by: pB.current.y,
        aGX, aGY, bGX, bGY,
        aBlur, bBlur,
        aOp: baseOp, bOp: baseOp,
        aScale, bScale,
        az, bz, arx, ary, brx, bry,
        cRx, cRy,
        centerOp: resonating ? 0.22 : loading ? 0.20 : merge * 0.20,
        r1x: rData[0].rx, r1y: rData[0].ry, r1Op: rData[0].rop,
        r2x: rData[1].rx, r2y: rData[1].ry, r2Op: rData[1].rop,
        r3x: rData[2].rx, r3y: rData[2].ry, r3Op: rData[2].rop,
      })

      raf.current = requestAnimationFrame(tick)
    }

    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [])

  // ── Drag start ─────────────────────────────────────────────────────────────
  const startDrag = (sphere: 'A' | 'B') => (e: React.PointerEvent) => {
    if (resonatingRef.current || loadingRef.current) return
    e.preventDefault()
    e.stopPropagation()
    drag.current = sphere
    const mx = (e.clientX / window.innerWidth)  * 100
    const my = (e.clientY / window.innerHeight) * 100
    const cur = sphere === 'A' ? pA.current : pB.current
    dragOff.current = { x: mx - cur.x, y: my - cur.y }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  // ── Render helpers ─────────────────────────────────────────────────────────
  const SZ   = 'clamp(200px, 28vw, 340px)'
  const HALF = 'clamp(100px, 14vw, 170px)'

  // Small resonance spheres — 60px fixed
  const RSZ  = '60px'
  const RHALF = '30px'

  const resoSpheres = [
    { x: vs.r1x, y: vs.r1y, op: vs.r1Op, ...RESO_SPHERES[0] },
    { x: vs.r2x, y: vs.r2y, op: vs.r2Op, ...RESO_SPHERES[1] },
    { x: vs.r3x, y: vs.r3y, op: vs.r3Op, ...RESO_SPHERES[2] },
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0,
      zIndex: 11,
      overflow: 'hidden',
      pointerEvents: 'none',
      perspective: '900px',
      perspectiveOrigin: '50% 38%',
    }}>
      {/* 3D scene */}
      <div style={{
        position: 'absolute', inset: 0,
        transformStyle: 'preserve-3d',
        transform: `rotateX(${vs.cRx}deg) rotateY(${vs.cRy}deg)`,
      }}>

        {/* ── Sphere A — Gold ────────────────────────────────────────────── */}
        <div
          onPointerDown={startDrag('A')}
          style={{
            position: 'absolute',
            width: SZ, height: SZ,
            left: `calc(${vs.ax}% - ${HALF})`,
            top:  `calc(${vs.ay}% - ${HALF})`,
            borderRadius: '50%',
            background: `radial-gradient(circle at ${vs.aGX}% ${vs.aGY}%,
              #FFE599 0%, #D4A843 28%, #C9A84C 50%, transparent 72%)`,
            filter: `blur(${vs.aBlur}px)`,
            mixBlendMode: 'screen',
            opacity: vs.aOp,
            transform: `translateZ(${vs.az}px) rotateX(${vs.arx}deg) rotateY(${vs.ary}deg) scale(${vs.aScale})`,
            willChange: 'transform, opacity, left, top, filter',
            cursor: isResonating || isLoading ? 'default' : drag.current === 'A' ? 'grabbing' : 'grab',
            pointerEvents: 'auto',
            touchAction: 'none',
            userSelect: 'none',
          }}
        />

        {/* ── Sphere B — Blue ────────────────────────────────────────────── */}
        <div
          onPointerDown={startDrag('B')}
          style={{
            position: 'absolute',
            width: SZ, height: SZ,
            left: `calc(${vs.bx}% - ${HALF})`,
            top:  `calc(${vs.by}% - ${HALF})`,
            borderRadius: '50%',
            background: `radial-gradient(circle at ${vs.bGX}% ${vs.bGY}%,
              #A8C8FF 0%, #5A8FD4 28%, #4A7CC9 50%, transparent 72%)`,
            filter: `blur(${vs.bBlur}px)`,
            mixBlendMode: 'screen',
            opacity: vs.bOp,
            transform: `translateZ(${vs.bz}px) rotateX(${vs.brx}deg) rotateY(${vs.bry}deg) scale(${vs.bScale})`,
            willChange: 'transform, opacity, left, top, filter',
            cursor: isResonating || isLoading ? 'default' : drag.current === 'B' ? 'grabbing' : 'grab',
            pointerEvents: 'auto',
            touchAction: 'none',
            userSelect: 'none',
          }}
        />

        {/* ── Resonance spheres — 3 human vécus (rose, vert, violet) ─────── */}
        {resoSpheres.map((s, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: RSZ, height: RSZ,
            left: `calc(${s.x}% - ${RHALF})`,
            top:  `calc(${s.y}% - ${RHALF})`,
            borderRadius: '50%',
            background: `radial-gradient(circle at 38% 38%, ${s.light} 0%, ${s.color} 45%, transparent 72%)`,
            filter: 'blur(12px)',
            mixBlendMode: 'screen',
            opacity: s.op,
            willChange: 'transform, opacity, left, top',
            pointerEvents: 'none',
            transition: 'opacity 0.3s ease',
          }} />
        ))}

        {/* ── Center convergence glow — 400px ────────────────────────────── */}
        <div style={{
          position: 'absolute',
          left: 'calc(50% - 200px)', top: 'calc(50% - 200px)',
          width: '400px', height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)',
          filter: 'blur(60px)',
          mixBlendMode: 'screen',
          opacity: vs.centerOp,
          transform: 'translateZ(22px)',
          pointerEvents: 'none',
        }} />

      </div>
    </div>
  )
}
