// TEL — The Experience Layer
// lib/detect-mode.ts
// Détection automatique du mode d'entrée utilisateur

export type InputMode = 'url' | 'free_text' | 'keyword' | 'crossing' | 'book'

export interface DetectedInput {
  mode: InputMode
  value: string
  // For crossing mode: the two terms
  crossingTerms?: [string, string]
  // For URL mode: sub-type hint
  urlType?: 'youtube' | 'wikipedia' | 'instagram' | 'article' | 'other'
}

// ─── URL sub-type detection ────────────────────────────────────────────────────
function detectUrlType(url: string): DetectedInput['urlType'] {
  const u = url.toLowerCase()
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube'
  if (u.includes('wikipedia.org')) return 'wikipedia'
  if (u.includes('instagram.com')) return 'instagram'
  // Generic article for anything http/https
  return 'article'
}

// ─── Main detection function ───────────────────────────────────────────────────
export function detectInputMode(input: string): DetectedInput {
  const trimmed = input.trim()

  // 0. Book mode — explicit livre:/book: prefix (set by UI toggle)
  if (trimmed.toLowerCase().startsWith('livre:') || trimmed.toLowerCase().startsWith('book:')) {
    return { mode: 'book', value: trimmed }
  }

  // 1. URL — starts with http:// or https://
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return {
      mode: 'url',
      value: trimmed,
      urlType: detectUrlType(trimmed),
    }
  }

  // 2. Crossing mode — contains × or X between two terms
  // Supports: "A × B", "A×B", "A x B" (case-insensitive x with spaces)
  const crossingPattern = /^(.+?)\s*[×x]\s*(.+)$/i
  const crossingMatch = trimmed.match(crossingPattern)
  if (crossingMatch) {
    const termA = crossingMatch[1].trim()
    const termB = crossingMatch[2].trim()
    // Validate: each term should be 2–80 chars, not a URL, not too long
    if (
      termA.length >= 2 &&
      termB.length >= 2 &&
      termA.length <= 80 &&
      termB.length <= 80 &&
      !termA.startsWith('http') &&
      !termB.startsWith('http')
    ) {
      return {
        mode: 'crossing',
        value: trimmed,
        crossingTerms: [termA, termB],
      }
    }
  }

  // 3. Free text — more than 50 words
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length
  if (wordCount > 50) {
    return {
      mode: 'free_text',
      value: trimmed,
    }
  }

  // 4. Keyword — anything else (1–50 words, not URL, not crossing)
  return {
    mode: 'keyword',
    value: trimmed,
  }
}

// ─── Batch detection for multiple inputs ──────────────────────────────────────
export function detectAllModes(inputs: string[]): DetectedInput[] {
  return inputs.map(detectInputMode)
}

// ─── Mode label for UI display ─────────────────────────────────────────────────
export function getModeLabel(mode: InputMode): string {
  switch (mode) {
    case 'url': return 'URL'
    case 'free_text': return 'Texte libre'
    case 'keyword': return 'Mot-clé'
    case 'crossing': return 'Croisement ×'
    case 'book': return 'Livre / Œuvre'
  }
}

export function getModeDescription(mode: InputMode): string {
  switch (mode) {
    case 'url': return 'YouTube, Wikipedia, article, document'
    case 'free_text': return 'Témoignage direct (>50 mots)'
    case 'keyword': return 'Recherche Wikipedia FR + EN automatique'
    case 'crossing': return 'Deux concepts — LOGOS les confronte directement'
    case 'book': return 'Portrait thématique via Exa.ai'
  }
}
