// TEL — The Experience Layer
// Core TypeScript types — v2 (Niveaux 2+3+4)

export type SourceType =
  | 'youtube'
  | 'wikipedia'
  | 'article'
  | 'podcast'
  | 'instagram'
  | 'book'
  | 'free_text'
  | 'crossing'
  | 'unknown'

export type RepresentationType =
  | 'direct_testimony'
  | 'narration'
  | 'academic'
  | 'fiction'
  | 'oral_tradition'

// ─── Input Modes ──────────────────────────────────────────────────────────────
// Mode A: URL (YouTube, Wikipedia, article)
// Mode B: Free text (>50 words — direct narrative)
// Mode C: Keyword (auto Wikipedia FR+EN search)
// Mode D: Crossing (A × B — two concepts, direct LOGOS knowledge)
export type InputMode = 'url' | 'free_text' | 'keyword' | 'crossing'

// ─── Niveau 2 — Enrichissement ────────────────────────────────────────────────

export type SourceDomaine =
  | 'histoire'
  | 'science'
  | 'social'
  | 'art'
  | 'politique'
  | 'economie'
  | 'religion'
  | 'technologie'
  | 'environnement'
  | 'inconnu'

export type SourceRegion =
  | 'afrique'
  | 'asie'
  | 'amerique_latine'
  | 'moyen_orient'
  | 'amerique_nord'
  | 'europe'
  | 'oceanie'
  | 'global'
  | 'inconnue'

export interface ContexteAnalyse {
  entitesCles: string[]       // Named entities detected
  langueDetectee: string      // 'fr', 'en', 'ar', 'sw', etc.
  domaine: SourceDomaine
  region: SourceRegion
  biaisGeographique: number   // 0–100 (100 = very biased toward one region)
}

export interface SourceProposee {
  url: string
  titre: string
  type: SourceType
  langue: string
  pertinence: number          // 0–100
  raison: string              // Why this source is relevant
  region: SourceRegion
  extrait?: string            // Short excerpt (≤300 chars)
  isSudGlobal?: boolean       // Bonus: Global South perspective
  selected?: boolean          // UI state for selection
}

export interface EnrichissementProposal {
  sourcesProposees: SourceProposee[]
  contexte: ContexteAnalyse
  nombreTrouvees: number
}

// ─── Niveau 3 — Angles morts ──────────────────────────────────────────────────

export interface AngleMort {
  type: 'geographique' | 'temporel' | 'genre_posture' | 'silence'
  description: string
  regions?: SourceRegion[]    // Missing regions (for geo angles)
  suggestion?: string         // Actionable suggestion
}

export interface AnglesMortsAnalyse {
  anglesDetectes: AngleMort[]
  scoreEquilibre: number      // 0–100 (100 = balanced perspectives)
  perspectivesManquantes: string[]
  questionsEvitees: string[]
}

// ─── Niveau 4 — Mémoire des vécus ────────────────────────────────────────────

export interface Resonance {
  croisementId: string
  themeCommun: string
  patternCommun: string
  scoreSimilarite: number     // 0–100
}

// Structure ready for Supabase pgvector Phase 2
export interface InsightVectoriel {
  id: string
  sources: SourceMeta[]
  insight: InsightCard
  // embedding: number[]      // vector(1536) — Phase 2
  domaine: SourceDomaine
  regions: SourceRegion[]
  confidence: number
  timestamp: Date
}

// Raw content extracted from a URL
export interface ExtractedSource {
  url: string
  type: SourceType
  title: string
  content: string
  geographicContext: string
  geographicConfidence: number // 0–100
  inputMode?: InputMode
}

// Source metadata stored in the InsightCard
export interface SourceMeta {
  url: string
  type: SourceType
  title: string
  geographicContext: string
  geographicConfidence: number
}

// Geographic coordinate for the Living Map
export interface MapCoordinate {
  lat: number
  lng: number
  region: string
}

// The core output of a narrative crossing
export interface InsightCard {
  id: string
  theme: string
  sources: SourceMeta[]
  revealedPattern: string
  convergenceZones: string[]
  divergenceZones: string[]
  globalConfidence: number    // 0–100
  geographicRepresentativity: string
  theUnspeakable: string
  questionNoOneHasAsked: string
  sourceCoordinates: MapCoordinate[]
  createdAt: Date
  anglesMorts?: AnglesMortsAnalyse    // Niveau 3 — added after crossing
}

// Full result returned by /api/cross
export interface CrossResult {
  insight: InsightCard
  processingTime: number
  souffleNiveaux: SouffleNiveau[]
  souffleDecision: SouffleDecision
  anglesMorts?: AnglesMortsAnalyse    // Niveau 3
}

// Point on the Living Map
export interface MapPoint {
  id: string
  lat: number
  lng: number
  type: 'crossing' | 'source' | 'silent'
  label: string
  pulsePhase: number
  createdAt: number
}

// Arc connecting two points on the Living Map
export interface MapArc {
  id: string
  from: { lat: number; lng: number }
  to: { lat: number; lng: number }
  progress: number // 0–1, animation progress
  createdAt: number
}

// Raw JSON structure returned by any LOGOS model (N1/N2/N3)
export interface LogosInsightResponse {
  theme: string
  revealedPattern: string
  convergenceZones: string[]
  divergenceZones: string[]
  globalConfidence: number
  geographicRepresentativity: string
  theUnspeakable: string
  questionNoOneHasAsked: string
  sourceCoordinates: MapCoordinate[]
}
// Backward compat alias
export type ClaudeInsightResponse = LogosInsightResponse

// ─── SOUFFLE — 3 niveaux de présence IA ──────────────────────────────────────

// 1 = L'Écoute  (Ollama local — Mistral, gratuit, souverain)
// 2 = La Traversée (Mistral API, croisements profonds)
// 3 = La Révélation (Claude Anthropic, cas premium)
export type SouffleNiveau = 1 | 2 | 3

export type SouffleContexte =
  | 'exploration'        // Défaut — 2 sources, découverte libre
  | 'culturel_profond'   // 3+ sources ou croisement culturel complexe
  | 'institutionnel'     // Décisions institutionnelles critiques
  | 'langue_en_danger'   // Langues menacées de disparition
  | 'vecu_traumatique'   // Vécus fragiles, mémoire douloureuse

export interface SouffleDecision {
  niveaux: SouffleNiveau[]
  niveauPrincipal: SouffleNiveau
  raison: string
}

export interface SouffleStatut {
  niveau1: boolean       // Ollama accessible sur localhost:11434
  niveau2: boolean       // MISTRAL_API_KEY configurée
  niveau3: boolean       // ANTHROPIC_API_KEY configurée
  niveauxActifs: SouffleNiveau[]
}

// ─── SSE Streaming Events ─────────────────────────────────────────────────────

export type SSEEventType =
  | 'souffle_status'       // SOUFFLE levels available
  | 'extraction_start'     // Starting source extraction
  | 'extraction_done'      // Source extracted
  | 'crossing_start'       // Starting AI crossing
  | 'crossing_level'       // SOUFFLE level activated
  | 'section_ready'        // One InsightCard section available
  | 'angles_morts'         // Blind spots detected (Niveau 3)
  | 'complete'             // Full result ready
  | 'error'                // Error occurred

export interface SSEEvent {
  type: SSEEventType
  data?: unknown
  message?: string
}

// Callbacks for SOUFFLE streaming progress
export interface SouffleCallbacks {
  onStatus?: (statut: SouffleStatut) => void
  onExtractionStart?: (url: string, index: number) => void
  onExtractionDone?: (url: string, index: number, title: string) => void
  onCrossingStart?: (niveau: SouffleNiveau) => void
  onSectionReady?: (section: keyof LogosInsightResponse, value: unknown) => void
  onAnglesMorts?: (analyse: AnglesMortsAnalyse) => void  // Niveau 3
}

// Payload for /api/cross
export interface CrossPayload {
  inputs: string[]         // URLs, free text, keywords, or "A × B" expressions
  contexte?: SouffleContexte
  // Legacy support
  urls?: string[]
}

// Payload for /api/enrichir
export interface EnrichirPayload {
  inputs: string[]
}

// Payload for /api/extract
export interface ExtractPayload {
  url: string
}

// Session crossing entry (for sidebar)
export interface SessionCrossing {
  id: string
  theme: string
  sourceCount: number
  souffleNiveaux: SouffleNiveau[]
  createdAt: number
  card: InsightCard
  resonances?: Resonance[]       // Niveau 4
}
