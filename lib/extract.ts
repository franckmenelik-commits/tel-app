// TEL — The Experience Layer
// Content extraction by source type + 4 input modes

import * as cheerio from 'cheerio'
import type { SourceType, ExtractedSource, InputMode } from './types'

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

function detectSourceType(url: string): SourceType {
  const u = url.toLowerCase()
  if (u.includes('youtube.com/watch') || u.includes('youtu.be/')) return 'youtube'
  if (u.includes('wikipedia.org/wiki/')) return 'wikipedia'
  if (u.includes('instagram.com/')) return 'instagram'
  if (u.includes('.pdf')) return 'book'
  return 'article'
}

function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

async function extractYouTube(url: string): Promise<{ title: string; content: string }> {
  const videoId = extractYouTubeVideoId(url)
  if (!videoId) throw new Error('Cannot extract YouTube video ID from URL')

  // ── Get title first (oEmbed — fast, always available) ────────────────────
  let title = `YouTube video ${videoId}`
  let description = ''
  try {
    const oembedRes = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(5000) }
    )
    if (oembedRes.ok) {
      const oembed = await oembedRes.json()
      title = oembed.title || title
    }
  } catch { /* oEmbed failed */ }

  // ── Plan A — youtube-transcript ───────────────────────────────────────────
  try {
    const { YoutubeTranscript } = await import('youtube-transcript')
    const transcript = await YoutubeTranscript.fetchTranscript(videoId)
    const text = transcript.map((item: { text: string }) => item.text).join(' ')
    if (text.trim().length > 100) {
      return { title, content: text }
    }
  } catch { /* Plan A failed — try Plan B */ }

  // ── Plan B — Whisper local ────────────────────────────────────────────────
  const whisperEndpoint = process.env.WHISPER_ENDPOINT || 'http://127.0.0.1:9000'
  try {
    console.log(`[TEL] Whisper utilisé pour : ${url}`)
    const whisperRes = await fetch(`${whisperEndpoint}/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(120000),
    })
    if (whisperRes.ok) {
      const data = await whisperRes.json()
      const text: string = data.text || data.transcript || ''
      if (text.trim().length > 100) {
        console.log(`[TEL] Whisper transcription réussie pour : ${url} (${text.length} chars)`)
        return { title, content: `[Transcription Whisper]\n\n${text}` }
      }
    }
  } catch { /* Plan B failed — try Plan C */ }

  // ── Plan C — Metadata assembly (quasi-crossing fallback) ──────────────────
  // Scrape page for description + tags
  try {
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(15000),
    })
    if (pageRes.ok) {
      const html = await pageRes.text()
      const $ = cheerio.load(html)
      title = $('meta[property="og:title"]').attr('content') ||
        $('title').text().replace(' - YouTube', '').trim() || title
      description = $('meta[property="og:description"]').attr('content') ||
        $('meta[name="description"]').attr('content') || ''
    }
  } catch { /* ignore */ }

  return {
    title,
    content: `[Note: Transcription non disponible — croisement basé sur les métadonnées YouTube. Niveau de confiance réduit.]\n\nTitre : ${title}\n\nDescription : ${description}\n\nIdentifiant vidéo : ${videoId}\nURL : ${url}`,
  }
}

async function extractWikipedia(url: string): Promise<{ title: string; content: string }> {
  const match = url.match(/wikipedia\.org\/wiki\/(.+)/)
  if (!match) throw new Error('Cannot extract Wikipedia page title')

  const pageTitle = decodeURIComponent(match[1])
  const lang = url.match(/([a-z]{2,3})\.wikipedia\.org/)?.[1] || 'en'
  const apiUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`

  const summaryRes = await fetch(apiUrl, { headers: { 'User-Agent': USER_AGENT } })

  if (summaryRes.ok) {
    const data = await summaryRes.json()
    const summary = data.extract || ''
    const title = data.title || pageTitle

    let fullContent = summary
    try {
      const contentUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=extracts&exintro=false&explaintext=true&format=json&origin=*`
      const contentRes = await fetch(contentUrl, { headers: { 'User-Agent': USER_AGENT } })
      if (contentRes.ok) {
        const contentData = await contentRes.json()
        const pages = contentData.query?.pages
        if (pages) {
          const page = Object.values(pages)[0] as { extract?: string }
          if (page.extract) {
            fullContent = page.extract.slice(0, 8000)
          }
        }
      }
    } catch {
      // Full content failed, use summary
    }

    return { title, content: fullContent }
  }

  // Fallback: scrape the page directly
  const pageRes = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  const html = await pageRes.text()
  const $ = cheerio.load(html)

  const title = $('#firstHeading').text().trim() || pageTitle
  $('#mw-content-text .mw-parser-output script, #mw-content-text .mw-parser-output style').remove()
  const content = $('#mw-content-text .mw-parser-output p')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((_: number, el: any) => $(el).text())
    .get()
    .join('\n\n')
    .slice(0, 8000)

  return { title, content }
}

async function extractArticle(url: string): Promise<{ title: string; content: string }> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
    signal: AbortSignal.timeout(30000),
  })

  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`)

  const html = await res.text()
  const $ = cheerio.load(html)

  const title =
    $('meta[property="og:title"]').attr('content') ||
    $('h1').first().text().trim() ||
    $('title').text().trim() ||
    url

  $(
    'script, style, nav, footer, header, aside, .ads, .advertisement, .sidebar, .comments, .related, .social-share, .cookie-banner, .popup, .modal, [class*="banner"], [class*="cookie"], [id*="cookie"]'
  ).remove()

  const contentSelectors = [
    'article',
    '[role="main"]',
    'main',
    '.post-content',
    '.entry-content',
    '.article-content',
    '.article-body',
    '.story-body',
    '.content-body',
    '#content',
    '.content',
    '.post',
  ]

  let content = ''
  for (const selector of contentSelectors) {
    const el = $(selector).first()
    if (el.length) {
      content = el.text().replace(/\s+/g, ' ').trim()
      if (content.length > 200) break
    }
  }

  if (content.length < 200) {
    content = $('body').text().replace(/\s+/g, ' ').trim()
  }

  return { title, content: content.slice(0, 8000) }
}

async function extractInstagram(url: string): Promise<{ title: string; content: string }> {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  const html = await res.text()
  const $ = cheerio.load(html)

  const title = $('meta[property="og:title"]').attr('content') || 'Instagram post'
  const description = $('meta[property="og:description"]').attr('content') || ''

  return {
    title,
    content: `[Instagram post — accès limité]\n\n${title}\n\n${description}`,
  }
}

// ─── Mode B: Free text ────────────────────────────────────────────────────────
// User provides a direct narrative (>50 words) — treat as content directly

export function extractFreeText(text: string, index: number): ExtractedSource {
  const words = text.trim().split(/\s+/)
  const preview = words.slice(0, 12).join(' ')
  return {
    url: `free-text://${index}`,
    type: 'free_text',
    title: `Témoignage direct — "${preview}${words.length > 12 ? '…' : ''}"`,
    content: text.trim(),
    geographicContext: 'Contexte géographique non déterminé (texte libre)',
    geographicConfidence: 0,
    inputMode: 'free_text',
  }
}

// ─── Mode C: Keyword → Wikipedia ──────────────────────────────────────────────
// Fetches Wikipedia FR + EN for a keyword, returns ExtractedSource[]

export async function extractKeyword(keyword: string): Promise<ExtractedSource[]> {
  const { autoSearchKeyword } = await import('./auto-search')
  const results = await autoSearchKeyword(keyword)

  if (results.urls.length === 0) {
    // No Wikipedia pages found — return placeholder
    return [{
      url: `keyword://${encodeURIComponent(keyword)}`,
      type: 'article',
      title: `Terme : "${keyword}" (aucune source Wikipedia trouvée)`,
      content: `Le terme "${keyword}" n'a pas de page Wikipedia correspondante. LOGOS utilisera sa connaissance directe de ce concept.`,
      geographicContext: 'Global',
      geographicConfidence: 20,
      inputMode: 'keyword',
    }]
  }

  // Extract content from found URLs
  const sources: ExtractedSource[] = []
  for (let i = 0; i < Math.min(results.urls.length, 2); i++) {
    try {
      const extracted = await extractContent(results.urls[i])
      sources.push({ ...extracted, inputMode: 'keyword' })
    } catch {
      // If extraction fails, use the description from search
      sources.push({
        url: results.urls[i],
        type: 'wikipedia',
        title: results.titles[i] || keyword,
        content: results.descriptions[i] || `Résumé Wikipedia pour "${keyword}"`,
        geographicContext: 'Global',
        geographicConfidence: 50,
        inputMode: 'keyword',
      })
    }
  }

  return sources
}

// ─── Mode D: Direct crossing (A × B) ─────────────────────────────────────────
// Returns a synthetic "source" that tells LOGOS to use its own knowledge

export function extractDirectCrossing(termA: string, termB: string): ExtractedSource[] {
  return [
    {
      url: `crossing://${encodeURIComponent(termA)}`,
      type: 'crossing',
      title: `Concept : "${termA}"`,
      content: `[MODE CROISEMENT DIRECT]\n\nTERME: ${termA}\n\nLOGOS utilise sa connaissance directe de "${termA}" pour ce croisement. Aucune source externe n'a été fournie — ce croisement repose sur la connaissance encodée dans LOGOS.`,
      geographicContext: 'Global (connaissance directe)',
      geographicConfidence: 60,
      inputMode: 'crossing',
    },
    {
      url: `crossing://${encodeURIComponent(termB)}`,
      type: 'crossing',
      title: `Concept : "${termB}"`,
      content: `[MODE CROISEMENT DIRECT]\n\nTERME: ${termB}\n\nLOGOS utilise sa connaissance directe de "${termB}" pour ce croisement. Aucune source externe n'a été fournie — ce croisement repose sur la connaissance encodée dans LOGOS.`,
      geographicContext: 'Global (connaissance directe)',
      geographicConfidence: 60,
      inputMode: 'crossing',
    },
  ]
}

// ─── Master extraction ────────────────────────────────────────────────────────

export async function extractContent(url: string): Promise<ExtractedSource> {
  const type = detectSourceType(url)

  let title = ''
  let content = ''

  switch (type) {
    case 'youtube':
      ;({ title, content } = await extractYouTube(url))
      break
    case 'wikipedia':
      ;({ title, content } = await extractWikipedia(url))
      break
    case 'instagram':
      ;({ title, content } = await extractInstagram(url))
      break
    case 'article':
    default:
      ;({ title, content } = await extractArticle(url))
      break
  }

  return {
    url,
    type,
    title: title.slice(0, 200),
    content,
    geographicContext: 'Pending analysis',
    geographicConfidence: 0,
    inputMode: 'url',
  }
}
