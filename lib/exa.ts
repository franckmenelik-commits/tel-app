// TEL — The Experience Layer
// lib/exa.ts
// Exa API integration — book/work thematic portrait

/**
 * Fetches a thematic portrait of a book, film, or work via Exa.ai neural search.
 * Returns a compiled summary of the work's central theses, internal tensions,
 * and cultural perspectives — treated as a normal SOUFFLE source.
 */
export async function fetchBookPortrait(title: string): Promise<string> {
  const apiKey = process.env.EXA_API_KEY

  if (!apiKey) {
    return `[ŒUVRE — portrait thématique]\n\nTitre : "${title}"\n\n` +
      `[Note : EXA_API_KEY non configurée — le croisement sera basé sur la connaissance interne de LOGOS.]\n\n` +
      `Œuvre : "${title}". LOGOS utilise sa connaissance encyclopédique de cette œuvre pour produire le croisement.`
  }

  const queries = [
    `thèses principales résumé critique "${title}" signification analyse`,
    `"${title}" tensions internes perspectives culturelles réception`,
  ]

  const summaries: string[] = []
  const urls: string[] = []

  for (const query of queries) {
    try {
      const res = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          query,
          type: 'neural',
          numResults: 3,
          contents: { summary: { query } },
        }),
        signal: AbortSignal.timeout(15000),
      })

      if (!res.ok) {
        console.warn(`[Exa] Requête échouée pour "${title}" (${query.slice(0, 40)}…): ${res.status}`)
        continue
      }

      const data = await res.json()
      const results: Array<{ summary?: string; url?: string }> = data.results || []

      for (const r of results) {
        if (r.summary) summaries.push(r.summary)
        if (r.url) urls.push(r.url)
      }
    } catch (err) {
      console.warn(`[Exa] Erreur pour "${title}":`, err instanceof Error ? err.message : err)
    }
  }

  if (summaries.length === 0) {
    return `[ŒUVRE — portrait thématique]\n\nTitre : "${title}"\n\n` +
      `[Note : Aucun résumé Exa disponible — LOGOS utilise sa connaissance interne de cette œuvre.]\n\n` +
      `Œuvre : "${title}". Croisement basé sur la connaissance encyclopédique de LOGOS.`
  }

  const portrait = [
    `PORTRAIT THÉMATIQUE — "${title}"`,
    `Compilé via Exa.ai (analyses et critiques disponibles sur le web)`,
    `Sources consultées : ${urls.length > 0 ? urls.slice(0, 3).join(', ') : 'non disponibles'}`,
    ``,
    ...summaries.map((s, i) => `[Analyse ${i + 1}]\n${s}`),
  ].join('\n\n')

  return portrait.slice(0, 6000)
}
