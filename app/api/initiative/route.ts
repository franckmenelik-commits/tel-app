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
    notoriete?: 'obscur' | 'connu'
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
    contact?: string
  }>
  coalitionPotentielle: Array<{
    nom: string
    pays: string
    description: string
    lien?: string
    pourquoi: string
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
Un utilisateur décrit un problème social qu'il veut résoudre. Ton rôle est de produire un plan d'action SPÉCIFIQUE, CONCRET et ANCRÉ dans des faits réels — pas un rapport générique.

PROBLÈME SOUMIS PAR L'UTILISATEUR :
${probleme}

━━━ RÈGLES CRITIQUES — LIRE AVANT TOUT ━━━

DIAGNOSTIC :
- Commence TOUJOURS par les éléments concrets mentionnés par l'utilisateur (chiffres, lieux, populations nommés).
- N'invente pas de données — si tu cites un chiffre, il doit être réel et vérifiable.
- INTERDIT : phrases vagues comme "échec systémique de la gouvernance", "enjeu complexe", "problème multidimensionnel" SANS données précises derrière.
- La reformulation doit nommer des mécanismes précis : qui décide quoi, qui paie, qui bénéficie, qui est exclu, pourquoi.

PRÉCÉDENTS MONDIAUX :
- Au moins 1 précédent sur 3 DOIT être OBSCUR — une initiative locale, communautaire, municipale, ou du Sud Global que la majorité des gens ne connaissent pas.
- INTERDITS comme seuls exemples : Asilomar, AI Act européen, RGPD, Kyoto, toute politique nationale mainstream.
- Cherche : initiatives au niveau d'une ville, d'un quartier, d'une ONG, d'une communauté autochtone, d'un pays du Sud Global peu médiatisé.
- Chaque précédent doit citer une année réelle et un lieu précis.
- Indique pour chaque précédent si il est "obscur" ou "connu" dans le champ notoriete.

PERSPECTIVES MANQUANTES :
- Nomme des groupes réels et spécifiques — pas "les marginalisés", mais "les travailleuses informelles du secteur textile à Dhaka" ou "les personnes sourdes dans les procédures judiciaires".
- Le "silence" doit décrire une expérience vécue concrète, pas une abstraction.

ARGUMENTS PAR AUDIENCE :
- Chaque paragraphe doit utiliser LE REGISTRE de l'interlocuteur : un député parle de circonscription, un journaliste pense à l'accroche, une fondation pense au ROI social, un citoyen pense à sa vie quotidienne.
- Mentionne des exemples ou analogies spécifiques dans chaque argument.

30 JOURS — ÉTAPES CONCRÈTES :
- Chaque action doit être faisable par une seule personne sans budget institutionnel.
- Quand c'est possible : nomme une organisation réelle à contacter (ex: "Contactez le Réseau québécois d'action pour la santé des femmes — rqasf.qc.ca"), un outil précis ("Google Alerts sur les termes X et Y"), ou une démarche administrative réelle.
- Le champ "contact" doit contenir une URL ou un nom d'organisation précis quand disponible.

COALITION POTENTIELLE :
- 3 organisations ou acteurs qui travaillent DÉJÀ sur ce problème ou un problème adjacent.
- Peut inclure des ONG, des chercheurs, des journalistes d'investigation, des collectifs citoyens.
- Priorité aux acteurs que l'utilisateur pourrait réellement contacter (email public, formulaire web, réseau social).
- Explique POURQUOI cet acteur spécifiquement serait un allié stratégique pour ce problème précis.
- "lien" doit être une URL réelle si elle existe.

━━━ STRUCTURE JSON ━━━

Produis UNIQUEMENT ce JSON valide, sans markdown, sans commentaire :

{
  "diagnostic": {
    "reformulation": "Commence par les faits du problème tel que décrit, avec les chiffres ou contextes mentionnés. Ensuite élargis au mécanisme systémique précis. Nomme qui décide, qui finance, qui profite, qui est exclu. 3-4 phrases denses et factuelles.",
    "enjeuCentral": "Une phrase percutante qui nomme la contradiction fondamentale révélée par ce problème — pas un slogan, une observation analytique.",
    "populationsAffectees": "Nomme les groupes spécifiques affectés, avec leur expérience vécue concrète. Qui souffre le plus ? Qui est le plus silencieux dans le débat actuel ?",
    "donnees": "2-3 données chiffrées ou faits précis et vérifiables qui ancrent le problème. Si l'utilisateur en a fourni, les utiliser et les compléter. Cite la source entre parenthèses."
  },
  "precedents": [
${cherchePrecedents ? `    {
      "titre": "Nom précis du programme ou initiative",
      "pays": "Pays ou ville précise",
      "annee": "Année de lancement ou période",
      "description": "Ce qui a été tenté concrètement — qui a fait quoi, avec quels moyens. 2 phrases précises.",
      "resultat": "Ce qui s'est passé réellement — chiffres si disponibles, succès ou échec documenté, leçons tirées.",
      "notoriete": "obscur"
    },
    {
      "titre": "...",
      "pays": "...",
      "annee": "...",
      "description": "...",
      "resultat": "...",
      "notoriete": "connu"
    },
    {
      "titre": "...",
      "pays": "...",
      "annee": "...",
      "description": "...",
      "resultat": "...",
      "notoriete": "obscur"
    }` : `    {
      "titre": "Analyse désactivée",
      "pays": "N/A",
      "annee": "N/A",
      "description": "La recherche de précédents a été désactivée par l'utilisateur.",
      "resultat": "Activez cette option pour voir des exemples mondiaux.",
      "notoriete": "connu"
    }`}
  ],
  "perspectivesManquantes": [
${generePerspecives ? `    {
      "voix": "Nom précis du groupe absent — pas 'les marginalisés' mais le groupe spécifique",
      "silence": "Ce qu'ils vivent concrètement que le débat public ignore — une expérience vécue, pas une abstraction",
      "angle": "L'angle analytique ou la question que leur inclusion forcerait à poser"
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
    "depute": "Paragraphe utilisant le registre politique : impact sur la circonscription, coût pour les finances publiques, risque électoral ou opportunité législative. Mentionne un angle de projet de loi ou d'amendement possible si pertinent.",
    "media": "Paragraphe utilisant le registre journalistique : accroche forte, personnage humain qui incarne le problème, comparaison choquante ou chiffre inattendu. Suggère un angle d'enquête ou un format.",
    "fondation": "Paragraphe utilisant le registre philanthropique : impact mesurable, alignement avec des ODD ou priorités ESG, ROI social estimé, gap de financement non couvert par l'État.",
    "citoyen": "Paragraphe sans jargon, avec une image ou analogie du quotidien qui rend le problème immédiatement compréhensible. Se termine par une question qui invite à l'action personnelle."
  },
  "premieresEtapes": [
    {
      "numero": 1,
      "action": "Action concrète avec verbe d'action, résultat tangible attendu, et si possible nom d'un outil ou d'une démarche précise.",
      "delai": "Cette semaine",
      "ressources": "Temps estimé, compétences nécessaires, coût zéro ou minimal.",
      "contact": "URL ou nom d'organisation précise si applicable — ex: rqasf.qc.ca ou @nom_sur_linkedin"
    },
    {
      "numero": 2,
      "action": "...",
      "delai": "Dans 1 semaine",
      "ressources": "...",
      "contact": "..."
    },
    {
      "numero": 3,
      "action": "...",
      "delai": "Dans 2 semaines",
      "ressources": "...",
      "contact": "..."
    },
    {
      "numero": 4,
      "action": "...",
      "delai": "Dans 3 semaines",
      "ressources": "...",
      "contact": "..."
    },
    {
      "numero": 5,
      "action": "...",
      "delai": "Dans 30 jours",
      "ressources": "...",
      "contact": "..."
    }
  ],
  "coalitionPotentielle": [
    {
      "nom": "Nom exact de l'organisation ou de la personne",
      "pays": "Pays",
      "description": "Ce qu'ils font concrètement en lien avec ce problème — 1-2 phrases précises.",
      "lien": "https://... (URL réelle si elle existe, sinon omets ce champ)",
      "pourquoi": "Pourquoi cet acteur spécifiquement serait un allié stratégique — angle complémentaire, réseau utile, expertise précise."
    },
    {
      "nom": "...",
      "pays": "...",
      "description": "...",
      "lien": "https://...",
      "pourquoi": "..."
    },
    {
      "nom": "...",
      "pays": "...",
      "description": "...",
      "lien": "https://...",
      "pourquoi": "..."
    }
  ]
}

Réponds UNIQUEMENT avec le JSON valide. Aucun markdown. Aucun commentaire avant ou après.`
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
