// TEL — The Experience Layer
// /api/enrichir — Niveau 2: analyse de contexte + proposition de sources complémentaires
// Appelé AVANT le croisement pour enrichir les sources de l'utilisateur

import { rechercherEnrichissementFromInputs } from '@/lib/enrichir'
import { checkRateLimit, extractIp } from '@/lib/rate-limit'
import type { EnrichirPayload } from '@/lib/types'

export const maxDuration = 30

export async function POST(request: Request) {
  // ── Rate limiting ─────────────────────────────────────────────────────────
  const ip = extractIp(request)
  const rateResult = checkRateLimit(ip)
  if (!rateResult.allowed) {
    return new Response(JSON.stringify({ error: rateResult.reason }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: EnrichirPayload
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'JSON invalide' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const inputs = (body.inputs || [])
    .map((i: string) => (typeof i === 'string' ? i.trim() : ''))
    .filter((i: string) => i.length > 0)
    .slice(0, 20)

  if (inputs.length === 0) {
    return new Response(JSON.stringify({ error: 'Aucune entrée valide fournie.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── Recherche d'enrichissement ────────────────────────────────────────────
  try {
    const proposal = await rechercherEnrichissementFromInputs(inputs, 5)
    return new Response(JSON.stringify(proposal), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'X-RateLimit-Remaining': String(rateResult.remaining),
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[TEL /api/enrichir]', message)
    // Return empty proposal on error — degraded gracefully
    return new Response(
      JSON.stringify({ sourcesProposees: [], contexte: null, nombreTrouvees: 0, error: message }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
