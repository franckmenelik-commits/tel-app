// TEL — The Experience Layer
// lib/parse-llm.ts — Parse robuste des réponses JSON des LLMs
//
// Les LLMs écrivent parfois des caractères de contrôle littéraux
// (vrais sauts de ligne, tabs) à l'intérieur des valeurs JSON string,
// ce qui produit "Bad control character in string literal in JSON".
// Cette fonction nettoie le JSON avant de le parser.

/**
 * Extrait et parse le premier objet JSON d'un texte LLM.
 * Échappe automatiquement les caractères de contrôle dans les chaînes.
 */
export function parseLLMJson<T = unknown>(raw: string): T {
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Réponse LLM sans JSON valide')
  }

  const json = jsonMatch[0]

  // 1er essai — parse direct (cas nominal)
  try {
    return JSON.parse(json) as T
  } catch {
    // 2ème essai — on échappe les caractères de contrôle dans les string values
    const sanitized = sanitizeJsonString(json)
    return JSON.parse(sanitized) as T
  }
}

/**
 * Échappe les caractères de contrôle ASCII (0x00–0x1F) qui se trouvent
 * à l'intérieur des valeurs string d'un JSON.
 * Utilise un automate simple (pas de regex récursif) pour rester rapide.
 */
function sanitizeJsonString(json: string): string {
  let result = ''
  let inString = false
  let escaped = false

  for (let i = 0; i < json.length; i++) {
    const ch = json[i]
    const code = json.charCodeAt(i)

    if (escaped) {
      result += ch
      escaped = false
      continue
    }

    if (ch === '\\' && inString) {
      result += ch
      escaped = true
      continue
    }

    if (ch === '"') {
      inString = !inString
      result += ch
      continue
    }

    if (inString && code < 0x20) {
      // Caractère de contrôle dans une string — on l'échappe
      switch (ch) {
        case '\n': result += '\\n'; break
        case '\r': result += '\\r'; break
        case '\t': result += '\\t'; break
        default:   result += '\\u' + code.toString(16).padStart(4, '0')
      }
      continue
    }

    result += ch
  }

  return result
}
