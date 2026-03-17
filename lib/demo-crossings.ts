// TEL — The Experience Layer
// lib/demo-crossings.ts
// 5 croisements pré-générés — exemples de la profondeur de TEL
// Ces croisements illustrent la vision : des vécus qui ne se seraient jamais rencontrés.

import type { InsightCard, MapPoint, MapArc } from './types'

// ─── Helper ───────────────────────────────────────────────────────────────────

function makeId(prefix: string): string {
  return `demo-${prefix}-${Date.now()}`
}

// ─── CROISEMENT 1 — Félix Moumié × Patrice Lumumba ───────────────────────────
// Deux résistances africaines contemporaines qui ne se sont jamais rencontrées.
// Moumié (Cameroun) × Lumumba (Congo) — même blessure coloniale, deux trajectoires.

export const DEMO_MOUMOUE_LUMUMBA: InsightCard = {
  id: 'demo-moumoue-lumumba',
  theme: 'Résistances coloniales — la blessure partagée',
  sources: [
    {
      url: 'https://fr.wikipedia.org/wiki/F%C3%A9lix-Roland_Moumi%C3%A9',
      type: 'wikipedia',
      title: 'Félix-Roland Moumié — Wikipedia FR',
      geographicContext: 'Cameroun (Afrique centrale)',
      geographicConfidence: 92,
    },
    {
      url: 'https://fr.wikipedia.org/wiki/Patrice_Lumumba',
      type: 'wikipedia',
      title: 'Patrice Lumumba — Wikipedia FR',
      geographicContext: 'Congo-Kinshasa (Afrique centrale)',
      geographicConfidence: 95,
    },
  ],
  revealedPattern:
    'Moumié et Lumumba ont tous deux été assassinés en 1960–1961, à quelques mois d\'intervalle, par des opérations impliquant leurs anciens colonisateurs. Les deux portaient un projet continental : pas seulement l\'indépendance de leur pays, mais l\'unité africaine. Ce pattern révèle que la décolonisation n\'a jamais été perdue par hasard — elle a été systématiquement sabotée au moment précis de sa victoire.',
  convergenceZones: [
    'Assassinats commandités par des puissances occidentales (France/Belgique/CIA) en 1960–1961',
    'Vision panafricaine : au-delà des frontières coloniales héritées',
    'Refus de la néocolonisation économique après l\'indépendance politique',
    'Fin brutale au moment du plus grand espoir — l\'indépendance obtenue',
    'Réhabilitation posthume décennies après leur mort',
  ],
  divergenceZones: [
    'Moumié opère depuis l\'exil (Genève, Conakry) — Lumumba depuis l\'intérieur du pouvoir',
    'Moumié est marxiste convaincu, aligné Bloc soviétique — Lumumba cherche neutralisme',
    'Moumié meurt empoisonné par la SDECE française — Lumumba fusillé avec complicité belge-CIA',
    'Le Cameroun accède à l\'indépendance sans Moumié — le Congo s\'effondre avec Lumumba',
  ],
  globalConfidence: 88,
  geographicRepresentativity:
    'Afrique centrale (Cameroun + Congo). Cette analyse manque les perspectives des colonisateurs eux-mêmes — leur absence des sources est un silence politique délibéré.',
  theUnspeakable:
    'Ce croisement ne peut pas capturer ce que Moumié et Lumumba auraient pensé l\'un de l\'autre. Il ne peut pas rendre le poids de savoir — comme ils le savaient — qu\'ils allaient mourir. Il ne peut pas rendre la rage lucide de ceux qui ont choisi la résistance en sachant le prix.',
  questionNoOneHasAsked:
    'Si Moumié et Lumumba s\'étaient rencontrés à Accra en 1960, quelle Afrique auraient-ils imaginée ensemble — et pourquoi cette réunion n\'a jamais eu lieu ?',
  sourceCoordinates: [
    { lat: 3.8480, lng: 11.5021, region: 'Cameroun (Yaoundé)' },
    { lat: -4.3216, lng: 15.3216, region: 'Congo (Kinshasa)' },
  ],
  createdAt: new Date('2024-06-15T00:00:00Z'),
}

// ─── CROISEMENT 2 — Physique quantique × Cosmologie Hopi ─────────────────────
// Niels Bohr : "L'électron n'existe pas avant qu'on l'observe."
// Cosmologie Hopi : le monde est co-créé par l'observation collective.

export const DEMO_BOHR_HOPI: InsightCard = {
  id: 'demo-bohr-hopi',
  theme: 'L\'observation crée-t-elle la réalité ?',
  sources: [
    {
      url: 'https://en.wikipedia.org/wiki/Copenhagen_interpretation',
      type: 'wikipedia',
      title: 'Copenhagen Interpretation — Wikipedia EN',
      geographicContext: 'Danemark / Europe occidentale (science académique)',
      geographicConfidence: 85,
    },
    {
      url: 'https://en.wikipedia.org/wiki/Hopi_mythology',
      type: 'wikipedia',
      title: 'Hopi mythology — Wikipedia EN',
      geographicContext: 'Arizona, États-Unis (Pueblos du Sud-Ouest)',
      geographicConfidence: 62,
    },
  ],
  revealedPattern:
    'La mécanique quantique de Copenhague et la cosmologie Hopi arrivent, depuis des épistémologies radicalement différentes, à une conclusion structurellement identique : la réalité non observée est indéterminée. Pour Bohr, l\'électron est une probabilité jusqu\'à la mesure. Pour les Hopi, le monde physique émerge de la conscience collective des êtres qui le chantent. Deux langages incommensurables — une intuition partagée sur la nature de l\'existence.',
  convergenceZones: [
    'L\'observation/conscience comme condition de la réalité manifeste',
    'Rejet du monde-objet indépendant de l\'observateur',
    'La réalité comme processus, non comme état fixe',
    'L\'indétermination fondamentale avant la mesure/intention',
  ],
  divergenceZones: [
    'Bohr : observateur = instrument de mesure physique. Hopi : observateur = conscience collective ceremonielle',
    'La physique quantique est réfutable, falsifiable. La cosmologie Hopi est ontologique, non testable',
    'Bohr désacralise la réalité. Les Hopi la re-sacralisent en permanence par le rituel',
    'La physique opère sur l\'infiniment petit. La cosmologie Hopi opère sur le cosmos habité',
    'La langue Hopi n\'a pas de temps grammatical — le futur et passé sont des modes d\'intensité, pas des temps linéaires',
  ],
  globalConfidence: 71,
  geographicRepresentativity:
    'Europe du Nord (physique académique) + Pueblos du Sud-Ouest américain. ALERTE : la cosmologie Hopi est ici représentée via des sources académiques externes — les voix Hopi elles-mêmes sont absentes. Ce croisement a une dette épistémique envers la communauté Hopi.',
  theUnspeakable:
    'Ce croisement ne peut pas capturer ce que ressentent les physiciens qui découvrent cette convergence — ni l\'embarras académique qu\'elle provoque. Il ne peut pas rendre la sacralité d\'un chant Hopi, ni ce que cela fait d\'appartenir à une langue dont la grammaire encode une autre physique.',
  questionNoOneHasAsked:
    'Si les physiciens de Copenhague avaient eu accès à la cosmologie Hopi en 1927, auraient-ils formulé le principe d\'incertitude différemment — et cela aurait-il changé l\'interprétation de la mécanique quantique ?',
  sourceCoordinates: [
    { lat: 55.6761, lng: 12.5683, region: 'Copenhague (Danemark)' },
    { lat: 35.8156, lng: -110.4052, region: 'Territoire Hopi (Arizona)' },
  ],
  createdAt: new Date('2024-07-22T00:00:00Z'),
}

// ─── CROISEMENT 3 — M-Pesa (Kenya) × Silicon Valley ──────────────────────────
// L'Afrique a inventé le paiement mobile en 2007. La Silicon Valley l'a réinventé en 2011.

export const DEMO_MPESA_SILICON: InsightCard = {
  id: 'demo-mpesa-silicon',
  theme: 'Innovation financière — qui a inventé quoi, et pour qui ?',
  sources: [
    {
      url: 'https://en.wikipedia.org/wiki/M-Pesa',
      type: 'wikipedia',
      title: 'M-Pesa — Wikipedia EN',
      geographicContext: 'Kenya (Afrique de l\'Est)',
      geographicConfidence: 90,
    },
    {
      url: 'https://en.wikipedia.org/wiki/Venmo',
      type: 'wikipedia',
      title: 'Venmo — Wikipedia EN',
      geographicContext: 'États-Unis (Silicon Valley)',
      geographicConfidence: 88,
    },
  ],
  revealedPattern:
    'M-Pesa est lancé en 2007 au Kenya et atteint 30% du PIB national en transactions mobiles en 5 ans. Il résout un problème réel : 80% de la population sans compte bancaire. Venmo est lancé en 2009 aux États-Unis pour un problème inverse : des bancarisés qui ne veulent pas sortir leur carte. L\'innovation "disruptive" de la Silicon Valley a 2 ans de retard sur l\'Afrique — et résout un problème de confort, pas de survie.',
  convergenceZones: [
    'Transfert d\'argent via mobile sans infrastructure bancaire traditionnelle',
    'Adoption massive sans marketing institutionnel — viralité organique',
    'Transformation des comportements financiers en moins de 5 ans',
    'Preuve que le mobile peut remplacer les banques',
  ],
  divergenceZones: [
    'M-Pesa : conçu pour les non-bancarisés. Venmo : conçu pour les bancarisés qui veulent partager l\'addition',
    'M-Pesa est réglementé dès le départ avec Safaricom/Vodafone. Venmo a contourné la régulation bancaire',
    'M-Pesa a été copié dans 40 pays africains et asiatiques. Venmo est resté US-centrique',
    'M-Pesa est cité dans les études de développement économique. Venmo est cité dans les études de comportement millennial',
    'Le monde académique et VC a ignoré M-Pesa pendant 5 ans, puis l\'a "découvert" comme modèle pour les marchés émergents',
  ],
  globalConfidence: 84,
  geographicRepresentativity:
    'Kenya + États-Unis. Absence notable : le Bangladesh (bKash), le Zimbabwe (EcoCash), l\'Inde (UPI) — tous des innovations fintech du Sud Global qui précèdent ou égalent la Silicon Valley.',
  theUnspeakable:
    'Ce croisement ne peut pas mesurer l\'arrogance structurelle qui fait qu\'une innovation africaine n\'existe dans le récit mondial que lorsqu\'elle est validée par un papier de Harvard ou un investissement de McKinsey. Il ne peut pas rendre ce que cela fait d\'avoir inventé quelque chose que le monde attribuera plus tard à quelqu\'un d\'autre.',
  questionNoOneHasAsked:
    'Combien d\'innovations du Sud Global ont été "réinventées" par la Silicon Valley entre 2000 et 2024 — et combien de brevets ont été déposés sur des pratiques qui existaient déjà depuis des décennies dans des contextes que le droit des brevets ne considérait pas ?',
  sourceCoordinates: [
    { lat: -1.2921, lng: 36.8219, region: 'Nairobi (Kenya)' },
    { lat: 37.3861, lng: -122.0839, region: 'Silicon Valley (Californie)' },
  ],
  createdAt: new Date('2024-08-10T00:00:00Z'),
}

// ─── CROISEMENT 4 — Génocide Rwanda × Apartheid × Commission Vérité Canada ───
// Trois approches de la réconciliation après l'atrocité collective.

export const DEMO_RECONCILIATION: InsightCard = {
  id: 'demo-reconciliation',
  theme: 'Réconciliation après l\'atrocité — peut-on vraiment guérir ?',
  sources: [
    {
      url: 'https://en.wikipedia.org/wiki/Gacaca_court',
      type: 'wikipedia',
      title: 'Gacaca Courts (Rwanda) — Wikipedia EN',
      geographicContext: 'Rwanda (Afrique de l\'Est)',
      geographicConfidence: 87,
    },
    {
      url: 'https://en.wikipedia.org/wiki/Truth_and_Reconciliation_Commission_(South_Africa)',
      type: 'wikipedia',
      title: 'TRC South Africa — Wikipedia EN',
      geographicContext: 'Afrique du Sud',
      geographicConfidence: 89,
    },
    {
      url: 'https://en.wikipedia.org/wiki/Truth_and_Reconciliation_Commission_(Canada)',
      type: 'wikipedia',
      title: 'TRC Canada — Wikipedia EN',
      geographicContext: 'Canada (Amérique du Nord)',
      geographicConfidence: 85,
    },
  ],
  revealedPattern:
    'Les trois processus partagent un postulat : la vérité dite publiquement guérit. Les Gacaca rwandais vont plus loin — ils demandent aux victimes et aux bourreaux de vivre ensemble dans le même village après. La TRC sud-africaine a échangé la vérité contre l\'amnistie. La TRC canadienne a documenté — mais sans poursuites. Le pattern révèle que la réconciliation est toujours un compromis politique sur la souffrance privée.',
  convergenceZones: [
    'La vérité publique comme condition nécessaire (mais non suffisante) à la guérison collective',
    'La tension entre justice punitive et justice restaurative',
    'Le rôle de la parole des victimes comme pilier institutionnel',
    'L\'État comme garant du processus — même quand l\'État était le bourreau',
    'Les limites de la réconciliation institutionnelle face à la douleur individuelle',
  ],
  divergenceZones: [
    'Rwanda : coexistence forcée dans les mêmes villages — radicalement différent des deux autres',
    'Afrique du Sud : amnistie accordée aux bourreaux qui confessent — impossible au Rwanda',
    'Canada : aucune poursuite pénale malgré les recommandations — absence totale au Rwanda et AS',
    'Échelle temporelle : génocide (3 mois) vs apartheid (46 ans) vs pensionnats (150 ans)',
    'Le Canada nomme une crise humanitaire en cours. Le Rwanda et l\'AS nomment quelque chose de "terminé"',
  ],
  globalConfidence: 79,
  geographicRepresentativity:
    'Afrique de l\'Est + Afrique Australe + Amérique du Nord. SILENCE MAJEUR : aucune source directe de survivants. Ces données sont des représentations institutionnelles de la souffrance — pas la souffrance elle-même.',
  theUnspeakable:
    'Ce croisement ne peut pas capturer ce que ressent une mère rwandaise qui doit saluer chaque matin l\'homme qui a tué ses enfants. Il ne peut pas rendre la dissociation nécessaire à la survie. Il ne peut pas dire si la réconciliation est possible — ou si c\'est seulement un besoin des États et non des victimes.',
  questionNoOneHasAsked:
    'Les processus de réconciliation sont-ils conçus pour guérir les victimes — ou pour permettre aux sociétés de continuer à fonctionner malgré une guérison impossible ? Et si ces deux objectifs sont contradictoires, lequel doit primer ?',
  sourceCoordinates: [
    { lat: -1.9706, lng: 30.1044, region: 'Kigali (Rwanda)' },
    { lat: -33.9249, lng: 18.4241, region: 'Cape Town (Afrique du Sud)' },
    { lat: 56.1304, lng: -106.3468, region: 'Canada (Territoire autochtone)' },
  ],
  createdAt: new Date('2024-09-05T00:00:00Z'),
}

// ─── CROISEMENT 5 — Wittgenstein × Langue Pirahã ─────────────────────────────
// "Les limites de mon langage sont les limites de mon monde." — Wittgenstein
// Le Pirahã n'a ni récursion, ni temps passé, ni concepts abstraits. Ses locuteurs refusent de parler d'autre chose que ce qu'ils ont vécu.

export const DEMO_WITTGENSTEIN_PIRAHA: InsightCard = {
  id: 'demo-wittgenstein-piraha',
  theme: 'Les limites du langage sont-elles les limites du monde ?',
  sources: [
    {
      url: 'https://en.wikipedia.org/wiki/Ludwig_Wittgenstein',
      type: 'wikipedia',
      title: 'Ludwig Wittgenstein — Wikipedia EN',
      geographicContext: 'Autriche / Angleterre (philosophie continentale + analytique)',
      geographicConfidence: 88,
    },
    {
      url: 'https://en.wikipedia.org/wiki/Pirah%C3%A3_language',
      type: 'wikipedia',
      title: 'Pirahã language — Wikipedia EN',
      geographicContext: 'Amazonas (Brésil) — ~400 locuteurs',
      geographicConfidence: 74,
    },
  ],
  revealedPattern:
    'Wittgenstein affirme que ce qu\'on ne peut pas dire, on doit le taire — les limites du langage sont les limites du monde pensable. Le Pirahã semble incarner l\'inverse : en refusant les structures grammaticales qui permettent l\'abstraction (pas de récursion, pas de temps passé, pas de nombres), ses locuteurs vivent dans un monde radicalement différent — plus ancré, plus immédiat, refusant l\'accumulation de récits non vécus. La langue Pirahã est peut-être la démonstration empirique de Wittgenstein : ses locuteurs n\'ont simplement pas construit les limites qui les emprisonneraient.',
  convergenceZones: [
    'Le langage comme structure du monde pensable (et pas seulement de sa description)',
    'Ce qu\'on ne peut pas dire dans une langue n\'existe pas pour ses locuteurs — et ce n\'est pas un manque',
    'La grammaire comme ontologie implicite',
    'Le silence (ce qu\'on ne dit pas) comme forme de sagesse, pas d\'ignorance',
  ],
  divergenceZones: [
    'Wittgenstein cherche les limites universelles du langage. Le Pirahã est une démonstration que ces limites sont culturellement variables',
    'Wittgenstein opère dans le langage (en allemand, en anglais). Les locuteurs Pirahã refusent activement l\'expansion grammaticale',
    'Wittgenstein écrit pour des philosophes. Les Pirahã n\'ont pas de tradition d\'écriture — intentionnellement',
    'Wittgenstein considère l\'abstraction comme une caractéristique du langage. Le Pirahã la rejette comme inutile',
    'Le Pirahã a survécu 500 ans de contact avec des langues à récursion sans changer sa structure — ce que Wittgenstein n\'avait pas prévu',
  ],
  globalConfidence: 76,
  geographicRepresentativity:
    'Europe centrale + Amazonie brésilienne. ALERTE CRITIQUE : la langue Pirahã est représentée ici à travers des sources académiques (Daniel Everett). La communauté Pirahã elle-même n\'a pas été consultée. Ce croisement est partial par construction.',
  theUnspeakable:
    'Ce croisement ne peut pas capturer ce que c\'est d\'être locuteur Pirahã et de voir un linguiste européen décider que votre langue "prouve" une théorie philosophique. Il ne peut pas rendre la différence entre une langue "limitée" (selon des critères externes) et une langue qui a décidé de ses propres limites comme acte de souveraineté.',
  questionNoOneHasAsked:
    'Si Wittgenstein avait vécu six mois avec la communauté Pirahã, aurait-il réécrit les Investigations philosophiques — ou aurait-il conclu que les Pirahã avaient déjà résolu le problème qu\'il cherchait à poser ?',
  sourceCoordinates: [
    { lat: 48.2082, lng: 16.3738, region: 'Vienne (Autriche)' },
    { lat: -3.1190, lng: -60.0217, region: 'Río Maici, Amazonie (Brésil)' },
  ],
  createdAt: new Date('2024-10-18T00:00:00Z'),
}

// ─── Collection complète ───────────────────────────────────────────────────────

export const ALL_DEMO_CROSSINGS: InsightCard[] = [
  DEMO_MOUMOUE_LUMUMBA,
  DEMO_BOHR_HOPI,
  DEMO_MPESA_SILICON,
  DEMO_RECONCILIATION,
  DEMO_WITTGENSTEIN_PIRAHA,
]

// ─── Generate MapPoints + MapArcs from a demo crossing ────────────────────────

export function demoToMapPoints(card: InsightCard): MapPoint[] {
  const now = Date.now()
  const points: MapPoint[] = card.sourceCoordinates.map((coord, i) => ({
    id: `demo-src-${card.id}-${i}`,
    lat: coord.lat,
    lng: coord.lng,
    type: 'source' as const,
    label: coord.region,
    pulsePhase: i * 1.4,
    createdAt: now - 5000, // Slightly in the past for demo
  }))

  // Add crossing point at centroid
  if (card.sourceCoordinates.length >= 2) {
    const midLat = card.sourceCoordinates.reduce((s, c) => s + c.lat, 0) / card.sourceCoordinates.length
    const midLng = card.sourceCoordinates.reduce((s, c) => s + c.lng, 0) / card.sourceCoordinates.length
    points.push({
      id: `demo-cross-${card.id}`,
      lat: midLat,
      lng: midLng,
      type: 'crossing',
      label: card.theme,
      pulsePhase: 0,
      createdAt: now - 5000,
    })
  }

  return points
}

export function demoToMapArcs(card: InsightCard): MapArc[] {
  const now = Date.now()
  const arcs: MapArc[] = []
  for (let i = 0; i < card.sourceCoordinates.length - 1; i++) {
    for (let j = i + 1; j < card.sourceCoordinates.length; j++) {
      arcs.push({
        id: `demo-arc-${card.id}-${i}-${j}`,
        from: { lat: card.sourceCoordinates[i].lat, lng: card.sourceCoordinates[i].lng },
        to: { lat: card.sourceCoordinates[j].lat, lng: card.sourceCoordinates[j].lng },
        progress: 1, // Already complete for demos
        createdAt: now - 5000,
      })
    }
  }
  return arcs
}
