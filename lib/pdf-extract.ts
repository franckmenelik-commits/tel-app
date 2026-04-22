// TEL — The Experience Layer
// PDF/Text extraction — sovereign, no external API
// Supports: .pdf (via pdf-parse), .txt, .md

import type { ExtractedSource } from './types'

const MAX_CHARS = 12000 // ~3000 tokens, safe for SOUFFLE prompt windows
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

interface ExtractResult {
  text: string
  title: string
  pageCount?: number
  truncated: boolean
}

/**
 * Extract text from a PDF buffer.
 * Uses pdf-parse (pure JS, no native binaries — Docker-safe).
 */
export async function extractPdfText(buffer: Buffer, filename: string): Promise<ExtractResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pdfModule: any
  try {
    pdfModule = await import('pdf-parse')
  } catch {
    throw new Error('pdf-parse module not found. Install with: npm install pdf-parse')
  }

  // pdf-parse v2 exports PDFParse class
  const PDFParse = pdfModule.PDFParse || pdfModule.default || pdfModule
  const parser = new PDFParse()
  const result = await parser.loadPDF(buffer)
  
  const fullText = (result.text || '').trim()
  const truncated = fullText.length > MAX_CHARS
  const text = truncated ? fullText.slice(0, MAX_CHARS) + '\n\n[…document tronqué pour analyse]' : fullText
  const title = result.info?.Title || filename.replace(/\.[^.]+$/, '') || 'Document PDF'

  return {
    text,
    title,
    pageCount: result.numpages || result.numPages,
    truncated,
  }
}

/**
 * Extract text from a plain text or markdown file.
 */
export function extractPlainText(content: string, filename: string): ExtractResult {
  const fullText = content.trim()
  const truncated = fullText.length > MAX_CHARS
  const text = truncated ? fullText.slice(0, MAX_CHARS) + '\n\n[…document tronqué pour analyse]' : fullText
  const title = filename.replace(/\.[^.]+$/, '') || 'Document'

  return { text, title, truncated }
}

/**
 * Build a TEL ExtractedSource from an uploaded file.
 */
export function buildSourceFromUpload(
  extractResult: ExtractResult,
  filename: string,
): ExtractedSource {
  return {
    url: `upload://${filename}`,
    type: 'book',
    title: extractResult.title,
    content: extractResult.text,
    geographicContext: 'Contexte géographique non déterminé',
    geographicConfidence: 20,
  }
}

export { MAX_FILE_SIZE }
