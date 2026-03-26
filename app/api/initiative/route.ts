// TEL — The Experience Layer
// /api/initiative — Transforme un problème social en plan d'action
//
// SOUFFLE : Mistral → Claude → Ollama
// 5 sections : DIAGNOSTIC / PRÉCÉDENTS / PERSPECTIVES / ARGUMENTS / ÉTAPES

import Anthropic from '@anthropic-ai/sdk'
import { parseLLMJson } from '@/lib/parse-llm'

export const maxDuration = 120

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InitiativeReport {
  diagnostic: {
    reformulation: string
    enjeuCentral: string
    populationsAffectees: string
    donnees: string
  }
  precedents: Array<{
    titre: string
    pays: string
    annee: string
    description: string
    resultat: string
  }>
  perspectivesManquantes: Array<{
    voix: string
    silence: string
    angle: string
  }>
  argumentsParAudience: {
    depute: string
    media: string
    fondation: string
    citoyen: string
  }
  premieresEtapes: Array<{
    numero: number
    action: string
    delai: string
    ressources: string
  }>
}

interface InitiativePayload {
  probleme: string
  cherchePrecedents: boolean
  generePerspecives: boolean
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildInitiativePrompt(
  probleme: string,
  cherchePrecedents: boolean,
  generePerspecives: boolean
): string {
  return `Tu es LOGOS, l'intelligence analytique de TEL (The Experience Layer).
Un utilisateur décrit un problème social qu'il veut résoudre. Ton rôle est de transformer ce problème en plan d'action structuré, ancré dans des précédents réels et des perspectives honnêtes.

PROBLÈME SOUMIS :
${probleme}

Produis un rapport JSON avec cette structure exacte :

{
  "diagnostic": {
    "reformulation": "Reformulation structurelle et précise du problème — nomme les mécanismes systémiques, pas seulement les symptômes (3-4 phrases).",
    "enjeuCentral": "L'enjeu central en une phrase percutante — ce que ce problème révèle sur la société.",
    "populationsAffectees": "Qui est affecté, avec quelle intensité, et qui a le moins de voix dans ce débat.",
    "donnees": "2-3 données chiffrées ou faits contextuels qui ancrent le problème dans la réalité vérifiable."
  },
  "precedents": [
${cherchePrecedents ? `    {
      "titre": "Nom du programme ou initiative",
      "pays": "Pays",
      "annee": "Année",
      "description": "Ce qui a été tenté — en 2 phrases concrètes.",
      "resultat": "Ce qui s'est passé réellement — succès, échec partiel, ou leçons tirées."
    },
    {
      "titre": "...",
      "pays": "...",
      "annee": "...",
      "description": "...",
      "resultat": "..."
    },
    {
      "titre": "...",
      "pays": "...",
      "annee": "...",
      "description": "...",
      "resultat": "..."
    }` : `    {
      "titre": "Analyse désactivée",
      "pays": "N/A",
      "annee": "N/A",
      "description": "La recherche de précédents a été désactivée par l'utilisateur.",
      "resultat": "Activez cette option pour voir des exemples mondiaux."
    }`}
  ],
  "perspectivesManquantes": [
${generePerspecives ? `    {
      "voix": "Qui n'est pas consulté — nom de la population ou du groupe",
      "silence": "Ce qu'ils vivent que le débat public ignore complètement",
      "angle": "L'angle analytique que leur inclusion révélerait"
    },
    {
      "voix": "...",
      "silence": "...",
      "angle": "..."
    },
    {
      "voix": "...",
      "silence": "...",
      "angle": "..."
    }` : `    {
      "voix": "Analyse désactivée",
      "silence": "La génération de perspectives a été désactivée par l'utilisateur.",
      "angle": "Activez cette option pour identifier les voix absentes du débat."
    }`}
  ],
  "argumentsParAudience": {
    "depute": "Comment présenter ce problème à un député ou élu local — langage politique, impact électoral, levier législatif possible. 1 paragraphe incisif.",
    "media": "Comment présenter ce problème à un journaliste ou média — angle narratif, chiffre d'accroche, personnage humain qui incarne le problème. 1 paragraphe.",
    "fondation": "Comment présenter ce problème à une fondation philanthropique — impact mesurable, alignement avec les priorités ESG/SDG, retour sur investissement social. 1 paragraphe.",
    "citoyen": "Comment expliquer ce problème à quelqu'un dans la rue qui n'a aucun contexte — sans jargon, avec une image mentale forte. 1 paragraphe."
  },
  "premieresEtapes": [
    {
      "numero": 1,
      "action": "Action concrète que l'utilisateur peut faire dans les 30 prochains jours — verbe d'action, résultat tangible.",
      "delai": "Cette semaine / Dans 2 semaines / Dans 30 jours",
      "ressources": "Ce dont vous avez besoin — temps, contacts, outils, budget estimé."
    },
    { "numero": 2, "action": "...", "delai": "...", "ressources": "..." },
    { "numero": 3, "action": "...", "delai": "...", "ressources": "..." },
    { "numero": 4, "action": "...", "delai": "...", "ressources": "..." },
    { "numero": 5, "action": "...", "delai": "...", "ressources": "..." }
  ]
}

RÈGLES :
- Sois factuel et précis — pas de rhétorique creuse
- Les précédents doivent être réels et vérifiables
- Les perspectives manquantes doivent nommer des groupes concrets, pas des abstractions
- Les arguments par audience doivent être réellement adaptés au registre de chaque interlocuteur
- Les premières étapes doivent être faisables par une seule personne sans budget institutionnel
- Réponds UNIQUEMENT avec le JSON valide, sans markdown, sans commentaire`
}

// ─── SOUFFLE LLM call ─────────────────────────────────────────────────────────

async function callLLM(prompt: string): Promise<string> {
  if (process.env.MISTRAL_API_KEY) {
    try {
      console.log('[initiative] Essai N2 Mistral...')
      const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'mistral-large-latest',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.4,
          max_tokens: 5000,
        }),
        signal: AbortSignal.timeout(90000),
      })
      if (res.ok) {
        const data = await res.json()
        const text: string = data.choices?.[0]?.message?.content ?? ''
        if (text.trim()) { console.log('[initiative] N2 Mistral OK'); return text }
      }
    } catch (err) {
      console.warn('[initiative] N2 indisponible:', err instanceof Error ? err.message : err)
    }
  }

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      console.log('[initiative] Fallback N3 Claude...')
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 5000,
        messages: [{ role: 'user', content: prompt }],
      })
      const text = response.content[0].type === 'text' ? response.content[0].text : ''
      if (text.trim()) { console.log('[initiative] N3 Claude OK'); return text }
    } catch (err) {
      console.warn('[initiative] N3 indisponible:', err instanceof Error ? err.message : err)
    }
  }

  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434'
  const ollamaModel = process.env.OLLAMA_MODEL || 'mistral'
  console.log('[initiative] Fallback N1 Ollama...')
  const res = await fetch(`${ollamaUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: ollamaModel,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      options: { temperature: 0.4, num_predict: 4000 },
    }),
    signal: AbortSignal.timeout(120000),
  })
  if (!res.ok) throw new Error(`Ollama ${res.status}: aucun modèle disponible`)
  const data = await res.json()
  const text: string = data.message?.content ?? ''
  if (!text.trim()) throw new Error('Réponse vide de tous les modèles SOUFFLE')
  return text
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  let body: InitiativePayload
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'JSON invalide' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    })
  }

  const { probleme, cherchePrecedents = true, generePerspecives = true } = body

  if (!probleme || probleme.trim().length < 30) {
    return new Response(
      JSON.stringify({ error: 'Décrivez votre problème en au moins 30 caractères' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const prompt = buildInitiativePrompt(probleme.trim(), cherchePrecedents, generePerspecives)

  try {
    const raw = await callLLM(prompt)
    const report = parseLLMJson<InitiativeReport>(raw)
    return new Response(JSON.stringify({ success: true, report }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[/api/initiative] Erreur:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Erreur lors de l\'analyse' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
