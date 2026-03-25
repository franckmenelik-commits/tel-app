// TEL — The Experience Layer
// /api/resonate — Mode Croise-moi : résonances de vécu personnel
//
// SOUFFLE : Mistral d'abord → Claude fallback → Ollama

import Anthropic from '@anthropic-ai/sdk'
import { buildResonancePrompt } from '@/lib/prompt'
import { parseLLMJson } from '@/lib/parse-llm'

export const maxDuration = 120

export interface ResonanceResult {
  structureProfonde: string
  resonances: {
    titre: string
    contexte: string
    lienStructurel: string
    difference: string
  }[]
  revelationCroisee: string
  questionInexposee: string
  indicible: string
}

// ─── SOUFFLE LLM ──────────────────────────────────────────────────────────────

async function callLLM(prompt: string): Promise<string> {
  if (process.env.MISTRAL_API_KEY) {
    try {
      console.log('[resonate] N2 Mistral…')
      const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.MISTRAL_API_KEY}` },
        body: JSON.stringify({
          model: 'mistral-large-latest',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.4,
          max_tokens: 3000,
        }),
        signal: AbortSignal.timeout(90000),
      })
      if (res.ok) {
        const data = await res.json()
        const text: string = data.choices?.[0]?.message?.content ?? ''
        if (text.trim()) { console.log('[resonate] N2 OK'); return text }
      }
    } catch (err) {
      console.warn('[resonate] N2:', err instanceof Error ? err.message : err)
    }
  }

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      console.log('[resonate] N3 Claude…')
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }],
      })
      const text = response.content[0].type === 'text' ? response.content[0].text : ''
      if (text.trim()) { console.log('[resonate] N3 OK'); return text }
    } catch (err) {
      console.warn('[resonate] N3:', err instanceof Error ? err.message : err)
    }
  }

  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434'
  const res = await fetch(`${ollamaUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: process.env.OLLAMA_MODEL || 'mistral', messages: [{ role: 'user', content: prompt }], stream: false, options: { temperature: 0.4, num_predict: 2500 } }),
    signal: AbortSignal.timeout(120000),
  })
  if (!res.ok) throw new Error(`Ollama ${res.status}`)
  const data = await res.json()
  const text: string = data.message?.content ?? ''
  if (!text.trim()) throw new Error('Réponse vide')
  return text
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  let body: { vecu: string }
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'JSON invalide' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  const { vecu } = body
  if (!vecu || vecu.trim().length < 30) {
    return new Response(
      JSON.stringify({ error: 'Décrivez votre vécu en au moins 30 caractères.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    const prompt = buildResonancePrompt(vecu)
    const raw = await callLLM(prompt)
    const result = parseLLMJson<ResonanceResult>(raw)

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[/api/resonate]', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Erreur lors de la recherche de résonances' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
