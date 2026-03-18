// TEL — The Experience Layer
// Croisement narratif — orchestrateur principal
// Gère les 4 modes d'entrée + délègue au système SOUFFLE

import { extractContent, extractFreeText, extractKeyword, extractDirectCrossing } from './extract'
import { SOUFFLE } from './souffle'
import { detectInputMode } from './detect-mode'
import { autoSearchCrossing } from './auto-search'
import { analyserAnglesMorts } from './angles-morts'
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
  callbacks?: SouffleCallbacks
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

  // ── SOUFFLE: enrichissement + croisement + révélation ────────────────────
  const souffleResult = await SOUFFLE(rawSources, contexte, callbacks)
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
    anglesMorts = analyserAnglesMorts(sourcesEnrichies, insightTemp)
    callbacks?.onAnglesMorts?.(anglesMorts)
  } catch {
    // Angles morts analysis is non-critical — continue without it
  }

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
    anglesMorts,
  }

  return {
    insight,
    processingTime: Date.now() - startTime,
    souffleNiveaux: niveauxUtilises,
    souffleDecision: decision,
    anglesMorts,
  }
}
