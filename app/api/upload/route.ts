// TEL — The Experience Layer
// File upload API endpoint — sovereign, processes locally
// Accepts: PDF, TXT, MD files up to 10MB
// Returns: extracted text content

import { NextRequest, NextResponse } from 'next/server'
import { extractPdfText, extractPlainText, MAX_FILE_SIZE } from '@/lib/pdf-extract'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 413 }
      )
    }

    const filename = file.name || 'document'
    const ext = filename.split('.').pop()?.toLowerCase() || ''

    // Validate type
    const ALLOWED_TYPES = ['pdf', 'txt', 'md', 'text']
    if (!ALLOWED_TYPES.includes(ext)) {
      return NextResponse.json(
        { error: `Unsupported file type: .${ext}. Accepted: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    let result

    if (ext === 'pdf') {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      result = await extractPdfText(buffer, filename)
    } else {
      // Plain text / markdown
      const content = await file.text()
      result = extractPlainText(content, filename)
    }

    return NextResponse.json({
      success: true,
      text: result.text,
      title: result.title,
      pageCount: result.pageCount,
      truncated: result.truncated,
      filename,
    })
  } catch (err) {
    console.error('[TEL Upload]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload processing failed' },
      { status: 500 }
    )
  }
}
