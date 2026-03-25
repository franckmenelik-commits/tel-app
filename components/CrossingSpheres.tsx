'use client'

// TEL — The Experience Layer
// components/CrossingSpheres.tsx
//
// PREMIUM INTERACTIVE SPHERES
// ─────────────────────────────────────────────────────────────────────────────
// • IDLE       : JS sin-wave pulse (no CSS keyframe conflicts)
// • MOUSE      : spheres drift toward cursor (A: strong, B: softer)
// • SCROLL     : 3D perspective tilt + translateZ + counter-rotation + convergence
// • LOADING    : JS orbit (sin/cos, 3s period)
// • RESULT     : flash opacity 0.5 → 0.25, spheres merged
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react'

interface CrossingSpheresProps {
  isLoading?: boolean
  hasResult?: boolean
}

interface VS {   // visual state — updated every RAF frame
  ax: number; ay: number   // sphere A center in viewport %
  bx: number; by: number   // sphere B center in viewport %
  aScale: number; bScale:  number  // JS pulse / orbit scale
  az: number; bz: number   // translateZ px (depth)
  arx: number; ary: number // individual sphere 3D tilt A
  brx: number; bry: number // individual sphere 3D tilt B
  aBlur: number; bBlur: number
  aOp: number;  bOp:  number
  cRx: number;  cRy: number  // container tilt (mouse parallax)
  centerOp: number
}

const A0 = { x: 15, y: 25 }   // idle position sphere A
const B0 = { x: 85, y: 75 }   // idle position sphere B
const CX = 50                  // merge target

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

export default function CrossingSpheres({
  isLoading = false,
  hasResult = false,
}: CrossingSpheresProps) {

  const [vs, setVs] = useState<VS>({
    ax: A0.x, ay: A0.y, bx: B0.x, by: B0.y,
    aScale: 1, bScale: 1,
    az: 0, bz: 0,
    arx: 0, ary: 0, brx: 0, bry: 0,
    aBlur: 40, bBlur: 40,
    aOp: 0.25, bOp: 0.25,
    cRx: 0, cRy: 0,
    centerOp: 0,
  })

  // Refs — mutated outside React state for RAF performance
  const mouseRef    = useRef({ x: 50, y: 50 })
  const curA        = useRef({ x: A0.x, y: A0.y })
  const curB        = useRef({ x: B0.x, y: B0.y })
  const loadingRef  = useRef(isLoading)
  const resultRef   = useRef(hasResult)
  const flashRef    = useRef(false)
  const raf         = useRef<number>(0)
  const t0          = useRef(Date.now())

  // Sync props → refs without re-running the main loop
  useEffect(() => { loadingRef.current = isLoading }, [isLoading])
  useEffect(() => { resultRef.current  = hasResult  }, [hasResult])

  // Mouse position (% of viewport)
  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth)  * 100,
        y: (e.clientY / window.innerHeight) * 100,
      }
    }
    window.addEventListener('mousemove', onMouse, { passive: true })
    return () => window.removeEventListener('mousemove', onMouse)
  }, [])

  // Result flash — spike opacity then fade
  useEffect(() => {
    if (!hasResult) return
    flashRef.current = true
    const id = setTimeout(() => { flashRef.current = false }, 400)
    return () => clearTimeout(id)
  }, [hasResult])

  // ── Main RAF loop ──────────────────────────────────────────────────────────
  useEffect(() => {
    function tick() {
      const t       = (Date.now() - t0.current) / 1000  // seconds
      const mx      = mouseRef.current.x
      const my      = mouseRef.current.y
      const loading = loadingRef.current
      const result  = resultRef.current

      // Scroll ratio (0 → 1 as page scrolled to bottom)
      const maxS   = document.documentElement.scrollHeight - window.innerHeight
      const scroll = maxS > 0 ? Math.min(1, window.scrollY / maxS) : 0
      const merge  = Math.min(1, scroll * 2)   // full merge at 50% scroll

      // ── Target positions ─────────────────────────────────────────────────
      let tAx: number, tAy: number, tBx: number, tBy: number

      if (loading) {
        // JS orbit — 40px ≈ 5% of 800px viewport; 3s period
        const angle = t * ((Math.PI * 2) / 3)
        tAx = CX + Math.cos(angle)               * 6
        tAy = CX + Math.sin(angle)               * 6
        tBx = CX + Math.cos(angle + Math.PI)     * 6
        tBy = CX + Math.sin(angle + Math.PI)     * 6
      } else if (result) {
        tAx = CX;     tAy = CX
        tBx = CX;     tBy = CX + 2   // tiny offset so blend isn't flat
      } else {
        // Base: lerp idle → center by merge progress
        const bAx = lerp(A0.x, CX, merge)
        const bAy = lerp(A0.y, CX, merge)
        const bBx = lerp(B0.x, CX, merge)
        const bBy = lerp(B0.y, CX, merge)

        // Mouse attraction fades as spheres converge
        const pull = 1 - merge
        tAx = lerp(bAx, mx, 0.15 * pull)
        tAy = lerp(bAy, my, 0.10 * pull)
        tBx = lerp(bBx, mx, 0.08 * pull)
        tBy = lerp(bBy, my, 0.06 * pull)
      }

      // ── Smooth lerp current → target ─────────────────────────────────────
      const spd = loading ? 0.07 : 0.04
      curA.current.x += (tAx - curA.current.x) * spd
      curA.current.y += (tAy - curA.current.y) * spd
      curB.current.x += (tBx - curB.current.x) * spd
      curB.current.y += (tBy - curB.current.y) * spd

      // ── JS pulse (replaces CSS keyframes — no conflict with JS transform) ─
      const TWO_PI = Math.PI * 2
      const pulseA = loading ? 1 : 1 + Math.sin(t  * (TWO_PI / 6)) * 0.10
      const pulseB = loading ? 1 : 1 + Math.sin((t - 3) * (TWO_PI / 6)) * 0.10

      // ── 3D: container tilts with mouse (parallax) ─────────────────────────
      // Scroll adds forward tilt so page feels like diving into the spheres
      const cRx = (my - 50) * 0.06 + scroll * 18
      const cRy = (mx - 50) * -0.05

      // ── Individual sphere 3D counter-rotation on scroll ───────────────────
      const arx = -scroll * 18
      const ary =  scroll * 12
      const brx =  scroll * 18
      const bry = -scroll * 12

      // ── Z-depth: spheres come toward viewer as they merge ─────────────────
      const az = merge * 40
      const bz = merge * 28

      // ── Blur sharpens slightly at convergence ─────────────────────────────
      const aBlur = 40 - merge * 10
      const bBlur = 40 - merge * 10

      // ── Opacity — flash spike on result ───────────────────────────────────
      const baseOp = flashRef.current ? 0.55 : 0.25

      setVs({
        ax: curA.current.x, ay: curA.current.y,
        bx: curB.current.x, by: curB.current.y,
        aScale: pulseA, bScale: pulseB,
        az, bz,
        arx, ary, brx, bry,
        aBlur, bBlur,
        aOp: baseOp, bOp: baseOp,
        cRx, cRy,
        centerOp: loading ? 0.18 : merge * 0.18,
      })

      raf.current = requestAnimationFrame(tick)
    }

    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, []) // intentionally empty — isLoading / hasResult sync via refs

  // ── Helpers ────────────────────────────────────────────────────────────────
  const SZ   = 'clamp(200px, 25vw, 300px)'
  const HALF = 'clamp(100px, 12.5vw, 150px)'

  const sphereBase: React.CSSProperties = {
    position: 'absolute',
    width: SZ, height: SZ,
    borderRadius: '50%',
    mixBlendMode: 'screen',
    willChange: 'transform, opacity, left, top, filter',
    pointerEvents: 'none',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0,
      pointerEvents: 'none', overflow: 'hidden',
      // CSS 3D space
      perspective: '1200px',
      perspectiveOrigin: '50% 50%',
    }}>
      {/* 3D scene — tilts with mouse + scroll */}
      <div style={{
        position: 'absolute', inset: 0,
        transformStyle: 'preserve-3d',
        transform: `rotateX(${vs.cRx}deg) rotateY(${vs.cRy}deg)`,
      }}>

        {/* ── Sphere A — Gold ────────────────────────────────────────────── */}
        <div style={{
          ...sphereBase,
          background: 'radial-gradient(circle, #C9A84C 0%, transparent 70%)',
          filter: `blur(${vs.aBlur}px)`,
          opacity: vs.aOp,
          left: `calc(${vs.ax}% - ${HALF})`,
          top:  `calc(${vs.ay}% - ${HALF})`,
          transform: `translateZ(${vs.az}px) rotateX(${vs.arx}deg) rotateY(${vs.ary}deg) scale(${vs.aScale})`,
        }} />

        {/* ── Sphere B — Blue ────────────────────────────────────────────── */}
        <div style={{
          ...sphereBase,
          background: 'radial-gradient(circle, #4A7CC9 0%, transparent 70%)',
          filter: `blur(${vs.bBlur}px)`,
          opacity: vs.bOp,
          left: `calc(${vs.bx}% - ${HALF})`,
          top:  `calc(${vs.by}% - ${HALF})`,
          transform: `translateZ(${vs.bz}px) rotateX(${vs.brx}deg) rotateY(${vs.bry}deg) scale(${vs.bScale})`,
        }} />

        {/* ── Center white convergence glow — 400px ──────────────────────── */}
        <div style={{
          position: 'absolute',
          left: 'calc(50% - 200px)',
          top:  'calc(50% - 200px)',
          width: '400px', height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)',
          filter: 'blur(60px)',
          mixBlendMode: 'screen',
          opacity: vs.centerOp,
          transform: 'translateZ(15px)',
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  )
}
