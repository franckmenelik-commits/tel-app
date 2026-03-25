'use client'

// TEL — The Experience Layer
// components/CrossingSpheres.tsx — Scroll-driven ambient spheres
// IDLE: pulsing at corners | SCROLL: merging to center | LOADING: orbiting | RESULT: flash merge

import { useEffect, useRef, useState } from 'react'

interface CrossingSpheresProps {
  isLoading?: boolean
  hasResult?: boolean
}

interface SphereState {
  ax: number; ay: number
  bx: number; by: number
  centerOpacity: number
}

// Extreme start positions so movement is unmistakable
const IDLE: SphereState   = { ax: 15, ay: 25, bx: 85, by: 75, centerOpacity: 0 }
const MERGED: SphereState = { ax: 50, ay: 50, bx: 50, by: 50, centerOpacity: 0.15 }

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

export default function CrossingSpheres({ isLoading = false, hasResult = false }: CrossingSpheresProps) {
  const [pos, setPos] = useState<SphereState>(IDLE)
  const [resultFlash, setResultFlash] = useState(false)
  const rafRef = useRef<number | null>(null)
  const scrollRatioRef = useRef(0)

  // ── Scroll tracking ──────────────────────────────────────────────────────
  useEffect(() => {
    if (isLoading || hasResult) return

    function onScroll() {
      if (rafRef.current !== null) return
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        const scrollY = window.scrollY
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight
        // merge reaches 1 at scroll progress 0.5 (halfway down page)
        const ratio = maxScroll > 0 ? Math.min(1, scrollY / maxScroll) : 0
        scrollRatioRef.current = ratio
        const merge = Math.min(1, ratio * 2)
        setPos({
          ax: lerp(IDLE.ax, MERGED.ax, merge),
          ay: lerp(IDLE.ay, MERGED.ay, merge),
          bx: lerp(IDLE.bx, MERGED.bx, merge),
          by: lerp(IDLE.by, MERGED.by, merge),
          centerOpacity: lerp(0, MERGED.centerOpacity, merge),
        })
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    }
  }, [isLoading, hasResult])

  // ── Loading: orbit ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading) return
    setPos({ ax: 50, ay: 50, bx: 50, by: 50, centerOpacity: 0.15 })
  }, [isLoading])

  // ── Result: flash ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasResult) return
    setPos(MERGED)
    setResultFlash(true)
    const t = setTimeout(() => setResultFlash(false), 400)
    return () => clearTimeout(t)
  }, [hasResult])

  // ── Reset to scroll position when returning to idle ──────────────────────
  useEffect(() => {
    if (!isLoading && !hasResult) {
      const ratio = scrollRatioRef.current
      const merge = Math.min(1, ratio * 2)
      setPos({
        ax: lerp(IDLE.ax, MERGED.ax, merge),
        ay: lerp(IDLE.ay, MERGED.ay, merge),
        bx: lerp(IDLE.bx, MERGED.bx, merge),
        by: lerp(IDLE.by, MERGED.by, merge),
        centerOpacity: lerp(0, MERGED.centerOpacity, merge),
      })
    }
  }, [isLoading, hasResult])

  const size = 300 // desktop — CSS clamps to 200px on mobile via calc
  const half = size / 2

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    // 300px desktop, 200px mobile
    width: 'clamp(200px, 25vw, 300px)',
    height: 'clamp(200px, 25vw, 300px)',
    borderRadius: '50%',
    filter: 'blur(40px)',
    mixBlendMode: 'screen',
    opacity: resultFlash ? 0.5 : 0.25,
    transition: isLoading
      ? 'none'
      : hasResult
        ? 'left 0.4s ease, top 0.4s ease, opacity 0.4s ease'
        : 'left 0.5s ease, top 0.5s ease',
    willChange: 'transform, opacity',
    pointerEvents: 'none',
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 0,
      pointerEvents: 'none',
      overflow: 'hidden',
    }}>
      {/* Sphere A — gold */}
      <div style={{
        ...baseStyle,
        background: 'radial-gradient(circle, #C9A84C 0%, transparent 70%)',
        left: `calc(${pos.ax}% - clamp(100px, 12.5vw, 150px))`,
        top: `calc(${pos.ay}% - clamp(100px, 12.5vw, 150px))`,
        animation: isLoading
          ? 'sphereOrbitA 3s linear infinite'
          : !hasResult
            ? 'spherePulseA 6s ease-in-out infinite'
            : 'none',
      }} />

      {/* Sphere B — blue */}
      <div style={{
        ...baseStyle,
        background: 'radial-gradient(circle, #4A7CC9 0%, transparent 70%)',
        left: `calc(${pos.bx}% - clamp(100px, 12.5vw, 150px))`,
        top: `calc(${pos.by}% - clamp(100px, 12.5vw, 150px))`,
        animation: isLoading
          ? 'sphereOrbitB 3s linear infinite'
          : !hasResult
            ? 'spherePulseB 6s ease-in-out infinite 3s'
            : 'none',
      }} />

      {/* Center glow — white convergence, 400px */}
      <div style={{
        position: 'absolute',
        left: 'calc(50% - 200px)',
        top: 'calc(50% - 200px)',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)',
        filter: 'blur(60px)',
        opacity: isLoading ? 0.15 : pos.centerOpacity,
        transition: 'opacity 0.6s ease',
        pointerEvents: 'none',
        mixBlendMode: 'screen',
      }} />
    </div>
  )
}
