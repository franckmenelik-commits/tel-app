// TEL — Nightly Concept Auto-Crosser
// Automatically crosses top human discussions to keep the homepage landing dynamically alive.

import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { crossNarratives } from '../lib/cross'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// Helper to load .env.local
function loadEnv() {
  const envPath = join(ROOT, '.env.local')
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf-8')
    content.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const idx = trimmed.indexOf('=')
        if (idx !== -1) {
          const key = trimmed.slice(0, idx).trim()
          const val = trimmed.slice(idx + 1).trim()
          process.env[key] = val
        }
      }
    })
  }
}

async function runAutoCrosser() {
  console.log('⚡ Démarrage de l\'Auto-Croiseur de Concepts...')
  loadEnv()

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY manquante dans .env.local')
    process.exit(1)
  }

  try {
    // 1. Fetch top stories from HackerNews
    console.log('⏳ Récupération du Top Stories HackerNews...')
    const topIdsRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json')
    if (!topIdsRes.ok) throw new Error(`HN API error: ${topIdsRes.statusText}`)
    const topIds = await topIdsRes.json()

    // Grab a few candidates and select two that have external URLs
    const inputs: string[] = []
    for (let i = 0; i < 15 && inputs.length < 2; i++) {
      const storyRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${topIds[i]}.json`)
      if (storyRes.ok) {
        const story = await storyRes.json()
        if (story.url && (story.url.startsWith('http://') || story.url.startsWith('https://'))) {
          inputs.push(story.url)
          console.log(`  ✓ Candidat trouvé : ${story.title} (${story.url})`)
        }
      }
    }

    if (inputs.length < 2) {
      console.warn('⚠️ Moins de 2 articles avec URL trouvés. Utilisation de termes de secours...')
      inputs.push('https://en.wikipedia.org/wiki/Artificial_general_intelligence')
      inputs.push('https://en.wikipedia.org/wiki/Philosophy_of_mind')
    }

    // 2. Perform the narrative crossing
    console.log(`⏳ Lancement du croisement SOUFFLE N2 entre : \n  1. ${inputs[0]} \n  2. ${inputs[1]}`)
    const result = await crossNarratives(inputs, 'exploration', {
      onStatus: (statut) => console.log(`  [SOUFFLE] Modèles actifs : ${statut.niveauxActifs.join(', ')}`),
      onCrossingStart: (niveau) => console.log(`  [SOUFFLE] Démarrage Niveau ${niveau}`),
    }, 'fr')

    const insight = result.insight
    insight.id = `dynamic-daily-crossing`
    insight.createdAt = new Date()

    // 3. Save to local JSON cache
    const outputPath = join(ROOT, 'lib/dynamic-crossing.json')
    writeFileSync(outputPath, JSON.stringify(insight, null, 2), 'utf-8')
    console.log(`🎉 Croisement dynamique quotidien écrit avec succès dans : ${outputPath}`)

  } catch (err) {
    console.error('❌ L\'Auto-Croiseur a échoué:', err instanceof Error ? err.message : err)
    process.exit(1)
  }
}

runAutoCrosser()
