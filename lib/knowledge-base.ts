// TEL — The Experience Layer
// lib/knowledge-base.ts
// Architecture Pinecone + Exa — Phase 2
//
// PHASE 2 PLAN:
// 1. Connect Pinecone (vector DB) to store embeddings of all knowledge sources
// 2. Connect Exa.ai (semantic search) to discover relevant sources by meaning
// 3. At crossing time, LOGOS will query this base for the 3 most resonant sources
//    to enrich the cross with wisdom that wasn't explicitly provided by the user
//
// For now: interfaces and placeholder functions only. No live connections.

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface KnowledgeSource {
  id?: string
  title: string
  author?: string
  themes: string[]               // e.g. ['résilience', 'économie', 'vécu']
  embeddings_id?: string         // Pinecone vector ID once indexed
  type?: 'book' | 'article' | 'testimony' | 'academic' | 'oral' | 'fiction'
  geographicOrigin?: string      // e.g. 'Afrique subsaharienne', 'Europe'
  language?: string              // ISO 639-1 code: 'fr', 'en', 'sw', etc.
  yearPublished?: number
  excerpt?: string               // Short excerpt for display (≤500 chars)
}

export interface WisdomSearchResult {
  source: KnowledgeSource
  relevanceScore: number         // 0–100
  resonanceReason: string        // Why this source resonates with the query
}

// ─── Pinecone placeholder ─────────────────────────────────────────────────────
// Phase 2: Replace with @pinecone-database/pinecone

export async function connectToPinecone(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _apiKey: string
): Promise<{ connected: boolean; indexName: string }> {
  // Phase 2: Initialize Pinecone client
  // const pinecone = new Pinecone({ apiKey })
  // return pinecone.index('tel-wisdom')
  console.warn('[TEL] Pinecone not yet connected — Phase 2')
  return { connected: false, indexName: 'tel-wisdom' }
}

// ─── Exa.ai placeholder ───────────────────────────────────────────────────────
// Phase 2: Replace with exa-js SDK
// Exa searches by semantic meaning, not keywords — ideal for finding
// sources that "resonate" with a query rather than match it lexically.

export async function searchWisdom(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _query: string
): Promise<WisdomSearchResult[]> {
  // Phase 2: Call Exa API
  // const exa = new Exa(process.env.EXA_API_KEY)
  // const results = await exa.searchAndContents(query, { type: 'neural', numResults: 5 })
  // return results.map(r => ({ source: ..., relevanceScore: ..., resonanceReason: ... }))
  console.warn('[TEL] Exa search not yet connected — Phase 2')
  return []
}

// ─── Index a source into Pinecone ─────────────────────────────────────────────

export async function indexSource(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _source: KnowledgeSource
): Promise<{ indexed: boolean; id: string }> {
  // Phase 2: Embed the source text and upsert into Pinecone
  // const embedding = await getEmbedding(source.excerpt || source.title)
  // await index.upsert([{ id: source.id, values: embedding, metadata: source }])
  console.warn('[TEL] Source indexing not yet connected — Phase 2')
  return { indexed: false, id: '' }
}

// ─── 50 Root Sources — The TEL Knowledge Vault ────────────────────────────────
// These are the foundational works that will seed TEL's wisdom base in Phase 2.
// Priority: texts that capture lived experience, systemic critique, and
// epistemological humility — not just academic authority.

export const ROOT_SOURCES: KnowledgeSource[] = [
  // ── Philosophie & Sagesse ───────────────────────────────────────────────────
  { title: 'Les Villes Invisibles', author: 'Italo Calvino', themes: ['imagination', 'structure', 'mémoire'], type: 'fiction', geographicOrigin: 'Italie', language: 'fr' },
  { title: 'Le Mythe de Sisyphe', author: 'Albert Camus', themes: ['absurde', 'résilience', 'sens'], type: 'book', geographicOrigin: 'France / Algérie', language: 'fr' },
  { title: "La Condition de l'homme moderne", author: 'Hannah Arendt', themes: ['action', 'politique', 'dignité'], type: 'academic', geographicOrigin: 'États-Unis / Europe', language: 'fr' },
  { title: 'Méditations', author: 'Marc Aurèle', themes: ['stoïcisme', 'résilience', 'pouvoir'], type: 'book', geographicOrigin: 'Rome antique', language: 'fr' },
  { title: 'Tao Tö King', author: 'Lao Tseu', themes: ['équilibre', 'non-action', 'sagesse'], type: 'book', geographicOrigin: 'Chine ancienne', language: 'fr' },
  { title: 'Le Prophète', author: 'Khalil Gibran', themes: ['amour', 'liberté', 'deuil'], type: 'fiction', geographicOrigin: 'Liban / États-Unis', language: 'fr' },
  { title: 'Fragments', author: 'Héraclite', themes: ['changement', 'feu', 'logos'], type: 'oral', geographicOrigin: 'Grèce antique', language: 'fr' },
  { title: 'Critique de la raison pure', author: 'Kant', themes: ["temps", 'espace', 'connaissance'], type: 'academic', geographicOrigin: 'Prusse / Europe', language: 'fr' },
  { title: 'Éthique', author: 'Spinoza', themes: ['émotion', 'raison', 'liberté'], type: 'academic', geographicOrigin: 'Pays-Bas', language: 'fr' },
  { title: 'Ainsi parlait Zarathoustra', author: 'Nietzsche', themes: ['volonté', 'dépassement', 'valeurs'], type: 'book', geographicOrigin: 'Allemagne', language: 'fr' },
  // ── Sociologie & Réalité Terrain ────────────────────────────────────────────
  { title: 'La Misère du monde', author: 'Pierre Bourdieu', themes: ['précarité', 'témoignage', 'vécu'], type: 'academic', geographicOrigin: 'France', language: 'fr' },
  { title: 'Les Damnés de la terre', author: 'Frantz Fanon', themes: ['colonialisme', 'violence', 'libération'], type: 'academic', geographicOrigin: 'Martinique / Algérie', language: 'fr' },
  { title: 'Asiles', author: 'Erving Goffman', themes: ['institution', 'identité', 'stigmate'], type: 'academic', geographicOrigin: 'États-Unis', language: 'fr' },
  { title: 'La Distinction', author: 'Pierre Bourdieu', themes: ['classe', 'goût', 'reproduction'], type: 'academic', geographicOrigin: 'France', language: 'fr' },
  { title: 'Le Quai de Ouistreham', author: 'Florence Aubenas', themes: ['précarité', 'travail', 'invisibilité'], type: 'testimony', geographicOrigin: 'France', language: 'fr' },
  { title: 'Par-delà nature et culture', author: 'Philippe Descola', themes: ['anthropologie', 'nature', 'cosmologie'], type: 'academic', geographicOrigin: 'France / Amazonie', language: 'fr' },
  { title: "Une Farouche liberté", author: 'Gisèle Halimi', themes: ['justice', 'genre', 'résistance'], type: 'testimony', geographicOrigin: 'Tunisie / France', language: 'fr' },
  // ── Économie & Psychologie ──────────────────────────────────────────────────
  { title: 'The Psychology of Money', author: 'Morgan Housel', themes: ['argent', 'comportement', 'vécu'], type: 'book', geographicOrigin: 'États-Unis', language: 'en' },
  { title: 'Système 1 / Système 2', author: 'Daniel Kahneman', themes: ['cognition', 'biais', 'décision'], type: 'academic', geographicOrigin: 'États-Unis / Israël', language: 'fr' },
  { title: 'Le Capital au XXIe siècle', author: 'Thomas Piketty', themes: ['inégalités', 'capital', 'histoire'], type: 'academic', geographicOrigin: 'France', language: 'fr' },
  { title: 'Debt: The First 5,000 Years', author: 'David Graeber', themes: ['dette', 'morale', 'économie'], type: 'academic', geographicOrigin: 'États-Unis', language: 'en' },
  { title: 'Small is Beautiful', author: 'E.F. Schumacher', themes: ['décroissance', 'échelle', 'dignité'], type: 'book', geographicOrigin: 'Royaume-Uni', language: 'en' },
  { title: "L'Intelligence émotionnelle", author: 'Daniel Goleman', themes: ['émotion', 'empathie', 'intelligence'], type: 'book', geographicOrigin: 'États-Unis', language: 'fr' },
  { title: 'Atomic Habits', author: 'James Clear', themes: ['habitude', 'changement', 'identité'], type: 'book', geographicOrigin: 'États-Unis', language: 'en' },
  // ── Littérature & Vécus ─────────────────────────────────────────────────────
  { title: "L'Alchimiste", author: 'Paulo Coelho', themes: ['quête', 'destin', 'résilience'], type: 'fiction', geographicOrigin: 'Brésil', language: 'fr' },
  { title: 'Les Misérables', author: 'Victor Hugo', themes: ['pauvreté', 'justice', 'révolution'], type: 'fiction', geographicOrigin: 'France', language: 'fr' },
  { title: '1984', author: 'George Orwell', themes: ['contrôle', 'vérité', 'résistance'], type: 'fiction', geographicOrigin: 'Royaume-Uni', language: 'fr' },
  { title: "Si c'est un homme", author: 'Primo Levi', themes: ['trauma', 'dignité', 'mémoire'], type: 'testimony', geographicOrigin: 'Italie', language: 'fr' },
  { title: "Man's Search for Meaning", author: 'Viktor Frankl', themes: ['sens', 'survie', 'liberté intérieure'], type: 'testimony', geographicOrigin: 'Autriche', language: 'en' },
  { title: 'Cent ans de solitude', author: 'Gabriel García Márquez', themes: ['mémoire', 'temps', 'identité collective'], type: 'fiction', geographicOrigin: 'Colombie', language: 'fr' },
  { title: 'La Métamorphose', author: 'Kafka', themes: ['aliénation', 'identité', 'système'], type: 'fiction', geographicOrigin: 'Bohême / Autriche', language: 'fr' },
  { title: 'En attendant Godot', author: 'Samuel Beckett', themes: ['attente', 'temps', 'sens'], type: 'fiction', geographicOrigin: 'Irlande / France', language: 'fr' },
  { title: 'Les Frères Karamazov', author: 'Dostoïevski', themes: ['foi', 'culpabilité', 'liberté'], type: 'fiction', geographicOrigin: 'Russie', language: 'fr' },
  { title: 'Don Quichotte', author: 'Cervantès', themes: ['illusion', 'idéalisme', 'folie'], type: 'fiction', geographicOrigin: 'Espagne', language: 'fr' },
  { title: 'Le Meilleur des mondes', author: 'Aldous Huxley', themes: ['technologie', 'bonheur contrôlé', 'liberté'], type: 'fiction', geographicOrigin: 'Royaume-Uni', language: 'fr' },
]
