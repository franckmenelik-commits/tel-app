import { exec } from 'child_process'
import util from 'util'

const execPromise = util.promisify(exec)

const API_URL = process.env.API_URL || 'https://theexperiencelayer.org/api/ingest'
const INGEST_SECRET = process.env.INGEST_SECRET || 'tel-sovereign-ingest-secret'
const OLLAMA_URL = 'http://localhost:11434/api/embeddings'
const EMBEDDING_MODEL = 'nomic-embed-text'

async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      prompt: text
    })
  })
  
  if (!response.ok) {
    throw new Error(`Ollama error: ${response.statusText}`)
  }
  
  const data = await response.json()
  return data.embedding
}

async function ingestHackerNewsPost(postId: string) {
  console.log(`\n⏳ Ingesting HackerNews post ${postId} via OpenCLI...`)
  try {
    const { stdout, stderr } = await execPromise(`npx opencli hackernews item --id ${postId} --format json`)
    
    if (stderr && stderr.toLowerCase().includes('error')) {
      console.error('OpenCLI Error:', stderr)
      return
    }

    const rawItems = JSON.parse(stdout)
    console.log(`✅ Extracted ${rawItems.length} items. Generating local embeddings with Ollama...`)
    
    const items = []
    for (const item of rawItems) {
      if (!item.text || item.text.length < 50) continue
      try {
        item.embedding = await getEmbedding(item.text)
        items.push(item)
      } catch (err) {
        console.error(`Failed to generate embedding for item ${item.id}`, err)
      }
    }

    console.log(`🧠 Generated ${items.length} vectors. Sending to TEL API...`)
    
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
