'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { SouffleContexte } from '@/lib/types'
import { detectInputMode } from '@/lib/detect-mode'
import type { InputMode } from '@/lib/detect-mode'
import { useLanguage, t } from '@/lib/i18n'

interface SourceInputProps {
  onCross: (inputs: string[], contexte: SouffleContexte) => void
  isLoading: boolean
  prefill?: string[]
  register?: string
  onRegisterChange?: (register: string) => void
  isEmpiricalMode?: boolean
  onToggleEmpiricalMode?: (value: boolean) => void
}

function detectUrlMeta(url: string): { icon: string; color: string; label: string } {
  const u = url.toLowerCase()
  if (u.includes('youtube.com') || u.includes('youtu.be'))
    return { icon: '▶', color: '#C9A84C', label: 'YouTube' }
  if (u.includes('wikipedia.org'))
    return { icon: 'W', color: '#7AABB5', label: 'Wikipedia' }
  if (u.includes('instagram.com'))
    return { icon: '◈', color: '#9898CC', label: 'Instagram' }
  if (u.includes('.pdf'))
    return { icon: '▣', color: '#888', label: 'Document' }
  if (u.startsWith('http'))
    return { icon: '○', color: '#888', label: 'Article' }
  return { icon: '·', color: '#444', label: 'URL' }
}

function getModeIcon(mode: InputMode): string {
  switch (mode) {
    case 'url': return '○'
    case 'free_text': return '❝'
    case 'keyword': return '⊕'
    case 'crossing': return '×'
    case 'book': return '□'
    case 'upload': return '+'
    case 'voice': return '●'
  }
}

function getModeColor(mode: InputMode): string {
  switch (mode) {
    case 'url': return '#888'
    case 'free_text': return '#888'
    case 'keyword': return '#C9A84C'
    case 'crossing': return '#C9A84C'
    case 'book': return '#4A7FC1'
    case 'upload': return '#7AABB5'
    case 'voice': return '#E85D4A'
  }
}

export default function SourceInput({ onCross, isLoading, prefill, register = 'standard', onRegisterChange, isEmpiricalMode = false, onToggleEmpiricalMode }: SourceInputProps) {
  const [mode, setMode] = useState<'cross' | 'resonate'>('cross')
  const [vecu, setVecu] = useState('')
  const [resonanceResult, setResonanceResult] = useState<null | {
    structureProfonde: string
    resonances: { titre: string; contexte: string; lienStructurel: string; difference: string }[]
    revelationCroisee: string
    questionInexposee: string
    indicible: string
  }>(null)
  const [resonanceLoading, setResonanceLoading] = useState(false)
  const [resonanceError, setResonanceError] = useState<string | null>(null)

  // Voice recording state
  const [recordingIndex, setRecordingIndex] = useState<number | null>(null)
  const [recordingVecu, setRecordingVecu] = useState(false)
  const [isBookVecu, setIsBookVecu] = useState(false)
  // File upload state  
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const [uploadingVecu, setUploadingVecu] = useState(false)

  const [inputs, setInputs] = useState<string[]>(['', ''])
  const [bookModes, setBookModes] = useState<boolean[]>([false, false])
  const [contexte, setContexte] = useState<SouffleContexte>('exploration')

  // Pre-fill from carousel click
  useEffect(() => {
    if (prefill && prefill.length > 0) {
      setInputs(prefill.length >= 2 ? [...prefill] : [...prefill, ''])
      setMode('cross')
    }
  }, [prefill])

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('tel:approfondir')
      if (stored) {
        const urls = JSON.parse(stored) as string[]
        sessionStorage.removeItem('tel:approfondir')
        if (Array.isArray(urls) && urls.length > 0) {
          setInputs(urls.length >= 2 ? urls : [...urls, ''])
        }
      }
    } catch { /* ok */ }
  }, [])

  const [error, setError] = useState<string | null>(null)
  const [showContexte, setShowContexte] = useState(false)
  const [lang] = useLanguage()

  const CONTEXTES = [
    { value: 'exploration' as const,      label: t('ctx.exploration.label', lang),   niveaux: '•',   description: t('ctx.exploration.desc', lang) },
    { value: 'culturel_profond' as const, label: t('ctx.cultural.label', lang),      niveaux: '••',  description: t('ctx.cultural.desc', lang) },
    { value: 'institutionnel' as const,   label: t('ctx.institutional.label', lang), niveaux: '•••', description: t('ctx.institutional.desc', lang) },
    { value: 'langue_en_danger' as const, label: t('ctx.language.label', lang),      niveaux: '•••', description: t('ctx.language.desc', lang) },
    { value: 'vecu_traumatique' as const, label: t('ctx.trauma.label', lang),        niveaux: '•••', description: t('ctx.trauma.desc', lang) },
  ]

  const getLangModeLabel = (mode: InputMode): string => {
    if (mode === 'free_text') return t('hint.mode.freetext', lang)
    if (mode === 'keyword') return t('hint.mode.keyword', lang)
    if (mode === 'crossing') return t('hint.mode.crossing', lang)
    return 'URL'
  }

  const inputRefs = useRef<(HTMLTextAreaElement | null)[]>([])

  const updateInput = useCallback((index: number, value: string) => {
    setInputs(prev => {
      const next = [...prev]
      next[index] = value
      return next
    })
    setError(null)
  }, [])

  const addSource = useCallback(() => {
    setInputs(prev => [...prev, ''])
    setBookModes(prev => [...prev, false])
  }, [])

  const toggleBookMode = useCallback((index: number) => {
    setBookModes(prev => {
      const next = [...prev]
      next[index] = !next[index]
      return next
    })
  }, [])

  const removeSource = useCallback((index: number) => {
    setInputs(prev => {
      if (prev.length <= 2) return prev
      return prev.filter((_, i) => i !== index)
    })
    setBookModes(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handlePaste = useCallback((index: number, e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').trim()
    updateInput(index, text)
  }, [updateInput])

  // ── Voice recording (Web Speech API — fully client-side, sovereign) ──────
  const startVoiceRecording = useCallback((index: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const W = window as any
    const SpeechRecognitionCtor = W.SpeechRecognition || W.webkitSpeechRecognition
    if (!SpeechRecognitionCtor) {
      setError(lang === 'en' ? 'Voice not supported on this browser' : 'Voix non supportée sur ce navigateur')
      return
    }
    const recognition = new SpeechRecognitionCtor()
    recognition.lang = lang === 'en' ? 'en-US' : 'fr-FR'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.continuous = false
    setRecordingIndex(index)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || ''
      if (transcript.trim()) {
        updateInput(index, transcript.trim())
      }
      setRecordingIndex(null)
    }
    recognition.onerror = () => { setRecordingIndex(null) }
    recognition.onend = () => { setRecordingIndex(null) }
    recognition.start()
  }, [lang, updateInput])

  // ── File upload (drag & drop / click) ───────────────────────────────────
  const handleFileUpload = useCallback(async (index: number, file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    if (!['pdf', 'txt', 'md', 'text', 'pptx', 'ppt', 'png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) {
      setError(lang === 'en' ? `Unsupported: .${ext}` : `Non supporté : .${ext}`)
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError(lang === 'en' ? 'File too large (max 10MB)' : 'Fichier trop volumineux (max 10MB)')
      return
    }
    setUploadingIndex(index)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Upload failed')
      // Set the source input to the extracted text with upload:// prefix for mode detection
      updateInput(index, data.text)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload error')
    } finally {
      setUploadingIndex(null)
    }
  }, [lang, updateInput])

  const handleDrop = useCallback((index: number, e: React.DragEvent) => {
    e.preventDefault()
    setDragOverIndex(null)
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(index, file)
  }, [handleFileUpload])

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleCross = useCallback(() => {
    const validInputs = inputs
      .map((input, i) => {
        const trimmed = input.trim()
        if (!trimmed) return ''
        if (bookModes[i]) return `livre:${trimmed}`
        return trimmed
      })
      .filter(i => i.length > 0)
    if (validInputs.length < 1) {
      setError(t('input.error', lang))
      return
    }
    setError(null)
    onCross(validInputs, contexte)
  }, [inputs, bookModes, contexte, onCross])

  const contexteChoisi = CONTEXTES.find((c) => c.value === contexte)!
  const nonEmptyCount = inputs.filter(i => i.trim().length > 0).length

  async function handleResonate() {
    if (vecu.trim().length < 30) {
      setResonanceError(t('resonate.error', lang))
      return
    }
    setResonanceError(null)
    setResonanceResult(null)
    setResonanceLoading(true)
    try {
      const res = await fetch('/api/resonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vecu: vecu.trim() }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Erreur')
      setResonanceResult(data.result)
    } catch (err) {
      setResonanceError(err instanceof Error ? err.message : 'Erreur réseau')
    } finally {
      setResonanceLoading(false)
    }
  }

  const GOLD = '#C9A84C'
  const BORDER = 'rgba(255,255,255,0.071)'
  const SURFACE = 'rgba(255,255,255,0.025)'

  return (
    <div className="w-full max-w-2xl mx-auto">

      {/* ── Mode tabs ── */}
      <div className="flex gap-1 mb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.047)', paddingBottom: '0' }}>
        {([
          { key: 'cross', label: t('input.tab.cross', lang) },
          { key: 'resonate', label: `◎ ${t('mode.resonate', lang)}` },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => { setMode(tab.key); setResonanceResult(null); setResonanceError(null) }}
            style={{
              padding: '8px 16px',
              fontSize: '12px',
              background: 'none',
              border: 'none',
              borderBottom: mode === tab.key ? `2px solid ${GOLD}` : '2px solid transparent',
              color: mode === tab.key ? GOLD : '#444',
              cursor: 'pointer',
              transition: 'all 200ms ease',
              marginBottom: '-1px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Mode Croise-moi ── */}
      {mode === 'resonate' && (
        <div>
          <p style={{ fontSize: '12px', color: '#444', lineHeight: 1.6, marginBottom: '16px', fontStyle: 'italic' }}>
            {t('resonate.desc', lang)}
          </p>
          {isBookVecu ? (
            <div className={`tel-resonate-area flex flex-col gap-4 p-5 rounded-xl mb-3 ${vecu.trim().length > 10 ? 'tel-bubble-filled' : ''}`} style={{ background: SURFACE, border: `1px solid ${vecu.trim() ? 'rgba(201,168,76,0.25)' : BORDER}` }}>
              <input
                type="text"
                placeholder={t('input.book.title', lang)}
                value={vecu.split(' — ')[0] || ''}
                onChange={(e) => {
                  const parts = vecu.split(' — ')
                  setVecu(`${e.target.value} — ${parts[1] || ''} — ${parts[2] || ''}`)
                }}
                className="bg-transparent border-none focus:ring-0 text-lg tel-serif font-medium"
                style={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}
              />
              <div className="flex gap-6">
                <input
                  type="text"
                  placeholder={t('input.book.author', lang)}
                  value={vecu.split(' — ')[1] || ''}
                  onChange={(e) => {
                    const parts = vecu.split(' — ')
                    setVecu(`${parts[0] || ''} — ${e.target.value} — ${parts[2] || ''}`)
                  }}
                  className="bg-transparent border-none focus:ring-0 text-sm tel-serif italic flex-1"
                  style={{ color: '#aaa' }}
                />
                <input
                  type="text"
                  placeholder={t('input.book.page', lang)}
                  value={vecu.split(' — ')[2] || ''}
                  onChange={(e) => {
                    const parts = vecu.split(' — ')
                    setVecu(`${parts[0] || ''} — ${parts[1] || ''} — ${e.target.value}`)
                  }}
                  className="bg-transparent border-none focus:ring-0 text-sm tel-serif flex-1"
                  style={{ color: '#666', textAlign: 'right' }}
                />
              </div>
            </div>
          ) : (
            <textarea
              className={`tel-resonate-area ${vecu.trim().length > 10 ? 'tel-bubble-filled' : ''}`}
              value={vecu}
              onChange={e => { setVecu(e.target.value); setResonanceError(null) }}
              rows={5}
              placeholder={t('mode.resonate.placeholder', lang)}
              disabled={resonanceLoading}
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: '14px',
                background: SURFACE,
                border: `1px solid ${vecu.trim() ? 'rgba(201,168,76,0.25)' : BORDER}`,
                borderRadius: '8px',
                color: '#e0e0e0',
                lineHeight: 1.7,
                resize: 'vertical' as const,
                outline: 'none',
                fontFamily: 'Georgia, Times New Roman, serif',
                marginBottom: '12px',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)' }}
              onBlur={e => { e.currentTarget.style.borderColor = vecu.trim() ? 'rgba(201,168,76,0.25)' : BORDER }}
            />
          )}

          {/* Voice + File buttons for resonance mode */}
          <div className="flex items-center gap-2 mb-3">
            {/* Mic button */}
            <button
              onClick={() => {
                if (recordingVecu) { setRecordingVecu(false); return }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const W = window as any
                const Ctor = W.SpeechRecognition || W.webkitSpeechRecognition
                if (!Ctor) { setResonanceError(lang === 'en' ? 'Voice not supported' : 'Voix non supportée'); return }
                const r = new Ctor()
                r.lang = lang === 'en' ? 'en-US' : lang === 'fr' ? 'fr-FR' : lang === 'de' ? 'de-DE' : lang === 'es' ? 'es-ES' : lang === 'pt' ? 'pt-BR' : lang === 'it' ? 'it-IT' : lang === 'ja' ? 'ja-JP' : lang === 'ko' ? 'ko-KR' : lang === 'hi' ? 'hi-IN' : lang === 'id' ? 'id-ID' : lang === 'ar' ? 'ar-SA' : 'en-US'
                r.interimResults = false; r.continuous = false
                setRecordingVecu(true)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                r.onresult = (e: any) => { const txt = e.results?.[0]?.[0]?.transcript || ''; if (txt) setVecu(prev => prev ? prev + ' ' + txt : txt); setRecordingVecu(false) }
                r.onerror = () => setRecordingVecu(false)
                r.onend = () => setRecordingVecu(false)
                r.start()
              }}
              disabled={resonanceLoading}
              className={recordingVecu ? 'tel-voice-recording' : ''}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                fontSize: '11px', padding: '6px 12px', borderRadius: '6px',
                background: recordingVecu ? 'rgba(232,93,74,0.12)' : 'rgba(255,255,255,0.025)',
                border: `1px solid ${recordingVecu ? 'rgba(232,93,74,0.4)' : 'rgba(255,255,255,0.071)'}`,
                color: recordingVecu ? '#E85D4A' : '#666',
                cursor: 'pointer', transition: 'all 200ms ease',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              </svg>
              {recordingVecu ? (lang === 'en' ? 'Recording…' : 'Écoute…') : (lang === 'en' ? 'Vocal' : 'Vocal')}
            </button>

            {/* File upload button */}
            <button
              onClick={() => (document.getElementById('vecu-file-input') as HTMLInputElement)?.click()}
              disabled={resonanceLoading || uploadingVecu}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                fontSize: '11px', padding: '6px 12px', borderRadius: '6px',
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.071)',
                color: uploadingVecu ? '#7AABB5' : '#666',
                cursor: 'pointer', transition: 'all 200ms ease',
                textTransform: 'uppercase', letterSpacing: '0.05em'
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              {uploadingVecu ? (lang === 'en' ? 'Reading…' : 'Lecture…') : (lang === 'en' ? 'Fichier' : 'Fichier')}
            </button>

            {/* Book Mode button for Resonate */}
            <button
              onClick={() => setIsBookVecu(!isBookVecu)}
              disabled={resonanceLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                fontSize: '11px', padding: '6px 12px', borderRadius: '6px',
                background: isBookVecu ? 'rgba(122,171,181,0.1)' : 'rgba(255,255,255,0.025)',
                border: `1px solid ${isBookVecu ? 'rgba(122,171,181,0.3)' : 'rgba(255,255,255,0.071)'}`,
                color: isBookVecu ? '#7AABB5' : '#666',
                cursor: 'pointer', transition: 'all 200ms ease',
                textTransform: 'uppercase', letterSpacing: '0.05em'
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <span>Livre</span>
            </button>
            <input
              id="vecu-file-input"
              type="file"
              accept=".pdf,.txt,.md,.text,.pptx,.ppt,.png,.jpg,.jpeg,.webp,.gif"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setUploadingVecu(true)
                try {
                  const formData = new FormData()
                  formData.append('file', file)
                  const res = await fetch('/api/upload', { method: 'POST', body: formData })
                  const data = await res.json()
                  if (data.success && data.text) setVecu(prev => prev ? prev + '\n\n' + data.text : data.text)
                  else setResonanceError(data.error || 'Upload error')
                } catch { setResonanceError('Upload error') }
                setUploadingVecu(false)
                e.target.value = ''
              }}
            />
          </div>

          {resonanceError && (
            <p style={{ fontSize: '12px', color: '#8B3A3A', fontStyle: 'italic', marginBottom: '10px' }}>{resonanceError}</p>
          )}
          <button
            onClick={() => {
              // Collision animation on the textarea container
              const textarea = document.querySelector('.tel-resonate-area')
              if (textarea) {
                textarea.classList.remove('tel-bubble-collide')
                void (textarea as HTMLElement).offsetWidth
                textarea.classList.add('tel-bubble-collide')
              }
              setTimeout(() => handleResonate(), 350)
            }}
            disabled={resonanceLoading}
            style={{
              width: '100%',
              padding: '12px',
              background: resonanceLoading ? 'rgba(201,168,76,0.04)' : GOLD,
              border: resonanceLoading ? '1px solid rgba(201,168,76,0.15)' : 'none',
              color: resonanceLoading ? 'rgba(201,168,76,0.3)' : '#09090b',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: resonanceLoading ? 'not-allowed' : 'pointer',
              transition: 'all 200ms ease',
              marginBottom: '24px',
            }}
          >
            {resonanceLoading ? t('mode.resonate.loading', lang) : t('mode.resonate.btn', lang)}
          </button>

          {/* Résultat */}
          {resonanceResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Structure profonde */}
              <div style={{ padding: '20px', borderRadius: '8px', background: SURFACE, border: '1px solid rgba(201,168,76,0.12)' }}>
                <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: GOLD, opacity: 0.7, marginBottom: '10px' }}>
                  {t('resonate.deepstruct', lang)}
                </p>
                <p style={{ fontSize: '14px', lineHeight: 1.75, color: '#e0e0e0', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                  {resonanceResult.structureProfonde}
                </p>
              </div>

              {/* Résonances */}
              {resonanceResult.resonances.map((r, i) => (
                <div key={i} style={{ padding: '20px', borderRadius: '8px', background: SURFACE, border: `1px solid ${BORDER}` }}>
                  <p style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#666', marginBottom: '6px' }}>
                    {t('resonate.resonance', lang)} {i + 1} — {r.contexte}
                  </p>
                  <p style={{ fontSize: '15px', color: '#e0e0e0', fontWeight: 500, marginBottom: '10px' }}>{r.titre}</p>
                  <p style={{ fontSize: '13px', lineHeight: 1.7, color: '#aaa', marginBottom: '8px' }}>
                    <span style={{ color: GOLD, opacity: 0.7, marginRight: '6px' }}>{t('resonate.resonates', lang)}</span>
                    {r.lienStructurel}
                  </p>
                  <p style={{ fontSize: '13px', lineHeight: 1.7, color: '#666', fontStyle: 'italic' }}>
                    <span style={{ opacity: 0.7, marginRight: '6px' }}>{t('resonate.differs', lang)}</span>
                    {r.difference}
                  </p>
                </div>
              ))}

              {/* Révélation */}
              <div style={{ padding: '20px', borderRadius: '8px', background: 'rgba(201,168,76,0.03)', border: '1px solid rgba(201,168,76,0.12)' }}>
                <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: GOLD, opacity: 0.7, marginBottom: '10px' }}>
                  {t('resonate.reveals', lang)}
                </p>
                <p style={{ fontSize: '14px', lineHeight: 1.75, color: '#e0e0e0', fontFamily: 'Georgia, serif' }}>
                  {resonanceResult.revelationCroisee}
                </p>
              </div>

              {/* Question */}
              <div style={{ padding: '20px', borderRadius: '8px', background: 'rgba(255,255,255,0.015)', border: `1px solid ${BORDER}` }}>
                <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: GOLD, opacity: 0.7, marginBottom: '10px' }}>
                  {t('resonate.question', lang)}
                </p>
                <p style={{ fontSize: '15px', lineHeight: 1.75, color: '#f0f0f0', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                  {resonanceResult.questionInexposee}
                </p>
              </div>

              {/* Indicible */}
              <p style={{ fontSize: '12px', color: '#444', fontStyle: 'italic', lineHeight: 1.6, textAlign: 'center' as const, padding: '0 16px' }}>
                {resonanceResult.indicible}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Mode croisement (normal) ── */}
      {mode === 'cross' && <>

      {/* ── Mode hints ── */}
      <div className="flex flex-wrap gap-3 mb-5" style={{ fontSize: '11px', color: '#333' }}>
        {[
          { mode: 'url' as InputMode, example: 'youtube.com/…' },
          { mode: 'keyword' as InputMode, example: t('hint.keyword.example', lang) },
          { mode: 'crossing' as InputMode, example: t('hint.crossing.example', lang) },
          { mode: 'free_text' as InputMode, example: t('hint.text.example', lang) },
          { mode: 'upload' as InputMode, example: lang === 'en' ? 'drag PDF, TXT' : 'glissez PDF, TXT' },
          { mode: 'voice' as InputMode, example: lang === 'en' ? 'speak directly' : 'parlez directement' },
        ].map(({ mode, example }) => (
          <span key={mode} className="flex items-center gap-1">
            <span style={{ color: getModeColor(mode) }}>{getModeIcon(mode)}</span>
            <span style={{ color: '#444' }}>{getLangModeLabel(mode)}</span>
            <span style={{ color: '#2a2a2a' }}>— {example}</span>
          </span>
        ))}
      </div>

      {/* ── Source inputs ── */}
      <div className="flex flex-col gap-3 mb-6">
        {inputs.map((input, i) => {
          const trimmed = input.trim()
          const isBook = bookModes[i] ?? false
          const detected = trimmed ? detectInputMode(trimmed) : null
          const isUrl = !isBook && detected?.mode === 'url'
          const urlMeta = isUrl ? detectUrlMeta(trimmed) : null
          const isValid = trimmed.length > 0

          return (
            <div 
              key={i} 
              className={`relative flex flex-col gap-2 p-4 rounded-xl transition-all duration-300 ${isValid ? 'tel-bubble-filled' : ''}`} 
              style={{ 
                background: 'rgba(255,255,255,0.012)', 
                border: `1px solid ${isValid ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.04)'}`,
                boxShadow: isValid ? '0 4px 20px rgba(0,0,0,0.2)' : 'none'
              }}
            >
              {/* Step & Label */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                   <span style={{ fontSize: '10px', color: GOLD, opacity: 0.6, fontWeight: 700, letterSpacing: '0.1em' }}>
                     {String(i + 1).padStart(2, '0')}
                   </span>
                   <span style={{ fontSize: '10px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
                     {isBook ? t('input.mode.book', lang) : (isValid ? (isUrl ? urlMeta!.label : getLangModeLabel(detected?.mode ?? 'keyword')) : t('input.sources', lang))}
                   </span>
                </div>
                {inputs.length > 2 && !isLoading && (
                  <button 
                    onClick={() => removeSource(i)}
                    style={{ background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: '0 4px' }}
                    title={lang === 'en' ? 'Remove' : 'Supprimer'}
                  >×</button>
                )}
              </div>

              <div className="flex gap-3 items-start">
                {/* Mode Icon */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm ${recordingIndex === i ? 'tel-voice-recording' : ''}`}
                  style={{
                    background: recordingIndex === i ? 'rgba(232,93,74,0.1)'
                      : isBook ? 'rgba(122,171,181,0.06)'
                      : isValid ? 'rgba(201,168,76,0.04)'
                      : 'rgba(255,255,255,0.015)',
                    color: recordingIndex === i ? '#E85D4A'
                      : isBook ? '#7AABB5'
                      : isValid ? (urlMeta?.color ?? getModeColor(detected?.mode ?? 'keyword'))
                      : '#1a1a1a',
                    border: `1px solid ${recordingIndex === i ? 'rgba(232,93,74,0.3)' : isBook ? 'rgba(122,171,181,0.2)' : isValid ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.03)'}`,
                    transition: 'all 300ms ease',
                  }}
                >
                  {recordingIndex === i ? (
                    <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                  ) : isBook ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  ) : detected ? (
                    isUrl ? <span style={{ fontSize: '14px' }}>{urlMeta!.icon}</span> : 
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                       {detected.mode === 'keyword' && <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}
                       {detected.mode === 'crossing' && <path d="M18 6L6 18M6 6l12 12"/>}
                       {detected.mode === 'free_text' && <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>}
                    </svg>
                  ) : <span style={{ opacity: 0.15 }}>?</span>}
                </div>

                <div
                  className="flex-1 relative"
                  onDragOver={(e) => { e.preventDefault(); setDragOverIndex(i) }}
                  onDragLeave={() => setDragOverIndex(null)}
                  onDrop={(e) => handleDrop(i, e)}
                >
                  {/* Drop overlay */}
                  {dragOverIndex === i && (
                    <div style={{
                      position: 'absolute', inset: 0, zIndex: 10,
                      background: 'rgba(122,171,181,0.08)',
                      border: '2px dashed rgba(122,171,181,0.4)',
                      borderRadius: '8px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      pointerEvents: 'none',
                    }}>
                      <span style={{ fontSize: '12px', color: '#7AABB5', letterSpacing: '0.04em' }}>
                        {lang === 'en' ? '▣ Drop file' : '▣ Déposer le fichier'}
                      </span>
                    </div>
                  )}

                  {/* Upload progress */}
                  {uploadingIndex === i && (
                    <div style={{
                      position: 'absolute', inset: 0, zIndex: 10,
                      background: 'rgba(9,9,11,0.85)',
                      borderRadius: '8px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: '8px',
                    }}>
                      <div className="tel-loading-dot" />
                    </div>
                  )}

                  {isBook ? (
                    <div className="flex flex-col gap-2 w-full py-2">
                      <input
                        type="text"
                        placeholder={t('input.book.title', lang)}
                        value={input.split(' — ')[0] || ''}
                        onChange={(e) => {
                          const parts = input.split(' — ')
                          updateInput(i, `${e.target.value} — ${parts[1] || ''} — ${parts[2] || ''}`)
                        }}
                        className="bg-transparent border-none focus:ring-0 text-sm md:text-base tel-serif font-medium"
                        style={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px' }}
                      />
                      <div className="flex gap-4">
                        <input
                          type="text"
                          placeholder={t('input.book.author', lang)}
                          value={input.split(' — ')[1] || ''}
                          onChange={(e) => {
                            const parts = input.split(' — ')
                            updateInput(i, `${parts[0] || ''} — ${e.target.value} — ${parts[2] || ''}`)
                          }}
                          className="bg-transparent border-none focus:ring-0 text-xs md:text-sm tel-serif italic flex-1"
                          style={{ color: '#aaa' }}
                        />
                        <input
                          type="text"
                          placeholder={t('input.book.page', lang)}
                          value={input.split(' — ')[2] || ''}
                          onChange={(e) => {
                            const parts = input.split(' — ')
                            updateInput(i, `${parts[0] || ''} — ${parts[1] || ''} — ${e.target.value}`)
                          }}
                          className="bg-transparent border-none focus:ring-0 text-xs tel-serif flex-1"
                          style={{ color: '#666', textAlign: 'right' }}
                        />
                      </div>
                    </div>
                  ) : (
                    <textarea
                      ref={(el) => { inputRefs.current[i] = el }}
                      value={input}
                      onChange={(e) => updateInput(i, e.target.value)}
                      onPaste={(e) => handlePaste(i, e)}
                      rows={detected?.mode === 'free_text' ? 4 : 1}
                      placeholder={
                        i === 0
                          ? t('input.placeholder1', lang)
                          : i === 1
                          ? t('input.placeholder2', lang)
                          : `${t('input.sources', lang)} ${i + 1}`
                      }
                      disabled={isLoading || uploadingIndex === i}
                      className="w-full bg-transparent border-none focus:ring-0 text-sm md:text-base tel-serif"
                      style={{
                        height: 'auto',
                        resize: 'none',
                        color: '#fff',
                        padding: '4px 0',
                        lineHeight: '1.6',
                        outline: 'none',
                        minHeight: detected?.mode === 'free_text' ? '96px' : '24px',
                      }}
                      onFocus={e => { (e.currentTarget.parentElement?.parentElement?.parentElement as HTMLElement).style.borderColor = 'rgba(201,168,76,0.3)' }}
                      onBlur={e => { (e.currentTarget.parentElement?.parentElement?.parentElement as HTMLElement).style.borderColor = isValid ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.04)' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && detected?.mode !== 'free_text') {
                          e.preventDefault()
                          if (i < inputs.length - 1) {
                            inputRefs.current[i + 1]?.focus()
                          } else {
                            handleCross()
                          }
                        }
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Actions & Meta */}
              <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                <div className="flex items-center gap-4">
                  {!isBook && detected?.mode === 'crossing' && detected.crossingTerms && (
                    <span style={{ color: '#2a2a2a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {detected.crossingTerms[0]} <span style={{ opacity: 0.3 }}>×</span> {detected.crossingTerms[1]}
                    </span>
                  )}
                  {isValid && !isBook && (
                    <span style={{ fontSize: '10px', color: '#2a2a2a' }}>
                      {input.length} {lang === 'en' ? 'chars' : 'cars.'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => recordingIndex === i ? setRecordingIndex(null) : startVoiceRecording(i)}
                    title={lang === 'en' ? 'Voice' : 'Voix'}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      fontSize: '9px', padding: '4px 9px', borderRadius: '100px',
                      background: recordingIndex === i ? 'rgba(232,93,74,0.1)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${recordingIndex === i ? 'rgba(232,93,74,0.3)' : 'transparent'}`,
                      color: recordingIndex === i ? '#E85D4A' : '#555',
                      cursor: 'pointer', transition: 'all 200ms ease',
                      textTransform: 'uppercase', letterSpacing: '0.05em'
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    </svg>
                    <span>{lang === 'en' ? 'Vocal' : 'Vocal'}</span>
                  </button>

                  <button
                    onClick={() => fileInputRefs.current[i]?.click()}
                    title={lang === 'en' ? 'File' : 'Fichier'}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      fontSize: '9px', padding: '4px 9px', borderRadius: '100px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid transparent',
                      color: '#555',
                      cursor: 'pointer', transition: 'all 200ms ease',
                      textTransform: 'uppercase', letterSpacing: '0.05em'
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    <span>{lang === 'en' ? 'File' : 'Fichier'}</span>
                  </button>

                  <button
                    onClick={() => toggleBookMode(i)}
                    title={t('input.mode.book', lang)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      fontSize: '9px', padding: '4px 9px', borderRadius: '100px',
                      background: isBook ? 'rgba(122,171,181,0.08)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isBook ? 'rgba(122,171,181,0.25)' : 'transparent'}`,
                      color: isBook ? '#7AABB5' : '#555',
                      cursor: 'pointer', transition: 'all 200ms ease',
                      textTransform: 'uppercase', letterSpacing: '0.05em'
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                    <span>{t('input.book.toggle', lang).split('/')[0]}</span>
                  </button>

                  <input
                    ref={(el) => { fileInputRefs.current[i] = el }}
                    type="file"
                    accept=".pdf,.txt,.md,.text,.pptx,.ppt,.png,.jpg,.jpeg,.webp,.gif"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(i, file)
                      e.target.value = ''
                    }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Add source ── */}
      {!isLoading && (
        <div className="flex justify-center mb-6">
          <button
            onClick={addSource}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              color: '#333', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
              padding: '6px 16px', borderRadius: '100px',
              cursor: 'pointer', fontSize: '11px', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.1em',
              transition: 'all 200ms ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = GOLD; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#333'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)' }}
          >
            <span>+</span>
            {t('input.add', lang)}
          </button>
        </div>
      )}

      {/* ── Contexte SOUFFLE ── */}
      <div className="mb-5">
        <button
          onClick={() => setShowContexte(!showContexte)}
          className="flex items-center gap-2"
          style={{
            color: showContexte ? '#C9A84C' : '#333',
            background: 'none', border: 'none',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'color 200ms ease',
          }}
        >
          <span style={{ display: 'inline-block', transform: showContexte ? 'rotate(90deg)' : 'none', transition: 'transform 200ms ease', fontSize: '8px' }}>▶</span>
          <span>{t('contexte.label', lang)}</span>
          <span style={{
            color: contexteChoisi.niveaux === '•••' ? '#C9A84C'
              : contexteChoisi.niveaux === '••' ? 'rgba(201,168,76,0.55)'
              : 'rgba(255,255,255,0.15)',
            letterSpacing: '0.05em',
          }}>
            {contexteChoisi.niveaux}
          </span>
          <span style={{ color: '#222' }}>— {contexteChoisi.label}</span>
        </button>

        {showContexte && (
          <div className="mt-2 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.047)' }}>
            <p style={{ fontSize: '12px', color: '#333', fontStyle: 'italic', marginBottom: '10px', lineHeight: 1.6 }}>
              {t('contexte.hint', lang)}
            </p>
            <div className="flex flex-col gap-1">
              {CONTEXTES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => { setContexte(c.value); setShowContexte(false) }}
                  className="flex items-center gap-3 px-3 py-2 rounded text-left"
                  style={{
                    background: contexte === c.value ? 'rgba(201,168,76,0.06)' : 'transparent',
                    border: `1px solid ${contexte === c.value ? 'rgba(201,168,76,0.15)' : 'transparent'}`,
                    cursor: 'pointer',
                    borderRadius: '6px',
                    transition: 'all 200ms ease',
                  }}
                >
                  <span style={{
                    fontSize: '11px', width: '20px', flexShrink: 0,
                    color: c.niveaux === '•••' ? '#C9A84C' : c.niveaux === '••' ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.15)',
                  }}>
                    {c.niveaux}
                  </span>
                  <div>
                    <p style={{ fontSize: '13px', color: contexte === c.value ? '#e0e0e0' : '#555' }}>{c.label}</p>
                    <p style={{ fontSize: '11px', color: '#2a2a2a' }}>{c.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <p style={{ fontSize: '12px', color: '#8B3A3A', fontStyle: 'italic', textAlign: 'center', marginBottom: '12px' }}>
          {error}
        </p>
      )}

      {/* ── Cross button — reality collision trigger ── */}
      <button
        onClick={() => {
          // Trigger collision animation on all filled source rows
          const rows = document.querySelectorAll('.tel-bubble-filled')
          rows.forEach(row => {
            row.classList.remove('tel-bubble-collide')
            // Force reflow to restart animation
            void (row as HTMLElement).offsetWidth
            row.classList.add('tel-bubble-collide')
          })
          // Slight delay for visual impact before actual crossing
          setTimeout(() => handleCross(), 350)
        }}
        disabled={isLoading}
        className="w-full py-3 rounded-lg text-sm"
        style={{
          background: isLoading ? 'rgba(201,168,76,0.04)' : '#C9A84C',
          border: isLoading ? '1px solid rgba(201,168,76,0.15)' : 'none',
          color: isLoading ? 'rgba(201,168,76,0.3)' : '#09090b',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontWeight: 500,
          fontSize: '14px',
          borderRadius: '6px',
          transition: 'all 200ms ease',
        }}
        onMouseEnter={(e) => {
          if (!isLoading) e.currentTarget.style.background = '#d4b05a'
        }}
        onMouseLeave={(e) => {
          if (!isLoading) e.currentTarget.style.background = '#C9A84C'
        }}
      >
        {isLoading ? t('input.loading', lang) : nonEmptyCount === 1 ? t('input.surprise', lang) : t('input.cross', lang)}
      </button>

      {/* ── Language register pills ── */}
      {onRegisterChange && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {([
            { value: 'casual',   label: t('register.casual', lang) },
            { value: 'standard', label: t('register.standard', lang) },
            { value: 'indepth',  label: t('register.indepth', lang) },
          ] as const).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onRegisterChange(value)}
              style={{
                padding: '5px 14px',
                borderRadius: '20px',
                fontSize: '11px',
                border: `1px solid ${register === value ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.08)'}`,
                background: register === value ? 'rgba(201,168,76,0.08)' : 'transparent',
                color: register === value ? '#C9A84C' : '#333',
                cursor: 'pointer',
                transition: 'all 200ms ease',
                letterSpacing: '0.04em',
              }}
              onMouseEnter={e => { if (register !== value) { e.currentTarget.style.color = '#666'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)' } }}
              onMouseLeave={e => { if (register !== value) { e.currentTarget.style.color = '#333'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' } }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── Empirical Audit Mode Toggle ── */}
      {onToggleEmpiricalMode && (
        <div className="flex justify-center mt-6 mb-2">
          <button
            onClick={() => onToggleEmpiricalMode(!isEmpiricalMode)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <div 
              style={{
                width: '28px',
                height: '14px',
                borderRadius: '14px',
                background: isEmpiricalMode ? '#C9A84C' : 'rgba(255,255,255,0.06)',
                position: 'relative',
                transition: 'background 200ms ease',
              }}
            >
              <div 
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: isEmpiricalMode ? '#09090b' : '#666',
                  position: 'absolute',
                  top: '2px',
                  left: isEmpiricalMode ? '16px' : '2px',
                  transition: 'left 200ms ease, background 200ms ease',
                }}
              />
            </div>
            <span style={{ fontSize: '10px', color: isEmpiricalMode ? '#e0e0e0' : '#444', transition: 'color 200ms ease', letterSpacing: '0.05em' }}>
              🧪 {lang === 'en' ? 'Empirical Audit Mode (Omi)' : 'Mode Audit Empirique (Omi)'}
            </span>
          </button>
        </div>
      )}

      </> /* end mode === 'cross' */}
    </div>
  )
}
