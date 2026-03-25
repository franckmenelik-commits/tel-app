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
  questionNoOneHasAskedEN:
    'If Moumié and Lumumba had met in Accra in 1960, what Africa would they have imagined together — and why did that meeting never happen?',
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
  questionNoOneHasAskedEN:
    'If quantum physicists and Hopi elders had co-authored a theory of reality in 1927, what would it say about the role of the observer — and why has Western science avoided this encounter?',
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
  questionNoOneHasAskedEN:
    'How many Global South innovations were "reinvented" by Silicon Valley between 2000 and 2024 — and what would financial inclusion look like if built from Nairobi rather than San Francisco?',
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
  questionNoOneHasAskedEN:
    'Are reconciliation processes designed to heal victims — or to allow societies to function despite an impossible healing? And if these two goals contradict, which must come first?',
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
  questionNoOneHasAskedEN:
    'If Wittgenstein had lived six months with the Pirahã, would he have rewritten the Philosophical Investigations — or concluded that the Pirahã had already solved the problem he was trying to pose?',
  sourceCoordinates: [
    { lat: 48.2082, lng: 16.3738, region: 'Vienne (Autriche)' },
    { lat: -3.1190, lng: -60.0217, region: 'Río Maici, Amazonie (Brésil)' },
  ],
  createdAt: new Date('2024-10-18T00:00:00Z'),
}

// ─── CROISEMENT 6 — COMPAS Algorithm × Témoignage condamné ──────────────────
// L'algorithme COMPAS prédit un 'risque de récidive' en 137 variables — toutes des marqueurs de pauvreté.

export const DEMO_COMPAS_JUSTICE: InsightCard = {
  id: 'demo-compas-justice',
  theme: 'L\'algorithme COMPAS prédit-il la récidive — ou fabrique-t-il l\'incarcération ?',
  sources: [
    {
      url: 'https://en.wikipedia.org/wiki/COMPAS_(software)',
      type: 'wikipedia',
      title: 'COMPAS Algorithm — Wikipedia EN',
      geographicContext: 'États-Unis (système judiciaire fédéral)',
      geographicConfidence: 86,
    },
    {
      url: 'https://fr.wikipedia.org/wiki/Mass_incarceration',
      type: 'wikipedia',
      title: 'Mass incarceration — Wikipedia',
      geographicContext: 'États-Unis (prisons fédérales et d\'État)',
      geographicConfidence: 88,
    },
  ],
  revealedPattern:
    'COMPAS prédit un \'risque de récidive\' en 137 variables — dont le code postal, l\'emploi du père, les dettes. Aucune de ces variables n\'est un acte criminel. Elles sont toutes des marqueurs de pauvreté structurelle. Le pattern révèle que COMPAS ne prédit pas ce que va faire une personne — il reproduit ce que le système lui a déjà fait.',
  convergenceZones: [
    'La pauvreté structurelle prédit le score de risque mieux que le comportement individuel',
    'Les biais raciaux des données d\'entraînement se transmettent directement aux décisions judiciaires',
    'L\'algorithme neutralise politiquement une décision qui reste politiquement chargée',
  ],
  divergenceZones: [
    'Les concepteurs de COMPAS croient sincèrement améliorer l\'objectivité — les résultats montrent l\'inverse',
    'Les juges qui utilisent COMPAS pensent garder leur autonomie — les études montrent une dépendance croissante',
  ],
  globalConfidence: 82,
  geographicRepresentativity:
    'États-Unis uniquement. L\'absence de données de pays sans incarcération de masse crée un biais systémique dans l\'analyse.',
  theUnspeakable:
    'Ce croisement ne peut pas rendre ce que ressent un homme de 23 ans qui apprend qu\'un algorithme a recommandé 10 ans de prison en 0.3 secondes.',
  questionNoOneHasAsked:
    'Si COMPAS avait été entraîné sur des données de Norvège plutôt que des États-Unis, quelles décisions aurait-il recommandées — et que révèle cette différence sur ce que nous appelons \'justice\' ?',
  questionNoOneHasAskedEN:
    'If the judge who sentenced you had been assessed by the same algorithm that assessed you, what sentence would they receive — and why is this question never asked in court?',
  sourceCoordinates: [
    { lat: 38.9072, lng: -77.0369, region: 'Washington DC (système judiciaire)' },
    { lat: 29.9511, lng: -90.0715, region: 'Louisiane (État le plus incarcérant)' },
  ],
  createdAt: new Date('2024-11-01T00:00:00Z'),
}

// ─── CROISEMENT 7 — Révolution française × Haïti 1804 ────────────────────────
// La Révolution française proclame les droits universels en 1789. Haïti prend ces mots au pied de la lettre en 1791.

export const DEMO_REVOLUTION_HAITI: InsightCard = {
  id: 'demo-revolution-haiti',
  theme: 'La Révolution française a-t-elle libéré tout le monde ?',
  sources: [
    {
      url: 'https://fr.wikipedia.org/wiki/R%C3%A9volution_fran%C3%A7aise',
      type: 'wikipedia',
      title: 'Révolution française — Wikipedia FR',
      geographicContext: 'France (Europe)',
      geographicConfidence: 92,
    },
    {
      url: 'https://fr.wikipedia.org/wiki/R%C3%A9volution_ha%C3%AFtienne',
      type: 'wikipedia',
      title: 'Révolution haïtienne — Wikipedia FR',
      geographicContext: 'Saint-Domingue / Haïti (Caraïbes)',
      geographicConfidence: 89,
    },
  ],
  revealedPattern:
    'La Révolution française proclame en 1789 : \'Tous les hommes naissent libres et égaux.\' En 1791, Haïti — alors Saint-Domingue, première colonie productrice de sucre mondiale — prend ces mots au pied de la lettre. La France envoie des armées pour écraser cette interprétation. Le pattern : les révolutions d\'idées universelles ont systématiquement une clause d\'exception non-écrite pour les colonisés.',
  convergenceZones: [
    'La rhétorique des droits universels mobilisée par les deux révolutions',
    'La violence comme sage-femme du changement institutionnel',
    'L\'invention d\'un nouvel ordre politique sans précédent historique',
  ],
  divergenceZones: [
    'La France libère des citoyens blancs — Haïti libère des esclaves noirs',
    'La France est reconnue diplomatiquement en 1802 — Haïti paie 150 ans de \'dette de la liberté\' à la France',
    'La révolution française est au programme scolaire mondial — la révolution haïtienne est absente de la plupart des curriculums',
  ],
  globalConfidence: 90,
  geographicRepresentativity:
    'France et Haïti. Le silence sur les 500 000 esclaves qui ont rendu possible la Révolution française (le sucre finançait Versailles) est le vrai angle mort de ce croisement.',
  theUnspeakable:
    'Ce croisement ne peut pas rendre l\'humiliation d\'enseigner les droits de l\'homme à des élèves dont les ancêtres ont été exclus de ces droits par ceux qui les ont formulés.',
  questionNoOneHasAsked:
    'Si la révolution haïtienne avait réussi à être reconnue immédiatement par la France, qu\'est-ce que cela aurait changé à la définition des droits universels — et pourquoi la France a-t-elle préféré payer pour effacer cette question ?',
  questionNoOneHasAskedEN:
    'If Haiti\'s revolution had been immediately recognized by France in 1804, what would have changed in the definition of universal rights — and why did France prefer to pay to erase this question?',
  sourceCoordinates: [
    { lat: 48.8566, lng: 2.3522, region: 'Paris (France)' },
    { lat: 18.5944, lng: -72.3074, region: 'Port-au-Prince (Haïti)' },
  ],
  createdAt: new Date('2024-11-15T00:00:00Z'),
}

// ─── CROISEMENT 8 — Burn-out × Méditation zen ────────────────────────────────
// Le burn-out : maladie individuelle ou réponse saine à un système pathologique ?

export const DEMO_BURNOUT_ZEN: InsightCard = {
  id: 'demo-burnout-zen',
  theme: 'Le burn-out est-il une maladie — ou la réponse saine à un système pathologique ?',
  sources: [
    {
      url: 'https://en.wikipedia.org/wiki/Occupational_burnout',
      type: 'wikipedia',
      title: 'Occupational burnout — Wikipedia EN',
      geographicContext: 'Occident (contexte professionnel mondial)',
      geographicConfidence: 80,
    },
    {
      url: 'https://en.wikipedia.org/wiki/Zen',
      type: 'wikipedia',
      title: 'Zen Buddhism — Wikipedia EN',
      geographicContext: 'Japon / Asie orientale',
      geographicConfidence: 77,
    },
  ],
  revealedPattern:
    'La médecine occidentale classe le burn-out comme \'syndrome d\'épuisement professionnel\' — implicitement, une défaillance individuelle à gérer le stress. Le zen identifie depuis 14 siècles que la souffrance émerge de l\'attachement aux résultats et à l\'ego productif. Le pattern : le burn-out est diagnostiqué là où il devrait être condamné. Ce que la médecine traite comme une maladie de l\'individu, le zen reconnaît comme la réponse lucide d\'un être humain à une demande qui viole sa nature.',
  convergenceZones: [
    'L\'épuisement comme signal d\'alarme d\'un dépassement de limite',
    'La nécessité d\'un retrait temporaire du monde productif pour se reconstituer',
    'La connexion corps-esprit comme unité indissociable',
  ],
  divergenceZones: [
    'Le burn-out cherche un retour à la productivité — le zen cherche la dissolution du moi productif',
    'La médecine traite l\'individu — le zen interroge le monde qui épuise',
    'Le burn-out est un diagnostic médical récent (1974) — le zen pratique l\'impermanence depuis 600 ans',
  ],
  globalConfidence: 73,
  geographicRepresentativity:
    'Europe/Amérique du Nord + Asie orientale. Absence totale de perspectives du Sud Global sur le travail, le repos, et la productivité.',
  theUnspeakable:
    'Ce croisement ne peut pas rendre ce que ressent quelqu\'un qui \'guérit\' de son burn-out pour retourner exactement dans le système qui l\'a produit.',
  questionNoOneHasAsked:
    'Si les entreprises adoptaient la pratique zen de zazen — l\'assise silencieuse sans but productif — combien disparaîtraient en 6 mois, et que révèle cette fragilité sur leur modèle économique ?',
  questionNoOneHasAskedEN:
    'If burn-out were officially recognized as a spiritual emergency rather than a medical pathology, what treatment would exist — and why does the healthcare system avoid this diagnosis?',
  sourceCoordinates: [
    { lat: 51.5074, lng: -0.1278, region: 'Londres (culture du travail occidental)' },
    { lat: 35.0116, lng: 135.7681, region: 'Kyoto (Japon — centres zen)' },
  ],
  createdAt: new Date('2024-12-01T00:00:00Z'),
}

// ─── CROISEMENT 9 — CGU Instagram × DUDH ─────────────────────────────────────
// En signant les CGU Instagram, 2,3 milliards d'utilisateurs cèdent des droits que la DUDH juge inaliénables.

export const DEMO_INSTAGRAM_DUDH: InsightCard = {
  id: 'demo-instagram-dudh',
  theme: 'En signant les CGU Instagram, abandonnez-vous vos droits fondamentaux ?',
  sources: [
    {
      url: 'https://en.wikipedia.org/wiki/Instagram',
      type: 'wikipedia',
      title: 'Instagram Terms of Service',
      geographicContext: 'États-Unis (Silicon Valley)',
      geographicConfidence: 91,
    },
    {
      url: 'https://en.wikipedia.org/wiki/Universal_Declaration_of_Human_Rights',
      type: 'wikipedia',
      title: 'DUDH — Wikipedia EN',
      geographicContext: 'International (ONU)',
      geographicConfidence: 95,
    },
  ],
  revealedPattern:
    'Instagram dispose d\'une licence perpétuelle, mondiale et non-exclusive sur tout contenu publié. Vous pouvez supprimer votre compte — Instagram conserve le droit d\'utiliser vos données. La DUDH Art. 12 protège explicitement la \'vie privée, la famille, le domicile et la correspondance\'. Le pattern : 2,3 milliards d\'utilisateurs ont signé un document qui restreint des droits que la DUDH juge inaliénables — sans que cela soit présenté comme un choix.',
  convergenceZones: [
    'Les deux documents traitent de l\'information personnelle comme enjeu fondamental',
    'La notion de consentement est centrale dans les deux textes',
    'La protection des mineurs est un enjeu explicite dans les deux',
  ],
  divergenceZones: [
    'La DUDH est non-contraignante juridiquement — les CGU sont un contrat légalement opposable',
    'La DUDH protège l\'individu contre les États — les CGU lient l\'individu à une entreprise privée',
    'La DUDH est permanente — les CGU peuvent changer unilatéralement sans préavis réel',
  ],
  globalConfidence: 85,
  geographicRepresentativity:
    'Mondial — Instagram opère dans 200+ pays. Mais la régulation varie : les utilisateurs européens bénéficient du RGPD, les autres non.',
  theUnspeakable:
    'Ce croisement ne peut pas rendre ce que ressent un adolescent haïtien qui découvre que ses photos d\'enfance sont la propriété d\'une entreprise californienne.',
  questionNoOneHasAsked:
    'Si la DUDH avait été rédigée en 2024 en anticipant les plateformes numériques, quels articles auraient rendu les CGU actuelles illégales — et pourquoi cette question n\'est-elle pas débattue dans les parlements ?',
  questionNoOneHasAskedEN:
    'If Instagram had to pay each user for every hour of attention captured at advertising market rates, how much would it owe you — and would this model survive?',
  sourceCoordinates: [
    { lat: 37.3382, lng: -121.8863, region: 'San Jose (Meta headquarters)' },
    { lat: 46.2044, lng: 6.1432, region: 'Genève (ONU — droits humains)' },
  ],
  createdAt: new Date('2024-12-15T00:00:00Z'),
}

// ─── CROISEMENT 10 — Psychology of Money × Dette du Sud Global ───────────────
// La dette du Sud Global : question économique ou construction narrative ?

export const DEMO_MONEY_DETTE: InsightCard = {
  id: 'demo-money-dette',
  theme: 'La dette du Sud Global est-elle économique — ou psychologique ?',
  sources: [
    {
      url: 'https://en.wikipedia.org/wiki/The_Psychology_of_Money',
      type: 'wikipedia',
      title: 'The Psychology of Money — Morgan Housel',
      geographicContext: 'États-Unis (culture financière occidentale)',
      geographicConfidence: 82,
    },
    {
      url: 'https://en.wikipedia.org/wiki/Debt_relief',
      type: 'wikipedia',
      title: 'Debt relief — Wikipedia EN',
      geographicContext: 'Afrique / Asie du Sud / Amérique latine',
      geographicConfidence: 80,
    },
  ],
  revealedPattern:
    'Morgan Housel démontre que les décisions financières sont gouvernées par l\'histoire personnelle et la psychologie, pas la rationalité. Le Zambie rembourse depuis 60 ans des dettes contractées par des gouvernements coloniaux non-élus. Le pattern : la distinction entre \'dette légitime\' et \'dette illégitime\' n\'est pas économique — elle est une construction narrative qui détermine qui souffre et qui prospère.',
  convergenceZones: [
    'La psychologie de la dette crée des comportements auto-destructeurs chez les individus comme chez les États',
    'L\'histoire personnelle/nationale détermine l\'attitude envers la dette plus que les chiffres',
    'La culpabilité liée à la dette est un mécanisme de contrôle plus qu\'un reflet de la réalité économique',
  ],
  divergenceZones: [
    'Housel parle de choix individuels — la dette du Sud Global est une imposition structurelle non-choisie',
    'L\'individu endetté peut refaire sa psychologie — l\'État endetté est contraint par des institutions internationales',
    'Housel conseille la patience et la durée — les plans d\'ajustement structurel du FMI ont détruit des services publics en 5 ans',
  ],
  globalConfidence: 78,
  geographicRepresentativity:
    'Nord Global (culture financière) + Sud Global (dette). Ce croisement manque la voix directe des populations affectées par les plans d\'ajustement structurel.',
  theUnspeakable:
    'Ce croisement ne peut pas rendre ce que ressent une infirmière zambienne dont le salaire a été coupé pour \'rembourser\' une dette contractée par un dictateur avant sa naissance.',
  questionNoOneHasAsked:
    'Si les manuels d\'économie enseignaient la psychologie de la dette du Sud Global avec la même rigueur que la crise des subprimes, quelle révision de la notion de \'croissance\' cela imposerait-il ?',
  questionNoOneHasAskedEN:
    'If the financial principles of The Psychology of Money had been written from the perspective of a country carrying colonial debt, what would chapter one say?',
  sourceCoordinates: [
    { lat: 40.7128, lng: -74.0060, region: 'New York (marchés financiers)' },
    { lat: -15.4167, lng: 28.2833, region: 'Lusaka (Zambie)' },
  ],
  createdAt: new Date('2025-01-10T00:00:00Z'),
}

// ─── Collection complète ───────────────────────────────────────────────────────

export const ALL_DEMO_CROSSINGS: InsightCard[] = [
  DEMO_MOUMOUE_LUMUMBA,
  DEMO_BOHR_HOPI,
  DEMO_MPESA_SILICON,
  DEMO_RECONCILIATION,
  DEMO_WITTGENSTEIN_PIRAHA,
  DEMO_COMPAS_JUSTICE,
  DEMO_REVOLUTION_HAITI,
  DEMO_BURNOUT_ZEN,
  DEMO_INSTAGRAM_DUDH,
  DEMO_MONEY_DETTE,
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
