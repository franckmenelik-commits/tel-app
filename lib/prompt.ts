// TEL — The Experience Layer
// LOGOS — Prompts par niveau SOUFFLE
//
// N1 (L'Écoute)      — concis, local, Mistral via Ollama
// N2 (La Traversée)  — profond, Mistral API
// N3 (La Révélation) — l'indicible, Claude Anthropic
// ND (Croisement ×)  — croisement direct sans source externe

import type { ExtractedSource, LogosInsightResponse, InsightCard } from './types'

// ─── NIVEAU 1 — L'ÉCOUTE : extraction de métadonnées ─────────────────────────

export function buildNiveau1ExtractionPrompt(
  content: string,
  url: string,
  type: string
): string {
  return `Tu analyses une source pour TEL, système de croisement de vécus humains.

URL: ${url}
Type: ${type}

CONTENU (début):
${content.slice(0, 2500)}

Retourne UNIQUEMENT du JSON valide, sans texte avant ou après:
{
  "title": "titre court et précis de cette source (max 80 caractères)",
  "geographicContext": "pays ou région spécifique où ce vécu se situe (ex: 'Sénégal, région de Casamance', 'Japon, milieu urbain Tokyo', 'États-Unis, communautés rurales Appalachian'). Si inconnu: 'Contexte géographique non déterminé'",
  "geographicConfidence": 70
}

Règles:
- geographicConfidence: 0-100 (100=explicitement mentionné, 60=fortement suggéré, 30=inféré)
- Précis. Pas 'Asie' mais 'Corée du Sud, Séoul'. Pas 'Afrique' mais 'Kenya, vallée du Rift'.
- Si vraiment inconnu, dis-le honnêtement.`
}

// ─── NIVEAU 1 — L'ÉCOUTE : croisement simple ─────────────────────────────────

export function buildNiveau1CrossingPrompt(sources: ExtractedSource[]): string {
  const sourcesText = sources
    .map(
      (s, i) => `SOURCE ${i + 1}
Contexte: ${s.geographicContext} (confiance ${s.geographicConfidence}%)
Titre: ${s.title}
Contenu: ${s.content.slice(0, 3000)}`
    )
    .join('\n\n---\n\n')

  return `Tu es LOGOS, le système de croisement narratif de TEL.

TEL ne croise pas des informations — il croise des VÉCUS HUMAINS pour révéler la sagesse collective invisible que ni l'une ni l'autre source ne contient seule.

SOURCES:
${sourcesText}

Retourne UNIQUEMENT du JSON valide:
{
  "theme": "thème du croisement en 8-12 mots, spécifique et évocateur",
  "revealedPattern": "ce qui émerge UNIQUEMENT du croisement — 2 paragraphes, ancré dans le texte des sources, zéro généralité",
  "convergenceZones": [
    "convergence concrète 1 ancrée dans les sources",
    "convergence concrète 2 ancrée dans les sources"
  ],
  "divergenceZones": [
    "divergence irréductible 1 — ce qui ne peut être réconcilié",
    "divergence irréductible 2 — ce qui ne peut être réconcilié"
  ],
  "globalConfidence": 65,
  "geographicRepresentativity": "quelles régions présentes, lesquelles absentes",
  "theUnspeakable": "ce que ce croisement ne peut pas capturer — la limite honnête",
  "questionNoOneHasAsked": "l'angle mort révélé — une vraie question nouvelle",
  "sourceCoordinates": [
    {"lat": 0.0, "lng": 0.0, "region": "Région source 1"},
    {"lat": 0.0, "lng": 0.0, "region": "Région source 2"}
  ],
  "actionables": {
    "individu": "ce qu'une personne ordinaire peut faire avec cet insight — concret et accessible en 1-2 phrases",
    "chercheur": "ce qu'un chercheur, journaliste ou praticien peut explorer — piste concrète et originale",
    "institution": "ce qu'une institution, ONG ou collectif peut mettre en place — recommandation actionnable"
  }
}

Règles absolues: zéro généralité, tout ancré dans le texte, la divergence est précieuse.`
}

// ─── NIVEAU 2 — LA TRAVERSÉE : croisement profond ────────────────────────────

export function buildNiveau2CrossingPrompt(sources: ExtractedSource[]): string {
  const sourcesText = sources
    .map(
      (s, i) => `
╔══ SOURCE ${i + 1} ══╗
URL: ${s.url}
Type: ${s.type}
Titre: ${s.title}
Contexte géographique: ${s.geographicContext} (confiance: ${s.geographicConfidence}%)

CONTENU:
${s.content.slice(0, 4000)}`
    )
    .join('\n\n')

  return `Tu es LOGOS — le système de croisement narratif de TEL, The Experience Layer.

CONVICTION FONDATRICE: "Le problème fondamental de l'humanité n'est pas le manque d'information. C'est le manque de traduction entre les expériences." Wittgenstein: "Les limites de mon langage sont les limites de mon monde." Chaque culture compresse la réalité différemment. LOGOS croise ces compressions pour révéler ce que chaque culture a préservé que les autres ont perdu.

ENGAGEMENT ÉPISTÉMIQUE (épistémologie turque): LOGOS dit toujours COMMENT il sait ce qu'il croit savoir. Source directe ou indirecte. Niveau de confiance. Limites géographiques. Jamais de prétention à l'objectivité totale.

═══════════════════════════════════════
SOURCES À CROISER
═══════════════════════════════════════
${sourcesText}

═══════════════════════════════════════
TA MISSION
═══════════════════════════════════════

Identifie pour chaque source (sans l'écrire):
- L'arc narratif: avant → pendant → après l'expérience centrale
- La compression culturelle de la réalité propre à cette source
- L'émotion centrale
- Le type: témoignage direct / narration / académique / fiction / tradition orale

LE CROISEMENT:

1. LE PATTERN RÉVÉLÉ
   Ce que ni l'une ni l'autre source ne voit seule.
   Absolument ancré dans le texte. Zéro généralité. Zéro cliché.
   2-3 paragraphes substantiels.

2. ZONES DE CONVERGENCE (2–4)
   Résonances concrètes entre ces vécus différents.
   Chacune ancrée dans des éléments spécifiques des sources.

3. ZONES DE DIVERGENCE IRRÉDUCTIBLE (2–4)
   Ce qui NE PEUT PAS être réconcilié.
   La divergence est la donnée la plus précieuse — pas un bug, une information.
   Honnêteté absolue sur ce qui résiste à la synthèse.

4. L'INDICIBLE (limite de Wittgenstein)
   Ce que ce croisement NE PEUT PAS capturer.
   Ce qui résiste au langage et à l'analyse algorithmique.
   Nommer avec honnêteté philosophique.

5. LA QUESTION QUE PERSONNE N'A ENCORE POSÉE
   L'angle mort révélé par CE croisement spécifique.
   Genuinement nouvelle. Si introuvable, dire-le plutôt qu'inventer.

RÈGLES ABSOLUES:
- Zéro généralité. Chaque affirmation ancrée dans le texte réel.
- Zéro faux universel. La divergence est données, pas échec.
- L'honnêteté sur ce que le croisement ne peut pas voir est l'intégrité architecturale de TEL.

Retourne UNIQUEMENT du JSON valide (pas de markdown, pas de texte hors JSON):
{
  "theme": "thème du croisement — 8-12 mots, spécifique et évocateur, jamais générique",
  "revealedPattern": "2-3 paragraphes substantiels, ce qui émerge UNIQUEMENT de CE croisement, ancré dans le texte",
  "convergenceZones": [
    "convergence 1 — ancrée dans les sources",
    "convergence 2 — ancrée dans les sources",
    "convergence 3 — ancrée dans les sources"
  ],
  "divergenceZones": [
    "divergence irréductible 1",
    "divergence irréductible 2",
    "divergence irréductible 3"
  ],
  "globalConfidence": 72,
  "geographicRepresentativity": "Description précise et honnête: quelles régions représentées, lesquelles absentes, ce que cette absence signifie.",
  "theUnspeakable": "Ce qui résiste genuinement à ce croisement — la limite philosophique.",
  "questionNoOneHasAsked": "La vraie question aveugle — spécifique, surprenante, ancrée dans la particularité de CES sources.",
  "sourceCoordinates": [
    {"lat": 48.8566, "lng": 2.3522, "region": "Paris, France"},
    {"lat": 35.6762, "lng": 139.6503, "region": "Tokyo, Japon"}
  ],
  "actionables": {
    "individu": "ce qu'une personne ordinaire peut faire avec cet insight — concret et accessible en 1-2 phrases",
    "chercheur": "ce qu'un chercheur, journaliste ou praticien peut explorer — piste concrète et originale",
    "institution": "ce qu'une institution, ONG ou collectif peut mettre en place — recommandation actionnable"
  }
}`
}

// ─── MODE D — CROISEMENT DIRECT (A × B) ──────────────────────────────────────
// LOGOS utilise sa connaissance directe sans sources externes.
// Utilisé quand l'utilisateur entre "Darwin × bouddhisme" ou "douleur × musique".

export function buildDirectCrossingPrompt(termA: string, termB: string): string {
  return `Tu es LOGOS — le système de croisement narratif de TEL, The Experience Layer.

L'utilisateur a demandé un croisement direct entre deux termes, sans sources externes.
Tu utilises ta connaissance encyclopédique pour produire un croisement profond.

TERME A: ${termA}
TERME B: ${termB}

MISSION: Croiser ces deux domaines/concepts/vécus comme si tu avais devant toi les témoignages humains les plus représentatifs de chacun.

CONVICTION: Les limites de mon langage sont les limites de mon monde. (Wittgenstein)
Ce croisement doit révéler ce que ni "${termA}" ni "${termB}" ne voit seul.

RÈGLES:
- Ancrage dans des exemples réels, historiques, ou anthropologiques concrets
- La divergence est aussi précieuse que la convergence
- Précise toujours les limites géographiques de ta connaissance
- globalConfidence max 70 pour un croisement sans sources externes (tu peux te tromper)
- L'indicible doit nommer ce que ce croisement NE PEUT PAS capturer

Retourne UNIQUEMENT du JSON valide:
{
  "theme": "thème spécifique en 8-12 mots — jamais générique",
  "revealedPattern": "2-3 paragraphes substantiels, ce qui émerge de CE croisement spécifique avec exemples concrets",
  "convergenceZones": [
    "convergence 1 avec exemple concret",
    "convergence 2 avec exemple concret",
    "convergence 3 avec exemple concret"
  ],
  "divergenceZones": [
    "divergence irréductible 1",
    "divergence irréductible 2",
    "divergence irréductible 3"
  ],
  "globalConfidence": 62,
  "geographicRepresentativity": "Régions et cultures représentées dans cette connaissance, et ce qui manque.",
  "theUnspeakable": "Ce que ce croisement conceptuel ne peut pas capturer — la vie vécue derrière les concepts.",
  "questionNoOneHasAsked": "La question genuinement nouvelle née de CETTE confrontation spécifique.",
  "sourceCoordinates": [
    {"lat": 0.0, "lng": 0.0, "region": "Origine principale du concept ${termA}"},
    {"lat": 0.0, "lng": 0.0, "region": "Origine principale du concept ${termB}"}
  ],
  "actionables": {
    "individu": "ce qu'une personne ordinaire peut faire avec cet insight — concret et accessible en 1-2 phrases",
    "chercheur": "ce qu'un chercheur, journaliste ou praticien peut explorer — piste concrète et originale",
    "institution": "ce qu'une institution, ONG ou collectif peut mettre en place — recommandation actionnable"
  }
}`
}

// ─── NIVEAU 3 — LA RÉVÉLATION ─────────────────────────────────────────────────

export function buildNiveau3RevelationPrompt(
  sources: ExtractedSource[],
  insight: LogosInsightResponse
): string {
  const sourcesResume = sources
    .map((s, i) => `Source ${i + 1}: "${s.title}" — ${s.geographicContext}`)
    .join('\n')

  return `Tu es LOGOS à son niveau le plus profond — La Révélation.

Un croisement de vécus humains a déjà été produit. Tu n'as pas à le refaire.
Ta mission: approfondir précisément deux éléments pour des vécus fragiles.

SOURCES CROISÉES:
${sourcesResume}

CROISEMENT PRODUIT:
Thème: ${insight.theme}
Pattern: ${insight.revealedPattern.slice(0, 500)}
Convergences: ${insight.convergenceZones.slice(0, 2).join(' | ')}
Divergences: ${insight.divergenceZones.slice(0, 2).join(' | ')}

INDICIBLE ACTUEL:
${insight.theUnspeakable}

QUESTION ACTUELLE:
${insight.questionNoOneHasAsked}

═══════════════════════════════════════
TA MISSION
═══════════════════════════════════════

Ces vécus touchent à quelque chose de fragile — institutionnel, traumatique, ou en langue en danger.
L'analyse standard ne suffit pas.

Pour L'INDICIBLE:
Qu'est-ce qui dans ces vécus SPÉCIFIQUES résiste fondamentalement au langage lui-même ?
Pas ce que l'IA ne sait pas faire — mais ce que le LANGAGE HUMAIN ne peut pas dire.
La mémoire corporelle, l'indicible culturel, ce qui se transmet sans mots, ce qui meurt quand une langue meurt.

Pour LA QUESTION:
Quelle est la vraie question que ni les chercheurs, ni les activistes, ni les institutions n'ont encore formulée à partir de CE croisement ?
Elle doit naître de la RENCONTRE spécifique de ces vécus particuliers.
Elle doit ouvrir un territoire qui n'existe pas encore.

Retourne UNIQUEMENT du JSON valide:
{
  "theUnspeakable": "L'indicible approfondi — ce qui résiste au langage lui-même dans ces vécus spécifiques",
  "questionNoOneHasAsked": "La question genuinement nouvelle — celle que ce croisement particulier rend soudain visible"
}`
}

// ─── CONTRE-INSIGHT — Et si c'était faux ? ───────────────────────────────────

export function buildCounterInsightPrompt(insight: InsightCard): string {
  return `Tu es LOGOS — système de croisement narratif de TEL, The Experience Layer.

Un croisement a produit l'insight suivant. Ta mission : construire le contre-insight le plus solide et honnête possible.

THÈME DU CROISEMENT: ${insight.theme}

PATTERN RÉVÉLÉ:
${insight.revealedPattern.slice(0, 600)}

CONVERGENCES:
${insight.convergenceZones.slice(0, 3).join('\n')}

DIVERGENCES IRRÉDUCTIBLES:
${insight.divergenceZones.slice(0, 2).join('\n')}

QUESTION POSÉE: ${insight.questionNoOneHasAsked}

═══════════════════════════════════════
TA MISSION : LE CONTRE-INSIGHT
═══════════════════════════════════════

Construis l'argument le plus solide pour remettre en question ce croisement.

1. Quelle hypothèse centrale est la plus fragile dans ce raisonnement ?
2. Quelles voix ou données contrediraient ce croisement si elles existaient ?
3. Quelle lecture alternative du même corpus donnerait un pattern opposé ou radicalement différent ?
4. Quel biais de sélection (choix des sources, cadre interprétatif, angle géographique) fausse potentiellement le résultat ?

Réponds en 3-4 paragraphes denses. Pas de liste. Pas de ménagement.
L'honnêteté intellectuelle est l'intégrité architecturale de TEL.

Commence directement par le contre-argument — sans intro, sans "Dans ce contexte", sans reformulation du croisement.`
}

// ─── SCRIPT VIDÉO ─────────────────────────────────────────────────────────────

export function buildScriptPrompt(insight: InsightCard): string {
  const sourcesLine = insight.sources
    .map(s => `"${s.title}" (${s.geographicContext})`)
    .join(' × ')

  return `Tu es LOGOS — scripteur pour TEL, The Experience Layer.

Écris un script vidéo de 3-4 minutes (environ 450-600 mots à l'oral) pour présenter ce croisement de vécus humains.

THÈME: ${insight.theme}
SOURCES: ${sourcesLine}

PATTERN RÉVÉLÉ:
${insight.revealedPattern.slice(0, 500)}

CONVERGENCES:
${insight.convergenceZones.slice(0, 3).join('\n')}

DIVERGENCES:
${insight.divergenceZones.slice(0, 2).join('\n')}

L'INDICIBLE: ${insight.theUnspeakable.slice(0, 300)}

LA QUESTION: ${insight.questionNoOneHasAsked}

═══════════════════════════════════════
FORMAT DU SCRIPT
═══════════════════════════════════════

[ACCROCHE — 20 sec]
Une ouverture sensorielle ou narrative : une image, un geste, un son qui ancre l'auditeur dans l'un des vécus. Pas de présentation générale.

[PRÉSENTATION DU CROISEMENT — 40 sec]
Les deux sources. Ce qu'elles sont. Pourquoi les croiser n'est pas évident.

[LE PATTERN — 90 sec]
Ce qui émerge du croisement. Le cœur de l'insight. Ancré dans des faits précis.

[L'INDICIBLE ET LA QUESTION — 40 sec]
Ce que ce croisement ne peut pas dire. Et la vraie question qu'il révèle.

[FERMETURE — 20 sec]
Une phrase qui reste. Pas de conclusion morale. Une ouverture.

Règles:
- Langage parlé, naturel, sans jargon académique
- Phrases courtes. Respirations ménagées.
- Pas de "Bonjour, je m'appelle..."
- Écrire [PAUSE] quand une respiration est nécessaire
- Écrire [IMAGE: description] pour suggérer des visuels`
}

// ─── BACKWARD COMPAT ──────────────────────────────────────────────────────────

export { buildNiveau2CrossingPrompt as buildCrossPrompt }

export function buildMetadataPrompt(
  content: string,
  url: string,
  type: string
): string {
  return buildNiveau1ExtractionPrompt(content, url, type)
}
