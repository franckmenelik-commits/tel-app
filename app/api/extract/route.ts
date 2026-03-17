// TEL — The Experience Layer
// /api/extract — Extract content from a single URL

import { NextResponse } from 'next/server'
import { extractContent } from '@/lib/extract'
import type { ExtractPayload } from '@/lib/types'

export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const body: ExtractPayload = await request.json()

    if (!body.url || typeof body.url !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid url field' }, { status: 400 })
    }

    const url = body.url.trim()
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return NextResponse.json({ error: 'URL must start with http:// or https://' }, { status: 400 })
    }

    const extracted = await extractContent(url)

    return NextResponse.json({ success: true, data: extracted })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[TEL /api/extract]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
