#!/usr/bin/env node
// TEL — The Experience Layer
// npm run check-souffle
// Vérifie quels niveaux SOUFFLE sont actifs sur cette machine

import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// ─── Couleurs ANSI ────────────────────────────────────────────────────────────
const GOLD    = '\x1b[33m'
const GREEN   = '\x1b[32m'
const RED     = '\x1b[31m'
const DIM     = '\x1b[2m'
const RESET   = '\x1b[0m'
const BOLD    = '\x1b[1m'

// ─── Charger .env.local ───────────────────────────────────────────────────────
function loadEnv() {
  const envPath = join(ROOT, '.env.local')
  if (!existsSync(envPath)) return {}
  const content = readFileSync(envPath, 'utf-8')
  const env = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    env[key] = value
  }
  return env
}

// ─── Vérifications ────────────────────────────────────────────────────────────
async function checkOllama(url) {
  try {
    const res = await fetch(`${url}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return { ok: false, message: `HTTP ${res.status}` }
    const data = await res.json()
    const models = (data.models || []).map(m => m.name)
    const hasMistral = models.some(m => m.startsWith('mistral'))
    return {
      ok: true,
      modeles: models.slice(0, 5),
      hasMistral,
    }
  } catch (err) {
    return { ok: false, message: err.message }
  }
}

async function checkMistralAPI(apiKey) {
  if (!apiKey) return { ok: false, message: 'MISTRAL_API_KEY non configurée' }
  try {
    const res = await fetch('https://api.mistral.ai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return { ok: false, message: `HTTP ${res.status} — clé invalide ou quota dépassé` }
    return { ok: true }
  } catch (err) {
    return { ok: false, message: err.message }
  }
}

async function checkAnthropicAPI(apiKey) {
  if (!apiKey) return { ok: false, message: 'ANTHROPIC_API_KEY non configurée' }
  // Anthropic n'a pas d'endpoint public sans consommer — on vérifie juste le format
  const valid = apiKey.startsWith('sk-ant-')
  return {
    ok: valid,
    message: valid ? undefined : 'Format de clé invalide (doit commencer par sk-ant-)',
  }
}

// ─── Affichage ────────────────────────────────────────────────────────────────
function ligne(label, ok, detail) {
  const icone = ok ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`
  const labelFmt = ok ? `${BOLD}${label}${RESET}` : `${DIM}${label}${RESET}`
  const detailFmt = detail ? ` ${DIM}— ${detail}${RESET}` : ''
  console.log(`  ${icone} ${labelFmt}${detailFmt}`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const env = loadEnv()
  const ollamaUrl = env.OLLAMA_URL || 'http://localhost:11434'
  const mistralKey = env.MISTRAL_API_KEY || ''
  const anthropicKey = env.ANTHROPIC_API_KEY || ''

  console.log()
  console.log(`${GOLD}${BOLD}TEL — SOUFFLE System Check${RESET}`)
  console.log(`${GOLD}═══════════════════════════════${RESET}`)
  console.log()

  let niveauxActifs = 0

  // ── Niveau 1 — L'Écoute ──────────────────────────────────────────────────
  console.log(`${BOLD}NIVEAU 1 — L'ÉCOUTE${RESET} ${DIM}(Ollama local — gratuit, souverain)${RESET}`)
  const ollama = await checkOllama(ollamaUrl)
  if (ollama.ok) {
    ligne('Ollama actif', true, ollamaUrl)
    if (ollama.hasMistral) {
      ligne('Modèle mistral disponible', true, ollama.modeles.find(m => m.startsWith('mistral')))
      niveauxActifs++
    } else {
      ligne('Modèle mistral', false, `non trouvé. Exécutez : ollama pull mistral`)
      console.log(`  ${DIM}  Modèles présents: ${ollama.modeles.join(', ') || 'aucun'}${RESET}`)
    }
  } else {
    ligne('Ollama', false, `non détecté (${ollama.message})`)
    console.log(`  ${DIM}  → brew install ollama && ollama pull mistral${RESET}`)
    console.log(`  ${DIM}  → https://ollama.com${RESET}`)
  }
  console.log()

  // ── Niveau 2 — La Traversée ──────────────────────────────────────────────
  console.log(`${BOLD}NIVEAU 2 — LA TRAVERSÉE${RESET} ${DIM}(Mistral API — croisements profonds)${RESET}`)
  const mistral = await checkMistralAPI(mistralKey)
  if (mistral.ok) {
    ligne('MISTRAL_API_KEY valide', true)
    niveauxActifs++
  } else {
    ligne('MISTRAL_API_KEY', false, mistral.message)
    console.log(`  ${DIM}  → https://console.mistral.ai${RESET}`)
  }
  console.log()

  // ── Niveau 3 — La Révélation ─────────────────────────────────────────────
  console.log(`${BOLD}NIVEAU 3 — LA RÉVÉLATION${RESET} ${DIM}(Claude Anthropic — l'indicible)${RESET}`)
  const anthropic = await checkAnthropicAPI(anthropicKey)
  if (anthropic.ok) {
    ligne('ANTHROPIC_API_KEY valide', true)
    niveauxActifs++
  } else {
    ligne('ANTHROPIC_API_KEY', false, anthropic.message)
    console.log(`  ${DIM}  → https://console.anthropic.com${RESET}`)
  }
  console.log()

  // ── Statut global ─────────────────────────────────────────────────────────
  console.log(`${GOLD}═══════════════════════════════${RESET}`)
  if (niveauxActifs === 3) {
    console.log(`${GREEN}${BOLD}SOUFFLE complet (3/3 niveaux actifs)${RESET}`)
    console.log(`${DIM}TEL peut croiser des vécus à tous les niveaux de profondeur.${RESET}`)
  } else if (niveauxActifs >= 1) {
    console.log(`${GOLD}${BOLD}SOUFFLE partiel (${niveauxActifs}/3 niveaux actifs)${RESET}`)
    console.log(`${DIM}TEL est fonctionnel. Certains contextes premium peuvent être limités.${RESET}`)
  } else {
    console.log(`${RED}${BOLD}SOUFFLE inactif (0/3 niveaux actifs)${RESET}`)
    console.log(`${DIM}TEL nécessite au moins un niveau actif pour fonctionner.${RESET}`)
    console.log(`${DIM}Recommandé: commencer par Ollama (gratuit) → ollama pull mistral${RESET}`)
  }
  console.log()

  // ── Routing estimé ────────────────────────────────────────────────────────
  if (niveauxActifs > 0) {
    console.log(`${DIM}Routing SOUFFLE estimé:${RESET}`)
    console.log(`  ${DIM}2 sources + exploration    → Niveau 1 (L'Écoute)${RESET}`)
    console.log(`  ${DIM}3+ sources ou profond      → Niveau 1 + 2 (La Traversée)${RESET}`)
    console.log(`  ${DIM}Institutionnel / fragile   → Niveau 1 + 2 + 3 (La Révélation)${RESET}`)
    console.log()
    console.log(`${DIM}Démarrez TEL avec: npm run dev${RESET}`)
  }
  console.log()
}

main().catch(err => {
  console.error(`${RED}Erreur check-souffle:${RESET}`, err.message)
  process.exit(1)
})
