// TEL — The Experience Layer
// POST /api/education — Perspectives culturelles pour enseignants

import Anthropic from '@anthropic-ai/sdk'
import { buildEducationPrompt } from '@/lib/prompt'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

// ─── LLM call ─────────────────────────────────────────────────────────────────

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
          temperature: 0.5,
          max_tokens: 6000,
          response_format: { type: 'json_object' },
        }),
        signal: AbortSignal.timeout(90000),
      })
      if (res.ok) {
        const data = await res.json()
        const text: string = data.choices?.[0]?.message?.content ?? ''
        if (text.trim()) return text
      } else {
        console.warn('[education] N2 HTTP', res.status)
      }
    } catch (err) {
      console.warn('[education] N2 indisponible:', err instanceof Error ? err.message : err)
    }
  }

  // N3 — Anthropic Claude (fallback)
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 6000,
        messages: [{ role: 'user', content: prompt }],
      })
      const text = response.content[0].type === 'text' ? response.content[0].text : ''
      if (text.trim()) return text
    } catch (err) {
      console.warn('[education] N3 indisponible:', err instanceof Error ? err.message : err)
    }
  }

  // N1 — Ollama
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434'
  const ollamaModel = process.env.OLLAMA_MODEL || 'mistral'
  const res = await fetch(`${ollamaUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: ollamaModel,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      options: { temperature: 0.5, num_predict: 4000 },
    }),
    signal: AbortSignal.timeout(120000),
  })
  if (!res.ok) throw new Error(`Ollama ${res.status}`)
  const data = await res.json()
  const text: string = data.message?.content ?? ''
  if (!text.trim()) throw new Error('Réponse vide')
  return text
}

function extractJson(raw: string): string {
  const match = raw.match(/\{[\s\S]*\}/)
  return match ? match[0] : raw
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sujet, origines, niveau } = body as {
      sujet: string
      origines: string[]
      niveau: string
    }

    if (!sujet?.trim()) {
      return Response.json({ error: 'sujet manquant' }, { status: 400 })
    }
    if (!Array.isArray(origines) || origines.length < 2) {
      return Response.json({ error: 'Au moins 2 origines requises' }, { status: 400 })
    }
    if (!niveau?.trim()) {
      return Response.json({ error: 'niveau manquant' }, { status: 400 })
    }

    // Limit to 15 origins max to avoid LLM token overflow
    const originesLimitees = origines.slice(0, 15)

    const prompt = buildEducationPrompt(sujet.trim(), originesLimitees, niveau.trim())
    const raw = await callLLM(prompt)
    const data = JSON.parse(extractJson(raw))

    return Response.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[/api/education]', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
