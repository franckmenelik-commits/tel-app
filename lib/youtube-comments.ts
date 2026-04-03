// TEL — The Experience Layer
// lib/youtube-comments.ts
// Extraction des commentaires YouTube les plus likés via YouTube Data API v3
//
// USAGE : requires YOUTUBE_API_KEY env var
// Fetches top 20 comments by relevance/likeCount for a given videoId.

export interface YouTubeComment {
  text: string
  likeCount: number
  author: string
}

export async function fetchTopComments(
  videoId: string,
  maxResults = 20
): Promise<YouTubeComment[]> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return []

  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/commentThreads')
    url.searchParams.set('key', apiKey)
    url.searchParams.set('videoId', videoId)
    url.searchParams.set('part', 'snippet')
    url.searchParams.set('order', 'relevance')
    url.searchParams.set('maxResults', String(Math.min(maxResults, 50)))

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      console.warn(`[YouTube Comments] Échec pour videoId=${videoId}: ${res.status}`)
      return []
    }

    const data = await res.json()
    const items: Array<{
      snippet: {
        topLevelComment: {
          snippet: {
            textDisplay: string
            likeCount: number
            authorDisplayName: string
          }
        }
      }
    }> = data.items || []

    return items
      .map(item => ({
        text: item.snippet.topLevelComment.snippet.textDisplay,
        likeCount: item.snippet.topLevelComment.snippet.likeCount || 0,
        author: item.snippet.topLevelComment.snippet.authorDisplayName || 'Anonymous',
      }))
      .sort((a, b) => b.likeCount - a.likeCount)
      .slice(0, 20)
  } catch (err) {
    console.warn('[YouTube Comments] Erreur:', err instanceof Error ? err.message : err)
    return []
  }
}

/**
 * Formats top comments as a text block for inclusion in SOUFFLE prompts.
 * Only includes comments with 5+ likes to filter noise.
 */
export function formatCommentsForPrompt(comments: YouTubeComment[]): string {
  const significant = comments.filter(c => c.likeCount >= 5).slice(0, 10)
  if (significant.length === 0) return ''

  const lines = significant.map(c =>
    `[${c.likeCount} likes] ${c.text.replace(/<[^>]*>/g, '').slice(0, 300)}`
  )

  return `\nCOMMENTAIRES PUBLICS (triés par pertinence/likes):\n${lines.join('\n')}\n`
}
