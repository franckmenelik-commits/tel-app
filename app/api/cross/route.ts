// TEL — The Experience Layer
// /api/cross — SSE streaming, rate limiting, security
// Accepte URLs/textes/mots-clés/croisements ×, retourne InsightCard via Server-Sent Events

import { crossNarratives } from '@/lib/cross'
import { checkRateLimit, extractIp, validateUrls } from '@/lib/rate-limit'
import type { CrossPayload, SouffleContexte, SouffleCallbacks, SSEEvent } from '@/lib/types'

// SOUFFLE peut prendre du temps — N1 + N2 + N3 en séquence
export const maxDuration = 120

const CONTEXTES_VALIDES: SouffleContexte[] = [
  'exploration',
  'culturel_profond',
  'institutionnel',
  'langue_en_danger',
  'vecu_traumatique',
]

// ─── SSE helpers ──────────────────────────────────────────────────────────────

const encoder = new TextEncoder()

function sseEncode(event: SSEEvent): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
}

// ─── Main POST handler (SSE streaming) ───────────────────────────────────────

export async function POST(request: Request) {
  // ── Rate limiting ────────────────────────────────────────────────────────
  const ip = extractIp(request)
  const rateResult = checkRateLimit(ip)

  if (!rateResult.allowed) {
    return new Response(
      JSON.stringify({ error: rateResult.reason }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(rateResult.resetAt / 1000)),
          'Retry-After': String(Math.ceil((rateResult.resetAt - Date.now()) / 1000)),
        },
      }
    )
  }

  // ── Parse body ───────────────────────────────────────────────────────────
  let body: CrossPayload
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'JSON invalide' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Support both legacy "urls" and new "inputs" field
  const rawInputs: string[] = body.inputs || body.urls || []

  if (!Array.isArray(rawInputs) || rawInputs.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Champ "inputs" manquant ou vide' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Sanitize inputs
  const inputs = rawInputs
    .map((u) => (typeof u === 'string' ? u.trim() : ''))
    .filter((u) => u.length > 0)
    .slice(0, 20) // Max 20 inputs

  if (inputs.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Aucune entrée valide fournie.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // ── URL security validation ──────────────────────────────────────────────
  // Only validate items that look like URLs
  const urlInputs = inputs.filter(u => u.startsWith('http://') || u.startsWith('https://'))
  if (urlInputs.length > 0) {
    const urlValidation = validateUrls(urlInputs)
    if (!urlValidation.valid) {
      return new Response(
        JSON.stringify({ error: urlValidation.reason }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  // ── Contexte SOUFFLE ─────────────────────────────────────────────────────
  const contexte: SouffleContexte =
    body.contexte && CONTEXTES_VALIDES.includes(body.contexte)
      ? body.contexte
      : 'exploration'

  // ── SSE Stream ───────────────────────────────────────────────────────────
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: SSEEvent) => {
        try {
          controller.enqueue(sseEncode(event))
        } catch {
          // Client disconnected
        }
      }

      // SOUFFLE callbacks → SSE events
      const callbacks: SouffleCallbacks = {
        onStatus: (statut) => {
          send({ type: 'souffle_status', data: statut })
        },
        onExtractionStart: (url, index) => {
          send({ type: 'extraction_start', data: { url, index }, message: `Extraction source ${index + 1}…` })
        },
        onExtractionDone: (url, index, title) => {
          send({ type: 'extraction_done', data: { url, index, title }, message: title })
        },
        onCrossingStart: (niveau) => {
          const labels: Record<number, string> = {
            1: "L'Écoute traverse les vécus…",
            2: 'La Traversée détecte les patterns…',
            3: 'La Révélation nomme l\'indicible…',
          }
          send({
            type: 'crossing_level',
            data: { niveau },
            message: labels[niveau] || 'LOGOS travaille…',
          })
        },
        onSectionReady: (section, value) => {
          send({ type: 'section_ready', data: { section, value } })
        },
      }

      try {
        const result = await crossNarratives(inputs, contexte, callbacks)
        send({ type: 'complete', data: result })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue'
        console.error('[TEL /api/cross]', message)
        send({ type: 'error', message })
      } finally {
        try {
          controller.close()
        } catch {
          // Already closed
        }
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, no-transform',
      // NOTE: Connection: keep-alive is a hop-by-hop header — FORBIDDEN in HTTP/2.
      // Cloudflare → Coolify uses HTTP/2; setting it breaks SSE through the proxy.
      'X-Accel-Buffering': 'no',  // nginx: disable response buffering
      'X-Content-Type-Options': 'nosniff',
      'X-RateLimit-Limit': '10',
      'X-RateLimit-Remaining': String(rateResult.remaining),
      'X-RateLimit-Reset': String(Math.ceil(rateResult.resetAt / 1000)),
    },
  })
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
