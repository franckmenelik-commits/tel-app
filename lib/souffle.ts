// TEL — The Experience Layer
// SOUFFLE — Système à 3 niveaux de présence IA
//
// "Babel a dispersé les langages. TEL rassemble les vécus."
//
//  NIVEAU 1 — L'ÉCOUTE    : Mistral local via Ollama (gratuit, souverain)
//  NIVEAU 2 — LA TRAVERSÉE: Mistral API (croisements profonds)
//  NIVEAU 3 — LA RÉVÉLATION: Claude Anthropic (l'indicible, cas premium)

import Anthropic from '@anthropic-ai/sdk'
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
} from './prompt'

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const OLLAMA_BASE = process.env.OLLAMA_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'mistral'
const MISTRAL_API_BASE = 'https://api.mistral.ai/v1'
const MISTRAL_MODEL = 'mistral-large-latest'
const CLAUDE_MODEL = 'claude-sonnet-4-6'

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
  return !!process.env.MISTRAL_API_KEY
}

function checkNiveau3(): boolean {
  return !!process.env.ANTHROPIC_API_KEY
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
  const apiKey = process.env.MISTRAL_API_KEY
  if (!apiKey) throw new Error('MISTRAL_API_KEY non configurée')

  const response = await fetch(`${MISTRAL_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MISTRAL_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 4096,
    }),
    signal: AbortSignal.timeout(120000),
  })
  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Mistral API ${response.status}: ${err.slice(0, 300)}`)
  }
  const data = await response.json()
  return data.choices?.[0]?.message?.content ?? ''
}

async function appelNiveau3(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY non configurée')

  const client = new Anthropic({ apiKey })
  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })
  return response.content[0].type === 'text' ? response.content[0].text : ''
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

// ─── EXTRACTION DES MÉTADONNÉES (PHASE 1) ────────────────────────────────────

async function enrichirSource(
  source: ExtractedSource,
  statut: SouffleStatut,
  niveauxUtilises: Set<SouffleNiveau>
): Promise<ExtractedSource> {
  // Don't try to enrich synthetic sources (crossing/free_text modes)
  if (source.inputMode === 'crossing' && source.url.startsWith('crossing://')) {
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

    const meta = JSON.parse(jsonMatch[0])
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
  callbacks?: SouffleCallbacks
): Promise<LogosInsightResponse> {
  // Detect if all sources are from direct crossing mode
  const isDirectCrossing = sources.every(s => s.inputMode === 'crossing')

  let prompt: string
  let ordre: Array<{ niveau: SouffleNiveau; fn: AppelFn }>

  if (isDirectCrossing && sources.length === 2) {
    // Mode D: Direct crossing — use dedicated prompt
    const termA = sources[0].title.replace('Concept : "', '').replace('"', '')
    const termB = sources[1].title.replace('Concept : "', '').replace('"', '')
    prompt = buildDirectCrossingPrompt(termA, termB)
    // For direct crossing, prefer N2 or N3 (more knowledgeable)
    ordre = []
    if (statut.niveau2) ordre.push({ niveau: 2, fn: appelNiveau2 })
    if (statut.niveau3) ordre.push({ niveau: 3, fn: appelNiveau3 })
    if (statut.niveau1) ordre.push({ niveau: 1, fn: appelNiveau1 })
  } else if (decision.niveauPrincipal === 1) {
    prompt = buildNiveau1CrossingPrompt(sources)
    ordre = []
    if (statut.niveau1) ordre.push({ niveau: 1, fn: appelNiveau1 })
    if (statut.niveau2) ordre.push({ niveau: 2, fn: appelNiveau2 })
    if (statut.niveau3) ordre.push({ niveau: 3, fn: appelNiveau3 })
  } else {
    prompt = buildNiveau2CrossingPrompt(sources)
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

  const result = JSON.parse(jsonMatch[0]) as LogosInsightResponse

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
  niveauxUtilises: Set<SouffleNiveau>
): Promise<LogosInsightResponse> {
  if (!process.env.ANTHROPIC_API_KEY) return insight

  try {
    const prompt = buildNiveau3RevelationPrompt(sources, insight)
    const texte = await appelNiveau3(prompt)
    niveauxUtilises.add(3)

    const jsonMatch = texte.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return insight

    const revelation = JSON.parse(jsonMatch[0])
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
  callbacks?: SouffleCallbacks
): Promise<SouffleResult> {
  // 1. Vérifier quels niveaux sont disponibles
  const statut = await getSouffleStatut()
  callbacks?.onStatus?.(statut)

  if (statut.niveauxActifs.length === 0) {
    throw new Error(
      'TEL nécessite au moins un modèle actif.\n' +
      'Configurez Ollama (local) ou MISTRAL_API_KEY ou ANTHROPIC_API_KEY.\n' +
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
    callbacks
  )

  // 5. Phase 3 — Révélation (si contexte premium et Claude disponible)
  if (decision.niveaux.includes(3)) {
    insight = await approfondirRevelation(sourcesEnrichies, insight, niveauxUtilisesSet)
  }

  return {
    insight,
    sourcesEnrichies,
    niveauxUtilises: Array.from(niveauxUtilisesSet).sort() as SouffleNiveau[],
    decision,
  }
}
