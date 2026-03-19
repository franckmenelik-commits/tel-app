// TEL — The Experience Layer
// POST /api/discover — Mode Découverte: une source unique → connexion improbable → InsightCard

import Anthropic from '@anthropic-ai/sdk'
import { extractContent, extractFreeText } from '@/lib/extract'
import { buildDiscoveryPrompt } from '@/lib/prompt'
import { detectInputMode } from '@/lib/detect-mode'
import { crossNarratives } from '@/lib/cross'
import type { ExtractedSource } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

// ─── LLM call (JSON output) ───────────────────────────────────────────────────

async function callLLMJson(prompt: string): Promise<string> {
  // N3 — Anthropic Claude
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      })
      const text = response.content[0].type === 'text' ? response.content[0].text : ''
      if (text.trim()) return text
    } catch (err) {
      console.warn('[discover] N3 indisponible:', err instanceof Error ? err.message : err)
    }
  }

  // N2 — Mistral API
  if (process.env.MISTRAL_API_KEY) {
    try {
      const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'mistral-large-latest',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 1024,
          response_format: { type: 'json_object' },
        }),
        signal: AbortSignal.timeout(45000),
      })
      if (res.ok) {
        const data = await res.json()
        const text: string = data.choices?.[0]?.message?.content ?? ''
        if (text.trim()) return text
      }
    } catch (err) {
      console.warn('[discover] N2 indisponible:', err instanceof Error ? err.message : err)
    }
  }

  // N1 — Ollama fallback
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434'
  const ollamaModel = process.env.OLLAMA_MODEL || 'mistral'
  const res = await fetch(`${ollamaUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: ollamaModel,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      options: { temperature: 0.7, num_predict: 800 },
    }),
    signal: AbortSignal.timeout(60000),
  })
  if (!res.ok) throw new Error(`Ollama ${res.status}`)
  const data = await res.json()
  const text: string = data.message?.content ?? ''
  if (!text.trim()) throw new Error('Réponse vide de tous les modèles')
  return text
}

// ─── Extract JSON from LLM response ──────────────────────────────────────────

function extractJson(raw: string): string {
  const match = raw.match(/\{[\s\S]*\}/)
  return match ? match[0] : raw
}

// ─── Build Wikipedia URL ──────────────────────────────────────────────────────

function buildWikiUrl(titre: string, langue: string): string {
  const lang = (langue === 'en' || langue === 'fr') ? langue : 'fr'
  const slug = titre.trim().replace(/ /g, '_')
  return `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(slug)}`
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { source } = body as { source: string }

    if (!source?.trim()) {
      return Response.json({ error: 'source manquante' }, { status: 400 })
    }

    // 1. Extract source content for discovery prompt
    let extracted: ExtractedSource
    const mode = detectInputMode(source.trim())
    if (mode.mode === 'free_text') {
      extracted = extractFreeText(source.trim(), 0)
    } else {
      extracted = await extractContent(source.trim())
    }

    // 2. Ask LOGOS for 3 improbable crossing pistes
    const prompt = buildDiscoveryPrompt(extracted)
    const rawJson = await callLLMJson(prompt)
    const pistesData = JSON.parse(extractJson(rawJson)) as {
      pistes: Array<{ titre_wikipedia: string; langue: string; pourquoi: string; richesse: number }>
    }

    if (!pistesData.pistes?.length) {
      throw new Error('Aucune piste de découverte générée')
    }

    // 3. Take the richest piste
    const sorted = [...pistesData.pistes].sort((a, b) => (b.richesse || 0) - (a.richesse || 0))
    const richest = sorted[0]

    console.log(`[TEL Découverte] Piste choisie: "${richest.titre_wikipedia}" — ${richest.pourquoi}`)

    // 4. Build Wikipedia URL for the richest piste
    const wikiUrl = buildWikiUrl(richest.titre_wikipedia, richest.langue)

    // 5. Run full SOUFFLE crossing: original source × discovered Wikipedia source
    const result = await crossNarratives(
      [source.trim(), wikiUrl],
      'exploration',
      undefined
    )

    return Response.json({
      insight: result.insight,
      discovery: {
        titre: richest.titre_wikipedia,
        url: wikiUrl,
        pourquoi: richest.pourquoi,
        langue: richest.langue,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[/api/discover]', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
