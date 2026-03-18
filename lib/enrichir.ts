// TEL — The Experience Layer
// lib/enrichir.ts
// Niveau 2 — Enrichissement automatique des sources
// "LOGOS a trouvé X sources qui enrichiraient ce croisement"

import type {
  ExtractedSource,
  ContexteAnalyse,
  SourceProposee,
  EnrichissementProposal,
  SourceDomaine,
  SourceRegion,
} from './types'

const USER_AGENT = 'TEL/2.0 (theexperiencelayer.org; contact@theexperiencelayer.org)'

// ── Wikipedia 24h cache ───────────────────────────────────────────────────────
const wikiCache = new Map<string, { data: unknown; ts: number }>()
const CACHE_TTL = 24 * 60 * 60 * 1000

function fromCache<T>(key: string): T | null {
  const entry = wikiCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > CACHE_TTL) { wikiCache.delete(key); return null }
  return entry.data as T
}
function toCache(key: string, data: unknown) {
  wikiCache.set(key, { data, ts: Date.now() })
}

// ─── Détection de langue ──────────────────────────────────────────────────────

function detecterLangue(texte: string): string {
  const t = texte.slice(0, 2000)
  const ar = (t.match(/[\u0600-\u06FF]/g) || []).length
  const zh = (t.match(/[\u4E00-\u9FFF]/g) || []).length
  const fr = (t.match(/\b(le|la|les|de|du|des|un|une|est|avec|pour|dans|sur|qui|que|par|son|sa|ses|au|aux|ce|cette|aussi|mais|donc|leur|dont|plus)\b/gi) || []).length
  const en = (t.match(/\b(the|a|an|is|are|was|were|of|in|to|and|that|with|for|on|by|from|have|has|been|they|their|this|which)\b/gi) || []).length
  const sw = (t.match(/\b(na|ya|wa|za|kwa|ni|katika|kuwa|au|pia|bila)\b/gi) || []).length

  if (ar > 15) return 'ar'
  if (zh > 10) return 'zh'
  if (sw > 8) return 'sw'
  if (fr > en * 1.3) return 'fr'
  return 'en'
}

// ─── Détection de domaine ─────────────────────────────────────────────────────

function detecterDomaine(texte: string): SourceDomaine {
  const t = texte.toLowerCase().slice(0, 3000)
  if (/coloni|empire|guerre|révolution|esclavage|slavery|colonialism|war|histoire|century|revolt/.test(t)) return 'histoire'
  if (/science|physique|biologie|chimie|quantum|darwin|evolution|genome|cerveau|neuroscience/.test(t)) return 'science'
  if (/pauvreté|migration|réfugié|droits|social|community|poverty|refugee|inégalité|inequality/.test(t)) return 'social'
  if (/art|musique|peinture|film|littérature|poésie|music|literature|cinéma|culture/.test(t)) return 'art'
  if (/politique|gouvernement|démocratie|élection|pouvoir|politics|government|state/.test(t)) return 'politique'
  if (/économie|marché|finance|monnaie|commerce|economy|market|trade/.test(t)) return 'economie'
  if (/religion|islam|christianisme|bouddhisme|hindouisme|spirituel|foi|theology/.test(t)) return 'religion'
  if (/technologie|numérique|intelligence artificielle|algorithme|digital|technology|software/.test(t)) return 'technologie'
  if (/climat|environnement|écologie|nature|déforestation|climate|environment|biodiversité/.test(t)) return 'environnement'
  return 'inconnu'
}

// ─── Détection de région ──────────────────────────────────────────────────────

export function detecterRegion(texte: string): SourceRegion {
  const t = texte.toLowerCase().slice(0, 2000)
  if (/afrique|africa|sahel|subsahar|congo|nigeria|ghana|kenya|sénégal|cameroun|mali|rwanda|éthiopie|ethiopia|côte d'ivoire|tanzanie|mozambique|angola/.test(t)) return 'afrique'
  if (/asie|asia|inde|india|chine|china|japon|japan|corée|vietnam|indonesia|bangladesh|pakistan|myanmar|thaïlande|cambodge/.test(t)) return 'asie'
  if (/amérique latine|latin america|brésil|brazil|mexique|mexico|colombia|argentina|cuba|pérou|chile|venezuela|bolivie/.test(t)) return 'amerique_latine'
  if (/moyen.orient|middle east|monde arabe|iran|iraq|syrie|palestine|liban|yémen|arabie|égypte|egypt|maroc|tunisie/.test(t)) return 'moyen_orient'
  if (/europe|france|allemagne|royaume.uni|italie|espagne|pologne|suède|pays.bas|belgique|suisse/.test(t)) return 'europe'
  if (/états.unis|usa|canada|north america|amérique du nord|united states|american/.test(t)) return 'amerique_nord'
  if (/australie|australia|nouvelle.zélande|océanie|pacific|melanesia|polynesia/.test(t)) return 'oceanie'
  return 'global'
}

// ─── Extraction d'entités ─────────────────────────────────────────────────────

function extraireEntites(textes: string[]): string[] {
  const texte = textes.join(' ').slice(0, 5000)
  // Proper nouns: capitalize sequences 1-3 words
  const matches = texte.match(
    /\b[A-ZÀÂÄÉÈÊËÎÏÔÙÛÜÇŒÆ][a-zàâäéèêëîïôùûüçœæ]+(?:\s+(?:de\s+)?[A-ZÀÂÄÉÈÊËÎÏÔÙÛÜÇŒÆ][a-zàâäéèêëîïôùûüçœæ]+){0,2}\b/g
  ) || []
  const STOP = new Set(['Le', 'La', 'Les', 'Du', 'Des', 'Un', 'Une', 'The', 'This', 'That', 'Ces', 'Ses', 'Mon', 'Sur', 'Pour', 'Dans', 'Par', 'En'])
  const freq = new Map<string, number>()
  for (const m of matches) {
    if (m.length < 3 || STOP.has(m)) continue
    freq.set(m, (freq.get(m) || 0) + 1)
  }
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([e]) => e)
}

// ─── Analyse de contexte ──────────────────────────────────────────────────────

export function analyserContexte(sources: ExtractedSource[]): ContexteAnalyse {
  const tousTextes = sources.map(s => `${s.title} ${s.content.slice(0, 1000)}`)
  const texteComplet = tousTextes.join('\n\n')

  const regions = sources.map(s => detecterRegion(`${s.geographicContext} ${s.title} ${s.content.slice(0, 500)}`))
  const regionPrincipale = regions.sort((a, b) =>
    regions.filter(r => r === b).length - regions.filter(r => r === a).length
  )[0] || 'global'

  // Geographic bias: % of sources from dominant region
  const regionCounts = new Map<string, number>()
  for (const r of regions) regionCounts.set(r, (regionCounts.get(r) || 0) + 1)
  const maxCount = Math.max(...Array.from(regionCounts.values()))
  const biaisGeographique = Math.round((maxCount / Math.max(1, regions.length)) * 100)

  return {
    entitesCles: extraireEntites(tousTextes),
    langueDetectee: detecterLangue(texteComplet),
    domaine: detecterDomaine(texteComplet),
    region: regionPrincipale,
    biaisGeographique,
  }
}

// Variant for raw inputs (before extraction)
export function analyserContexteInputs(inputs: string[]): ContexteAnalyse {
  const texteComplet = inputs.join('\n')
  return {
    entitesCles: extraireEntites(inputs),
    langueDetectee: detecterLangue(texteComplet),
    domaine: detecterDomaine(texteComplet),
    region: detecterRegion(texteComplet),
    biaisGeographique: 50, // Unknown without full extraction
  }
}

// ─── Recherche Wikipedia ──────────────────────────────────────────────────────

async function fetchWikipediaSummary(
  concept: string,
  lang: string,
  region: SourceRegion
): Promise<SourceProposee | null> {
  const cacheKey = `wiki:${lang}:${concept.toLowerCase()}`
  const cached = fromCache<SourceProposee>(cacheKey)
  if (cached) return cached

  try {
    const domain = `${lang}.wikipedia.org`
    // Step 1: Search
    const searchUrl = `https://${domain}/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(concept)}&srlimit=1&format=json&origin=*`
    const searchRes = await fetch(searchUrl, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(6000),
    })
    if (!searchRes.ok) return null

    const searchData = await searchRes.json()
    const topResult = searchData?.query?.search?.[0]
    if (!topResult) return null

    const pageTitle = topResult.title
    // Step 2: Summary
    const summaryUrl = `https://${domain}/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`
    const summaryRes = await fetch(summaryUrl, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(6000),
    })
    if (!summaryRes.ok) return null

    const summary = await summaryRes.json()
    const extract = (summary.extract || '').slice(0, 350)
    if (!extract || extract.length < 50) return null

    const url = `https://${domain}/wiki/${encodeURIComponent(pageTitle.replace(/ /g, '_'))}`

    const GLOBAL_SOUTH_LANGS = new Set(['sw', 'ha', 'yo', 'am', 'wo', 'ar', 'hi', 'bn', 'ur', 'zu', 'ig'])

    const result: SourceProposee = {
      url,
      titre: `Wikipedia ${lang.toUpperCase()} — ${pageTitle}`,
      type: 'wikipedia',
      langue: lang,
      pertinence: 75,
      raison: `Article Wikipedia en ${lang === 'fr' ? 'français' : lang === 'en' ? 'anglais' : `langue ${lang}`} sur "${concept}"`,
      region,
      extrait: extract,
      isSudGlobal: GLOBAL_SOUTH_LANGS.has(lang),
    }

    toCache(cacheKey, result)
    return result
  } catch {
    return null
  }
}

// ─── Semantic Scholar ─────────────────────────────────────────────────────────

async function fetchSemanticScholar(concept: string): Promise<SourceProposee | null> {
  try {
    const apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY
    const headers: Record<string, string> = {
      'User-Agent': USER_AGENT,
      ...(apiKey ? { 'x-api-key': apiKey } : {}),
    }
    const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(concept)}&fields=title,abstract,openAccessPdf,citationCount,year&limit=5`
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null

    const data = await res.json()
    type ScholarPaper = { title?: string; abstract?: string; openAccessPdf?: { url: string }; citationCount?: number; year?: number }
    const papers: ScholarPaper[] = (data.data || []).filter((p: ScholarPaper) => p.openAccessPdf && p.abstract && (p.abstract.length > 100))
    if (papers.length === 0) return null

    const best = papers.sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0))[0]
    const pdfUrl = best.openAccessPdf?.url
    if (!pdfUrl) return null

    return {
      url: pdfUrl,
      titre: `📄 Semantic Scholar — ${best.title}`,
      type: 'article',
      langue: 'en',
      pertinence: 82,
      raison: `Article académique open-access le plus cité sur "${concept}" (${best.citationCount || 0} citations${best.year ? `, ${best.year}` : ''})`,
      region: 'global',
      extrait: (best.abstract || '').slice(0, 350),
      isSudGlobal: false,
    }
  } catch {
    return null
  }
}

// ─── Priorité Global South ────────────────────────────────────────────────────

const GLOBAL_SOUTH_REGIONS: SourceRegion[] = ['afrique', 'asie', 'amerique_latine', 'moyen_orient']

function prioritiserSudGlobal(sources: SourceProposee[], contextRegion: SourceRegion): SourceProposee[] {
  if (!GLOBAL_SOUTH_REGIONS.includes(contextRegion)) return sources
  return sources
    .map(s => ({ ...s, pertinence: s.isSudGlobal ? Math.min(100, s.pertinence + 15) : s.pertinence }))
    .sort((a, b) => b.pertinence - a.pertinence)
}

// ─── Langues complémentaires selon région ────────────────────────────────────

function languesPourRegion(region: SourceRegion, langueDetectee: string): string[] {
  const base = new Set(['en', 'fr', langueDetectee])
  if (region === 'afrique') { base.add('sw'); base.add('ar') }
  if (region === 'moyen_orient') base.add('ar')
  if (region === 'asie') base.add('zh')
  if (region === 'amerique_latine') base.add('es')
  if (region === 'europe') base.add('de')
  return Array.from(base).slice(0, 4)
}

// ─── Recherche depuis inputs bruts (pré-extraction) ─────────────────────────

export async function rechercherEnrichissementFromInputs(
  inputs: string[],
  maxSources = 5
): Promise<EnrichissementProposal> {
  const contexte = analyserContexteInputs(inputs)
  return rechercherDepuisContexte(contexte, new Set(inputs.filter(i => i.startsWith('http'))), maxSources)
}

// ─── Recherche depuis sources extraites ──────────────────────────────────────

export async function rechercherEnrichissement(
  sources: ExtractedSource[],
  maxSources = 5
): Promise<EnrichissementProposal> {
  const contexte = analyserContexte(sources)
  return rechercherDepuisContexte(contexte, new Set(sources.map(s => s.url)), maxSources)
}

async function rechercherDepuisContexte(
  contexte: ContexteAnalyse,
  urlsExistantes: Set<string>,
  maxSources: number
): Promise<EnrichissementProposal> {
  const { entitesCles, langueDetectee, region } = contexte
  const langues = languesPourRegion(region, langueDetectee)
  const proposees: SourceProposee[] = []
  let wikiCount = 0

  // Wikipedia — top 3 entities × top 3 languages (max 3 fetches)
  for (const entite of entitesCles.slice(0, 3)) {
    if (wikiCount >= 3) break
    for (const lang of langues.slice(0, 2)) {
      if (wikiCount >= 3) break
      const wiki = await fetchWikipediaSummary(entite, lang, region)
      if (!wiki) continue
      if (urlsExistantes.has(wiki.url)) continue
      const isDuplicate = proposees.some(p =>
        p.url === wiki.url || (p.titre.includes(entite) && p.langue === lang)
      )
      if (isDuplicate) continue
      proposees.push(wiki)
      urlsExistantes.add(wiki.url)
      wikiCount++
    }
  }

  // Semantic Scholar — first entity
  if (entitesCles.length > 0 && proposees.length < maxSources) {
    const scholar = await fetchSemanticScholar(entitesCles[0])
    if (scholar && !urlsExistantes.has(scholar.url)) {
      proposees.push(scholar)
    }
  }

  const prioritized = prioritiserSudGlobal(proposees, region).slice(0, maxSources)

  return {
    sourcesProposees: prioritized,
    contexte,
    nombreTrouvees: prioritized.length,
  }
}
