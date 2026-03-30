// TEL — The Experience Layer
// POST /api/debate — Script de confrontation en 2 actes (insight vs contre-insight)

import Anthropic from '@anthropic-ai/sdk'
import { buildDebateScriptPrompt } from '@/lib/prompt'
import type { InsightCard } from '@/lib/types'

export const dynamic = 'force-dynamic'

async function callLLM(prompt: string): Promise<string> {
  // N2 — Mistral API (preferred)
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
          temperature: 0.65,
          max_tokens: 2500,
        }),
        signal: AbortSignal.timeout(90000),
      })
      if (res.ok) {
        const data = await res.json()
        const text: string = data.choices?.[0]?.message?.content ?? ''
        if (text.trim()) return text
      } else {
        console.warn('[debate] N2 HTTP', res.status)
      }
    } catch (err) {
      console.warn('[debate] N2 indisponible:', err instanceof Error ? err.message : err)
    }
  }

  // N3 — Anthropic Claude (fallback)
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2500,
        messages: [{ role: 'user', content: prompt }],
      })
      const text = response.content[0].type === 'text' ? response.content[0].text : ''
      if (text.trim()) return text
    } catch (err) {
      console.warn('[debate] N3 indisponible:', err instanceof Error ? err.message : err)
    }
  }

  // N1 — Ollama (fallback)
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434'
  const ollamaModel = process.env.OLLAMA_MODEL || 'mistral'
  const res = await fetch(`${ollamaUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: ollamaModel,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      options: { temperature: 0.65, num_predict: 2000 },
    }),
    signal: AbortSignal.timeout(120000),
  })
  if (!res.ok) throw new Error(`Ollama ${res.status}: ${await res.text().then(t => t.slice(0, 200))}`)
  const data = await res.json()
  const text: string = data.message?.content ?? ''
  if (!text.trim()) throw new Error('Réponse vide de tous les modèles')
  return text
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const insight = body.insight as InsightCard
    const counter = body.counter as string

    if (!insight?.theme) {
      return Response.json({ error: 'insight manquant ou invalide' }, { status: 400 })
    }
    if (!counter?.trim()) {
      return Response.json({ error: 'counter manquant' }, { status: 400 })
    }

    const prompt = buildDebateScriptPrompt(insight, counter)
    const debate = await callLLM(prompt)

    return Response.json({ debate })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[/api/debate]', message)
    const lower = message.toLowerCase()
    const friendly = lower.includes('credit') || lower.includes('balance') || lower.includes('insufficient')
      ? 'Crédits API épuisés. Réessayez dans quelques minutes.'
      : lower.includes('timeout') || lower.includes('abort')
      ? 'La requête a pris trop de temps. Réessayez.'
      : message
    return Response.json({ error: friendly }, { status: 200 })
  }
}
