// TEL — Specialized Whisper Agent
// Diagnoses and verifies the Whisper transcription local server health.

import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync, readFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '../..')

function loadEnv() {
  const envPath = join(ROOT, '.env.local')
  if (!existsSync(envPath)) return {}
  const content = readFileSync(envPath, 'utf-8')
  const env: Record<string, string> = {}
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

export interface WhisperHealth {
  healthy: boolean
  url: string
  latencyMs: number
  message: string
  recommendation?: string
}

export async function checkWhisperHealth(): Promise<WhisperHealth> {
  const env = loadEnv()
  const endpoint = env.WHISPER_ENDPOINT || process.env.WHISPER_ENDPOINT || 'http://127.0.0.1:9000'
  const startTime = Date.now()

  try {
    // Try pinging the endpoint directly or /health /tags
    const res = await fetch(`${endpoint}/`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    }).catch(() => null)

    const latency = Date.now() - startTime

    if (res && (res.ok || res.status === 404 || res.status === 405)) {
      // 404 or 405 means the server is running but the root doesn't support GET/is not public
      return {
        healthy: true,
        url: endpoint,
        latencyMs: latency,
        message: 'Le serveur Whisper est en ligne et répond.'
      }
    }

    return {
      healthy: false,
      url: endpoint,
      latencyMs: latency,
      message: `Le serveur ne répond pas correctement (HTTP ${res ? res.status : 'Aucune réponse'})`,
      recommendation: 'Assurez-vous que le serveur Whisper local est démarré : run-whisper ou docker run -p 9000:9000.'
    }
  } catch (err: any) {
    return {
      healthy: false,
      url: endpoint,
      latencyMs: Date.now() - startTime,
      message: `Erreur de connexion : ${err.message}`,
      recommendation: 'Le serveur Whisper local est éteint. Lancez l\'image Docker Whisper ASR ou vérifiez votre configuration réseau.'
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  checkWhisperHealth().then(status => {
    console.log(JSON.stringify(status, null, 2))
  })
}
