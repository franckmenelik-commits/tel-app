'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { MapPoint, MapArc } from '@/lib/types'

interface LiveMapProps {
  points: MapPoint[]
  arcs: MapArc[]
}

// ── Silent zones (dark areas of the globe — unrepresented voices) ──────────────
const SILENT_ZONES: { lat: number; lng: number; label: string }[] = [
  { lat: 14.5, lng: -14.4, label: 'Sahel' },
  { lat: -2.5, lng: 23.8, label: 'Congo' },
  { lat: 33.9, lng: 67.7, label: 'Afghanistan' },
  { lat: 7.9, lng: 29.7, label: 'Soudan du Sud' },
  { lat: 19.5, lng: 96.1, label: 'Myanmar' },
  { lat: 15.3, lng: 38.9, label: 'Érythrée' },
  { lat: 40.3, lng: 127.5, label: 'Corée du Nord' },
  { lat: 15.6, lng: 48.5, label: 'Yémen' },
  { lat: -6.0, lng: 35.7, label: 'Tanzanie rurale' },
  { lat: 12.1, lng: 15.0, label: 'Tchad' },
]

// ── Stars ─────────────────────────────────────────────────────────────────────
const STARS = Array.from({ length: 200 }, () => ({
  x: Math.random(),
  y: Math.random(),
  r: Math.random() * 1.2 + 0.2,
  opacity: Math.random() * 0.6 + 0.1,
}))

// ── Projection ────────────────────────────────────────────────────────────────
function latLngToCanvas(
  lat: number,
  lng: number,
  rotation: number,
  cx: number,
  cy: number,
  radius: number
): { x: number; y: number; visible: boolean } {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + rotation) * (Math.PI / 180)

  const x3d = Math.sin(phi) * Math.cos(theta)
  const y3d = Math.cos(phi)
  const z3d = Math.sin(phi) * Math.sin(theta)

  return {
    x: cx + radius * x3d,
    y: cy - radius * y3d,
    visible: z3d > -0.15,
  }
}

// ── SLERP for arc animation ───────────────────────────────────────────────────
function slerp(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
  t: number
): [number, number] {
  const toRad = Math.PI / 180
  const phi1 = lat1 * toRad
  const phi2 = lat2 * toRad
  const lam1 = lng1 * toRad
  const lam2 = lng2 * toRad

  const x1 = Math.cos(phi1) * Math.cos(lam1)
  const y1 = Math.cos(phi1) * Math.sin(lam1)
  const z1 = Math.sin(phi1)
  const x2 = Math.cos(phi2) * Math.cos(lam2)
  const y2 = Math.cos(phi2) * Math.sin(lam2)
  const z2 = Math.sin(phi2)

  const dot = Math.min(1, Math.max(-1, x1 * x2 + y1 * y2 + z1 * z2))
  const omega = Math.acos(dot)

  if (Math.abs(omega) < 0.0001) return [lat1, lng1]

  const sinOmega = Math.sin(omega)
  const s1 = Math.sin((1 - t) * omega) / sinOmega
  const s2 = Math.sin(t * omega) / sinOmega

  const xi = s1 * x1 + s2 * x2
  const yi = s1 * y1 + s2 * y2
  const zi = s1 * z1 + s2 * z2

  const lat = Math.atan2(zi, Math.sqrt(xi * xi + yi * yi)) / toRad
  const lng = Math.atan2(yi, xi) / toRad

  return [lat, lng]
}

export default function LiveMap({ points, arcs }: LiveMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rotationRef = useRef(0)
  const animFrameRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)

  const draw = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const dt = timestamp - (lastTimeRef.current || timestamp)
      lastTimeRef.current = timestamp

      rotationRef.current = (rotationRef.current + dt * 0.004) % 360

      const W = canvas.width / (window.devicePixelRatio || 1)
      const H = canvas.height / (window.devicePixelRatio || 1)
      const cx = W / 2
      const cy = H / 2
      const radius = Math.min(W, H) * 0.38
      const rot = rotationRef.current

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // ── Starfield ──────────────────────────────────────────────────────
      for (const star of STARS) {
        ctx.beginPath()
        ctx.arc(star.x * W, star.y * H, star.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${star.opacity})`
        ctx.fill()
      }

      // ── Globe atmosphere ───────────────────────────────────────────────
      const atmo = ctx.createRadialGradient(cx, cy, radius * 0.85, cx, cy, radius * 1.18)
      atmo.addColorStop(0, 'rgba(10,20,50,0)')
      atmo.addColorStop(0.7, 'rgba(20,40,100,0.04)')
      atmo.addColorStop(1, 'rgba(50,80,180,0.12)')
      ctx.beginPath()
      ctx.arc(cx, cy, radius * 1.18, 0, Math.PI * 2)
      ctx.fillStyle = atmo
      ctx.fill()

      // ── Globe sphere ───────────────────────────────────────────────────
      const sphereGrad = ctx.createRadialGradient(
        cx - radius * 0.25, cy - radius * 0.2, radius * 0.05,
        cx, cy, radius
      )
      sphereGrad.addColorStop(0, 'rgba(22,28,48,0.92)')
      sphereGrad.addColorStop(0.5, 'rgba(14,18,32,0.95)')
      sphereGrad.addColorStop(1, 'rgba(8,10,20,0.98)')
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fillStyle = sphereGrad
      ctx.fill()

      // ── Lat/lng grid ───────────────────────────────────────────────────
      ctx.strokeStyle = 'rgba(201,168,76,0.04)'
      ctx.lineWidth = 0.5

      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath()
        let first = true
        for (let lng = -180; lng <= 180; lng += 4) {
          const p = latLngToCanvas(lat, lng, rot, cx, cy, radius)
          if (!p.visible) { first = true; continue }
          if (first) { ctx.moveTo(p.x, p.y); first = false }
          else ctx.lineTo(p.x, p.y)
        }
        ctx.stroke()
      }

      for (let lng = -180; lng < 180; lng += 30) {
        ctx.beginPath()
        let first = true
        for (let lat = -85; lat <= 85; lat += 4) {
          const p = latLngToCanvas(lat, lng, rot, cx, cy, radius)
          if (!p.visible) { first = true; continue }
          if (first) { ctx.moveTo(p.x, p.y); first = false }
          else ctx.lineTo(p.x, p.y)
        }
        ctx.stroke()
      }

      // ── Silent zones ───────────────────────────────────────────────────
      const now = Date.now()
      for (const zone of SILENT_ZONES) {
        const p = latLngToCanvas(zone.lat, zone.lng, rot, cx, cy, radius)
        if (!p.visible) continue

        const pulse = (Math.sin(now * 0.0008 + zone.lng * 0.1) + 1) / 2
        const r = 3 + pulse * 2

        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(40,30,30,${0.5 + pulse * 0.3})`
        ctx.fill()
        ctx.strokeStyle = 'rgba(80,50,50,0.2)'
        ctx.lineWidth = 0.5
        ctx.stroke()

        ctx.fillStyle = 'rgba(80,55,55,0.35)'
        ctx.font = '7px ui-monospace, monospace'
        ctx.textAlign = 'left'
        ctx.fillText(zone.label, p.x + 5, p.y + 3)
      }

      // ── Arcs ───────────────────────────────────────────────────────────
      for (const arc of arcs) {
        if (arc.progress <= 0) continue

        const STEPS = 48
        const progressSteps = Math.floor(arc.progress * STEPS)
        let prevP: { x: number; y: number } | null = null

        for (let step = 0; step <= progressSteps; step++) {
          const t = step / STEPS
          const [lat, lng] = slerp(arc.from.lat, arc.from.lng, arc.to.lat, arc.to.lng, t)
          const p = latLngToCanvas(lat, lng, rot, cx, cy, radius)
          if (!p.visible) { prevP = null; continue }

          if (prevP) {
            const alpha = 0.15 + (t * 0.7)
            const grad = ctx.createLinearGradient(prevP.x, prevP.y, p.x, p.y)
            grad.addColorStop(0, `rgba(201,168,76,${alpha})`)
            grad.addColorStop(1, `rgba(245,236,215,${Math.min(1, alpha + 0.1)})`)
            ctx.beginPath()
            ctx.moveTo(prevP.x, prevP.y)
            ctx.lineTo(p.x, p.y)
            ctx.strokeStyle = grad
            ctx.lineWidth = 1.2
            ctx.stroke()
          }
          prevP = p
        }

        // Sparkle at arc tip
        if (arc.progress < 1 && progressSteps > 0) {
          const t = progressSteps / STEPS
          const [lat, lng] = slerp(arc.from.lat, arc.from.lng, arc.to.lat, arc.to.lng, t)
          const p = latLngToCanvas(lat, lng, rot, cx, cy, radius)
          if (p.visible) {
            ctx.beginPath()
            ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2)
            ctx.fillStyle = 'rgba(245,236,215,0.9)'
            ctx.fill()
          }
        }
      }

      // ── Map points ─────────────────────────────────────────────────────
      for (const point of points) {
        const p = latLngToCanvas(point.lat, point.lng, rot, cx, cy, radius)
        if (!p.visible) continue

        const age = (now - point.createdAt) / 1000
        const pulsePhase = point.pulsePhase + age * 1.5
        const pulse = (Math.sin(pulsePhase * 2.5) + 1) / 2

        if (point.type === 'crossing') {
          const r = 6 + pulse * 3
          const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2.5)
          glow.addColorStop(0, 'rgba(245,236,215,0.3)')
          glow.addColorStop(1, 'rgba(201,168,76,0)')
          ctx.beginPath()
          ctx.arc(p.x, p.y, r * 2.5, 0, Math.PI * 2)
          ctx.fillStyle = glow
          ctx.fill()
          ctx.beginPath()
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(245,236,215,${0.7 + pulse * 0.3})`
          ctx.fill()
          ctx.strokeStyle = `rgba(201,168,76,${0.6 + pulse * 0.4})`
          ctx.lineWidth = 1
          ctx.stroke()

          ctx.fillStyle = `rgba(201,168,76,${0.5 + pulse * 0.3})`
          ctx.font = '8px Georgia, serif'
          ctx.textAlign = 'center'
          const labelText = point.label.length > 32 ? point.label.slice(0, 30) + '…' : point.label
          ctx.fillText(labelText, p.x, p.y - r - 6)

        } else if (point.type === 'source') {
          const r = 4 + pulse * 1.5
          const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2)
          glow.addColorStop(0, 'rgba(100,160,255,0.2)')
          glow.addColorStop(1, 'rgba(100,160,255,0)')
          ctx.beginPath()
          ctx.arc(p.x, p.y, r * 2, 0, Math.PI * 2)
          ctx.fillStyle = glow
          ctx.fill()
          ctx.beginPath()
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(140,190,255,${0.6 + pulse * 0.3})`
          ctx.fill()
        }
      }

      // ── Globe rim ──────────────────────────────────────────────────────
      const rim = ctx.createRadialGradient(
        cx - radius * 0.3, cy - radius * 0.3, radius * 0.6,
        cx, cy, radius
      )
      rim.addColorStop(0.85, 'transparent')
      rim.addColorStop(1, 'rgba(201,168,76,0.04)')
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fillStyle = rim
      ctx.fill()

      animFrameRef.current = requestAnimationFrame(draw)
    },
    [points, arcs]
  )

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [draw])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const dpr = window.devicePixelRatio || 1
      const w = parent.clientWidth
      const h = parent.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.scale(dpr, dpr)
    }

    resize()
    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)
    return () => ro.disconnect()
  }, [])

  const crossingCount = points.filter(p => p.type === 'crossing').length

  return (
    <div className="fixed inset-0" style={{ zIndex: 0 }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      {crossingCount > 0 && (
        <div
          className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{
            background: 'rgba(10,10,15,0.8)',
            border: '1px solid rgba(201,168,76,0.12)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: '#C9A84C', boxShadow: '0 0 5px #C9A84C', animation: 'pulse 2.5s infinite' }}
          />
          <span className="text-xs" style={{ color: '#C9A84C', fontFamily: 'ui-monospace, monospace' }}>
            {crossingCount} vécu{crossingCount > 1 ? 's' : ''} croisé{crossingCount > 1 ? 's' : ''}
          </span>
        </div>
      )}

      <div className="absolute bottom-4 left-4" style={{ pointerEvents: 'none' }}>
        <p
          className="text-xs"
          style={{ color: 'rgba(80,50,50,0.4)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
        >
          Les zones sombres — silences de l&apos;humanité
        </p>
      </div>
    </div>
  )
}
