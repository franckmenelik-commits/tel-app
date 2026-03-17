// TEL — The Experience Layer
// lib/auto-search.ts
// Recherche automatique Wikipedia (FR + EN) et YouTube pour les modes keyword/crossing

export interface WikipediaResult {
  url: string
  title: string
  extract: string
  lang: 'fr' | 'en'
  found: boolean
}

export interface AutoSearchResult {
  urls: string[]
  titles: string[]
  descriptions: string[]
}

// ─── Wikipedia ─────────────────────────────────────────────────────────────────

async function searchWikipedia(keyword: string, lang: 'fr' | 'en'): Promise<WikipediaResult> {
  const domain = lang === 'fr' ? 'fr.wikipedia.org' : 'en.wikipedia.org'

  try {
    // Step 1: Search for the best article title
    const searchUrl = `https://${domain}/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(keyword)}&srlimit=1&format=json&origin=*`

    const searchRes = await fetch(searchUrl, {
      headers: { 'User-Agent': 'TEL/1.0 (theexperiencelayer.org)' },
      signal: AbortSignal.timeout(8000),
    })

    if (!searchRes.ok) {
      return { url: '', title: '', extract: '', lang, found: false }
    }

    const searchData = await searchRes.json()
    const results = searchData?.query?.search
    if (!results || results.length === 0) {
      return { url: '', title: '', extract: '', lang, found: false }
    }

    const pageTitle = results[0].title
    const encodedTitle = encodeURIComponent(pageTitle.replace(/ /g, '_'))
    const articleUrl = `https://${domain}/wiki/${encodedTitle}`

    // Step 2: Get extract (first 500 chars of article)
    const extractUrl = `https://${domain}/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&titles=${encodeURIComponent(pageTitle)}&format=json&origin=*`

    const extractRes = await fetch(extractUrl, {
      headers: { 'User-Agent': 'TEL/1.0 (theexperiencelayer.org)' },
      signal: AbortSignal.timeout(8000),
    })

    let extract = ''
    if (extractRes.ok) {
      const extractData = await extractRes.json()
      const pages = extractData?.query?.pages
      if (pages) {
        const pageId = Object.keys(pages)[0]
        extract = pages[pageId]?.extract?.slice(0, 600) ?? ''
      }
    }

    return {
      url: articleUrl,
      title: pageTitle,
      extract,
      lang,
      found: true,
    }
  } catch (err) {
    console.warn(`[auto-search] Wikipedia ${lang} error for "${keyword}":`, err instanceof Error ? err.message : err)
    return { url: '', title: '', extract: '', lang, found: false }
  }
}

// ─── YouTube search (via yt-search or YouTube Data API v3) ───────────────────

async function searchYouTube(keyword: string): Promise<{ url: string; title: string; found: boolean }> {
  const apiKey = process.env.YOUTUBE_API_KEY

  if (apiKey) {
    // Official YouTube Data API v3
    try {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(keyword)}&type=video&maxResults=1&relevanceLanguage=fr&key=${apiKey}`
      const res = await fetch(searchUrl, { signal: AbortSignal.timeout(8000) })
      if (res.ok) {
        const data = await res.json()
        const item = data?.items?.[0]
        if (item) {
          const videoId = item.id?.videoId
          const title = item.snippet?.title
          if (videoId) {
            return {
              url: `https://www.youtube.com/watch?v=${videoId}`,
              title: title || keyword,
              found: true,
            }
          }
        }
      }
    } catch (err) {
      console.warn('[auto-search] YouTube API error:', err instanceof Error ? err.message : err)
    }
  }

  // No YouTube API key — skip silently
  return { url: '', title: '', found: false }
}

// ─── Main auto-search for keyword mode ────────────────────────────────────────

export async function autoSearchKeyword(keyword: string): Promise<AutoSearchResult> {
  const [wikiEN, wikiFR] = await Promise.all([
    searchWikipedia(keyword, 'en'),
    searchWikipedia(keyword, 'fr'),
  ])

  const urls: string[] = []
  const titles: string[] = []
  const descriptions: string[] = []

  if (wikiEN.found) {
    urls.push(wikiEN.url)
    titles.push(`Wikipedia EN — ${wikiEN.title}`)
    descriptions.push(wikiEN.extract.slice(0, 150))
  }

  if (wikiFR.found && wikiFR.url !== wikiEN.url) {
    urls.push(wikiFR.url)
    titles.push(`Wikipedia FR — ${wikiFR.title}`)
    descriptions.push(wikiFR.extract.slice(0, 150))
  }

  // If we only found 1 or 0 Wikipedia results, try YouTube
  if (urls.length < 2) {
    const yt = await searchYouTube(keyword)
    if (yt.found) {
      urls.push(yt.url)
      titles.push(`YouTube — ${yt.title}`)
      descriptions.push('')
    }
  }

  return { urls, titles, descriptions }
}

// ─── Auto-search for crossing mode (A × B) ───────────────────────────────────
// For each term, fetch Wikipedia EN + FR, then pair them together

export async function autoSearchCrossing(
  termA: string,
  termB: string
): Promise<{ urlsA: string[]; urlsB: string[] }> {
  const [resA_EN, resA_FR, resB_EN, resB_FR] = await Promise.all([
    searchWikipedia(termA, 'en'),
    searchWikipedia(termA, 'fr'),
    searchWikipedia(termB, 'en'),
    searchWikipedia(termB, 'fr'),
  ])

  const urlsA: string[] = []
  const urlsB: string[] = []

  if (resA_EN.found) urlsA.push(resA_EN.url)
  if (resA_FR.found && resA_FR.url !== resA_EN.url) urlsA.push(resA_FR.url)

  if (resB_EN.found) urlsB.push(resB_EN.url)
  if (resB_FR.found && resB_FR.url !== resB_EN.url) urlsB.push(resB_FR.url)

  return { urlsA, urlsB }
}
