import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Try multiple common Docker host gateway IPs
const OLLAMA_URLS = [
  process.env.OLLAMA_URL,
  'http://host.docker.internal:11434/api/embeddings',
  'http://172.17.0.1:11434/api/embeddings',
  'http://172.18.0.1:11434/api/embeddings',
  'http://172.19.0.1:11434/api/embeddings'
].filter(Boolean) as string[]

const EMBEDDING_MODEL = 'nomic-embed-text'

async function getEmbedding(text: string): Promise<number[]> {
  let lastError: any
  
  for (const url of OLLAMA_URLS) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: EMBEDDING_MODEL,
          prompt: text
        })
      })
      
      if (!response.ok) {
        throw new Error(`Ollama error at ${url}: ${response.statusText}`)
      }
      
      const data = await response.json()
      return data.embedding
    } catch (err) {
      lastError = err
    }
  }
  
  throw lastError || new Error('All Ollama host URLs failed')
}

export async function POST(req: NextRequest) {
  try {
    const { text, limit = 3 } = await req.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // 1. Convert the input text into a vector using Ollama
    const vector = await getEmbedding(text)

    // 2. Perform Cosine Similarity Search (<=>) on pgvector
    // We format the vector as a string '[val1, val2, ...]' for pgvector
    const vectorStr = `[${vector.join(',')}]`

    // IMPORTANT: Prisma $queryRaw needs careful handling with pgvector
    // We use cast ::vector to ensure PostgreSQL understands the type
    const sqlResults = await prisma.$queryRaw<any[]>`
      SELECT 
        id::text, 
        "sourceId", 
        author, 
        text, 
        domain, 
        1 - (embedding <=> ${vectorStr}::vector) AS similarity
      FROM "MemoryInsight"
      WHERE 1 - (embedding <=> ${vectorStr}::vector) > 0.5
      ORDER BY embedding <=> ${vectorStr}::vector
      LIMIT ${limit}
    `

    const resonances = sqlResults.map(row => ({
      croisementId: row.id,
      themeCommun: `[Global] Résonance avec le domaine ${row.domain} (Auteur: ${row.author || 'Inconnu'})`,
      patternCommun: `"${row.text.length > 200 ? row.text.substring(0, 200) + '...' : row.text}"\n\n(ID source: ${row.sourceId})`,
      scoreSimilarite: Math.round(row.similarity * 100)
    }))

    return NextResponse.json({ resonances })

  } catch (error) {
    console.error('[Resonance API Error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
