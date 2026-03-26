// TEL — The Experience Layer
// lib/legends-data.ts
// Les 5 Croisements Fondateurs — Insight Cards pré-rédigées

import type { InsightCard as InsightCardType } from './types'

export const FOUNDATIONAL_CROSSINGS: InsightCardType[] = [
  {
    id: 'legend-000',
    theme: 'La Fracture des Langages Amoureux',
    sources: [
      { url: '', type: 'free_text', title: "Lettre d'un étudiant à distance à sa partenaire", geographicContext: 'Montréal / Amérique du Sud, 2026', geographicConfidence: 100 },
      { url: '', type: 'book', title: 'Correspondance Rilke et Lou Andreas-Salomé 1897–1903', geographicContext: 'Europe, fin XIXe–début XXe siècle', geographicConfidence: 90 },
      { url: '', type: 'article', title: 'Le mythe de Psyché et Éros — Métamorphoses d\'Apulée, IIe siècle', geographicContext: 'Rome antique', geographicConfidence: 80 },
    ],
    revealedPattern: `Trois époques. Trois formes d'amour. Un même déchirement.

Un étudiant écrit en 2026 : "je ne peux pas juste intellectualiser le fait que tu m'aimes, j'ai besoin de le ressentir." Rilke écrivait un siècle plus tôt : "je ne peux pas vivre de ton amour comme d'une théorie, j'ai besoin de le boire comme un vin." Psyché allumait une lampe pour voir Éros endormi — brisant leur pacte d'amour invisible.

Le même cri traverse 2000 ans : rendre tangible l'intangible, au risque de tout perdre. L'amour doit être à la fois éprouvé dans le corps et pensé dans le silence. Ces deux régimes sont incompatibles dans l'instant. Pourtant aucun couple, à aucune époque, n'a réussi à aimer sans les deux.

Ce croisement révèle une fracture fondamentale de la condition humaine : deux langages amoureux complets, irréductibles l'un à l'autre. Celui qui demande à ressentir n'est pas "trop" — il parle une langue que l'autre ne peut pas encore lire. Celui qui exprime par le silence n'est pas absent — il aime dans un registre que l'autre interprète comme indifférence.`,
    convergenceZones: [
      "Celui qui demande à ressentir est perçu comme celui qui menace la relation — alors qu'il essaie de la sauver.",
      "Les partenaires silencieux ne sont pas indifférents — ils aiment dans un registre que l'autre ne peut pas lire.",
      "La distance amplifie la fracture mais ne la crée pas — elle révèle ce qui existait déjà.",
      "Le moment de vérité est toujours un acte de transparence radicale — une lettre, un geste — pas une conversation négociée.",
    ],
    divergenceZones: [
      "Rilke et Lou ont transformé leur souffrance en œuvre. Le couple contemporain n'a pas ce luxe symbolique.",
      "Psyché a un arbitre divin pour sa rédemption. Le couple moderne négocie sans filet et sans oracle.",
      "Chapman propose une traduction pragmatique des langages. Mais le vécu révèle que le problème est existentiel, pas technique.",
      "Rilke a trouvé la paix dans la solitude créatrice. Pour un étudiant de 19 ans amoureux en 2026, ni la solitude ni la divinisation ne sont des options.",
    ],
    globalConfidence: 87,
    geographicRepresentativity: "Montréal et Amérique du Sud (témoignage contemporain), Europe fin XIXe (Rilke/Lou), Rome antique (Apulée). Absents : conceptions non-occidentales de la distance affective, modèles d'amour collectifs ou polygames, cultures où le silence est un langage d'amour reconnu socialement.",
    theUnspeakable: "Ce que cette analyse ne peut pas capturer, c'est la texture même de la souffrance : le silence après l'envoi du message, l'attente du 'vu' sans réponse, la honte de se sentir 'trop' dans son besoin, et cette peur viscérale que le temps de réflexion de l'autre ne soit pas un temps de compréhension mais un temps de détachement. Il y a, dans ce vécu, une dimension presque physique de la déconnexion — comme si le corps se vidait de sa substance à chaque jour sans appel. Aucune résonance ne peut rendre cette sensation de désertion affective.",
    questionNoOneHasAsked: "Si l'amour est à la fois ce qui doit être ressenti et intellectualisé, et que ces deux régimes sont incompatibles dans l'instant — existe-t-il une troisième voie, ni présence ni absence, ni corps ni esprit, qui permettrait de les réconcilier sans les trahir ? Ou bien l'amour n'est-il qu'une suite de malentendus nécessaires, où chacun donne ce qu'il peut, sans jamais combler l'autre ?",
    questionNoOneHasAskedEN: "If love must be both felt and intellectualized, and these two modes are incompatible in the present moment — is there a third way, neither presence nor absence, neither body nor mind, that could reconcile them without betraying either? Or is love simply a necessary series of misunderstandings, where each person gives what they can, without ever fully reaching the other?",
    irreconcilable: "Le besoin de ressentir l'amour dans le corps et le besoin de l'exprimer dans le silence sont deux vérités complètes. Aucune ne peut absorber l'autre sans la détruire. Cette fracture ne se résout pas — elle se vit, chaque jour, dans l'espace entre deux messages.",
    sourceCoordinates: [
      { lat: 45.50, lng: -73.56, region: 'Montréal, Canada' },
      { lat: 48.21, lng: 16.37, region: 'Vienne / Europe' },
      { lat: 41.90, lng: 12.50, region: 'Rome, Italie' },
    ],
    createdAt: new Date('2026-03-26'),
    actionables: {
      individu: "La prochaine fois que vous souffrez du silence de quelqu'un que vous aimez, demandez-vous : est-ce que cette personne m'aime dans un langage que je ne sais pas encore lire ?",
      chercheur: "Étudiez les couples à distance comme des laboratoires de la fracture fondamentale de l'amour. La distance ne crée pas le problème — elle le révèle.",
      institution: "Les applications de rencontre optimisent la compatibilité par algorithme. Aucune ne mesure la compatibilité des langages amoureux. C'est le prochain enjeu de santé relationnelle publique.",
    },
  },
  {
    id: 'legend-001',
    theme: 'La Dette de Dignité',
    sources: [
      { url: '', type: 'book', title: 'The Psychology of Money — Morgan Housel', geographicContext: 'États-Unis', geographicConfidence: 90 },
      { url: '', type: 'article', title: 'Rapport ONU — Extrême Pauvreté et Droits Humains', geographicContext: 'Global', geographicConfidence: 95 },
    ],
    revealedPattern: `La pauvreté n'est pas un manque de ressources, c'est une perte d'agence. On demande aux précaires d'être 100% logiques là où les riches sont autorisés à être émotionnels avec leur argent.

Les deux sources montrent que les décisions financières sont façonnées par le vécu, pas par la logique. Housel décrit comment les comportements financiers naissent d'expériences personnelles accumulées — peur, honte, mémoire familiale — et non de calculs rationnels. Le Rapport ONU révèle que les personnes en extrême pauvreté sont systématiquement jugées pour leurs décisions financières "irrationnelles", alors que leur contexte rend toute rationalité structurellement impossible.

Ce croisement révèle une double injustice : l'irrationalité est un privilège accordé aux riches (investissements risqués, dépenses de luxe, paris boursiers) et un crime reproché aux pauvres (un achat impulsif, un remboursement manqué). La dignité financière n'est pas universelle — elle est proportionnelle au capital initial.`,
    convergenceZones: [
      "Les décisions financières des deux groupes sont façonnées par l'expérience vécue, la peur et la mémoire — pas par la logique économique froide.",
      "Ni Housel ni le rapport ONU ne croient à la rationalité financière universelle : les deux reconnaissent que le contexte détermine le comportement bien avant la volonté individuelle.",
    ],
    divergenceZones: [
      "Housel parle de choix individuels dans un cadre de liberté où l'erreur est une leçon de croissance. L'ONU parle de systèmes où la même erreur est une condamnation sociale ou judiciaire.",
      "L'irrationalité de Housel est une stratégie narrative d'apprentissage dans un contexte de sécurité. L'irrationalité des précaires est un marqueur de disqualification qui ferme des portes définitives.",
    ],
    globalConfidence: 85,
    geographicRepresentativity: 'Amérique du Nord (Housel) et Global (ONU). Absents : modèles africains de tontine et solidarité communautaire, approches asiatiques du risque collectif, économies informelles du Sud global.',
    theUnspeakable: "Ce qu'un enfant qui n'a jamais eu de compte bancaire ressent en voyant une publicité pour l'épargne — la honte de ne pas appartenir à un monde qui se prend pour la norme.",
    questionNoOneHasAsked: "Si les riches ont le droit d'être irrationnels avec leur argent, pourquoi les pauvres sont-ils punis pour la même chose ? Qui a décidé que la rationalité était une exigence de classe ?",
    irreconcilable: "La liberté de faire des erreurs financières sans en payer le prix ultime est un privilège structurel — aucun programme d'éducation financière ne peut effacer cette asymétrie sans transformer le système qui la produit.",
    sourceCoordinates: [{ lat: 37.09, lng: -95.71, region: 'États-Unis' }, { lat: 0, lng: 20, region: 'Global' }],
    createdAt: new Date('2024-11-01'),
    actionables: {
      individu: "La prochaine fois que vous jugez une décision financière d'une personne précaire, demandez-vous d'abord : quelles contraintes invisibles cette personne porte-t-elle que vous n'avez jamais eu à porter ?",
      chercheur: "Comparer les mécanismes de punition financière selon la classe sociale dans les systèmes judiciaires et bancaires — qui paie la même erreur deux fois, et pourquoi ?",
      institution: "Concevoir des politiques de crédit qui intègrent le contexte de vie de l'emprunteur, pas seulement son score de solvabilité — un crédit contextualisé plutôt qu'un crédit normalisé.",
    },
  },
  {
    id: 'legend-002',
    theme: "L'Incertitude Quantique des Cultures",
    sources: [
      { url: '', type: 'article', title: "Principe d'incertitude de Heisenberg", geographicContext: 'Europe, Copenhague 1927', geographicConfidence: 95 },
      { url: '', type: 'article', title: 'Cosmologie Hopi — Arizona', geographicContext: 'États-Unis, communautés autochtones Hopi', geographicConfidence: 80 },
    ],
    revealedPattern: `En observant une culture avec des outils occidentaux, on modifie sa trajectoire. La vérité d'un peuple ne peut être saisie que par celui qui accepte de ne pas la mesurer.

Heisenberg a démontré qu'on ne peut connaître simultanément la position et la vitesse d'une particule — l'acte de mesure perturbe ce qu'on cherche à observer. La cosmologie Hopi, elle, ne cherche pas à mesurer le temps comme une ligne droite : le passé, le présent et le futur coexistent dans un espace circulaire où l'observation est un acte sacré, non une extraction d'information.

Ce croisement révèle que l'épistémologie occidentale — qui construit la science sur l'observation neutre et reproductible — est déjà une violence cognitive lorsqu'elle s'applique à des cultures qui vivent l'observation autrement. Ce que nous appelons "anthropologie" est peut-être notre propre principe d'incertitude appliqué à l'humanité entière.`,
    convergenceZones: [
      "Dans les deux cas, l'observation perturbe fondamentalement le système observé — une loi quantique et une loi spirituelle se rejoignent sur ce point central.",
      "Heisenberg et la tradition Hopi reconnaissent tous deux que la connaissance totale est impossible, et que l'humilité face à l'inconnaissable est la position intellectuellement la plus honnête.",
    ],
    divergenceZones: [
      "Heisenberg cherche à formaliser l'incertitude mathématiquement — c'est une limite qu'il espère quantifier. Les Hopis vivent l'incertitude comme état naturel qui n'a pas à être mesuré pour être vrai.",
      "La physique de Copenhague reste dans un paradigme de contrôle : on mesure ce qu'on peut, on nomme ce qu'on ne peut pas. La cosmologie Hopi n'est pas un paradigme de contrôle — c'est un mode de présence.",
    ],
    globalConfidence: 78,
    geographicRepresentativity: "Europe (Copenhague) et Amérique du Nord autochtone (Arizona). Absents : traditions épistémiques africaines et asiatiques sur l'observation, la connaissance et le rapport au temps.",
    theUnspeakable: "Ce que le physicien et le gardien de tradition ne pourront jamais se dire dans la même langue — et ce que cette impossibilité révèle sur les limites de toute traduction interculturelle, même la plus bien intentionnée.",
    questionNoOneHasAsked: "Si les physiciens de Copenhague avaient eu accès à la cosmologie Hopi en 1927, auraient-ils formulé le principe d'incertitude différemment — ou n'auraient-ils jamais osé l'appeler 'principe' ?",
    irreconcilable: "Le formalisme mathématique comme seul langage légitime de l'incertitude versus la transmission orale du sacré comme seul gardien authentique de la vérité — ces deux épistémologies ne peuvent être traduites l'une dans l'autre sans détruire l'une d'elles.",
    sourceCoordinates: [{ lat: 55.68, lng: 12.57, region: 'Copenhague, Danemark' }, { lat: 35.67, lng: -110.71, region: 'Arizona, États-Unis' }],
    createdAt: new Date('2024-11-15'),
    actionables: {
      individu: "La prochaine fois que vous étudiez une culture différente de la vôtre, commencez par vous demander : quel outil de mesure ai-je inconsciemment importé, et que détruit-il en observant ?",
      chercheur: "Développer des protocoles d'observation qui intègrent le consentement épistémique — pas seulement le consentement éthique — des communautés étudiées.",
      institution: "Créer des programmes académiques co-conçus avec les communautés observées, où la méthode d'observation est elle-même négociée et peut être refusée.",
    },
  },
  {
    id: 'legend-003',
    theme: 'Le Code Invisible de la Résilience',
    sources: [
      { url: '', type: 'book', title: "L'Alchimiste — Paulo Coelho", geographicContext: 'Brésil, fiction universelle', geographicConfidence: 70 },
      { url: '', type: 'free_text', title: "Témoignages d'entrepreneurs en faillite", geographicContext: 'Occident, contexte entrepreneurial global', geographicConfidence: 60 },
    ],
    revealedPattern: `La Légende Personnelle n'est pas un chemin droit, c'est un algorithme de correction d'erreurs. L'échec n'est pas le contraire du succès, c'est sa donnée d'entraînement.

Coelho construit sa philosophie sur la conviction que l'univers conspire à aider celui qui suit sa vocation — mais il passe sous silence les mécanismes concrets par lesquels cette conviction survit à l'échec répété. Les témoignages d'entrepreneurs en faillite comblent ce silence : ce que Coelho appelle "Âme du Monde", les survivants de la faillite l'appellent "la nuit où j'ai failli tout arrêter et où j'ai continué sans raison logique".

Ce croisement révèle que la résilience n'est pas une vertu mystique réservée aux héros — c'est un code exécuté dans des conditions de ressources nulles, où chaque erreur est un retour forcé à l'essentiel. La vraie Légende Personnelle ne commence pas quand on trouve sa voie, mais quand on continue à chercher après avoir tout perdu.`,
    convergenceZones: [
      "Les deux sources montrent que la transformation profonde passe invariablement par une destruction avant la reconstruction — la perte est structurelle, pas accidentelle.",
      "Coelho et les entrepreneurs survivants décrivent tous deux un moment de bascule où la logique cède la place à une obstination irrationnelle qui s'avère être la force la plus durable.",
    ],
    divergenceZones: [
      "Coelho romantise l'échec en le dotant d'un sens cosmique préexistant. Les entrepreneurs en faillite vivent l'échec dans la honte sociale et l'isolement — sans narratif rédempteur disponible.",
      "La Légende Personnelle de Coelho est individuelle et universelle. Les faillites réelles sont souvent liées à des contextes systémiques (crédits, classe sociale, conjoncture) que le roman efface entièrement.",
    ],
    globalConfidence: 74,
    geographicRepresentativity: "Brésil et contexte occidental (Coelho). Témoignages principalement nord-américains et européens. Absents : contextes de résilience entrepreneuriale africaine et asiatique qui intègrent la dimension collective et familiale.",
    theUnspeakable: "Le moment exact où quelqu'un passe de 'j'ai échoué' à 'je recommence' — et pourquoi certains n'y arrivent jamais, non par manque de volonté mais par manque de ressources pour survivre à la nuit la plus longue.",
    questionNoOneHasAsked: "Si l'échec est vraiment une donnée d'entraînement, pourquoi les systèmes éducatifs le punissent-ils au lieu de l'indexer ? Quelle société formerions-nous si la faillite était certifiée comme une compétence ?",
    irreconcilable: "La résilience comme choix héroïque dans un contexte de liberté versus la résilience comme seule option de survie faute d'alternatives — ces deux vécus ne peuvent être réconciliés sans effacer la violence systémique qui rend l'un possible et l'autre obligatoire.",
    sourceCoordinates: [{ lat: -14.24, lng: -51.93, region: 'Brésil' }, { lat: 40.71, lng: -74.00, region: 'États-Unis / Global' }],
    createdAt: new Date('2024-12-01'),
    actionables: {
      individu: "Tenez un journal de vos 'corrections d'erreurs' — chaque chose qui n'a pas marché cette semaine et ce qu'elle vous a révélé que le succès aurait caché.",
      chercheur: "Analyser comparativement les récits d'échec entrepreneurial dans des contextes économiques différents pour identifier quels facteurs systémiques (non individuels) déterminent qui peut se relever.",
      institution: "Créer des programmes qui certifient l'expérience de la traversée d'une faillite comme compétence — un certificat de résilience plutôt qu'un casier entrepreneurial.",
    },
  },
  {
    id: 'legend-004',
    theme: 'Le Mur de Verre Algorithmique',
    sources: [
      { url: '', type: 'book', title: 'Les Villes Invisibles — Italo Calvino', geographicContext: 'Italie, fiction universelle', geographicConfidence: 75 },
      { url: '', type: 'article', title: 'Biais des LLM — Recherches Anthropic / OpenAI', geographicContext: 'États-Unis, Silicon Valley', geographicConfidence: 90 },
    ],
    revealedPattern: `Nos IA construisent des villes numériques où tout le monde se ressemble. Sans vécus marginaux, nous bâtissons une prison de miroirs où l'innovation meurt de consanguinité intellectuelle.

Calvino décrit des villes imaginaires à travers les yeux de Marco Polo — chaque ville est une manière de comprendre le monde, une géographie mentale autant que physique. Les recherches d'Anthropic et OpenAI sur les biais des LLM montrent que les modèles de langage reproduisent systématiquement les préférences, la langue et les représentations des populations qui les ont entraînés — principalement blanches, anglophones, urbanisées, diplômées.

Ce croisement révèle que nos IA sont des Villes Invisibles construites par une seule culture qui se croit universelle. Ce que Marco Polo ne dit pas dans Calvino — ce qu'il ne peut pas voir depuis sa position — est exactement ce que les LLM ne peuvent pas générer : le vécu non-digitalisé, la pensée non-linéaire, la sagesse transmise oralement.`,
    convergenceZones: [
      "Calvino et les chercheurs en IA décrivent tous deux des systèmes qui reflètent leurs créateurs au lieu de révéler l'inconnu — la fiction et la science convergent sur le même diagnostic.",
      "Les deux sources montrent que l'invisibilité de certaines perspectives n'est pas un accident mais une architecture — Calvino par la géographie de l'imagination, les chercheurs par la statistique des données d'entraînement.",
    ],
    divergenceZones: [
      "Calvino célèbre l'invisible — les villes qu'on ne voit pas sont des invitations à l'imagination. L'IA efface l'invisible en le remplaçant par la moyenne statistique de ce qui existe déjà.",
      "Calvino opère par poésie et intuition. Les recherches sur les biais opèrent par mesure et correction — deux méthodes incompatibles pour réparer le même problème.",
    ],
    globalConfidence: 82,
    geographicRepresentativity: "Italie (Calvino) et Silicon Valley américaine (recherches IA). Absents : perspectives africaines, asiatiques et autochtones sur ce que l'IA devrait représenter et pour qui.",
    theUnspeakable: "Ce que l'IA ne générera jamais parce qu'elle n'a jamais souffert — et ce que cette absence révèle sur la nature de l'intelligence que nous construisons pour nous représenter.",
    questionNoOneHasAsked: "Si une IA lit tous les livres du monde mais n'a jamais eu faim, peut-elle comprendre Les Misérables ? Et si non, quelle ville invisible construit-elle à la place ?",
    irreconcilable: "L'optimisation statistique comme fondement de l'intelligence artificielle versus la singularité irréductible du vécu marginalisé — ces deux logiques ne peuvent coexister sans que l'une efface systématiquement l'autre.",
    sourceCoordinates: [{ lat: 41.90, lng: 12.50, region: 'Rome, Italie' }, { lat: 37.39, lng: -122.08, region: 'Silicon Valley, États-Unis' }],
    createdAt: new Date('2024-12-15'),
    actionables: {
      individu: "La prochaine fois que vous utilisez une IA, demandez-vous : quelle perspective cette réponse ne pourrait-elle jamais avoir ? Qui est absent de ce résultat ?",
      chercheur: "Développer des métriques de diversité épistémique pour évaluer les LLM — pas seulement la précision, mais la représentativité des vécus marginalisés dans les outputs.",
      institution: "Conditionner les appels d'offres publics d'IA à des audits de biais culturels co-construits avec des communautés sous-représentées dans les données d'entraînement.",
    },
  },
  {
    id: 'legend-005',
    theme: 'La Traduction de la Souffrance',
    sources: [
      { url: '', type: 'article', title: 'Félix Moumié — Cameroun 1960', geographicContext: 'Cameroun, décolonisation africaine', geographicConfidence: 90 },
      { url: '', type: 'article', title: 'Patrice Lumumba — Congo 1961', geographicContext: 'Congo, décolonisation africaine', geographicConfidence: 90 },
    ],
    revealedPattern: `Deux leaders assassinés par des puissances coloniales distinctes. Même mécanisme d'effacement. Même silence dans les manuels scolaires. La mémoire collective a des trous qui ne sont pas accidentels.

Félix Moumié, empoisonné par les services secrets français à Genève en 1960, et Patrice Lumumba, exécuté avec la complicité belge et américaine au Congo en 1961 — ces deux histoires partagent une architecture de l'oubli identique : une mort violente déguisée ou minimisée, une récupération narrative par les anciens colonisateurs, une absence systématique des manuels scolaires des pays concernés.

Ce croisement révèle que l'effacement de la mémoire n'est pas une négligence historique mais une politique : les États choisissent des méthodes invisibles pour tuer les mémoires autant que les personnes. La décolonisation politique n'a pas entraîné la décolonisation mémorielle. Ce qui reste, c'est la douleur des peuples qui doivent célébrer une indépendance qu'ils n'ont pas choisie, dans des frontières qu'ils n'ont pas tracées.`,
    convergenceZones: [
      "Même période (1960-1961), même méthode d'élimination planifiée par des puissances étrangères, même silence dans les récits officiels des anciennes métropoles coloniales.",
      "Les deux leaders incarnaient une vision d'indépendance totale — économique et politique — incompatible avec les intérêts des puissances qui ont orchestré leur disparition.",
    ],
    divergenceZones: [
      "Moumié a été empoisonné par la France via des réseaux de services secrets — une mort indirecte, invisible, niable pendant des décennies. Lumumba a été exécuté avec la complicité active de la Belgique et de la CIA — une mort directe, documentée mais longtemps déniée.",
      "Le Cameroun a entretenu un rapport ambigu à la mémoire de Moumié, parfois instrumentalisé selon les régimes. Le Congo a connu un processus de réhabilitation plus public mais aussi plus tardif de Lumumba.",
    ],
    globalConfidence: 88,
    geographicRepresentativity: "Afrique centrale (Cameroun, Congo). Ancrage dans l'histoire décoloniale africaine. Absents : perspectives des descendants et communautés directement affectées, comparaisons avec d'autres contextes d'assassinats politiques coloniaux en Asie et en Amérique latine.",
    theUnspeakable: "La douleur des peuples qui voient leur libérateur mourir avant la liberté — et qui doivent ensuite célébrer une indépendance qu'ils n'ont pas choisie, dans des institutions qu'ils n'ont pas conçues.",
    questionNoOneHasAsked: "Pourquoi les États choisissent-ils des méthodes invisibles pour tuer les mémoires autant que les personnes ? Et qu'est-ce que cela révèle sur la différence entre légitimité et légalité dans l'ordre international ?",
    irreconcilable: "La vérité historique documentée sur les responsabilités coloniales dans ces assassinats et les récits officiels des États impliqués — ces deux versions ne peuvent être réconciliées sans que l'une implique la culpabilité de l'autre.",
    sourceCoordinates: [{ lat: 3.85, lng: 11.52, region: 'Yaoundé, Cameroun' }, { lat: -4.33, lng: 15.32, region: 'Kinshasa, Congo' }],
    createdAt: new Date('2025-01-01'),
    actionables: {
      individu: "Lisez un récit historique de la décolonisation africaine écrit par un historien africain, pas par un historien français ou belge — et notez ce que ce changement de perspective révèle.",
      chercheur: "Comparer les manuels scolaires sur la décolonisation produits dans les anciens pays colonisateurs et dans les anciens pays colonisés — cartographier les silences et les inversions narratives.",
      institution: "Soutenir les initiatives de recherche historique menées par des universités africaines sur leur propre histoire — et conditionner les partenariats académiques Nord-Sud à une égalité de publication et de crédit intellectuel.",
    },
  },
]
