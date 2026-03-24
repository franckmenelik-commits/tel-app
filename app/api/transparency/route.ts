// TEL — The Experience Layer
// /api/transparency — Audit algorithmique de textes institutionnels
//
// Reçoit un texte à auditer + des IDs de textes de référence
// Retourne une analyse structurée en 5 sections

import Anthropic from '@anthropic-ai/sdk'
import { buildTransparencyPrompt } from '@/lib/prompt'
import { getReferencesByIds } from '@/lib/reference-texts'

export const maxDuration = 120

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// ─── Types ────────────────────────────────────────────────────────────────────

interface TransparencyPayload {
  textToAudit: string
  referenceIds: string[]       // IDs from REFERENCE_TEXTS
  freeReference?: string       // optional custom reference text
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

  // Validate
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

  // Build references list
  const references = getReferencesByIds(referenceIds).map(r => ({
    label: r.label,
    content: r.content,
  }))

  if (freeReference && freeReference.trim()) {
    references.push({
      label: 'Référence personnalisée',
      content: freeReference.trim(),
    })
  }

  if (references.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Aucune référence valide trouvée' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Check Anthropic key
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY non configuré' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Build prompt
  const prompt = buildTransparencyPrompt(textToAudit, references)

  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Réponse inattendue du modèle')
    }

    // Parse JSON
    const text = content.text.trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Réponse sans JSON valide')
    }

    const report: TransparencyReport = JSON.parse(jsonMatch[0])

    return new Response(JSON.stringify({ success: true, report }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[/api/transparency] Erreur:', err)
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'Erreur lors de l\'analyse',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
