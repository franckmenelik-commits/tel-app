// TEL — The Experience Layer
// /api/audit — Audit algorithmique de textes institutionnels
//
// SOUFFLE : Mistral d'abord → Claude fallback → Ollama dernier recours

import Anthropic from '@anthropic-ai/sdk'
import { buildTransparencyPrompt } from '@/lib/prompt'
import { getReferencesByIds } from '@/lib/reference-texts'
import { parseLLMJson } from '@/lib/parse-llm'

export const maxDuration = 120

// ─── Types ────────────────────────────────────────────────────────────────────

interface TransparencyPayload {
  textToAudit: string
  referenceIds: string[]
  freeReference?: string
}

export interface TransparencyReport {
  documentType: string
  whatItSays: string
  whatItHides: string
  whatContradictsReferences: string
  theUnspeakable: string
  questionNoOneHasAsked: string
  riskLevel: 'faible' | 'modéré' | 'élevé' | 'critique'
  riskSummary: string
}

// ─── SOUFFLE LLM call — Mistral → Claude → Ollama ─────────────────────────────

async function callLLM(prompt: string): Promise<string> {
  // N2 — Mistral API (preferred)
  if (process.env.MISTRAL_API_KEY) {
    try {
      console.log('[audit] Essai N2 Mistral...')
      const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'mistral-large-latest',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 4096,
        }),
        signal: AbortSignal.timeout(90000),
      })
      if (res.ok) {
        const data = await res.json()
        const text: string = data.choices?.[0]?.message?.content ?? ''
        if (text.trim()) {
          console.log('[audit] N2 Mistral OK')
          return text
        }
      } else {
        console.warn('[audit] N2 HTTP', res.status, await res.text().then(t => t.slice(0, 200)))
      }
    } catch (err) {
      console.warn('[audit] N2 indisponible:', err instanceof Error ? err.message : err)
    }
  }

  // N3 — Anthropic Claude (fallback)
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      console.log('[audit] Fallback N3 Claude...')
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      })
      const text = response.content[0].type === 'text' ? response.content[0].text : ''
      if (text.trim()) {
        console.log('[audit] N3 Claude OK')
        return text
      }
    } catch (err) {
      console.warn('[audit] N3 indisponible:', err instanceof Error ? err.message : err)
    }
  }

  // N1 — Ollama (dernier recours)
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434'
  const ollamaModel = process.env.OLLAMA_MODEL || 'mistral'
  console.log('[audit] Fallback N1 Ollama...')
  const res = await fetch(`${ollamaUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: ollamaModel,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      options: { temperature: 0.3, num_predict: 3000 },
    }),
    signal: AbortSignal.timeout(120000),
  })
  if (!res.ok) throw new Error(`Ollama ${res.status}: aucun modèle disponible`)
  const data = await res.json()
  const text: string = data.message?.content ?? ''
  if (!text.trim()) throw new Error('Réponse vide de tous les modèles SOUFFLE')
  return text
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  let body: TransparencyPayload
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'JSON invalide' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { textToAudit, referenceIds = [], freeReference } = body

  if (!textToAudit || textToAudit.trim().length < 50) {
    return new Response(
      JSON.stringify({ error: 'Le texte à auditer est trop court (minimum 50 caractères)' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (referenceIds.length === 0 && !freeReference) {
    return new Response(
      JSON.stringify({ error: 'Sélectionnez au moins un texte de référence' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const references = getReferencesByIds(referenceIds).map(r => ({
    label: r.label,
    content: r.content,
  }))

  if (freeReference?.trim()) {
    references.push({ label: 'Référence personnalisée', content: freeReference.trim() })
  }

  if (references.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Aucune référence valide trouvée' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Vérifier qu'au moins un modèle est disponible
  if (!process.env.MISTRAL_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434'
    try {
      const health = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(3000) })
      if (!health.ok) throw new Error()
    } catch {
      return new Response(
        JSON.stringify({ error: 'Aucun modèle disponible — configurez MISTRAL_API_KEY, ANTHROPIC_API_KEY, ou Ollama' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  const prompt = buildTransparencyPrompt(textToAudit, references)

  try {
    const raw = await callLLM(prompt)
    const report = parseLLMJson<TransparencyReport>(raw)

    return new Response(JSON.stringify({ success: true, report }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[/api/audit] Erreur:', err)
    const msg = err instanceof Error ? err.message : 'Erreur lors de l\'analyse'
    const lower = msg.toLowerCase()
    const friendly = lower.includes('credit') || lower.includes('balance') || lower.includes('insufficient')
      ? 'Crédits API épuisés. Réessayez dans quelques minutes.'
      : lower.includes('timeout') || lower.includes('abort') || lower.includes('timed out')
      ? 'L\'analyse a pris trop de temps. Réessayez avec un texte plus court.'
      : msg
    return new Response(
      JSON.stringify({ error: friendly }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
