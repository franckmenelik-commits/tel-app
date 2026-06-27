'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import LanguageSelector from './LanguageSelector'
import AuthModal from './AuthModal'
import { useLanguage, t } from '@/lib/i18n'

interface HeaderProps {
  showingSidebar?: boolean
  setShowingSidebar?: (open: boolean) => void
  sessionHistoryCount?: number
  onLogoClick?: () => void
}

export default function Header({
  showingSidebar = false,
  setShowingSidebar,
  sessionHistoryCount = 0,
  onLogoClick,
}: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [lang] = useLanguage()

  // State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showExplorer, setShowExplorer] = useState(false)
  const [user, setUser] = useState<string | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [historyCount, setHistoryCount] = useState(sessionHistoryCount)

  const explorerRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Load user from localStorage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('tel:user:email')
      if (savedUser) setUser(savedUser)
    } catch { /* ok */ }
  }, [])

  // Sync sessionHistoryCount if provided, otherwise check localStorage
  useEffect(() => {
    if (sessionHistoryCount > 0) {
      setHistoryCount(sessionHistoryCount)
    } else {
      try {
        const raw = localStorage.getItem('tel:history:v3')
        if (raw) {
          const list = JSON.parse(raw)
          if (Array.isArray(list)) setHistoryCount(list.length)
        }
      } catch { /* ok */ }
    }
  }, [sessionHistoryCount, pathname])

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (explorerRef.current && !explorerRef.current.contains(e.target as Node)) {
        setShowExplorer(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Navigation handlers
  const handleLogoClick = (e: React.MouseEvent) => {
    if (pathname === '/' && onLogoClick) {
      e.preventDefault()
      onLogoClick()
    }
  };

  const handleHistoryClick = () => {
    setMobileMenuOpen(false)
    if (pathname === '/' && setShowingSidebar) {
      setShowingSidebar(!showingSidebar)
    } else {
      try {
        sessionStorage.setItem('tel:sidebar:open', 'true')
      } catch { /* ok */ }
      router.push('/')
    }
  }

  const handleLogin = (email: string) => {
    setUser(email)
    setShowAuthModal(false)
    try {
      localStorage.setItem('tel:user:email', email)
      // Broadcast login event to sync other tabs/components
      window.dispatchEvent(new Event('tel:auth:change'))
    } catch { /* ok */ }
  }

  const handleLogout = () => {
    setUser(null)
    setShowUserMenu(false)
    try {
      localStorage.removeItem('tel:user:email')
      window.dispatchEvent(new Event('tel:auth:change'))
    } catch { /* ok */ }
  }

  // Listen to external auth changes (e.g. if page.tsx changes auth)
  useEffect(() => {
    function onAuthChange() {
      try {
        const savedUser = localStorage.getItem('tel:user:email')
        setUser(savedUser)
      } catch { /* ok */ }
    }
    window.addEventListener('tel:auth:change', onAuthChange)
    return () => window.removeEventListener('tel:auth:change', onAuthChange)
  }, [])

  const BORDER = 'rgba(255,255,255,0.047)'
  const GOLD = '#C9A84C'

  return (
    <>
      <header
        className="flex-shrink-0 px-6 py-4 md:px-10 md:py-5 sticky top-0 z-30 no-print"
        style={{
          background: 'rgba(9,9,11,0.95)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            onClick={handleLogoClick}
            style={{ textDecoration: 'none' }}
          >
            <span
              style={{
                fontWeight: 500,
                fontSize: '15px',
                letterSpacing: '0.2em',
                color: '#ffffff',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              TEL
            </span>
          </Link>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center" style={{ gap: '20px', marginRight: '8px' }}>
              {/* Explorer Dropdown */}
              <div ref={explorerRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowExplorer(v => !v)}
                  style={{
                    fontSize: '12px',
                    color: '#888888',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'color 200ms ease',
                    padding: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#e0e0e0' }}
                  onMouseLeave={e => { if (!showExplorer) e.currentTarget.style.color = '#888888' }}
                >
                  {t('nav.explore', lang)} ▾
                </button>
                {showExplorer && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      left: '-12px',
                      background: '#111113',
                      border: '1px solid rgba(255,255,255,0.071)',
                      borderRadius: '8px',
                      padding: '6px',
                      minWidth: '180px',
                      zIndex: 50,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    }}
                  >
                    {[
                      { href: '/legends', label: t('nav.legends', lang) },
                      { href: '/education', label: t('nav.education', lang) },
                      { href: '/audit', label: t('nav.audit', lang) },
                      { href: '/initiative', label: t('nav.initiative', lang) },
                      { href: '/careers', label: t('nav.careers', lang) },
                    ].map(link => (
                      <Link
                        key={link.href}
                        href={link.href}
                        style={{
                          display: 'block',
                          padding: '8px 12px',
                          fontSize: '12px',
                          color: '#888888',
                          textDecoration: 'none',
                          borderRadius: '6px',
                          transition: 'all 200ms ease',
                        }}
                        onClick={() => setShowExplorer(false)}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.031)'; e.currentTarget.style.color = '#e0e0e0' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#888888' }}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Manifesto */}
              <Link
                href="/manifesto"
                style={{
                  fontSize: '12px',
                  color: '#888888',
                  textDecoration: 'none',
                  transition: 'color 200ms ease',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#e0e0e0' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#888888' }}
              >
                {t('nav.manifesto', lang)}
              </Link>
            </nav>

            {/* Language Selector */}
            <LanguageSelector />

            {/* Session History (My Crossings) Button */}
            <button
              onClick={handleHistoryClick}
              className="tel-ghost-btn"
              style={{
                fontSize: '11px',
                padding: '6px 12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderColor: showingSidebar ? GOLD : BORDER,
                color: showingSidebar ? GOLD : '#888888',
              }}
            >
              {t('nav.history', lang)}{historyCount > 0 ? ` (${historyCount})` : ''}
            </button>

            {/* Auth section */}
            {user ? (
              <div ref={userMenuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowUserMenu(v => !v)}
                  className="tel-ghost-btn"
                  style={{
                    fontSize: '11px',
                    padding: '6px 12px',
                    maxWidth: '160px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    borderColor: showUserMenu ? GOLD : BORDER,
                    color: showUserMenu ? GOLD : '#888888',
                  }}
                >
                  {user.split('@')[0]}
                </button>
                {showUserMenu && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 6px)',
                      background: '#111113',
                      border: '1px solid rgba(255,255,255,0.047)',
                      borderRadius: '8px',
                      padding: '4px',
                      minWidth: '140px',
                      zIndex: 50,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    }}
                  >
                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 12px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#888',
                        fontSize: '12px',
                        borderRadius: '6px',
                        transition: 'background 200ms ease',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.031)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                    >
                      {t('nav.signout', lang)}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="tel-ghost-btn"
                style={{
                  fontSize: '11px',
                  padding: '6px 12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {t('nav.signin', lang)}
              </button>
            )}

            {/* Mobile Hamburger menu */}
            <button
              className="flex md:hidden items-center justify-center w-8 h-8 rounded-full"
              onClick={() => setMobileMenuOpen(v => !v)}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${mobileMenuOpen ? GOLD : BORDER}`,
                color: mobileMenuOpen ? GOLD : '#888888',
                cursor: 'pointer',
                fontSize: '1.1rem',
                transition: 'all 200ms ease',
              }}
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav menu drop-down */}
      {mobileMenuOpen && (
        <div
          className="md:hidden animate-fade-in"
          style={{
            background: '#111113',
            borderBottom: `1px solid ${BORDER}`,
            padding: '16px 24px 24px 24px',
            position: 'absolute',
            top: '64px',
            left: 0,
            right: 0,
            zIndex: 25,
            boxShadow: '0 16px 32px rgba(0,0,0,0.6)',
          }}
        >
          <div className="flex flex-col gap-2">
            {[
              { href: '/', label: pathname === '/' ? t('action.newcrossing', lang) : t('input.tab.cross', lang) },
              { href: '/legends', label: t('nav.legends', lang) },
              { href: '/education', label: t('nav.education', lang) },
              { href: '/audit', label: t('nav.audit', lang) },
              { href: '/initiative', label: t('nav.initiative', lang) },
              { href: '/careers', label: t('nav.careers', lang) },
              { href: '/manifesto', label: t('nav.manifesto', lang) },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'block',
                  padding: '12px 16px',
                  fontSize: '13px',
                  color: pathname === link.href ? GOLD : '#aaaaaa',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  background: pathname === link.href ? 'rgba(201,168,76,0.04)' : 'transparent',
                  borderBottom: `1px solid rgba(255,255,255,0.02)`,
                  fontWeight: pathname === link.href ? 500 : 400,
                }}
              >
                {link.label}
              </Link>
            ))}

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.047)', margin: '12px 0' }} />

            {/* Mobile history sidebar toggle */}
            <button
              onClick={handleHistoryClick}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '12px 16px',
                fontSize: '13px',
                color: '#aaaaaa',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '6px',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              📊 {t('nav.history', lang)}{historyCount > 0 ? ` (${historyCount})` : ''}
            </button>

            {/* Mobile auth link */}
            {user ? (
              <button
                onClick={() => { setMobileMenuOpen(false); handleLogout() }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontSize: '13px',
                  color: '#8B3A3A',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '6px',
                }}
              >
                🚪 {t('nav.signout', lang)} ({user.split('@')[0]})
              </button>
            ) : (
              <button
                onClick={() => { setMobileMenuOpen(false); setShowAuthModal(true) }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontSize: '13px',
                  color: GOLD,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '6px',
                }}
              >
                🔑 {t('nav.signin', lang)}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal onLogin={handleLogin} onClose={() => setShowAuthModal(false)} />
      )}
    </>
  )
}
