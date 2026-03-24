'use client'

// TEL — The Experience Layer
// components/ScrollSequence.tsx
// Scroll-driven image sequence — internal scroll, up to 65 frames
// Frame index updates instantly on scroll, no animation delay

import { useRef, useEffect, useState, useCallback } from 'react'

const MAX_FRAMES = 65

interface ScrollSequenceProps {
  /** Array of image URLs — max 65 frames */
  images: string[]
  /** Height in pixels of the virtual scroll area per frame (default: 180) */
  frameHeight?: number
  /** Optional CSS class for the outer container */
  className?: string
}

export default function ScrollSequence({
  images,
  frameHeight = 180,
  className,
}: ScrollSequenceProps) {
  const frames = images.slice(0, MAX_FRAMES)
  const frameCount = frames.length

  const scrollRef = useRef<HTMLDivElement>(null)
  const [currentFrame, setCurrentFrame] = useState(0)

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el || frameCount <= 1) return
    const maxScroll = el.scrollHeight - el.clientHeight
    if (maxScroll <= 0) return
    const progress = el.scrollTop / maxScroll
    // clamp to [0, frameCount - 1]
    const frame = Math.min(Math.floor(progress * frameCount), frameCount - 1)
    setCurrentFrame(frame)
  }, [frameCount])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  if (frameCount === 0) return null

  // Total scroll height = sum of all virtual frames
  const scrollHeight = frameCount * frameHeight

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Scroll container — internal, not window */}
      <div
        ref={scrollRef}
        style={{
          position: 'absolute',
          inset: 0,
          overflowY: 'scroll',
          scrollbarWidth: 'none',
          // webkit
          msOverflowStyle: 'none',
        }}
      >
        {/* Sticky frame display — anchored at top of scroll container */}
        <div style={{ position: 'sticky', top: 0, width: '100%', zIndex: 1 }}>
          {frames[currentFrame] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={frames[currentFrame]}
              alt=""
              draggable={false}
              style={{
                display: 'block',
                width: '100%',
                height: 'auto',
                userSelect: 'none',
                WebkitUserDrag: 'none',
              } as React.CSSProperties}
            />
          )}
        </div>

        {/* Invisible spacer that gives the scroll container its total height */}
        <div
          aria-hidden="true"
          style={{ height: scrollHeight, width: '100%' }}
        />
      </div>

      {/* Scrub indicator — subtle progress bar at bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '2px',
          background: 'rgba(201,168,76,0.5)',
          width: frameCount > 1
            ? `${((currentFrame) / (frameCount - 1)) * 100}%`
            : '0%',
          transition: 'width 60ms linear',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
    </div>
  )
}
