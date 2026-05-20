// TEL — The Experience Layer
// SOUFFLE — Système à 3 niveaux de présence IA
//
// "Babel a dispersé les langages. TEL rassemble les vécus."
//
//  NIVEAU 1 — L'ÉCOUTE    : Ollama (local) ou Gemini 2.5 Flash Free (OpenRouter)
//  NIVEAU 2 — LA TRAVERSÉE: Gemini 2.5 Flash Free (OpenRouter)
//  NIVEAU 3 — LA RÉVÉLATION: Llama 3.3 70B Free (OpenRouter)

import { parseLLMJson } from './parse-llm'
import type {
  ExtractedSource,
  SouffleNiveau,
  SouffleContexte,
  SouffleDecision,
  SouffleStatut,
  SouffleCallbacks,
  LogosInsightResponse,
} from './types'
import {
  buildNiveau1ExtractionPrompt,
  buildNiveau1CrossingPrompt,
  buildNiveau2CrossingPrompt,
  buildNiveau3RevelationPrompt,
  buildDirectCrossingPrompt,
  buildResonancesContextInstruction,
  type ResonanceContext,
} from './prompt'

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const OLLAMA_BASE = process.env.OLLAMA_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'mistral'

const OPENROUTER_API_BASE = 'https://openrouter.ai/api/v1'
const OPENROUTER_MODEL_N2 = 'openrouter/free'
const OPENROUTER_MODEL_N3 = 'openrouter/free'

// ─── DISPONIBILITÉ DES NIVEAUX ────────────────────────────────────────────────

async function checkNiveau1(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return false
    const data = await res.json()
    const models: Array<{ name: string }> = data.models || []
    return models.some((m) => m.name.startsWith(OLLAMA_MODEL))
  } catch {
    return false
  }
}

function checkNiveau2(): boolean {
  return !!process.env.OPENROUTER_API_KEY
}

function checkNiveau3(): boolean {
  return !!process.env.OPENROUTER_API_KEY
}

export async function getSouffleStatut(): Promise<SouffleStatut> {
  const [n1, n2, n3] = await Promise.all([
    checkNiveau1(),
    Promise.resolve(checkNiveau2()),
    Promise.resolve(checkNiveau3()),
  ])
  const niveauxActifs: SouffleNiveau[] = []
  if (n1) niveauxActifs.push(1)
  if (n2) niveauxActifs.push(2)
  if (n3) niveauxActifs.push(3)
  return { niveau1: n1, niveau2: n2, niveau3: n3, niveauxActifs }
}

// ─── LOGIQUE DE ROUTAGE ───────────────────────────────────────────────────────

export function choisirNiveau(
  sourceCount: number,
  contexte: SouffleContexte = 'exploration'
): SouffleDecision {
  if (
    contexte === 'institutionnel' ||
    contexte === 'langue_en_danger' ||
    contexte === 'vecu_traumatique'
  ) {
    return {
      niveaux: [1, 2, 3],
      niveauPrincipal: 3,
      raison: `Contexte "${contexte}" — SOUFFLE complet activé (L'Écoute + La Traversée + La Révélation)`,
    }
  }

  if (sourceCount >= 3 || contexte === 'culturel_profond') {
    return {
      niveaux: [1, 2],
      niveauPrincipal: 2,
      raison:
        sourceCount >= 3
          ? `${sourceCount} sources — La Traversée activée`
          : 'Croisement culturel profond — La Traversée activée',
    }
  }

  return {
    niveaux: [1],
    niveauPrincipal: 1,
    raison: "Exploration — L'Écoute suffit",
  }
}

// ─── APPELS PAR NIVEAU ────────────────────────────────────────────────────────

async function appelNiveau1(prompt: string): Promise<string> {
  const response = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      options: { temperature: 0.3, num_predict: 2048 },
    }),
    signal: AbortSignal.timeout(90000),
  })
  if (!response.ok) {
    throw new Error(`Ollama ${response.status}: ${await response.text().then(t => t.slice(0, 200))}`)
  }
  const data = await response.json()
  return data.message?.content ?? ''
}

async function appelNiveau2(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  
  if (!apiKey) {
    console.info('[SOUFFLE] No OpenRouter API key, falling back to Ollama for Niveau 2')
    return appelNiveau1(prompt)
  }

  const response = await fetch(`${OPENROUTER_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://theexperiencelayer.org',
      'X-Title': 'TEL - The Experience Layer',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL_N2,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    }),
    signal: AbortSignal.timeout(120000),
  })
  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenRouter N2 API ${response.status}: ${err.slice(0, 300)}`)
  }
  const data = await response.json()
  return data.choices?.[0]?.message?.content ?? ''
}

async function appelNiveau3(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  
  if (!apiKey) {
    console.info('[SOUFFLE] No OpenRouter API key, falling back to Niveau 2 for Niveau 3')
    return appelNiveau2(prompt)
  }

  const response = await fetch(`${OPENROUTER_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://theexperiencelayer.org',
      'X-Title': 'TEL - The Experience Layer',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL_N3,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
    }),
    signal: AbortSignal.timeout(120000),
  })
  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenRouter N3 API ${response.status}: ${err.slice(0, 300)}`)
  }
  const data = await response.json()
  return data.choices?.[0]?.message?.content ?? ''
}

// ─── FALLBACK INTELLIGENT ─────────────────────────────────────────────────────

type AppelFn = (prompt: string) => Promise<string>

interface AppelResult {
  texte: string
  niveauUtilise: SouffleNiveau
}

async function appelAvecFallback(
  prompt: string,
  ordrePriorite: Array<{ niveau: SouffleNiveau; fn: AppelFn }>
): Promise<AppelResult> {
  const erreurs: string[] = []

  for (const { niveau, fn } of ordrePriorite) {
    try {
      const texte = await fn(prompt)
      if (texte.trim().length > 20) {
        return { texte, niveauUtilise: niveau }
      }
      erreurs.push(`Niveau ${niveau}: réponse vide`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      erreurs.push(`Niveau ${niveau}: ${msg}`)
      console.warn(`[SOUFFLE] Niveau ${niveau} indisponible — ${msg}`)
    }
  }

  throw new Error(
    `TEL nécessite au moins un modèle actif.\n` +
    `Erreurs: ${erreurs.join(' | ')}\n` +
    `Exécutez "npm run check-souffle" pour diagnostiquer.`
  )
}

// ─── INFÉRENCE GÉOGRAPHIQUE RAPIDE (sans appel LLM) ──────────────────────────

function inferGeographicContext(source: ExtractedSource): { context: string; confidence: number } {
  const url = source.url.toLowerCase()
  const title = (source.title || '').toLowerCase()
  const content = (source.content || '').slice(0, 3000).toLowerCase()
  const all = `${url} ${title} ${content}`

  // ── Step 1: Detect the SOURCE language (Wikipedia prefix, title lang) ──
  let sourceLang = ''
  const wikiLang = url.match(/([a-z]{2,3})\.wikipedia\.org/)
  if (wikiLang) {
    sourceLang = wikiLang[1]
  } else if (/[àâéèêëîïôùûüÿçœæ]/.test(title) || /\b(les|des|une|dans|pour|avec|cette|mais|qui|est|pas)\b/.test(title)) {
    sourceLang = 'fr'
  } else if (/[\u3040-\u309f\u30a0-\u30ff]/.test(title)) {
    sourceLang = 'ja'
  } else if (/[\uac00-\ud7af]/.test(title)) {
    sourceLang = 'ko'
  } else if (/[\u4e00-\u9fff]/.test(title)) {
    sourceLang = 'zh'
  } else if (/[\u0600-\u06ff]/.test(title)) {
    sourceLang = 'ar'
  }

  const langLabels: Record<string, string> = {
    fr: 'français', en: 'anglais', de: 'allemand', es: 'espagnol',
    pt: 'portugais', ar: 'arabe', ja: 'japonais', ko: 'coréen',
    zh: 'mandarin', hi: 'hindi', ru: 'russe', it: 'italien', nl: 'néerlandais',
    sw: 'swahili', vi: 'vietnamien', tr: 'turc', id: 'indonésien',
    he: 'hébreu', fa: 'persan', th: 'thaï', uk: 'ukrainien', pl: 'polonais',
  }

  // ── Step 2: Detect the SUBJECT country/region from content ──
  const countryPatterns: Array<{ pattern: RegExp; country: string; region: string; confidence: number }> = [
    // Afrique
    { pattern: /\b(cameroun|cameroon|douala|yaound[eé])\b/, country: 'Cameroun', region: 'Afrique centrale', confidence: 85 },
    { pattern: /\b(s[eé]n[eé]gal|dakar|wolof)\b/, country: 'Sénégal', region: 'Afrique de l\'Ouest', confidence: 85 },
    { pattern: /\b(nigeria|lagos|igbo|yoruba|nollywood)\b/, country: 'Nigeria', region: 'Afrique de l\'Ouest', confidence: 85 },
    { pattern: /\b(kenya|nairobi)\b/, country: 'Kenya', region: 'Afrique de l\'Est', confidence: 85 },
    { pattern: /\b(south africa|johannesburg|apartheid|mandela)\b/, country: 'Afrique du Sud', region: 'Afrique australe', confidence: 85 },
    { pattern: /\b(congo|kinshasa|brazzaville|rdc)\b/, country: 'Congo', region: 'Afrique centrale', confidence: 85 },
    { pattern: /\b(alg[eé]ri[ea]|alger|constantine|kabylie)\b/, country: 'Algérie', region: 'Afrique du Nord', confidence: 85 },
    { pattern: /\b(maroc|morocco|casablanca|rabat|amazigh)\b/, country: 'Maroc', region: 'Afrique du Nord', confidence: 85 },
    { pattern: /\b(egypt|[eé]gypte|cairo|le caire)\b/, country: 'Égypte', region: 'Afrique du Nord', confidence: 85 },
    { pattern: /\b(ethiopia|[eé]thiopie|addis)\b/, country: 'Éthiopie', region: 'Afrique de l\'Est', confidence: 85 },
    // Amériques
    { pattern: /\b(ha[iï]ti|port-au-prince|cr[eé]ole ha[iï]tien)\b/, country: 'Haïti', region: 'Caraïbes', confidence: 85 },
    { pattern: /\b(brazil|br[eé]sil|rio de janeiro|são paulo|favela)\b/, country: 'Brésil', region: 'Amérique du Sud', confidence: 80 },
    { pattern: /\b(mexico|mexique|ciudad de m[eé]xico)\b/, country: 'Mexique', region: 'Amérique centrale', confidence: 80 },
    { pattern: /\b(colombia|colombie|bogot[aá]|medell[ií]n)\b/, country: 'Colombie', region: 'Amérique du Sud', confidence: 80 },
    { pattern: /\b(argentina|argentine|buenos aires)\b/, country: 'Argentine', region: 'Amérique du Sud', confidence: 80 },
    { pattern: /\b(united states|[eé]tats-unis|america|washington|new york|silicon valley|california|texas)\b/, country: 'États-Unis', region: 'Amérique du Nord', confidence: 75 },
    { pattern: /\b(canada|montr[eé]al|toronto|qu[eé]bec|ottawa)\b/, country: 'Canada', region: 'Amérique du Nord', confidence: 75 },
    // Asie
    { pattern: /\b(vietnam|hanoi|saigon|ho chi minh|pavn)\b/, country: 'Vietnam', region: 'Asie du Sud-Est', confidence: 85 },
    { pattern: /\b(india|inde|mumbai|delhi|hindi|bollywood|gandhi)\b/, country: 'Inde', region: 'Asie du Sud', confidence: 80 },
    { pattern: /\b(japan|japon|tokyo|osaka|kyoto)\b/, country: 'Japon', region: 'Asie de l\'Est', confidence: 80 },
    { pattern: /\b(china|chine|beijing|shanghai|p[eé]kin)\b/, country: 'Chine', region: 'Asie de l\'Est', confidence: 80 },
    { pattern: /\b(cor[eé]e|korea|seoul|pyongyang)\b/, country: 'Corée', region: 'Asie de l\'Est', confidence: 80 },
    { pattern: /\b(indonesia|indon[eé]sie|jakarta)\b/, country: 'Indonésie', region: 'Asie du Sud-Est', confidence: 80 },
    { pattern: /\b(philippines|manille|manila)\b/, country: 'Philippines', region: 'Asie du Sud-Est', confidence: 80 },
    { pattern: /\b(pakistan|islamabad|karachi)\b/, country: 'Pakistan', region: 'Asie du Sud', confidence: 80 },
    { pattern: /\b(bangladesh|dhaka|dacca)\b/, country: 'Bangladesh', region: 'Asie du Sud', confidence: 80 },
    // Moyen-Orient
    { pattern: /\b(palestine|gaza|ramallah|cisjordanie)\b/, country: 'Palestine', region: 'Moyen-Orient', confidence: 85 },
    { pattern: /\b(isra[eë]l|tel aviv|jerusalem|j[eé]rusalem)\b/, country: 'Israël', region: 'Moyen-Orient', confidence: 85 },
    { pattern: /\b(iran|t[eé]h[eé]ran|persian|perse)\b/, country: 'Iran', region: 'Moyen-Orient', confidence: 85 },
    { pattern: /\b(liban|lebanon|beyrouth|beirut)\b/, country: 'Liban', region: 'Moyen-Orient', confidence: 85 },
    { pattern: /\b(iraq|irak|bagdad|baghdad)\b/, country: 'Irak', region: 'Moyen-Orient', confidence: 85 },
    { pattern: /\b(syrie|syria|damas|alep|aleppo)\b/, country: 'Syrie', region: 'Moyen-Orient', confidence: 85 },
    // Europe
    { pattern: /\b(france|paris|lyon|marseille)\b/, country: 'France', region: 'Europe de l\'Ouest', confidence: 75 },
    { pattern: /\b(united kingdom|royaume-uni|london|londres|british|angleterre)\b/, country: 'Royaume-Uni', region: 'Europe du Nord', confidence: 75 },
    { pattern: /\b(deutschland|allemagne|berlin|munich|münchen)\b/, country: 'Allemagne', region: 'Europe centrale', confidence: 75 },
    { pattern: /\b(russie|russia|moscow|moscou|kremlin)\b/, country: 'Russie', region: 'Europe de l\'Est', confidence: 80 },
    { pattern: /\b(turquie|turkey|istanbul|ankara)\b/, country: 'Turquie', region: 'Eurasie', confidence: 80 },
    // Océanie
    { pattern: /\b(australia|australie|sydney|melbourne|aboriginal)\b/, country: 'Australie', region: 'Océanie', confidence: 80 },
  ]

  for (const { pattern, country, region, confidence } of countryPatterns) {
    if (pattern.test(all)) {
      // Build layered context: "Vietnam · Asie du Sud-Est · vietnamien"
      const lang = sourceLang ? langLabels[sourceLang] || sourceLang : ''
      const parts = [country, region]
      if (lang) parts.push(lang)
      return { context: parts.join(' · '), confidence }
    }
  }

  // ── Step 3: Fallback to source language only ──
  if (sourceLang) {
    const langFallbacks: Record<string, { context: string; confidence: number }> = {
      fr: { context: 'Monde francophone · français', confidence: 65 },
      en: { context: 'Monde anglophone · anglais', confidence: 55 },
      de: { context: 'Monde germanophone · allemand', confidence: 65 },
      es: { context: 'Monde hispanophone · espagnol', confidence: 60 },
      pt: { context: 'Lusophonie · portugais', confidence: 60 },
      ar: { context: 'Monde arabe · arabe', confidence: 65 },
      ja: { context: 'Japon · Asie de l\'Est · japonais', confidence: 70 },
      ko: { context: 'Corée · Asie de l\'Est · coréen', confidence: 70 },
      zh: { context: 'Sinosphère · Asie de l\'Est · mandarin', confidence: 65 },
      hi: { context: 'Inde · Asie du Sud · hindi', confidence: 65 },
      ru: { context: 'Russie · Europe de l\'Est · russe', confidence: 65 },
      sw: { context: 'Afrique de l\'Est · swahili', confidence: 70 },
      vi: { context: 'Vietnam · Asie du Sud-Est · vietnamien', confidence: 70 },
      tr: { context: 'Turquie · Eurasie · turc', confidence: 70 },
      id: { context: 'Indonésie · Asie du Sud-Est · indonésien', confidence: 70 },
    }
    if (langFallbacks[sourceLang]) return langFallbacks[sourceLang]
    return { context: `Source en ${langLabels[sourceLang] || sourceLang}`, confidence: 50 }
  }

  // YouTube without detectable language
  if (source.type === 'youtube') {
    return { context: 'Indéterminé · YouTube', confidence: 40 }
  }

  return { context: 'Indéterminé', confidence: 30 }
}

// ─── EXTRACTION DES MÉTADONNÉES (PHASE 1) ────────────────────────────────────

async function enrichirSource(
  source: ExtractedSource,
  statut: SouffleStatut,
  niveauxUtilises: Set<SouffleNiveau>
): Promise<ExtractedSource> {
  // For synthetic crossing sources, skip entirely
  if (source.inputMode === 'crossing' && source.url.startsWith('crossing://')) {
    return source
  }

  // For sources that already have a proper title (Wikipedia, YouTube via oEmbed),
  // skip the expensive LLM N1 call but still infer geographic metadata
  if (source.title && source.title.length > 5 && !source.title.includes('http') && source.geographicContext === 'Pending analysis') {
    const inferred = inferGeographicContext(source)
    return {
      ...source,
      geographicContext: inferred.context,
      geographicConfidence: inferred.confidence,
    }
  }

  // If already enriched, skip
  if (source.geographicContext && source.geographicContext !== 'Pending analysis') {
    return source
  }

  const prompt = buildNiveau1ExtractionPrompt(source.content, source.url, source.type)

  const ordre: Array<{ niveau: SouffleNiveau; fn: AppelFn }> = []
  if (statut.niveau1) ordre.push({ niveau: 1, fn: appelNiveau1 })
  if (statut.niveau2) ordre.push({ niveau: 2, fn: appelNiveau2 })
  if (statut.niveau3) ordre.push({ niveau: 3, fn: appelNiveau3 })

  if (ordre.length === 0) {
    return source
  }

  try {
    const { texte, niveauUtilise } = await appelAvecFallback(prompt, ordre)
    niveauxUtilises.add(niveauUtilise)

    const jsonMatch = texte.match(/\{[\s\S]*?\}/)
    if (!jsonMatch) return source

    const meta = parseLLMJson<{ title?: string; geographicContext?: string; geographicConfidence?: number }>(texte)
    return {
      ...source,
      title: meta.title || source.title,
      geographicContext: meta.geographicContext || source.geographicContext,
      geographicConfidence: meta.geographicConfidence ?? source.geographicConfidence,
    }
  } catch {
    return source
  }
}

// ─── CROISEMENT NARRATIF (PHASE 2) ────────────────────────────────────────────

async function croiserNarratives(
  sources: ExtractedSource[],
  decision: SouffleDecision,
  statut: SouffleStatut,
  niveauxUtilises: Set<SouffleNiveau>,
  callbacks?: SouffleCallbacks,
  lang?: string,
  register?: string,
  resonances?: ResonanceContext[]
): Promise<LogosInsightResponse> {
  // Detect if all sources are from direct crossing mode
  const isDirectCrossing = sources.every(s => s.inputMode === 'crossing')

  let prompt: string
  let ordre: Array<{ niveau: SouffleNiveau; fn: AppelFn }>

  const resonancesCtx = buildResonancesContextInstruction(resonances ?? [])

  if (isDirectCrossing && sources.length === 2) {
    // Mode D: Direct crossing — use dedicated prompt
    const termA = sources[0].title.replace('Concept : "', '').replace('"', '')
    const termB = sources[1].title.replace('Concept : "', '').replace('"', '')
    prompt = buildDirectCrossingPrompt(termA, termB, lang, register) + resonancesCtx
    // For direct crossing, prefer N2 or N3 (more knowledgeable)
    ordre = []
    if (statut.niveau2) ordre.push({ niveau: 2, fn: appelNiveau2 })
    if (statut.niveau3) ordre.push({ niveau: 3, fn: appelNiveau3 })
    if (statut.niveau1) ordre.push({ niveau: 1, fn: appelNiveau1 })
  } else if (decision.niveauPrincipal === 1) {
    prompt = buildNiveau1CrossingPrompt(sources, lang, register) + resonancesCtx
    ordre = []
    if (statut.niveau1) ordre.push({ niveau: 1, fn: appelNiveau1 })
    if (statut.niveau2) ordre.push({ niveau: 2, fn: appelNiveau2 })
    if (statut.niveau3) ordre.push({ niveau: 3, fn: appelNiveau3 })
  } else {
    prompt = buildNiveau2CrossingPrompt(sources, lang, register) + resonancesCtx
    ordre = []
    if (statut.niveau2) ordre.push({ niveau: 2, fn: appelNiveau2 })
    if (statut.niveau3) ordre.push({ niveau: 3, fn: appelNiveau3 })
    if (statut.niveau1) ordre.push({ niveau: 1, fn: appelNiveau1 })
  }

  // Notify callback which level we're using
  if (ordre.length > 0) {
    callbacks?.onCrossingStart?.(ordre[0].niveau)
  }

  const { texte, niveauUtilise } = await appelAvecFallback(prompt, ordre)
  niveauxUtilises.add(niveauUtilise)

  const jsonMatch = texte.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error(
      "LOGOS n'a pas pu produire un croisement structuré. " +
      'Réponse reçue: ' + texte.slice(0, 300)
    )
  }

  const result = parseLLMJson<LogosInsightResponse>(texte)

  // Emit section-ready callbacks for streaming
  if (callbacks?.onSectionReady) {
    const keys = Object.keys(result) as Array<keyof LogosInsightResponse>
    for (const key of keys) {
      callbacks.onSectionReady(key, result[key])
    }
  }

  return result
}

// ─── RÉVÉLATION (PHASE 3 — NIVEAU 3 UNIQUEMENT) ──────────────────────────────

async function approfondirRevelation(
  sources: ExtractedSource[],
  insight: LogosInsightResponse,
  niveauxUtilises: Set<SouffleNiveau>,
  lang?: string,
  register?: string
): Promise<LogosInsightResponse> {
  if (!process.env.OPENROUTER_API_KEY) return insight

  try {
    const prompt = buildNiveau3RevelationPrompt(sources, insight, lang, register)
    const texte = await appelNiveau3(prompt)
    niveauxUtilises.add(3)

    const jsonMatch = texte.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return insight

    const revelation = parseLLMJson<{ theUnspeakable?: string; questionNoOneHasAsked?: string }>(texte)
    return {
      ...insight,
      theUnspeakable: revelation.theUnspeakable || insight.theUnspeakable,
      questionNoOneHasAsked: revelation.questionNoOneHasAsked || insight.questionNoOneHasAsked,
    }
  } catch (err) {
    console.warn('[SOUFFLE] Révélation (N3) non disponible:', err instanceof Error ? err.message : err)
    return insight
  }
}

// ─── SOUFFLE — ORCHESTRATEUR PRINCIPAL ───────────────────────────────────────

export interface SouffleResult {
  insight: LogosInsightResponse
  sourcesEnrichies: ExtractedSource[]
  niveauxUtilises: SouffleNiveau[]
  decision: SouffleDecision
}

export async function SOUFFLE(
  sources: ExtractedSource[],
  contexte: SouffleContexte = 'exploration',
  callbacks?: SouffleCallbacks,
  lang?: string,
  register?: string,
  resonances?: ResonanceContext[]
): Promise<SouffleResult> {
  // 1. Vérifier quels niveaux sont disponibles
  const statut = await getSouffleStatut()
  callbacks?.onStatus?.(statut)

  if (statut.niveauxActifs.length === 0) {
    throw new Error(
      'TEL nécessite au moins un modèle actif.\n' +
      'Configurez Ollama (local) ou OPENROUTER_API_KEY.\n' +
      'Consultez README.md pour les instructions.'
    )
  }

  const niveauxUtilisesSet = new Set<SouffleNiveau>()

  // 2. Décider quels niveaux activer
  const decision = choisirNiveau(sources.length, contexte)

  // 3. Phase 1 — Enrichissement de chaque source (L'Écoute)
  const sourcesEnrichies = await Promise.all(
    sources.map((s) => enrichirSource(s, statut, niveauxUtilisesSet))
  )

  // 4. Phase 2 — Croisement narratif
  let insight = await croiserNarratives(
    sourcesEnrichies,
    decision,
    statut,
    niveauxUtilisesSet,
    callbacks,
    lang,
    register,
    resonances
  )

  // 5. Phase 3 — Révélation (si contexte premium et Claude disponible)
  if (decision.niveaux.includes(3)) {
    insight = await approfondirRevelation(sourcesEnrichies, insight, niveauxUtilisesSet, lang, register)
  }

  return {
    insight,
    sourcesEnrichies,
    niveauxUtilises: Array.from(niveauxUtilisesSet).sort() as SouffleNiveau[],
    decision,
  }
}
