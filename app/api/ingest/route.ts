import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const INGEST_SECRET = process.env.INGEST_SECRET || 'tel-sovereign-ingest-secret'

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
      if (!item.text || item.text.length < 50 || !item.embedding) continue

      try {
        await prisma.$executeRaw`
          INSERT INTO "MemoryInsight" ("id", "sourceId", "author", "text", "domain", "createdAt", "embedding")
          VALUES (
            gen_random_uuid(), 
            ${item.id.toString()}, 
            ${item.author || 'anonymous'}, 
            ${item.text}, 
            ${domain}, 
            ${new Date(item.created_at || Date.now())}, 
            ${item.embedding}::vector
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
