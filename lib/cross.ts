// TEL — The Experience Layer
// Croisement narratif — orchestrateur principal
// Gère les 4 modes d'entrée + délègue au système SOUFFLE

import { extractContent, extractFreeText, extractKeyword, extractDirectCrossing, extractBook } from './extract'
import { SOUFFLE } from './souffle'
import { detectInputMode } from './detect-mode'
import { autoSearchCrossing } from './auto-search'
import { analyserAnglesMorts } from './angles-morts'
import { storePublicPattern, findResonances } from './pinecone'
import type {
  InsightCard,
  CrossResult,
  SouffleContexte,
  SouffleCallbacks,
  ExtractedSource,
  AnglesMortsAnalyse,
} from './types'

function generateId(): string {
  return `tel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// ─── Resolve inputs to ExtractedSources ──────────────────────────────────────
// Handles all 4 input modes: URL, free_text, keyword, crossing (×)

async function resolveInputs(
  inputs: string[],
  callbacks?: SouffleCallbacks
): Promise<ExtractedSource[]> {
  const allSources: ExtractedSource[] = []
  let globalIndex = 0

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i]
    const detected = detectInputMode(input)

    callbacks?.onExtractionStart?.(input.slice(0, 80), globalIndex)

    switch (detected.mode) {
      // ── Mode A: URL ────────────────────────────────────────────────────────
      case 'url': {
        const source = await extractContent(input)
        callbacks?.onExtractionDone?.(input, globalIndex, source.title)
        allSources.push(source)
        globalIndex++
        break
      }

      // ── Mode B: Free text ─────────────────────────────────────────────────
      case 'free_text': {
        const source = extractFreeText(input, i)
        callbacks?.onExtractionDone?.(input.slice(0, 40) + '…', globalIndex, source.title)
        allSources.push(source)
        globalIndex++
        break
      }

      // ── Mode C: Keyword → Wikipedia FR+EN ─────────────────────────────────
      case 'keyword': {
        const sources = await extractKeyword(input)
        for (const source of sources) {
          callbacks?.onExtractionDone?.(source.url, globalIndex, source.title)
          allSources.push(source)
          globalIndex++
        }
        break
      }

      // ── Mode Book: Exa thematic portrait ──────────────────────────────────
      case 'book': {
        const source = await extractBook(input)
        callbacks?.onExtractionDone?.(input, globalIndex, source.title)
        allSources.push(source)
        globalIndex++
        break
      }

      // ── Mode D: Direct crossing (A × B) ───────────────────────────────────
      case 'crossing': {
        const { crossingTerms } = detected
        if (!crossingTerms) break

        const [termA, termB] = crossingTerms

        // Try to find Wikipedia sources for both terms
        const { urlsA, urlsB } = await autoSearchCrossing(termA, termB)

        if (urlsA.length > 0) {
          try {
            const source = await extractContent(urlsA[0])
            callbacks?.onExtractionDone?.(urlsA[0], globalIndex, source.title)
            allSources.push({ ...source, inputMode: 'crossing' })
            globalIndex++
          } catch {
            // Fall back to direct crossing knowledge
            const synth = extractDirectCrossing(termA, termB)
            allSources.push(synth[0])
            globalIndex++
          }
        } else {
          const synth = extractDirectCrossing(termA, termB)
          allSources.push(synth[0])
          globalIndex++
        }

        if (urlsB.length > 0) {
          try {
            const source = await extractContent(urlsB[0])
            callbacks?.onExtractionDone?.(urlsB[0], globalIndex, source.title)
            allSources.push({ ...source, inputMode: 'crossing' })
            globalIndex++
          } catch {
            const synth = extractDirectCrossing(termA, termB)
            allSources.push(synth[1])
            globalIndex++
          }
        } else {
          const synth = extractDirectCrossing(termA, termB)
          allSources.push(synth[1])
          globalIndex++
        }
        break
      }
    }
  }

  return allSources
}

// ─── Main crossing function ───────────────────────────────────────────────────

export async function crossNarratives(
  inputs: string[],
  contexte: SouffleContexte = 'exploration',
  callbacks?: SouffleCallbacks,
  lang?: string,
  register?: string
): Promise<CrossResult> {
  if (inputs.length < 1) {
    throw new Error('TEL nécessite au moins 1 source pour produire un croisement.')
  }

  const startTime = Date.now()

  // ── Resolve all inputs to extracted sources ────────────────────────────────
  let rawSources: ExtractedSource[]
  try {
    rawSources = await resolveInputs(inputs, callbacks)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    throw new Error(`Impossible d'extraire les sources : ${message}`)
  }

  // Check we have at least 2 sources after resolution
  if (rawSources.length < 2) {
    // For single keyword, try to get a second source via YouTube or similar
    if (rawSources.length === 1) {
      throw new Error(
        'TEL nécessite au moins 2 sources. ' +
        'Ajoutez une deuxième URL, un autre mot-clé, ou utilisez le format "A × B" pour un croisement direct.'
      )
    }
  }

  // ── Pinecone: query resonances from cultural memory ───────────────────────
  const combinedText = rawSources.map(s => s.title + ' ' + s.content.slice(0, 500)).join(' ')
  const resonances = await findResonances(combinedText, 5)

  // ── SOUFFLE: enrichissement + croisement + révélation ────────────────────
  const souffleResult = await SOUFFLE(rawSources, contexte, callbacks, lang, register, resonances)
  const { insight: parsed, sourcesEnrichies, niveauxUtilises, decision } = souffleResult

  // ── Niveau 3 — Analyse des angles morts ──────────────────────────────────
  let anglesMorts: AnglesMortsAnalyse | undefined
  try {
    const insightTemp: InsightCard = {
      id: 'temp',
      theme: parsed.theme || '',
      sources: [],
      revealedPattern: parsed.revealedPattern || '',
      convergenceZones: parsed.convergenceZones || [],
      divergenceZones: parsed.divergenceZones || [],
      globalConfidence: parsed.globalConfidence ?? 50,
      geographicRepresentativity: parsed.geographicRepresentativity || '',
      theUnspeakable: parsed.theUnspeakable || '',
      questionNoOneHasAsked: parsed.questionNoOneHasAsked || '',
      sourceCoordinates: parsed.sourceCoordinates || [],
      createdAt: new Date(),
    }
    anglesMorts = await analyserAnglesMorts(sourcesEnrichies, insightTemp)
    callbacks?.onAnglesMorts?.(anglesMorts)
  } catch {
    // Angles morts analysis is non-critical — continue without it
  }

  // ── Collect public voices from YouTube sources ────────────────────────────
  const allPublicVoices = sourcesEnrichies
    .filter(s => s.publicVoices && s.publicVoices.length > 0)
    .flatMap(s => s.publicVoices!)

  // ── Assemble InsightCard ─────────────────────────────────────────────────
  const insight: InsightCard = {
    id: generateId(),
    theme: parsed.theme || 'Croisement sans thème',
    sources: sourcesEnrichies.map((s) => ({
      url: s.url,
      type: s.type,
      title: s.title,
      geographicContext: s.geographicContext,
      geographicConfidence: s.geographicConfidence,
    })),
    revealedPattern: parsed.revealedPattern || '',
    convergenceZones: parsed.convergenceZones || [],
    divergenceZones: parsed.divergenceZones || [],
    globalConfidence: Math.min(100, Math.max(0, parsed.globalConfidence ?? 50)),
    geographicRepresentativity: parsed.geographicRepresentativity || '',
    theUnspeakable: parsed.theUnspeakable || '',
    questionNoOneHasAsked: parsed.questionNoOneHasAsked || '',
    sourceCoordinates: parsed.sourceCoordinates || [],
    createdAt: new Date(),
    irreconcilable: parsed.irreconcilable,
    anglesMorts,
    actionables: parsed.actionables,
    publicVoices: parsed.publicVoices && parsed.publicVoices.length > 0
      ? parsed.publicVoices
      : allPublicVoices.length > 0 ? allPublicVoices.slice(0, 2) : undefined,
    resonanceCount: resonances.length > 0 ? resonances.length : undefined,
  }

  // ── Store public pattern in Pinecone (skip personal/vecu contexts) ────────
  if (contexte !== 'vecu_traumatique') {
    const patternId = insight.id
    const domains = [...new Set(sourcesEnrichies.map(s => s.type))]
    const culturalContexts = sourcesEnrichies
      .map(s => s.geographicContext)
      .filter(c => c && c !== 'Pending analysis')

    storePublicPattern({
      patternId,
      sources: insight.sources.map(s => ({ title: s.title, type: s.type, url: s.url })),
      patternText: insight.revealedPattern,
      question: insight.questionNoOneHasAsked,
      convergences: insight.convergenceZones,
      divergences: insight.divergenceZones,
      missingPerspectives: anglesMorts?.perspectivesManquantes ?? [],
      domains,
      culturalContexts,
      confidence: insight.globalConfidence,
      language: lang ?? 'fr',
      createdAt: insight.createdAt.toISOString(),
    }).catch(err => console.warn('[TEL] Pinecone store error:', err))
  }

  return {
    insight,
    processingTime: Date.now() - startTime,
    souffleNiveaux: niveauxUtilises,
    souffleDecision: decision,
    anglesMorts,
  }
}
