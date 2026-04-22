// TEL — The Experience Layer
// Content extraction by source type + 4 input modes

import * as cheerio from 'cheerio'
import type { SourceType, ExtractedSource, InputMode } from './types'
import { fetchTopComments, formatCommentsForPrompt } from './youtube-comments'
import { fetchBookPortrait } from './exa'

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

async function extractYouTubeWithComments(url: string): Promise<{ title: string; content: string; publicVoices: import('./types').PublicVoice[] }> {
  const { title, content } = await extractYouTube(url)
  const videoId = extractYouTubeVideoId(url)

  if (!videoId) {
    return { title, content, publicVoices: [] }
  }

  const comments = await fetchTopComments(videoId, 20)
  const commentsBlock = formatCommentsForPrompt(comments)

  return {
    title,
    content: content + (commentsBlock ? '\n' + commentsBlock : ''),
    publicVoices: comments.slice(0, 20).map(c => ({
      text: c.text.replace(/<[^>]*>/g, '').slice(0, 500),
      likeCount: c.likeCount,
      author: c.author,
    })),
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

// ─── Instagram: Sovereign multi-tier scraper ──────────────────────────────────
// Tier 1: JSON-LD structured data from page HTML
// Tier 2: Open Graph meta tags
// Tier 3: oEmbed API (no auth, basic info)
// All strategies use Cheerio (already a dependency) and run on our server.
// No third-party API keys. 100% sovereign.

function extractInstagramShortcode(url: string): string | null {
  const patterns = [
    /instagram\.com\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/,
    /instagram\.com\/stories\/[^/]+\/(\d+)/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

async function extractInstagram(url: string): Promise<{ title: string; content: string }> {
  const shortcode = extractInstagramShortcode(url) || 'unknown'
  
  // Normalize URL — ensure it's a proper Instagram URL
  const cleanUrl = url.replace(/\?.*$/, '') // strip query params
  
  let title = 'Instagram post'
  let caption = ''
  let author = ''
  let likes = ''
  let commentsText = ''
  let postType = 'post'
  
  if (url.includes('/reel')) postType = 'reel'
  else if (url.includes('/stories')) postType = 'story'

  // ── Tier 1: Fetch page HTML → extract JSON-LD + meta tags ────────────────
  try {
    const res = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(15000),
      redirect: 'follow',
    })

    if (res.ok) {
      const html = await res.text()
      const $ = cheerio.load(html)

      // Try JSON-LD structured data (richest source)
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const data = JSON.parse($(el).html() || '{}')
          if (data['@type'] === 'VideoObject' || data['@type'] === 'ImageObject' || data['@type'] === 'SocialMediaPosting') {
            caption = data.caption || data.description || data.articleBody || caption
            author = data.author?.name || data.creator?.name || author
            title = data.name || data.headline || title
          }
          // Check for interaction stats
          if (data.interactionStatistic) {
            const likesStat = Array.isArray(data.interactionStatistic)
              ? data.interactionStatistic.find((s: { interactionType?: string }) => s.interactionType === 'http://schema.org/LikeAction')
              : null
            if (likesStat?.userInteractionCount) {
              likes = `${likesStat.userInteractionCount} likes`
            }
          }
          // Comments from structured data
          if (data.comment && Array.isArray(data.comment)) {
            commentsText = data.comment
              .slice(0, 30)
              .map((c: { text?: string; author?: { name?: string } }) => 
                `[${c.author?.name || 'Anonymous'}] ${(c.text || '').slice(0, 300)}`)
              .join('\n')
          }
        } catch { /* malformed JSON-LD, continue */ }
      })

      // OG meta tags (always present on Instagram pages)
      const ogTitle = $('meta[property="og:title"]').attr('content') || ''
      const ogDesc = $('meta[property="og:description"]').attr('content') || ''
      const ogType = $('meta[property="og:type"]').attr('content') || ''
      
      if (!title || title === 'Instagram post') title = ogTitle || 'Instagram post'
      if (!caption) caption = ogDesc
      
      // Extract author from og:title pattern: "Author on Instagram: ..."
      if (!author && ogTitle) {
        const authorMatch = ogTitle.match(/^(.+?)\s+(?:on|sur)\s+Instagram/i)
        if (authorMatch) author = authorMatch[1]
      }
      
      // Try to find additional text in page body
      const altTexts: string[] = []
      $('img[alt]').each((_, el) => {
        const alt = $(el).attr('alt') || ''
        if (alt.length > 30 && !alt.includes('profile picture')) {
          altTexts.push(alt)
        }
      })
      
      // Some pages embed caption in the alt text of the main image
      if (!caption && altTexts.length > 0) {
        caption = altTexts[0]
      }
      
      if (ogType) postType = ogType.includes('video') ? 'reel' : postType
    }
  } catch { /* Tier 1 failed, try Tier 2 */ }

  // ── Tier 2: oEmbed API (no auth needed for public posts) ─────────────────
  if (!caption || caption.length < 20) {
    try {
      const oembedUrl = `https://www.instagram.com/p/${shortcode}/media/?size=l`
      const oembedRes = await fetch(
        `https://graph.facebook.com/v18.0/instagram_oembed?url=${encodeURIComponent(cleanUrl)}&access_token=public`,
        { signal: AbortSignal.timeout(5000) }
      )
      if (!oembedRes.ok) {
        // Fallback: try Instagram's own oEmbed
        const fallbackRes = await fetch(
          `https://api.instagram.com/oembed?url=${encodeURIComponent(cleanUrl)}`,
          { signal: AbortSignal.timeout(5000) }
        )
        if (fallbackRes.ok) {
          const data = await fallbackRes.json()
          if (!title || title === 'Instagram post') title = data.title || title
          if (!author) author = data.author_name || ''
          if (!caption && data.title) caption = data.title
        }
      } else {
        const data = await oembedRes.json()
        if (!title || title === 'Instagram post') title = data.title || title  
        if (!author) author = data.author_name || ''
      }
    } catch { /* oEmbed failed */ }
  }

  // ── Build final content ──────────────────────────────────────────────────
  const contentParts: string[] = []
  
  contentParts.push(`[Instagram ${postType} — extraction souveraine TEL]`)
  contentParts.push('')
  
  if (author) contentParts.push(`Auteur : @${author}`)
  if (likes) contentParts.push(`Engagement : ${likes}`)
  contentParts.push(`URL : ${cleanUrl}`)
  contentParts.push(`Shortcode : ${shortcode}`)
  contentParts.push('')
  
  if (caption) {
    contentParts.push('─── CONTENU DU POST ───')
    contentParts.push(caption.slice(0, 4000))
    contentParts.push('')
  } else {
    contentParts.push('[Note: Caption non extractible — Instagram peut bloquer l\'accès direct. Croisement basé sur les métadonnées disponibles. Niveau de confiance réduit.]')
    contentParts.push('')
  }
  
  if (commentsText) {
    contentParts.push('─── COMMENTAIRES PUBLICS (top 30) ───')
    contentParts.push(commentsText)
  }

  // Build a meaningful title
  const finalTitle = author 
    ? `@${author} — Instagram ${postType}${caption ? ': ' + caption.slice(0, 60) + (caption.length > 60 ? '…' : '') : ''}`
    : title

  return {
    title: finalTitle,
    content: contentParts.join('\n'),
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

// ─── Mode Book: Exa thematic portrait ────────────────────────────────────────

export async function extractBook(titleRaw: string): Promise<ExtractedSource> {
  // Strip prefix if present
  const title = titleRaw.replace(/^(livre:|book:)\s*/i, '').trim()
  const portrait = await fetchBookPortrait(title)

  return {
    url: `book://${encodeURIComponent(title)}`,
    type: 'book',
    title: `Œuvre : "${title}"`,
    content: portrait,
    geographicContext: 'Portrait thématique compilé via Exa.ai',
    geographicConfidence: 60,
    inputMode: 'book',
  }
}

// ─── Master extraction ────────────────────────────────────────────────────────

export async function extractContent(url: string): Promise<ExtractedSource> {
  const type = detectSourceType(url)

  if (type === 'youtube') {
    const { title, content, publicVoices } = await extractYouTubeWithComments(url)
    return {
      url,
      type,
      title: title.slice(0, 200),
      content,
      geographicContext: 'Pending analysis',
      geographicConfidence: 0,
      inputMode: 'url',
      publicVoices: publicVoices.length > 0 ? publicVoices : undefined,
    }
  }

  let title = ''
  let content = ''

  switch (type) {
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
