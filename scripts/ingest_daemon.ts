import { PrismaClient } from '@prisma/client'
import { exec } from 'child_process'
import util from 'util'

const execPromise = util.promisify(exec)
const prisma = new PrismaClient()

// Ollama API configuration
// host.docker.internal allows the Coolify container to talk to the Hetzner host running Ollama
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://172.17.0.1:11434/api/embeddings'
const EMBEDDING_MODEL = 'nomic-embed-text' // Free, sovereign, fast embedding model

async function getEmbedding(text: string): Promise<number[]> {
  try {
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
  } catch (error) {
    console.error(`❌ Failed to get embedding from Ollama:`, error)
    throw error
  }
}

async function ingestHackerNewsPost(postId: string) {
  console.log(`\n⏳ Ingesting HackerNews post ${postId} via OpenCLI...`)
  try {
    // Call opencli to fetch the post and its comments
    // Wait, the output of the CLI is a table. We need JSON to process it in Node.
    // opencli allows output formats: --json
    const { stdout, stderr } = await execPromise(`npx opencli hackernews item --id ${postId} --json`)
    
    if (stderr && stderr.toLowerCase().includes('error')) {
      console.error('OpenCLI Error:', stderr)
      return
    }

    const items = JSON.parse(stdout)
    console.log(`✅ Extracted ${items.length} items (post + comments). Starting vectorization...`)
    
    let ingestedCount = 0
    
    for (const item of items) {
      if (!item.Text || item.Text.length < 50) continue // Skip very short or empty comments
      
      console.log(`🧠 Vectorizing comment by ${item.Author}...`)
      try {
        const vector = await getEmbedding(item.Text)
        
        // Insert into pgvector
        // Note: Prisma requires a raw query to insert Unsupported vector types
        await prisma.$executeRaw`
          INSERT INTO "MemoryInsight" ("id", "sourceId", "author", "text", "domain", "createdAt", "embedding")
          VALUES (
            gen_random_uuid(), 
            ${item.Id.toString()}, 
            ${item.Author}, 
            ${item.Text}, 
            'technologie', 
            ${new Date(item.Created_at)}, 
            ${vector}::vector
          )
        `
        ingestedCount++
      } catch (err) {
        console.error(`Failed to vectorize/insert item ${item.Id}:`, err)
      }
    }
    
    console.log(`🎉 Ingestion complete for post ${postId}. Added ${ingestedCount} vector memories.`)
    
  } catch (error) {
    console.error(`❌ Failed to ingest post ${postId}:`, error)
  }
}

// Example usage: node scripts/ingest_daemon.js <postId>
const targetId = process.argv[2] || '1'

async function main() {
  await ingestHackerNewsPost(targetId)
  await prisma.$disconnect()
}

main()
