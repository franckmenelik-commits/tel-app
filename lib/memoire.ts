// TEL — The Experience Layer
// lib/memoire.ts
// Niveau 4 — Mémoire des vécus, résonances entre croisements, pgvector prep

import type {
  SessionCrossing,
  InsightCard,
  Resonance,
  InsightVectoriel,
  SourceDomaine,
  SourceRegion,
} from './types'

// ─── Stop words bilingues ─────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  // FR
  'cette', 'avec', 'pour', 'dans', 'sur', 'mais', 'plus', 'aussi', 'comme',
  'une', 'des', 'les', 'ces', 'ses', 'entre', 'vers', 'leur', 'tout', 'même',
  'très', 'bien', 'être', 'fait', 'plus', 'peut', 'sont', 'ont', 'nous', 'vous',
  'elle', 'ils', 'elles', 'que', 'qui', 'dont', 'cela', 'ceci', 'non', 'oui',
  // EN
  'that', 'with', 'from', 'this', 'they', 'have', 'been', 'were', 'their',
  'there', 'what', 'when', 'where', 'which', 'those', 'these', 'then',
  'than', 'into', 'about', 'would', 'could', 'should', 'will', 'more',
])

// ─── Tokenisation ─────────────────────────────────────────────────────────────

function tokeniser(texte: string): Set<string> {
  return new Set(
    texte
      .toLowerCase()
      .replace(/[.,;:!?()[\]{}''"»«—–\-]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !STOP_WORDS.has(w) && !/^\d+$/.test(w))
  )
}

// ─── Jaccard similarity ───────────────────────────────────────────────────────

function jaccardSimilarite(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let intersectionSize = 0
  let unionSize = a.size
  for (const token of b) {
    if (a.has(token)) {
      intersectionSize++
    } else {
      unionSize++
    }
  }
  return intersectionSize / unionSize
}

function tokeniserInsight(insight: InsightCard): Set<string> {
  return tokeniser([
    insight.theme,
    insight.revealedPattern,
    ...insight.convergenceZones,
    ...insight.divergenceZones,
    insight.theUnspeakable,
    insight.questionNoOneHasAsked,
  ].join(' '))
}

// ─── Détection de résonances ──────────────────────────────────────────────────

export function detecterResonances(
  currentInsight: InsightCard,
  historique: SessionCrossing[]
): Resonance[] {
  if (historique.length === 0) return []

  const tokensActuel = tokeniserInsight(currentInsight)
  const resonances: Resonance[] = []

  for (const h of historique) {
    if (h.id === currentInsight.id) continue
    const tokensHisto = tokeniserInsight(h.card)
    const score = jaccardSimilarite(tokensActuel, tokensHisto)

    if (score > 0.12) {
      // Find common tokens for pattern description
      const motsCommunsArr = [...tokensActuel].filter(t => tokensHisto.has(t))
      const motsCommuns = motsCommunsArr.slice(0, 6)

      const themeCommun = score > 0.30
        ? `Résonance forte entre "${currentInsight.theme}" et "${h.card.theme}"`
        : `Pattern commun : ${motsCommuns.join(', ')}`

      resonances.push({
        croisementId: h.id,
        themeCommun,
        patternCommun: `Ces deux croisements partagent ${motsCommunsArr.length} concepts clés : ${motsCommuns.join(', ')}. Ils explorent une même tension de fond.`,
        scoreSimilarite: Math.round(score * 100),
      })
    }
  }

  return resonances
    .sort((a, b) => b.scoreSimilarite - a.scoreSimilarite)
    .slice(0, 3)
}

// ─── Détection du domaine ─────────────────────────────────────────────────────

function detecterDomaine(insight: InsightCard): SourceDomaine {
  const t = `${insight.theme} ${insight.revealedPattern}`.toLowerCase()
  if (/coloni|empire|guerre|révolution|esclavage|histoire/.test(t)) return 'histoire'
  if (/science|physique|biologie|évolution|quantum|darwin/.test(t)) return 'science'
  if (/social|pauvreté|migration|réfugié|droits/.test(t)) return 'social'
  if (/art|musique|littérature|poésie|cinéma/.test(t)) return 'art'
  if (/politique|gouvernement|démocratie|pouvoir/.test(t)) return 'politique'
  if (/économie|marché|finance|commerce/.test(t)) return 'economie'
  if (/religion|spirituel|foi|divin/.test(t)) return 'religion'
  if (/technologie|numérique|intelligence|algorithme/.test(t)) return 'technologie'
  if (/climat|environnement|écologie|nature/.test(t)) return 'environnement'
  return 'inconnu'
}

function detecterRegions(insight: InsightCard): SourceRegion[] {
  const regions = new Set<SourceRegion>()
  for (const coord of insight.sourceCoordinates) {
    const r = coord.region.toLowerCase()
    if (r.includes('afrique') || r.includes('africa')) regions.add('afrique')
    else if (r.includes('asie') || r.includes('asia') || r.includes('india') || r.includes('inde')) regions.add('asie')
    else if (r.includes('amérique latine') || r.includes('latin')) regions.add('amerique_latine')
    else if (r.includes('moyen') || r.includes('arab')) regions.add('moyen_orient')
    else if (r.includes('europe')) regions.add('europe')
    else if (r.includes('amérique du nord') || r.includes('usa') || r.includes('canada')) regions.add('amerique_nord')
    else regions.add('global')
  }
  return regions.size > 0 ? Array.from(regions) : ['global']
}

// ─── Préparer insight pour pgvector (Phase 2) ─────────────────────────────────

export function preparerInsightVectoriel(
  insight: InsightCard,
  regions?: SourceRegion[]
): InsightVectoriel {
  return {
    id: insight.id,
    sources: insight.sources,
    insight,
    // embedding: [],  // Phase 2 — Supabase pgvector vector(1536)
    domaine: detecterDomaine(insight),
    regions: regions || detecterRegions(insight),
    confidence: insight.globalConfidence,
    timestamp: insight.createdAt instanceof Date ? insight.createdAt : new Date(insight.createdAt),
  }
}

// ─── Fonction de recherche (Phase 2 stub) ────────────────────────────────────

export function searchSimilarInsights(
  _insight: InsightCard,
  _localHistory: SessionCrossing[]
): SessionCrossing[] {
  // Phase 2: Supabase pgvector cosine similarity search
  // For now: returns empty (Jaccard resonances handle local session)
  return []
}

// ─── LocalStorage persistence ─────────────────────────────────────────────────

const STORAGE_KEY = 'tel:history:v3'
const MAX_STORED = 20

export function sauvegarderSession(croisements: SessionCrossing[]): void {
  if (typeof window === 'undefined') return
  try {
    const lightData = croisements.slice(0, MAX_STORED).map(c => ({
      ...c,
      // Truncate heavy text to avoid localStorage quota exceeded
      card: {
        ...c.card,
        revealedPattern: c.card.revealedPattern?.slice(0, 600) ?? '',
        theUnspeakable: c.card.theUnspeakable?.slice(0, 400) ?? '',
        questionNoOneHasAsked: c.card.questionNoOneHasAsked?.slice(0, 300) ?? '',
        convergenceZones: c.card.convergenceZones?.slice(0, 3) ?? [],
        divergenceZones: c.card.divergenceZones?.slice(0, 3) ?? [],
        // Don't persist angles morts (regeneratable)
        anglesMorts: undefined,
      },
    }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lightData))
  } catch {
    // localStorage unavailable or full — fail silently
  }
}

export function chargerSession(): SessionCrossing[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw) as SessionCrossing[]
    // Rehydrate Date objects
    return data.map(c => ({
      ...c,
      card: {
        ...c.card,
        createdAt: new Date(c.card.createdAt),
        convergenceZones: c.card.convergenceZones || [],
        divergenceZones: c.card.divergenceZones || [],
      },
    }))
  } catch {
    return []
  }
}

export function viderSession(): void {
  if (typeof window === 'undefined') return
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
}
