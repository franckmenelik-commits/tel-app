import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// host.docker.internal connects the container to the Hetzner host
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://172.17.0.1:11434/api/embeddings'
const EMBEDDING_MODEL = 'nomic-embed-text'

// Simple secret to prevent unauthorized ingestion
const INGEST_SECRET = process.env.INGEST_SECRET || 'tel-sovereign-ingest-secret'

async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      prompt: text
    })
  })
  
  if (!response.ok) {
    throw new Error(`Ollama error: ${response.statusText}`)
  }
  
  const data = await response.json()
  return data.embedding
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${INGEST_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { items, domain = 'technologie' } = await req.json()

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Expected an array of items' }, { status: 400 })
    }

    let ingestedCount = 0
    const errors: any[] = []

    for (const item of items) {
      if (!item.text || item.text.length < 50) continue

      try {
        const vector = await getEmbedding(item.text)
        
        await prisma.$executeRaw`
          INSERT INTO "MemoryInsight" ("id", "sourceId", "author", "text", "domain", "createdAt", "embedding")
          VALUES (
            gen_random_uuid(), 
            ${item.id.toString()}, 
            ${item.author || 'anonymous'}, 
            ${item.text}, 
            ${domain}, 
            ${new Date(item.created_at || Date.now())}, 
            ${vector}::vector
          )
        `
        ingestedCount++
      } catch (err: any) {
        console.error(`Failed to ingest item ${item.id}:`, err)
        errors.push({ id: item.id, error: err.message || String(err) })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Ingested ${ingestedCount} out of ${items.length} items.`,
      ingestedCount,
      errors
    })

  } catch (err) {
    console.error('[Ingest API Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
