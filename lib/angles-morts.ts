// TEL — The Experience Layer
// lib/angles-morts.ts
// Niveau 3 — Détection des angles morts, silences et biais

import type {
  ExtractedSource,
  InsightCard,
  AngleMort,
  AnglesMortsAnalyse,
  SourceRegion,
} from './types'

// ─── Labels des régions ───────────────────────────────────────────────────────

export function labelRegion(r: SourceRegion): string {
  const labels: Record<SourceRegion, string> = {
    afrique: 'Afrique subsaharienne',
    asie: 'Asie du Sud / Sud-Est',
    amerique_latine: 'Amérique latine',
    moyen_orient: 'Moyen-Orient & Monde arabe',
    europe: 'Europe',
    amerique_nord: 'Amérique du Nord',
    oceanie: 'Océanie & Pacifique',
    global: 'Global',
    inconnue: 'Inconnue',
  }
  return labels[r] || r
}

// ─── Détection de région par source ──────────────────────────────────────────

function detecterRegionSource(source: ExtractedSource): SourceRegion {
  const t = `${source.geographicContext} ${source.title} ${source.content.slice(0, 400)}`.toLowerCase()
  if (/afrique|africa|sahel|subsahar|congo|nigeria|ghana|kenya|sénégal|cameroun|mali|rwanda|éthiopie|côte d'ivoire|mozambique|angola/.test(t)) return 'afrique'
  if (/asie|inde|india|chine|china|japon|japan|corée|vietnam|indonesia|bangladesh|pakistan|myanmar|thaïlande/.test(t)) return 'asie'
  if (/amérique latine|brésil|brazil|mexique|mexico|colombia|argentina|cuba|pérou|chile|venezuela/.test(t)) return 'amerique_latine'
  if (/moyen.orient|monde arabe|iran|iraq|syrie|palestine|liban|yémen|arabie|égypte|maroc|tunisie/.test(t)) return 'moyen_orient'
  if (/europe|france|allemagne|royaume.uni|italie|espagne|pologne|suède|belgique|suisse/.test(t)) return 'europe'
  if (/états.unis|usa|canada|north america|amérique du nord/.test(t)) return 'amerique_nord'
  if (/australie|océanie|pacific|polynesia|melanesia/.test(t)) return 'oceanie'
  return 'global'
}

// ─── Analyse géographique ─────────────────────────────────────────────────────

const ALL_REGIONS: SourceRegion[] = [
  'afrique', 'asie', 'amerique_latine', 'moyen_orient',
  'europe', 'amerique_nord', 'oceanie',
]

function analyserGeographie(sources: ExtractedSource[]): AngleMort[] {
  if (sources.length === 0) return []
  const angles: AngleMort[] = []

  const regionCounts = new Map<SourceRegion, number>()
  for (const s of sources) {
    const r = detecterRegionSource(s)
    regionCounts.set(r, (regionCounts.get(r) || 0) + 1)
  }

  const total = sources.length
  regionCounts.forEach((count, region) => {
    const pct = (count / total) * 100
    if (pct > 60 && region !== 'global') {
      const manquantes = ALL_REGIONS.filter(r => r !== region && r !== 'global' && !regionCounts.has(r))
      angles.push({
        type: 'geographique',
        description: `⚠️ Ce croisement est dominé par des sources ${labelRegion(region)} (${Math.round(pct)}% des sources). D'autres perspectives mondiales sont absentes.`,
        regions: manquantes,
        suggestion: manquantes.length > 0
          ? `Perspectives manquantes : ${manquantes.map(labelRegion).join(', ')}.`
          : undefined,
      })
    }
  })

  // Bonus: note if Global South is significantly underrepresented
  const southRegions: SourceRegion[] = ['afrique', 'asie', 'amerique_latine', 'moyen_orient']
  const southCount = southRegions.reduce((acc, r) => acc + (regionCounts.get(r) || 0), 0)
  const southPct = (southCount / total) * 100
  if (southPct === 0 && total >= 2) {
    angles.push({
      type: 'geographique',
      description: `🌍 Aucune source du Sud global (Afrique, Asie, Amérique latine, Monde arabe). Ce croisement reflète principalement des perspectives du Nord.`,
      regions: southRegions,
      suggestion: 'Enrichir avec des sources africaines, asiatiques ou latino-américaines ?',
    })
  }

  return angles
}

// ─── Analyse temporelle ───────────────────────────────────────────────────────

function detecterAnnee(source: ExtractedSource): number | null {
  const yearMatch = `${source.title} ${source.content.slice(0, 600)}`.match(/\b(19|20)\d{2}\b/g)
  if (!yearMatch) return null
  const years = yearMatch.map(Number).filter(y => y >= 1900 && y <= new Date().getFullYear())
  return years.sort((a, b) => b - a)[0] || null
}

function analyserTemporalite(sources: ExtractedSource[]): AngleMort[] {
  const angles: AngleMort[] = []
  const currentYear = new Date().getFullYear()
  const annees = sources.map(detecterAnnee).filter((a): a is number => a !== null)
  if (annees.length < 2) return angles

  const plusRecente = Math.max(...annees)
  const plusAncienne = Math.min(...annees)
  const age = currentYear - plusRecente

  if (age > 20) {
    angles.push({
      type: 'temporel',
      description: `⏳ Ce croisement manque de vécus contemporains. La source la plus récente date de ${plusRecente} (${age} ans).`,
      suggestion: 'Rechercher des témoignages ou analyses post-2020 sur ce sujet ?',
    })
  } else if ((currentYear - plusAncienne) < 5) {
    angles.push({
      type: 'temporel',
      description: `⏳ Ce croisement manque de profondeur historique. Toutes les sources semblent récentes (après ${plusAncienne}).`,
      suggestion: 'Rechercher des sources historiques pour ancrer ce croisement dans le temps long ?',
    })
  }

  return angles
}

// ─── Analyse de posture ───────────────────────────────────────────────────────

function detecterPosture(source: ExtractedSource): 'institutionnelle' | 'populaire' | 'academique' | 'inconnue' {
  if (source.type === 'wikipedia') return 'academique'
  if (source.type === 'youtube' || source.type === 'instagram' || source.type === 'podcast') return 'populaire'
  if (source.type === 'free_text') return 'populaire'
  if (source.type === 'article') {
    const titre = source.title.toLowerCase()
    if (/journal|review|research|study|université|académie|rapport annuel|working paper/.test(titre)) return 'academique'
    if (/ministère|government|official|rapport|agence|onu|unicef|banque mondiale/.test(titre)) return 'institutionnelle'
    return 'inconnue'
  }
  return 'inconnue'
}

function analyserPosture(sources: ExtractedSource[]): AngleMort[] {
  const angles: AngleMort[] = []
  const postures = sources.map(detecterPosture).filter(p => p !== 'inconnue')
  if (postures.length < 2) return angles

  const postureCount = new Map<string, number>()
  for (const p of postures) postureCount.set(p, (postureCount.get(p) || 0) + 1)

  const total = postures.length
  postureCount.forEach((count, posture) => {
    const pct = (count / total) * 100
    if (pct >= 75) {
      const labels: Record<string, string> = {
        academique: 'académiques / encyclopédiques',
        institutionnelle: 'institutionnelles / officielles',
        populaire: 'populaires / témoignages directs',
      }
      const manquantes = ['academique', 'institutionnelle', 'populaire']
        .filter(p => p !== posture)
        .map(p => labels[p])
      angles.push({
        type: 'genre_posture',
        description: `🔍 Toutes les sources sont ${labels[posture]} (${Math.round(pct)}%). Une perspective unique domine.`,
        suggestion: `Les voix ${manquantes.join(' et ')} enrichiraient ce croisement.`,
      })
    }
  })

  return angles
}

// ─── Détection des silences ───────────────────────────────────────────────────

const THEMES_SILENCES = [
  { theme: "l'impact sur les femmes et les filles", keywords: /femm|genre|gender|woman|women|féminin|maternité|patriarcat/ },
  { theme: 'les perspectives de la jeunesse', keywords: /enfant|jeune|youth|child|génération|adolescent/ },
  { theme: 'les communautés rurales et paysannes', keywords: /rural|campagne|village|paysan|agriculteur|fermier/ },
  { theme: 'les populations déplacées et réfugiées', keywords: /réfugié|déplacé|migrant|diaspora|refugee|displaced|exil/ },
  { theme: "la dimension économique pour les plus vulnérables", keywords: /pauvre|poverty|poor|misère|vulnérable|inégalité|chômage/ },
  { theme: 'les langues autochtones et savoirs locaux', keywords: /autochtone|indigenous|native|langue locale|savoir traditionnel|oral/ },
  { theme: 'la mémoire traumatique non-dite', keywords: /trauma|deuil|blessure|honte|silence|indicible|non.dit|stigma/ },
  { theme: 'les liens entre colonialisme et situation actuelle', keywords: /coloni|néocoloni|postcoloni|exploitation|indépendance|dette/ },
]

function detecterSilences(sources: ExtractedSource[], insight: InsightCard): AngleMort[] {
  const texteComplet = [
    ...sources.map(s => s.content.slice(0, 500)),
    insight.revealedPattern,
    ...insight.convergenceZones,
    ...insight.divergenceZones,
    insight.theUnspeakable,
  ].join(' ').toLowerCase()

  const silences = THEMES_SILENCES.filter(t => !t.keywords.test(texteComplet))
  if (silences.length === 0) return []

  const silencesList = silences.slice(0, 4).map(s => s.theme)

  return [{
    type: 'silence',
    description: `🤫 Ces croisements n'évoquent pas : ${silencesList.join(', ')}.`,
    suggestion: 'Le non-dit révèle souvent autant que le dit. Ce silence est peut-être le plus important.',
  }]
}

// ─── Calcul du score d'équilibre ─────────────────────────────────────────────

function calcScoreEquilibre(angles: AngleMort[], sourceCount: number): number {
  let score = 100
  score -= angles.filter(a => a.type === 'geographique').length * 25
  score -= angles.filter(a => a.type === 'temporel').length * 15
  score -= angles.filter(a => a.type === 'genre_posture').length * 15
  score -= angles.filter(a => a.type === 'silence').length * 10
  score += Math.min(20, (sourceCount - 2) * 5) // Bonus for more sources
  return Math.max(0, Math.min(100, score))
}

// ─── Orchestrateur ────────────────────────────────────────────────────────────

export function analyserAnglesMorts(
  sources: ExtractedSource[],
  insight: InsightCard
): AnglesMortsAnalyse {
  const geo = analyserGeographie(sources)
  const temp = analyserTemporalite(sources)
  const posture = analyserPosture(sources)
  const silences = detecterSilences(sources, insight)

  const anglesDetectes = [...geo, ...temp, ...posture, ...silences]

  const perspectivesManquantes = [
    ...geo.flatMap(a => (a.regions || []).map(labelRegion)),
    ...posture.flatMap(a => a.suggestion ? [a.suggestion] : []),
  ].slice(0, 5)

  const questionsEvitees = silences.length > 0
    ? THEMES_SILENCES
        .filter(t => !t.keywords.test(sources.map(s => s.content).join(' ').toLowerCase()))
        .map(t => t.theme)
        .slice(0, 4)
    : []

  return {
    anglesDetectes,
    scoreEquilibre: calcScoreEquilibre(anglesDetectes, sources.length),
    perspectivesManquantes,
    questionsEvitees,
  }
}
