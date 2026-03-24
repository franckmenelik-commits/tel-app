// TEL — The Experience Layer
// lib/seed-knowledge.ts
// Seeding script — peuple l'index Pinecone 'tel-wisdom' avec les 50 sources racines
//
// FONCTIONNEMENT :
// 1. Pour chaque source ROOT_SOURCES :
//    a. Cherche un résumé via Exa.ai (si EXA_API_KEY présente)
//    b. Fallback : génère une description structurée à partir des métadonnées
// 2. Upsert dans Pinecone 'tel-wisdom' (si PINECONE_API_KEY présente)
// 3. Fallback : écrit dans lib/wisdom-cache.json
//
// USAGE :
//   npm run seed          — via tsx en local
//   POST /api/seed        — via endpoint protégé (x-admin-key header requis)

import { ROOT_SOURCES } from './knowledge-base'
import type { KnowledgeSource } from './knowledge-base'
import * as fs from 'fs'
import * as path from 'path'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WisdomCacheEntry {
  id: string
  title: string
  author?: string
  themes: string[]
  type?: string
  geographicOrigin?: string
  language?: string
  summary: string
  relatedUrls: string[]
  indexedAt: string
}

// ─── ID generation ────────────────────────────────────────────────────────────

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

function generateId(source: KnowledgeSource, index: number): string {
  const base = slugify(`${source.title}-${source.author || ''}`)
  return `tel-wisdom-${String(index + 1).padStart(3, '0')}-${base}`
}

// ─── Exa search (when EXA_API_KEY available) ─────────────────────────────────

async function fetchExaSummary(source: KnowledgeSource): Promise<{ summary: string; urls: string[] }> {
  const apiKey = process.env.EXA_API_KEY
  if (!apiKey) {
    return { summary: '', urls: [] }
  }

  try {
    const query = `résumé analyse "${source.title}"${source.author ? ` ${source.author}` : ''} signification philosophique`
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        query,
        type: 'neural',
        numResults: 3,
        contents: { summary: { query } },
      }),
    })

    if (!response.ok) {
      console.warn(`[Exa] Échec pour "${source.title}": ${response.status}`)
      return { summary: '', urls: [] }
    }

    const data = await response.json()
    const results = data.results || []

    const summaryParts = results
      .filter((r: { summary?: string }) => r.summary)
      .map((r: { summary: string }) => r.summary)
      .join(' ')

    const urls = results
      .filter((r: { url?: string }) => r.url)
      .map((r: { url: string }) => r.url)

    return { summary: summaryParts.slice(0, 800), urls }
  } catch (err) {
    console.warn(`[Exa] Erreur pour "${source.title}":`, err)
    return { summary: '', urls: [] }
  }
}

// ─── Structured description fallback ─────────────────────────────────────────

function buildStructuredDescription(source: KnowledgeSource): string {
  const parts: string[] = []

  parts.push(`"${source.title}"${source.author ? ` par ${source.author}` : ''}.`)

  if (source.geographicOrigin) {
    parts.push(`Origine : ${source.geographicOrigin}.`)
  }

  if (source.type) {
    const typeLabels: Record<string, string> = {
      book: 'Livre',
      article: 'Article',
      testimony: 'Témoignage',
      academic: 'Œuvre académique',
      oral: 'Tradition orale',
      fiction: 'Œuvre de fiction',
    }
    parts.push(`Type : ${typeLabels[source.type] || source.type}.`)
  }

  if (source.themes.length > 0) {
    parts.push(`Thèmes centraux : ${source.themes.join(', ')}.`)
  }

  if (source.excerpt) {
    parts.push(`Extrait : ${source.excerpt}`)
  }

  parts.push(
    `Cette œuvre appartient à la base de sagesse TEL — The Experience Layer, ` +
    `un système de croisement de vécus humains pour révéler la sagesse collective invisible.`
  )

  return parts.join(' ')
}

// ─── Pinecone upsert (when PINECONE_API_KEY available) ───────────────────────
// Phase 2: Pinecone requires vector embeddings.
// We use a text-based metadata-only approach until embedding endpoint is confirmed.

async function upsertToPinecone(
  id: string,
  source: KnowledgeSource,
  summary: string
): Promise<boolean> {
  const apiKey = process.env.PINECONE_API_KEY
  if (!apiKey) return false

  try {
    // Phase 2: Replace this placeholder with real embedding + upsert
    // const embedding = await getEmbedding(summary) // via OpenAI / Cohere / etc.
    // const pinecone = new Pinecone({ apiKey })
    // const index = pinecone.index('tel-wisdom')
    // await index.upsert([{
    //   id,
    //   values: embedding,
    //   metadata: {
    //     title: source.title,
    //     author: source.author || '',
    //     themes: source.themes,
    //     type: source.type || '',
    //     geographicOrigin: source.geographicOrigin || '',
    //     language: source.language || 'fr',
    //     summary: summary.slice(0, 1000),
    //   }
    // }])
    console.log(`[Pinecone] Placeholder — clé présente mais embedding non connecté pour: ${source.title}`)
    return false // Remove when real embedding is connected
  } catch (err) {
    console.warn(`[Pinecone] Erreur pour "${source.title}":`, err)
    return false
  }
}

// ─── Main seeding function ────────────────────────────────────────────────────

export async function seedKnowledge(): Promise<{
  total: number
  indexed: number
  cached: number
  errors: string[]
}> {
  console.log('[TEL Seed] Démarrage du seeding...')
  console.log(`[TEL Seed] ${ROOT_SOURCES.length} sources à traiter`)

  const hasPinecone = !!process.env.PINECONE_API_KEY
  const hasExa = !!process.env.EXA_API_KEY

  console.log(`[TEL Seed] Pinecone: ${hasPinecone ? 'connecté' : 'non configuré — fallback JSON'}`)
  console.log(`[TEL Seed] Exa: ${hasExa ? 'connecté' : 'non configuré — descriptions structurées'}`)

  const cache: WisdomCacheEntry[] = []
  let indexed = 0
  const errors: string[] = []

  for (let i = 0; i < ROOT_SOURCES.length; i++) {
    const source = ROOT_SOURCES[i]
    const id = generateId(source, i)

    process.stdout.write(`\r[TEL Seed] ${i + 1}/${ROOT_SOURCES.length}: ${source.title.slice(0, 40)}...`)

    try {
      // 1. Get summary
      let summary = ''
      let urls: string[] = []

      if (hasExa) {
        const exaResult = await fetchExaSummary(source)
        summary = exaResult.summary
        urls = exaResult.urls
      }

      // Fallback to structured description
      if (!summary) {
        summary = buildStructuredDescription(source)
      }

      // 2. Try Pinecone upsert
      const pineconeSuccess = await upsertToPinecone(id, source, summary)
      if (pineconeSuccess) indexed++

      // 3. Always build cache entry (JSON cache as primary fallback + audit trail)
      cache.push({
        id,
        title: source.title,
        author: source.author,
        themes: source.themes,
        type: source.type,
        geographicOrigin: source.geographicOrigin,
        language: source.language,
        summary,
        relatedUrls: urls,
        indexedAt: new Date().toISOString(),
      })
    } catch (err) {
      const msg = `Erreur sur "${source.title}": ${err instanceof Error ? err.message : String(err)}`
      errors.push(msg)
      console.warn(`\n[TEL Seed] ⚠ ${msg}`)
    }

    // Rate limit: 300ms between Exa calls
    if (hasExa && i < ROOT_SOURCES.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 300))
    }
  }

  // 4. Write JSON cache
  const cachePath = path.join(process.cwd(), 'lib', 'wisdom-cache.json')
  try {
    fs.writeFileSync(cachePath, JSON.stringify({ generatedAt: new Date().toISOString(), sources: cache }, null, 2))
    console.log(`\n[TEL Seed] Cache JSON écrit: ${cachePath}`)
  } catch (err) {
    const msg = `Erreur écriture cache: ${err instanceof Error ? err.message : String(err)}`
    errors.push(msg)
    console.warn(`[TEL Seed] ⚠ ${msg}`)
  }

  const result = {
    total: ROOT_SOURCES.length,
    indexed,
    cached: cache.length,
    errors,
  }

  console.log(`\n[TEL Seed] ✓ Terminé — ${result.indexed} indexés Pinecone, ${result.cached} en cache JSON, ${result.errors.length} erreurs`)
  return result
}

// ─── Direct execution (via tsx) ───────────────────────────────────────────────

const isMain = process.argv[1]?.endsWith('seed-knowledge.ts') ||
               process.argv[1]?.endsWith('seed-knowledge.js')

if (isMain) {
  seedKnowledge()
    .then(result => {
      if (result.errors.length > 0) {
        console.error('[TEL Seed] Erreurs:', result.errors)
        process.exit(1)
      }
      process.exit(0)
    })
    .catch(err => {
      console.error('[TEL Seed] Erreur fatale:', err)
      process.exit(1)
    })
}
