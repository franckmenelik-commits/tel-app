'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { MapPoint, MapArc } from '@/lib/types'

interface LiveMapProps {
  points: MapPoint[]
  arcs: MapArc[]
}

// ── Silent zones ───────────────────────────────────────────────────────────────
const SILENT_ZONES: { lat: number; lng: number; label: string }[] = [
  { lat: 14.5,  lng: -14.4,  label: 'Sahel' },
  { lat: -2.5,  lng: 23.8,   label: 'Congo' },
  { lat: 33.9,  lng: 67.7,   label: 'Afghanistan' },
  { lat: 7.9,   lng: 29.7,   label: 'Soudan du Sud' },
  { lat: 19.5,  lng: 96.1,   label: 'Myanmar' },
  { lat: 15.3,  lng: 38.9,   label: 'Érythrée' },
  { lat: 40.3,  lng: 127.5,  label: 'Corée du Nord' },
  { lat: 15.6,  lng: 48.5,   label: 'Yémen' },
  { lat: -6.0,  lng: 35.7,   label: 'Tanzanie rurale' },
  { lat: 12.1,  lng: 15.0,   label: 'Tchad' },
]

// ── Stars (generated once, stable across renders) ─────────────────────────────
const STARS = Array.from({ length: 200 }, () => ({
  x: Math.random(),
  y: Math.random(),
  r: Math.random() * 1.2 + 0.2,
  o: Math.random() * 0.6 + 0.1,
}))

// ── 3D projection ─────────────────────────────────────────────────────────────
function project(
  lat: number, lng: number, rotation: number,
  cx: number, cy: number, radius: number
): { x: number; y: number; visible: boolean } {
  const phi   = (90 - lat) * (Math.PI / 180)
  const theta = (lng + rotation) * (Math.PI / 180)
  const x3 = Math.sin(phi) * Math.cos(theta)
  const y3 = Math.cos(phi)
  const z3 = Math.sin(phi) * Math.sin(theta)
  return { x: cx + radius * x3, y: cy - radius * y3, visible: z3 > -0.15 }
}

// ── SLERP great-circle interpolation ─────────────────────────────────────────
function slerp(
  lat1: number, lng1: number, lat2: number, lng2: number, t: number
): [number, number] {
  const R    = Math.PI / 180
  const p1   = lat1 * R, l1 = lng1 * R
  const p2   = lat2 * R, l2 = lng2 * R
  const x1   = Math.cos(p1) * Math.cos(l1), y1 = Math.cos(p1) * Math.sin(l1), z1 = Math.sin(p1)
  const x2   = Math.cos(p2) * Math.cos(l2), y2 = Math.cos(p2) * Math.sin(l2), z2 = Math.sin(p2)
  const dot  = Math.min(1, Math.max(-1, x1*x2 + y1*y2 + z1*z2))
  const om   = Math.acos(dot)
  if (Math.abs(om) < 0.0001) return [lat1, lng1]
  const s    = Math.sin(om)
  const a    = Math.sin((1 - t) * om) / s
  const b    = Math.sin(t * om) / s
  const xi   = a*x1 + b*x2, yi = a*y1 + b*y2, zi = a*z1 + b*z2
  return [
    Math.atan2(zi, Math.sqrt(xi*xi + yi*yi)) / R,
    Math.atan2(yi, xi) / R,
  ]
}

export default function LiveMap({ points, arcs }: LiveMapProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const rotRef     = useRef(0)
  const rafRef     = useRef<number>(0)
  const lastRef    = useRef<number>(0)
  // Logical dimensions (CSS pixels) — updated by resize, read in draw
  const dimRef     = useRef({ w: 0, h: 0, dpr: 1 })

  // ── Resize handler ── called once on mount + via ResizeObserver
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    // Use parent dims, fall back to window dims (important for fixed/absolute containers)
    const parent = canvas.parentElement
    const w = (parent ? parent.clientWidth  : 0) || window.innerWidth
    const h = (parent ? parent.clientHeight : 0) || window.innerHeight

    // Only resize if dimensions actually changed (avoid needless paint)
    if (canvas.width === Math.round(w * dpr) && canvas.height === Math.round(h * dpr)) return

    canvas.width         = Math.round(w * dpr)
    canvas.height        = Math.round(h * dpr)
    canvas.style.width   = `${w}px`
    canvas.style.height  = `${h}px`

    dimRef.current = { w, h, dpr }

    // Reset and apply scale ONCE — never accumulate transforms
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
  }, [])

  // ── Draw loop ─────────────────────────────────────────────────────────────
  const draw = useCallback((timestamp: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dt = timestamp - (lastRef.current || timestamp)
    lastRef.current = timestamp
    rotRef.current  = (rotRef.current + dt * 0.004) % 360

    const { w: W, h: H } = dimRef.current

    // If canvas has no logical dimensions yet, try to init then retry next frame
    if (W === 0 || H === 0) {
      initCanvas()
      rafRef.current = requestAnimationFrame(draw)
      return
    }

    const cx  = W / 2
    const cy  = H / 2
    const rad = Math.min(W, H) * 0.38
    const rot = rotRef.current

    // Clear in LOGICAL coordinates (ctx is pre-scaled)
    ctx.clearRect(0, 0, W, H)

    // ── Stars ───────────────────────────────────────────────────────────
    for (const s of STARS) {
      ctx.beginPath()
      ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255,255,255,${s.o})`
      ctx.fill()
    }

    // ── Atmosphere glow ─────────────────────────────────────────────────
    const atmo = ctx.createRadialGradient(cx, cy, rad * 0.85, cx, cy, rad * 1.18)
    atmo.addColorStop(0, 'rgba(10,20,50,0)')
    atmo.addColorStop(0.7, 'rgba(20,40,100,0.04)')
    atmo.addColorStop(1, 'rgba(50,80,180,0.12)')
    ctx.beginPath()
    ctx.arc(cx, cy, rad * 1.18, 0, Math.PI * 2)
    ctx.fillStyle = atmo
    ctx.fill()

    // ── Globe sphere ────────────────────────────────────────────────────
    const sg = ctx.createRadialGradient(cx - rad * 0.25, cy - rad * 0.2, rad * 0.05, cx, cy, rad)
    sg.addColorStop(0, 'rgba(22,28,48,0.92)')
    sg.addColorStop(0.5, 'rgba(14,18,32,0.95)')
    sg.addColorStop(1, 'rgba(8,10,20,0.98)')
    ctx.beginPath()
    ctx.arc(cx, cy, rad, 0, Math.PI * 2)
    ctx.fillStyle = sg
    ctx.fill()

    // ── Lat/lng grid ────────────────────────────────────────────────────
    ctx.strokeStyle = 'rgba(201,168,76,0.04)'
    ctx.lineWidth   = 0.5
    for (let lat = -60; lat <= 60; lat += 30) {
      ctx.beginPath(); let f = true
      for (let lng = -180; lng <= 180; lng += 4) {
        const p = project(lat, lng, rot, cx, cy, rad)
        if (!p.visible) { f = true; continue }
        if (f) { ctx.moveTo(p.x, p.y); f = false } else ctx.lineTo(p.x, p.y)
      }
      ctx.stroke()
    }
    for (let lng = -180; lng < 180; lng += 30) {
      ctx.beginPath(); let f = true
      for (let lat = -85; lat <= 85; lat += 4) {
        const p = project(lat, lng, rot, cx, cy, rad)
        if (!p.visible) { f = true; continue }
        if (f) { ctx.moveTo(p.x, p.y); f = false } else ctx.lineTo(p.x, p.y)
      }
      ctx.stroke()
    }

    // ── Silent zones ─────────────────────────────────────────────────────
    const now = Date.now()
    for (const z of SILENT_ZONES) {
      const p = project(z.lat, z.lng, rot, cx, cy, rad)
      if (!p.visible) continue
      const pulse = (Math.sin(now * 0.0008 + z.lng * 0.1) + 1) / 2
      ctx.beginPath()
      ctx.arc(p.x, p.y, 3 + pulse * 2, 0, Math.PI * 2)
      ctx.fillStyle   = `rgba(40,30,30,${0.5 + pulse * 0.3})`
      ctx.fill()
      ctx.strokeStyle = 'rgba(80,50,50,0.2)'
      ctx.lineWidth   = 0.5
      ctx.stroke()
      ctx.fillStyle = 'rgba(80,55,55,0.35)'
      ctx.font      = '7px ui-monospace,monospace'
      ctx.textAlign = 'left'
      ctx.fillText(z.label, p.x + 5, p.y + 3)
    }

    // ── Arcs ──────────────────────────────────────────────────────────────
    for (const arc of arcs) {
      if (arc.progress <= 0) continue
      const STEPS = 48
      const steps = Math.floor(arc.progress * STEPS)
      let prev: { x: number; y: number } | null = null
      for (let i = 0; i <= steps; i++) {
        const t = i / STEPS
        const [la, lo] = slerp(arc.from.lat, arc.from.lng, arc.to.lat, arc.to.lng, t)
        const p = project(la, lo, rot, cx, cy, rad)
        if (!p.visible) { prev = null; continue }
        if (prev) {
          const alpha = 0.15 + t * 0.7
          const g = ctx.createLinearGradient(prev.x, prev.y, p.x, p.y)
          g.addColorStop(0, `rgba(201,168,76,${alpha})`)
          g.addColorStop(1, `rgba(245,236,215,${Math.min(1, alpha + 0.1)})`)
          ctx.beginPath()
          ctx.moveTo(prev.x, prev.y)
          ctx.lineTo(p.x, p.y)
          ctx.strokeStyle = g
          ctx.lineWidth   = 1.2
          ctx.stroke()
        }
        prev = p
      }
      // Sparkle tip
      if (arc.progress < 1 && steps > 0) {
        const [la, lo] = slerp(arc.from.lat, arc.from.lng, arc.to.lat, arc.to.lng, steps / STEPS)
        const p = project(la, lo, rot, cx, cy, rad)
        if (p.visible) {
          ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(245,236,215,0.9)'; ctx.fill()
        }
      }
    }

    // ── Map points ────────────────────────────────────────────────────────
    for (const pt of points) {
      const p = project(pt.lat, pt.lng, rot, cx, cy, rad)
      if (!p.visible) continue
      const age   = (now - pt.createdAt) / 1000
      const pulse = (Math.sin((pt.pulsePhase + age * 1.5) * 2.5) + 1) / 2

      if (pt.type === 'crossing') {
        const r = 6 + pulse * 3
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2.5)
        g.addColorStop(0, 'rgba(245,236,215,0.3)')
        g.addColorStop(1, 'rgba(201,168,76,0)')
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 2.5, 0, Math.PI * 2)
        ctx.fillStyle = g; ctx.fill()
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fillStyle   = `rgba(245,236,215,${0.7 + pulse * 0.3})`; ctx.fill()
        ctx.strokeStyle = `rgba(201,168,76,${0.6 + pulse * 0.4})`
        ctx.lineWidth   = 1; ctx.stroke()
        const label = pt.label.length > 32 ? pt.label.slice(0, 30) + '…' : pt.label
        ctx.fillStyle = `rgba(201,168,76,${0.5 + pulse * 0.3})`
        ctx.font      = '8px Georgia,serif'
        ctx.textAlign = 'center'
        ctx.fillText(label, p.x, p.y - r - 6)
      } else if (pt.type === 'source') {
        const r = 4 + pulse * 1.5
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2)
        g.addColorStop(0, 'rgba(100,160,255,0.2)')
        g.addColorStop(1, 'rgba(100,160,255,0)')
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 2, 0, Math.PI * 2)
        ctx.fillStyle = g; ctx.fill()
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(140,190,255,${0.6 + pulse * 0.3})`; ctx.fill()
      }
    }

    // ── Globe rim highlight ───────────────────────────────────────────────
    const rim = ctx.createRadialGradient(cx - rad * 0.3, cy - rad * 0.3, rad * 0.6, cx, cy, rad)
    rim.addColorStop(0.85, 'transparent')
    rim.addColorStop(1, 'rgba(201,168,76,0.04)')
    ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2)
    ctx.fillStyle = rim; ctx.fill()

    rafRef.current = requestAnimationFrame(draw)
  }, [points, arcs, initCanvas])

  // ── Start animation loop ──────────────────────────────────────────────────
  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [draw])

  // ── Resize observer ───────────────────────────────────────────────────────
  useEffect(() => {
    initCanvas()

    // Observe the window for resize events (most reliable for fixed containers)
    const onResize = () => initCanvas()
    window.addEventListener('resize', onResize)

    // Also observe the parent element if available
    let ro: ResizeObserver | null = null
    const parent = canvasRef.current?.parentElement
    if (parent && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(onResize)
      ro.observe(parent)
    }

    return () => {
      window.removeEventListener('resize', onResize)
      ro?.disconnect()
    }
  }, [initCanvas])

  const crossingCount = points.filter(p => p.type === 'crossing').length

  return (
    <div className="fixed inset-0" style={{ zIndex: 0 }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />

      {crossingCount > 0 && (
        <div
          className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{
            background: 'rgba(10,10,15,0.82)',
            border: '1px solid rgba(201,168,76,0.12)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: '#C9A84C', boxShadow: '0 0 5px #C9A84C', animation: 'pulse 2.5s infinite' }}
          />
          <span className="text-xs" style={{ color: '#C9A84C', fontFamily: 'ui-monospace,monospace' }}>
            {crossingCount} vécu{crossingCount > 1 ? 's' : ''} croisé{crossingCount > 1 ? 's' : ''}
          </span>
        </div>
      )}

      <div className="absolute bottom-4 left-4" style={{ pointerEvents: 'none' }}>
        <p
          className="text-xs"
          style={{ color: 'rgba(80,50,50,0.4)', fontFamily: 'Georgia,serif', fontStyle: 'italic' }}
        >
          Les zones sombres — silences de l&apos;humanité
        </p>
      </div>
    </div>
  )
}
