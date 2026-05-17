import { exec } from 'child_process'
import util from 'util'

const execPromise = util.promisify(exec)

const API_URL = process.env.API_URL || 'https://theexperiencelayer.org/api/ingest'
const INGEST_SECRET = process.env.INGEST_SECRET || 'tel-sovereign-ingest-secret'

async function ingestHackerNewsPost(postId: string) {
  console.log(`\n⏳ Ingesting HackerNews post ${postId} via OpenCLI...`)
  try {
    const { stdout, stderr } = await execPromise(`npx opencli hackernews item --id ${postId} --format json`)
    
    if (stderr && stderr.toLowerCase().includes('error')) {
      console.error('OpenCLI Error:', stderr)
      return
    }

    const items = JSON.parse(stdout)
    console.log(`✅ Extracted ${items.length} items (post + comments). Sending to TEL API for vectorization...`)
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${INGEST_SECRET}`
      },
      body: JSON.stringify({
        items,
        domain: 'technologie'
      })
    })

    const result = await response.json()
    
    if (!response.ok) {
      console.error(`❌ API Error:`, result.error || result)
      return
    }

    console.log(`🎉 API Response: ${result.message}`)
    if (result.errors && result.errors.length > 0) {
      console.error(`⚠️ Some items failed to ingest:`)
      result.errors.forEach((e: any) => console.error(`  - Item ${e.id}: ${e.error}`))
    }
    
  } catch (error) {
    console.error(`❌ Failed to ingest post ${postId}:`, error)
  }
}

// Example usage: node scripts/ingest_daemon.js <postId>
const targetId = process.argv[2] || '1'

async function main() {
  await ingestHackerNewsPost(targetId)
}

main()
