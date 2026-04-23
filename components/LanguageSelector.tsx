'use client'

import { useLanguage, ALL_LANGS, LANG_LABELS, Lang } from '@/lib/i18n'
import { useEffect, useState, useRef } from 'react'

export default function LanguageSelector() {
  const [lang, setLang, langDetected] = useLanguage()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  if (!mounted || !langDetected) {
    return <div style={{ width: '60px', height: '28px' }} />
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Current language button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200"
        style={{
          background: open ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#e0e0e0',
          fontSize: '12px',
          cursor: 'pointer',
          letterSpacing: '0.04em',
        }}
      >
        <span style={{ fontSize: '11px' }}>{lang.toUpperCase()}</span>
        <span style={{ fontSize: '8px', opacity: 0.5, transition: 'transform 200ms', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="animate-fade-in"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            background: '#111113',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            padding: '4px',
            minWidth: '160px',
            zIndex: 100,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          {ALL_LANGS.map((l: Lang) => (
            <button
              key={l}
              onClick={() => { setLang(l); setOpen(false) }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '8px 12px',
                fontSize: '12px',
                background: lang === l ? 'rgba(201,168,76,0.08)' : 'transparent',
                border: 'none',
                borderRadius: '7px',
                color: lang === l ? '#C9A84C' : '#aaa',
                cursor: 'pointer',
                transition: 'all 150ms ease',
                textAlign: 'left',
              }}
              onMouseEnter={e => {
                if (lang !== l) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  e.currentTarget.style.color = '#e0e0e0'
                }
              }}
              onMouseLeave={e => {
                if (lang !== l) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#aaa'
                }
              }}
            >
              <span>{LANG_LABELS[l]}</span>
              <span style={{ fontSize: '10px', opacity: 0.5, fontFamily: 'monospace' }}>{l.toUpperCase()}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
