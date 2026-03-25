// TEL — The Experience Layer
// lib/angles-morts.ts
// Analyse des angles morts via LOGOS — spécifique aux sources fournies
// Remplace la détection par mots-clés hardcodés par un appel LLM ciblé

import type {
  ExtractedSource,
  InsightCard,
  AnglesMortsAnalyse,
} from './types'
import { parseLLMJson } from './parse-llm'

// ─── Labels des régions (kept for compat) ─────────────────────────────────────

export function labelRegion(r: string): string {
  const labels: Record<string, string> = {
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

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildAnglesMotsPrompt(sources: ExtractedSource[], insight: InsightCard): string {
  const sourcesDesc = sources
    .map(s => `- "${s.title}" (${s.geographicContext}, type: ${s.type})`)
    .join('\n')

  return `Tu es LOGOS — analyseur d'angles morts pour TEL, The Experience Layer.

SOURCES CROISÉES:
${sourcesDesc}

THÈME: ${insight.theme}
PATTERN: ${insight.revealedPattern.slice(0, 300)}

MISSION: Identifie les angles morts SPÉCIFIQUES à CES sources précises.
Ne génère PAS de réponses génériques (ex: "perspectives des femmes", "perspectives de la jeunesse") SAUF si c'est réellement absent ET pertinent pour CE croisement particulier.
Analyse le contenu réel de CES sources et identifie ce qui manque vraiment dans CE contexte précis.
Si le croisement est déjà équilibré, retourne un score élevé et peu d'angles.

Retourne UNIQUEMENT du JSON valide:
{
  "anglesDetectes": [
    {
      "type": "geographique",
      "description": "Angle mort spécifique à ces sources — 1 phrase concrète ancrée dans leur contenu réel",
      "suggestion": "Quelle source ou perspective comblerait cet angle mort"
    }
  ],
  "scoreEquilibre": 75,
  "perspectivesManquantes": ["Perspective manquante spécifique 1"],
  "questionsEvitees": ["Question spécifique évitée par ces sources"]
}

Règles absolues:
- Maximum 2 anglesDetectes — préfère 0 ou 1 si le croisement est équilibré
- type: "geographique" | "temporel" | "genre_posture" | "silence"
- scoreEquilibre: 0-100 (80+ = très équilibré)
- Sois spécifique aux sources fournies, pas générique`
}

// ─── Lightweight LLM call ─────────────────────────────────────────────────────

async function callLLMForAngles(prompt: string): Promise<string> {
  // N2 — Mistral small (fast + cheap pour une analyse légère)
  if (process.env.MISTRAL_API_KEY) {
    try {
      const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'mistral-small-latest',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 500,
          response_format: { type: 'json_object' },
        }),
        signal: AbortSignal.timeout(18000),
      })
      if (res.ok) {
        const data = await res.json()
        const text: string = data.choices?.[0]?.message?.content ?? ''
        if (text.trim()) return text
      }
    } catch { /* fallback to Ollama */ }
  }

  // N1 — Ollama (local fallback)
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434'
  const ollamaModel = process.env.OLLAMA_MODEL || 'mistral'
  try {
    const res = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        options: { temperature: 0.3, num_predict: 450 },
      }),
      signal: AbortSignal.timeout(25000),
    })
    if (res.ok) {
      const data = await res.json()
      const text: string = data.message?.content ?? ''
      if (text.trim()) return text
    }
  } catch { /* no model available */ }

  throw new Error('Aucun LLM disponible pour les angles morts')
}

// ─── Main function (now async — LLM-based) ────────────────────────────────────

export async function analyserAnglesMorts(
  sources: ExtractedSource[],
  insight: InsightCard
): Promise<AnglesMortsAnalyse> {
  const prompt = buildAnglesMotsPrompt(sources, insight)

  try {
    const raw = await callLLMForAngles(prompt)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = parseLLMJson<any>(raw)

    return {
      anglesDetectes: (data.anglesDetectes || []).slice(0, 2),
      scoreEquilibre: Math.max(0, Math.min(100, Number(data.scoreEquilibre) || 70)),
      perspectivesManquantes: (data.perspectivesManquantes || []).slice(0, 3),
      questionsEvitees: (data.questionsEvitees || []).slice(0, 2),
    }
  } catch {
    // Graceful fallback — neutral result, non-blocking
    return {
      anglesDetectes: [],
      scoreEquilibre: 75,
      perspectivesManquantes: [],
      questionsEvitees: [],
    }
  }
}
