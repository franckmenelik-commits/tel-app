'use client'

import { useLanguage, Lang } from '@/lib/i18n'
import { useEffect, useState } from 'react'

export default function LanguageSelector() {
  const [lang, setLang, langDetected] = useLanguage()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch by waiting for mount
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !langDetected) {
    return <div style={{ width: '60px', height: '24px' }} /> // placeholder
  }

  return (
    <div className="flex items-center gap-1 bg-[#111113] p-1 rounded-full border border-white/5">
      <button
        onClick={() => setLang('en')}
        className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
          lang === 'en'
            ? 'bg-white/10 text-white font-medium'
            : 'text-white/40 hover:text-white/70'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLang('fr')}
        className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
          lang === 'fr'
            ? 'bg-white/10 text-white font-medium'
            : 'text-white/40 hover:text-white/70'
        }`}
      >
        FR
      </button>
    </div>
  )
}
