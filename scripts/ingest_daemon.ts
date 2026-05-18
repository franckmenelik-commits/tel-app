import { exec } from 'child_process'
import util from 'util'

const execPromise = util.promisify(exec)

const API_URL = process.env.API_URL || 'https://theexperiencelayer.org/api/ingest'
const INGEST_SECRET = process.env.INGEST_SECRET || 'tel-sovereign-ingest-secret'
const OLLAMA_URL = 'http://localhost:11434/api/embeddings'
const EMBEDDING_MODEL = 'nomic-embed-text'

// ─── Ollama Embedding ─────────────────────────────────────────────────────────

async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBEDDING_MODEL, prompt: text })
  })
  if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`)
  const data = await response.json()
  return data.embedding
}

// ─── Send to TEL API ──────────────────────────────────────────────────────────

async function sendToAPI(items: any[], domain: string) {
  console.log(`🧠 Generated ${items.length} vectors. Sending to TEL API...`)
  
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${INGEST_SECRET}`
    },
    body: JSON.stringify({ items, domain })
  })

  const result = await response.json()
  
  if (!response.ok) {
    console.error(`❌ API Error:`, result.error || result)
    return
  }

  console.log(`🎉 ${result.message}`)
  if (result.errors?.length > 0) {
    console.error(`⚠️ Some items failed:`)
    result.errors.forEach((e: any) => console.error(`  - ${e.id}: ${e.error}`))
  }
}

// ─── Vectorize items ──────────────────────────────────────────────────────────

async function vectorizeItems(rawItems: any[], minLength = 50): Promise<any[]> {
  const items = []
  for (const item of rawItems) {
    if (!item.text || item.text.length < minLength) continue
    try {
      item.embedding = await getEmbedding(item.text)
      items.push(item)
      process.stdout.write(`  ✓ ${items.length} vectors\r`)
    } catch (err) {
      console.error(`  ✗ Failed embedding for ${item.id}`)
    }
  }
  console.log()
  return items
}

// ─── HackerNews ───────────────────────────────────────────────────────────────

async function ingestHackerNews(postId: string) {
  console.log(`\n⏳ [HackerNews] Ingesting post ${postId}...`)
  const { stdout } = await execPromise(`npx opencli hackernews item --id ${postId} --format json`)
  const rawItems = JSON.parse(stdout)
  console.log(`✅ Extracted ${rawItems.length} items from HackerNews`)
  
  const items = await vectorizeItems(rawItems)
  if (items.length > 0) await sendToAPI(items, 'technologie')
}

// ─── Reddit (Public JSON API — no auth needed) ───────────────────────────────

const REDDIT_USER_AGENT = 'TEL-Ingest/1.0 (theexperiencelayer.org)'

interface RedditPost {
  id: string
  title: string
  selftext: string
  author: string
  score: number
  num_comments: number
  permalink: string
  created_utc: number
  subreddit: string
}

async function fetchRedditSubreddit(subreddit: string, sort: 'hot' | 'top' | 'new' = 'top', limit = 25): Promise<RedditPost[]> {
  const url = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}&t=week`
  const res = await fetch(url, {
    headers: { 'User-Agent': REDDIT_USER_AGENT }
  })
  if (!res.ok) throw new Error(`Reddit API ${res.status}: ${res.statusText}`)
  const data = await res.json()
  return data.data.children
    .map((c: any) => c.data as RedditPost)
    .filter((p: RedditPost) => !p.selftext?.includes('[removed]') && !p.selftext?.includes('[deleted]'))
}

async function fetchRedditComments(permalink: string, limit = 10): Promise<any[]> {
  const url = `https://www.reddit.com${permalink}.json?limit=${limit}&sort=top&depth=1`
  const res = await fetch(url, {
    headers: { 'User-Agent': REDDIT_USER_AGENT }
  })
  if (!res.ok) return []
  const data = await res.json()
  if (!Array.isArray(data) || data.length < 2) return []
  
  return data[1].data.children
    .filter((c: any) => c.kind === 't1' && c.data.body && c.data.body.length > 50)
    .slice(0, limit)
    .map((c: any) => ({
      id: c.data.id,
      text: c.data.body,
      author: c.data.author,
      score: c.data.score,
      created_at: new Date(c.data.created_utc * 1000).toISOString()
    }))
}

async function ingestRedditSubreddit(subreddit: string, maxPosts = 10) {
  console.log(`\n⏳ [Reddit] Ingesting r/${subreddit}...`)
  
  const posts = await fetchRedditSubreddit(subreddit, 'top', maxPosts)
  console.log(`✅ Fetched ${posts.length} posts from r/${subreddit}`)
  
  const allItems: any[] = []
  
  for (const post of posts) {
    // Add the post itself (title + body)
    const postText = `${post.title}${post.selftext ? '\n\n' + post.selftext : ''}`
    if (postText.length >= 50) {
      allItems.push({
        id: `reddit-${post.id}`,
        text: postText,
        author: post.author,
        created_at: new Date(post.created_utc * 1000).toISOString()
      })
    }
    
    // Add top comments
    const comments = await fetchRedditComments(post.permalink, 5)
    for (const comment of comments) {
      allItems.push({
        id: `reddit-${comment.id}`,
        text: comment.text,
        author: comment.author,
        created_at: comment.created_at
      })
    }
    
    // Small delay to respect Reddit rate limits
    await new Promise(r => setTimeout(r, 1000))
  }
  
  console.log(`📦 Total items from r/${subreddit}: ${allItems.length}`)
  
  // Determine domain from subreddit
  const domainMap: Record<string, string> = {
    'philosophy': 'philosophie',
    'AskHistorians': 'histoire',
    'changemyview': 'social',
    'worldnews': 'politique',
    'science': 'science',
    'TrueReddit': 'social',
    'DepthHub': 'social',
    'AskAnthropology': 'histoire',
    'CriticalTheory': 'philosophie',
    'geopolitics': 'politique',
    'environment': 'environnement',
    'Economics': 'economie',
    'technology': 'technologie',
  }
  const domain = domainMap[subreddit] || 'inconnu'
  
  const items = await vectorizeItems(allItems)
  if (items.length > 0) await sendToAPI(items, domain)
}

// ─── RSS/Feed Ingestion (Global South + Non-Western sources) ──────────────────

interface RSSSource {
  name: string
  feedUrl: string
  domain: string
  region: string
}

const GLOBAL_SOURCES: RSSSource[] = [
  // ── AFRICA ──
  { name: 'Global Voices',           feedUrl: 'https://globalvoices.org/feed/',                              domain: 'social',         region: '🌍 Global South' },
  { name: 'AllAfrica',               feedUrl: 'https://allafrica.com/tools/headlines/rdf/latest/headlines.rdf', domain: 'politique',    region: '🌍 Afrique' },
  
  // ── INDIA ──
  { name: 'Scroll.in',               feedUrl: 'https://feeds.feedburner.com/Scrolli',                        domain: 'social',         region: '🇮🇳 Inde' },
  
  // ── MIDDLE EAST ──
  { name: 'Al Jazeera',              feedUrl: 'https://www.aljazeera.com/xml/rss/all.xml',                   domain: 'politique',      region: '🌍 Moyen-Orient' },
  
  // ── EAST ASIA ──
  { name: 'SCMP · Asia',             feedUrl: 'https://www.scmp.com/rss/91/feed',                            domain: 'politique',      region: '🌏 Asie-Est' },
  
  // ── JAPAN ──
  { name: 'Japan Times',             feedUrl: 'https://www.japantimes.co.jp/feed/',                           domain: 'social',         region: '🇯🇵 Japon' },
  
  // ── LATIN AMERICA / BRAZIL ──
  { name: 'Brasil de Fato',          feedUrl: 'https://www.brasildefato.com.br/rss2.xml',                     domain: 'social',         region: '🇧🇷 Brésil' },
  
  // ── KOREA ──
  { name: 'Korea Herald',            feedUrl: 'https://www.koreaherald.com/common/rss_xml.php?ct=102',        domain: 'social',         region: '🇰🇷 Corée' },
]

async function parseRSSFeed(feedUrl: string, maxItems = 10): Promise<{ title: string; content: string; link: string }[]> {
  try {
    const res = await fetch(feedUrl, {
      headers: { 'User-Agent': 'TEL-Ingest/1.0 (theexperiencelayer.org)' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const xml = await res.text()
    
    const items: { title: string; content: string; link: string }[] = []
    
    // Simple XML parsing — extract <item> or <entry> blocks
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>|<entry[^>]*>([\s\S]*?)<\/entry>/gi
    let match
    while ((match = itemRegex.exec(xml)) !== null && items.length < maxItems) {
      const block = match[1] || match[2]
      
      const titleMatch = block.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)
      const descMatch = block.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/) ||
                        block.match(/<content[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content>/) ||
                        block.match(/<summary[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/summary>/)
      const linkMatch = block.match(/<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/) ||
                        block.match(/<link[^>]*href="([^"]*)"/)
      
      const title = titleMatch?.[1]?.replace(/<[^>]+>/g, '').trim() || ''
      const content = descMatch?.[1]?.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, ' ').trim() || ''
      const link = linkMatch?.[1]?.trim() || ''
      
      if (title && (title.length + content.length) > 50) {
        items.push({ title, content, link })
      }
    }
    
    return items
  } catch (err) {
    console.error(`  ✗ Feed error: ${err instanceof Error ? err.message : err}`)
    return []
  }
}

async function ingestRSSSource(source: RSSSource, maxItems = 10) {
  console.log(`\n⏳ [${source.region}] ${source.name}...`)
  
  const feedItems = await parseRSSFeed(source.feedUrl, maxItems)
  if (feedItems.length === 0) {
    console.log(`  ⚠️ No items found`)
    return
  }
  console.log(`✅ Fetched ${feedItems.length} articles from ${source.name}`)
  
  const rawItems = feedItems.map((item, i) => ({
    id: `rss-${source.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}-${i}`,
    text: `${item.title}\n\n${item.content}`,
    author: source.name,
    created_at: new Date().toISOString()
  }))
  
  const items = await vectorizeItems(rawItems)
  if (items.length > 0) await sendToAPI(items, source.domain)
}

// ─── Main CLI ─────────────────────────────────────────────────────────────────

const HELP = `
╔══════════════════════════════════════════════╗
║  TEL Sovereign Ingestion Daemon v3.0        ║
║  "Babel a dispersé. TEL rassemble."         ║
║  theexperiencelayer.org                     ║
╚══════════════════════════════════════════════╝

Usage:
  npx tsx scripts/ingest_daemon.ts hackernews <postId>
  npx tsx scripts/ingest_daemon.ts reddit <subreddit> [maxPosts]
  npx tsx scripts/ingest_daemon.ts reddit-batch [maxPerSub]
  npx tsx scripts/ingest_daemon.ts rss <sourceName> [maxItems]
  npx tsx scripts/ingest_daemon.ts world [maxPerSource]
  npx tsx scripts/ingest_daemon.ts world-batch [maxPerSource]

Sources mondiales disponibles:
  🌍 Global Voices (Global, Afrique, Moyen-Orient, Asie, Latam, Autochtones)
  🌍 AllAfrica (Afrique panafricaine)
  🇮🇳 The Wire India, Scroll.in (Inde)
  🌍 Al Jazeera (Moyen-Orient)
  🌏 SCMP (Asie-Est)

Examples:
  npx tsx scripts/ingest_daemon.ts world 5
  npx tsx scripts/ingest_daemon.ts reddit philosophy 10
  npx tsx scripts/ingest_daemon.ts world-batch 8
`

const DEFAULT_SUBREDDITS = [
  'philosophy',
  'AskHistorians', 
  'changemyview',
  'worldnews',
  'science',
  'TrueReddit',
  'geopolitics',
  'environment',
]

async function main() {
  const [source, target, extra] = process.argv.slice(2)
  
  if (!source) {
    console.log(HELP)
    return
  }

  switch (source) {
    case 'hackernews':
    case 'hn':
      await ingestHackerNews(target || '1')
      break

    case 'reddit':
      if (!target) {
        console.error('❌ Specify a subreddit: npx tsx scripts/ingest_daemon.ts reddit philosophy')
        return
      }
      await ingestRedditSubreddit(target, parseInt(extra) || 10)
      break

    case 'reddit-batch':
      console.log(`\n🌍 Starting batch ingestion of ${DEFAULT_SUBREDDITS.length} subreddits...\n`)
      const maxPerSub = parseInt(target) || 5
      for (const sub of DEFAULT_SUBREDDITS) {
        try {
          await ingestRedditSubreddit(sub, maxPerSub)
        } catch (err) {
          console.error(`❌ Failed r/${sub}:`, err instanceof Error ? err.message : err)
        }
        await new Promise(r => setTimeout(r, 2000))
      }
      console.log(`\n✅ Reddit batch complete!`)
      break

    case 'rss': {
      const found = GLOBAL_SOURCES.find(s => s.name.toLowerCase().includes((target || '').toLowerCase()))
      if (!found) {
        console.log('Sources disponibles:')
        GLOBAL_SOURCES.forEach(s => console.log(`  ${s.region} ${s.name}`))
        return
      }
      await ingestRSSSource(found, parseInt(extra) || 10)
      break
    }

    case 'world': {
      const maxItems = parseInt(target) || 5
      console.log(`\n🌍 Ingesting ${GLOBAL_SOURCES.length} Global South sources (${maxItems} articles each)...\n`)
      for (const src of GLOBAL_SOURCES) {
        try {
          await ingestRSSSource(src, maxItems)
        } catch (err) {
          console.error(`❌ Failed ${src.name}:`, err instanceof Error ? err.message : err)
        }
        await new Promise(r => setTimeout(r, 1500))
      }
      console.log(`\n✅ Global South ingestion complete!`)
      break
    }

    case 'world-batch': {
      const maxAll = parseInt(target) || 5
      console.log(`\n╔══════════════════════════════════════════════╗`)
      console.log(`║  🌍 TEL FULL WORLD INGESTION                ║`)
      console.log(`║  Reddit + Global South + HackerNews         ║`)
      console.log(`╚══════════════════════════════════════════════╝\n`)
      
      // 1. Reddit
      console.log(`\n━━━ PHASE 1: Reddit (${DEFAULT_SUBREDDITS.length} subreddits) ━━━`)
      for (const sub of DEFAULT_SUBREDDITS) {
        try { await ingestRedditSubreddit(sub, maxAll) } catch (err) {
          console.error(`❌ r/${sub}:`, err instanceof Error ? err.message : err)
        }
        await new Promise(r => setTimeout(r, 2000))
      }
      
      // 2. Global South
      console.log(`\n━━━ PHASE 2: Global South (${GLOBAL_SOURCES.length} sources) ━━━`)
      for (const src of GLOBAL_SOURCES) {
        try { await ingestRSSSource(src, maxAll) } catch (err) {
          console.error(`❌ ${src.name}:`, err instanceof Error ? err.message : err)
        }
        await new Promise(r => setTimeout(r, 1500))
      }
      
      // 3. Top HackerNews
      console.log(`\n━━━ PHASE 3: HackerNews (top 3) ━━━`)
      try {
        const hnRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json')
        const topIds = await hnRes.json() as number[]
        for (const id of topIds.slice(0, 3)) {
          try { await ingestHackerNews(String(id)) } catch {}
        }
      } catch {}
      
      console.log(`\n╔══════════════════════════════════════════════╗`)
      console.log(`║  ✅ FULL WORLD INGESTION COMPLETE            ║`)
      console.log(`╚══════════════════════════════════════════════╝`)
      break
    }

    default:
      console.log(HELP)
  }
}

main()
