// TEL — The Experience Layer
// lib/pinecone.ts
// Pinecone vector database — public pattern storage + resonance search
//
// Architecture : "la sagesse collective (publique) enrichit le vécu individuel (privé, sacré).
//  TEL apprend du monde pour mieux servir l'individu. Sans jamais apprendre de l'individu."
//
// REQUIRES env vars:
//   PINECONE_API_KEY  — Pinecone API key
//   PINECONE_HOST     — Full index host URL (e.g. https://tel-wisdom-xxxx.svc.pinecone.io)
//   MISTRAL_API_KEY   — used for mistral-embed embeddings

export interface PatternVector {
  patternId: string
  sources: Array<{ title: string; type: string; url: string }>
  patternText: string
  question: string
  convergences: string[]
  divergences: string[]
  missingPerspectives: string[]
  domains: string[]
  culturalContexts: string[]
  confidence: number
  language: string
  createdAt: string
}

export interface FoundResonance {
  id: string
  score: number
  question: string
  patternText: string
  sourcesLabel: string
}

// ─── Embedding via Mistral ────────────────────────────────────────────────────

async function getEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.MISTRAL_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch('https://api.mistral.ai/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-embed',
        input: [text.slice(0, 4000)],
      }),
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      console.warn(`[Pinecone] Embedding échoué: ${res.status}`)
      return null
    }

    const data = await res.json()
    return (data.data?.[0]?.embedding as number[]) ?? null
  } catch (err) {
    console.warn('[Pinecone] Erreur embedding:', err instanceof Error ? err.message : err)
    return null
  }
}

// ─── Pinecone REST helpers ────────────────────────────────────────────────────

function getPineconeConfig(): { apiKey: string; host: string } | null {
  const apiKey = process.env.PINECONE_API_KEY
  const host = process.env.PINECONE_HOST
  if (!apiKey || !host) return null
  return { apiKey, host }
}

// ─── Store a public pattern ───────────────────────────────────────────────────

export async function storePublicPattern(pattern: PatternVector): Promise<boolean> {
  const config = getPineconeConfig()
  if (!config) {
    console.log('[Pinecone] Non configuré (PINECONE_API_KEY ou PINECONE_HOST manquant) — pattern non stocké')
    return false
  }

  const embedding = await getEmbedding(pattern.patternText)
  if (!embedding) {
    console.warn('[Pinecone] Embedding indisponible — pattern non stocké')
    return false
  }

  try {
    const res = await fetch(`${config.host}/vectors/upsert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': config.apiKey,
      },
      body: JSON.stringify({
        vectors: [
          {
            id: pattern.patternId,
            values: embedding,
            metadata: {
              sources: JSON.stringify(pattern.sources),
              question: pattern.question.slice(0, 500),
              patternText: pattern.patternText.slice(0, 1000),
              convergences: pattern.convergences.join(' | ').slice(0, 1000),
              divergences: pattern.divergences.join(' | ').slice(0, 1000),
              missingPerspectives: pattern.missingPerspectives.join(' | ').slice(0, 500),
              domains: pattern.domains.join(', '),
              culturalContexts: pattern.culturalContexts.join(', '),
              confidence: pattern.confidence,
              language: pattern.language,
              createdAt: pattern.createdAt,
            },
          },
        ],
      }),
      signal: AbortSignal.timeout(15000),
    })

    if (res.ok) {
      console.log(`[Pinecone] ✓ Pattern stocké : ${pattern.patternId}`)
    } else {
      const err = await res.text()
      console.warn(`[Pinecone] Upsert échoué ${res.status}: ${err.slice(0, 200)}`)
    }

    return res.ok
  } catch (err) {
    console.warn('[Pinecone] Erreur upsert:', err instanceof Error ? err.message : err)
    return false
  }
}

// ─── Find resonant patterns ───────────────────────────────────────────────────

export async function findResonances(
  text: string,
  topK = 5
): Promise<FoundResonance[]> {
  const config = getPineconeConfig()
  if (!config) return []

  const embedding = await getEmbedding(text)
  if (!embedding) return []

  try {
    const res = await fetch(`${config.host}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': config.apiKey,
      },
      body: JSON.stringify({
        vector: embedding,
        topK,
        includeMetadata: true,
      }),
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) return []

    const data = await res.json()
    const matches: Array<{
      id: string
      score: number
      metadata?: {
        question?: string
        patternText?: string
        sources?: string
      }
    }> = data.matches || []

    return matches
      .filter(m => m.score > 0.72)
      .map(m => {
        let sourcesLabel = ''
        try {
          const parsed = JSON.parse(m.metadata?.sources || '[]') as Array<{ title?: string }>
          sourcesLabel = parsed.map(s => s.title || '').filter(Boolean).join(' × ')
        } catch { /* ignore */ }

        return {
          id: m.id,
          score: m.score,
          question: m.metadata?.question || '',
          patternText: m.metadata?.patternText || '',
          sourcesLabel,
        }
      })
  } catch (err) {
    console.warn('[Pinecone] Erreur query:', err instanceof Error ? err.message : err)
    return []
  }
}
