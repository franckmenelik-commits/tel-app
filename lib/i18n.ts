'use client'

// TEL — The Experience Layer
// lib/i18n.ts — Internationalisation fr / en
// "TEL" ne se traduit jamais. Le contenu généré par LOGOS reste dans
// la langue des sources — seule l'interface change.

import { useState, useEffect } from 'react'

export type Lang = 'fr' | 'en'

export const TRANSLATIONS = {
  // ── Hero ────────────────────────────────────────────────────────────────────
  'hero.line1':      { fr: 'Croisez deux sources.', en: 'Cross two sources.' },
  'hero.line2':      { fr: "Voyez ce qu'elles cachent ensemble.", en: 'See what they hide together.' },
  'hero.desc':       { fr: "Entrez deux sources pour les croiser — ou une seule, et laissez TEL vous surprendre.", en: 'Enter two sources to cross them — or just one, and let TEL surprise you.' },
  'hero.cta':        { fr: 'Essayer maintenant', en: 'Try now' },
  'hero.discovery':  { fr: 'CE QUE TEL A DÉJÀ TROUVÉ', en: 'WHAT TEL HAS ALREADY FOUND' },
  'carousel.title':  { fr: 'CE QUE TEL RÉVÈLE', en: 'WHAT TEL REVEALS' },

  // ── Nav ──────────────────────────────────────────────────────────────────────
  'nav.legends':      { fr: 'Légendes',      en: 'Legends' },
  'nav.education':    { fr: 'Éducation',     en: 'Education' },
  'nav.transparency': { fr: 'Transparence',  en: 'Transparency' },
  'nav.manifesto':    { fr: 'Manifeste',     en: 'Manifesto' },
  'nav.careers':      { fr: 'Métiers',       en: 'Careers' },
  'nav.history':      { fr: 'Mes croisements', en: 'My crossings' },
  'nav.signin':       { fr: 'Se connecter',  en: 'Sign in' },
  'nav.explore':      { fr: 'Explorer',      en: 'Explore' },

  // ── Source input ─────────────────────────────────────────────────────────────
  'input.cross':       { fr: 'Croiser les vécus',            en: 'Cross the experiences' },
  'input.surprise':    { fr: 'Laisser TEL vous surprendre',  en: 'Let TEL surprise you' },
  'input.loading':     { fr: '— LOGOS travaille —',          en: '— LOGOS working —' },
  'input.add':         { fr: '+ ajouter une source',         en: '+ add a source' },
  'input.placeholder1': {
    fr: 'URL, mot-clé, "A × B", ou témoignage direct (>50 mots)…',
    en: 'URL, keyword, "A × B", or direct testimony (>50 words)…',
  },
  'input.placeholder2': {
    fr: 'Deuxième source — le vécu à croiser',
    en: 'Second source — the experience to cross',
  },
  'input.error':       { fr: 'Entrez au moins une source, un mot-clé, ou un croisement (A × B).', en: 'Enter at least one source, keyword, or crossing (A × B).' },
  'input.sources':     { fr: 'source',       en: 'source' },
  'input.waiting':     { fr: 'en attente',   en: 'waiting' },

  // ── Mode Croise-moi ──────────────────────────────────────────────────────────
  'mode.resonate':       { fr: 'Mon vécu',   en: 'My experience' },
  'mode.resonate.label': { fr: 'VÉCU PERSONNEL', en: 'PERSONAL EXPERIENCE' },
  'mode.resonate.placeholder': {
    fr: 'Décrivez votre situation, votre expérience, ou ce que vous traversez…',
    en: 'Describe your situation, your experience, or what you are going through…',
  },
  'mode.resonate.btn':   { fr: 'Trouver des résonances', en: 'Find resonances' },
  'mode.resonate.loading': { fr: 'Recherche de résonances dans le monde…', en: 'Searching for resonances in the world…' },

  // ── Contexte SOUFFLE ─────────────────────────────────────────────────────────
  'contexte.label':     { fr: 'Contexte SOUFFLE', en: 'SOUFFLE context' },
  'contexte.hint':      { fr: 'Le contexte détermine le niveau SOUFFLE activé.', en: 'The context determines the SOUFFLE level activated.' },

  // ── Loading messages ─────────────────────────────────────────────────────────
  'loading.extraction':  { fr: 'Extraction du contenu des sources…',           en: 'Extracting source content…' },
  'loading.cultural':    { fr: 'Détection des contextes culturels…',           en: 'Detecting cultural contexts…' },
  'loading.narrative':   { fr: 'Analyse des arcs narratifs…',                  en: 'Analysing narrative arcs…' },
  'loading.crossing':    { fr: 'Croisement des perspectives…',                  en: 'Crossing perspectives…' },
  'loading.convergences':{ fr: 'Identification des convergences…',              en: 'Identifying convergences…' },
  'loading.divergences': { fr: "Détection des divergences irréductibles…",      en: 'Detecting irreducible divergences…' },
  'loading.blindspots':  { fr: "Recherche d'angles morts géographiques…",       en: 'Searching geographic blind spots…' },
  'loading.pattern':     { fr: 'Formulation du pattern…',                       en: 'Formulating the pattern…' },
  'loading.question':    { fr: 'Génération de la question inexposée…',          en: 'Generating the unexposed question…' },

  // ── Discovery messages ───────────────────────────────────────────────────────
  'discovery.analyse':   { fr: 'Analyse de votre source…',          en: 'Analysing your source…' },
  'discovery.explore':   { fr: 'Exploration de 194 pays…',           en: 'Exploring 194 countries…' },
  'discovery.detect':    { fr: "Détection d'une connexion improbable…", en: 'Detecting an improbable connection…' },
  'discovery.emerge':    { fr: 'Un croisement inattendu émerge…',    en: 'An unexpected crossing emerges…' },

  // ── How it works ─────────────────────────────────────────────────────────────
  'how.title':       { fr: 'Comment ça fonctionne', en: 'How it works' },
  'how.step1.title': { fr: 'Entrez vos sources', en: 'Enter your sources' },
  'how.step1.desc':  { fr: "URL YouTube ou article web, texte libre, mot-clé, ou deux concepts à croiser directement.", en: 'YouTube URL or web article, free text, keyword, or two concepts to cross directly.' },
  'how.step2.title': { fr: 'LOGOS analyse et croise', en: 'LOGOS analyses and crosses' },
  'how.step2.desc':  { fr: "Contextes culturels, arcs narratifs, angles morts géographiques. Trois niveaux d'analyse.", en: 'Cultural contexts, narrative arcs, geographic blind spots. Three levels of analysis.' },
  'how.step3.title': { fr: 'Un insight émerge', en: 'An insight emerges' },
  'how.step3.desc':  { fr: "Convergences, divergences irréductibles — et la question que personne n'avait encore osé formuler.", en: "Convergences, irreducible divergences — and the question no one had yet dared to ask." },

  // ── Card ─────────────────────────────────────────────────────────────────────
  'card.expand':   { fr: 'Voir l\'analyse complète →', en: 'See full analysis →' },
  'card.collapse': { fr: '← Réduire', en: '← Collapse' },

  // ── Actions ──────────────────────────────────────────────────────────────────
  'action.share':       { fr: 'Partager — copier le lien',  en: 'Share — copy link' },
  'action.copied':      { fr: 'Lien copié',                 en: 'Link copied' },
  'action.newcrossing': { fr: 'Nouveau croisement',         en: 'New crossing' },

  // ── Feedback ─────────────────────────────────────────────────────────────────
  'feedback.resonates':  { fr: 'Cet insight résonne',    en: 'This insight resonates' },
  'feedback.inaccurate': { fr: 'Cet insight est inexact', en: 'This insight is inaccurate' },
  'feedback.thanks':     { fr: 'Merci',                  en: 'Thank you' },

  // ── History ──────────────────────────────────────────────────────────────────
  'history.title':  { fr: 'Mes croisements',             en: 'My crossings' },
  'history.empty':  { fr: "Aucun croisement pour l'instant.", en: 'No crossings yet.' },
  'history.back':   { fr: '← Fermer',                    en: '← Close' },
} as const

export type TranslationKey = keyof typeof TRANSLATIONS

export function t(key: TranslationKey, lang: Lang): string {
  return TRANSLATIONS[key]?.[lang] ?? TRANSLATIONS[key]?.fr ?? key
}

// ── React hook ───────────────────────────────────────────────────────────────

export function useLanguage(): [Lang, (l: Lang) => void] {
  const [lang, setLang] = useState<Lang>('fr')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('tel:lang') as Lang | null
      if (stored === 'fr' || stored === 'en') {
        setLang(stored)
        return
      }
      // Auto-detect from browser
      const browser = navigator.language || ''
      setLang(browser.toLowerCase().startsWith('fr') ? 'fr' : 'en')
    } catch { /* localStorage indisponible */ }
  }, [])

  function setAndStore(l: Lang) {
    setLang(l)
    try { localStorage.setItem('tel:lang', l) } catch { /* ok */ }
  }

  return [lang, setAndStore]
}
