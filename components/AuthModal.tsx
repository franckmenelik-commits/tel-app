'use client'

import { useState } from 'react'

interface AuthModalProps {
  onLogin: (email: string) => void
  onClose: () => void
}

export default function AuthModal({ onLogin, onClose }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !email.includes('@')) {
      setError('Entrez une adresse email valide.')
      return
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }

    // localStorage-based auth (demo)
    onLogin(email.trim())
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          width: '100%', maxWidth: '400px',
          background: '#111113',
          border: '1px solid rgba(255,255,255,0.071)',
          borderRadius: '12px',
          padding: '32px',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-4">
            {(['login', 'signup'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null) }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  fontSize: '14px', fontWeight: 500,
                  color: tab === t ? '#e0e0e0' : '#444',
                  borderBottom: tab === t ? '1px solid #e0e0e0' : '1px solid transparent',
                  paddingBottom: '4px',
                  transition: 'all 200ms ease',
                }}
              >
                {t === 'login' ? 'Se connecter' : 'Créer un compte'}
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', fontSize: '1.2rem', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#555', marginBottom: '6px', letterSpacing: '0.08em' }}>
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              autoFocus
              style={{
                width: '100%', padding: '12px 14px',
                background: 'rgba(255,255,255,0.031)',
                border: '1px solid rgba(255,255,255,0.071)',
                borderRadius: '8px',
                color: '#e0e0e0', fontSize: '14px',
                outline: 'none',
                transition: 'border-color 200ms ease',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.071)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#555', marginBottom: '6px', letterSpacing: '0.08em' }}>
              MOT DE PASSE
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%', padding: '12px 14px',
                background: 'rgba(255,255,255,0.031)',
                border: '1px solid rgba(255,255,255,0.071)',
                borderRadius: '8px',
                color: '#e0e0e0', fontSize: '14px',
                outline: 'none',
                transition: 'border-color 200ms ease',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.071)' }}
            />
          </div>

          {error && (
            <p style={{ fontSize: '12px', color: '#8B3A3A', fontStyle: 'italic' }}>{error}</p>
          )}

          <button
            type="submit"
            className="tel-gold-btn"
            style={{ padding: '12px', fontSize: '14px', marginTop: '4px' }}
          >
            {tab === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>

        <p style={{ fontSize: '11px', color: '#333', textAlign: 'center', marginTop: '16px', lineHeight: 1.5 }}>
          Démo locale — aucune donnée envoyée
        </p>
      </div>
    </div>
  )
}
