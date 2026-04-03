// TEL — The Experience Layer
// scripts/seed-patterns.ts
// Seed script — launches 30 high-quality public crossings and stores patterns in Pinecone.
//
// USAGE : npm run seed-patterns
// ATTENTION : consomme des crédits API (Mistral + Anthropic). Ne lancer qu'une seule fois.
//
// REQUIRES : ANTHROPIC_API_KEY or MISTRAL_API_KEY, PINECONE_API_KEY, PINECONE_HOST

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// ─── 30 founding crossings ───────────────────────────────────────────────────

const CROSSINGS: Array<{ sources: [string, string]; label: string }> = [
  // PHILOSOPHIE & EXISTENCE
  {
    label: 'Rilke × Camus',
    sources: ['livre:Lettres à un jeune poète — Rilke', "livre:L'Étranger — Albert Camus"],
  },
  {
    label: 'Camus Sisyphe × Marc Aurèle',
    sources: ['livre:Le Mythe de Sisyphe — Albert Camus', 'livre:Méditations — Marc Aurèle'],
  },
  {
    label: 'Wittgenstein × Rûmî',
    sources: ['livre:Tractatus Logico-Philosophicus — Wittgenstein', 'livre:Masnavi — Jalal al-Din Rûmî'],
  },
  {
    label: 'Simone Weil × Ubuntu',
    sources: ['livre:La Pesanteur et la Grâce — Simone Weil', 'philosophie ubuntu afrique subsaharienne'],
  },

  // SCIENCE & PERCEPTION
  {
    label: 'Schrödinger × Barry Schwartz',
    sources: ['chat de Schrödinger physique quantique', 'livre:Le Paradoxe du choix — Barry Schwartz'],
  },
  {
    label: 'Biais des survivants × Abraham Wald',
    sources: [
      'https://www.youtube.com/watch?v=IgnW4BxMwWE',
      'https://en.wikipedia.org/wiki/Abraham_Wald',
    ],
  },
  {
    label: 'Thomas Kuhn × Fanon',
    sources: [
      'livre:La Structure des révolutions scientifiques — Thomas Kuhn',
      'livre:Peau noire masques blancs — Frantz Fanon',
    ],
  },
  {
    label: 'Cosmologie Hopi × Physique quantique',
    sources: [
      'https://en.wikipedia.org/wiki/Hopi_mythology',
      'https://en.wikipedia.org/wiki/Copenhagen_interpretation',
    ],
  },

  // JUSTICE & DIGNITÉ
  {
    label: 'COMPAS × Mass incarceration',
    sources: [
      'https://en.wikipedia.org/wiki/COMPAS_(software)',
      'https://en.wikipedia.org/wiki/Mass_incarceration_in_the_United_States',
    ],
  },
  {
    label: 'Instagram ToS × DUDH',
    sources: [
      'https://en.wikipedia.org/wiki/Instagram',
      "https://fr.wikipedia.org/wiki/D%C3%A9claration_universelle_des_droits_de_l%27homme",
    ],
  },
  {
    label: 'TikTok Privacy × Convention droits enfant',
    sources: [
      'https://en.wikipedia.org/wiki/TikTok',
      "https://fr.wikipedia.org/wiki/Convention_internationale_des_droits_de_l%27enfant",
    ],
  },
  {
    label: 'Lumumba × Moumié',
    sources: [
      'https://fr.wikipedia.org/wiki/Patrice_Lumumba',
      'https://fr.wikipedia.org/wiki/F%C3%A9lix-Roland_Moumi%C3%A9',
    ],
  },

  // CULTURE & MÉMOIRE
  {
    label: 'Révolution française × Révolution haïtienne',
    sources: [
      'https://en.wikipedia.org/wiki/French_Revolution',
      'https://en.wikipedia.org/wiki/Haitian_Revolution',
    ],
  },
  {
    label: 'Psychology of Money × Pauvreté ONU',
    sources: [
      'livre:The Psychology of Money — Morgan Housel',
      'https://en.wikipedia.org/wiki/Extreme_poverty',
    ],
  },
  {
    label: 'M-Pesa × Silicon Valley',
    sources: [
      'https://en.wikipedia.org/wiki/M-Pesa',
      'https://en.wikipedia.org/wiki/Silicon_Valley',
    ],
  },
  {
    label: 'Biais des survivants × Naines brunes',
    sources: [
      'biais des survivants psychologie cognitive',
      'https://en.wikipedia.org/wiki/Brown_dwarf',
    ],
  },

  // AMOUR & RELATION
  {
    label: 'Rilke lettres × Chapman Love Languages',
    sources: [
      'livre:Lettres à Lou Andreas-Salomé — Rilke',
      'livre:Les 5 langages de l amour — Gary Chapman',
    ],
  },
  {
    label: 'Psyché et Éros × Bowlby attachment',
    sources: [
      'mythe de Psyché et Éros mythologie grecque',
      'https://en.wikipedia.org/wiki/Attachment_theory',
    ],
  },
  {
    label: 'Beauvoir × bell hooks',
    sources: [
      'livre:Le Deuxième Sexe — Simone de Beauvoir',
      'livre:All About Love — bell hooks',
    ],
  },
  {
    label: 'Rûmî amour × Neuroscience attachement',
    sources: [
      'livre:Poèmes mystiques — Rûmî',
      'neuroscience attachement amour cerveau',
    ],
  },

  // POUVOIR & RÉSISTANCE
  {
    label: 'MLK × Mandela',
    sources: [
      'https://en.wikipedia.org/wiki/Letter_from_Birmingham_Jail',
      "https://en.wikipedia.org/wiki/Nelson_Mandela%27s_prison_letter",
    ],
  },
  {
    label: 'Fanon × IA rapport Citrini',
    sources: [
      'livre:Les Damnés de la Terre — Frantz Fanon',
      'intelligence artificielle biais colonialisme pouvoir',
    ],
  },
  {
    label: 'Hannah Arendt × Algorithmes recommandation',
    sources: [
      'livre:Eichmann à Jérusalem — Hannah Arendt banalité du mal',
      'algorithmes recommandation biais polarisation',
    ],
  },
  {
    label: 'Crenshaw intersectionnalité × Immigration',
    sources: [
      'https://en.wikipedia.org/wiki/Intersectionality',
      'https://en.wikipedia.org/wiki/Immigration_detention',
    ],
  },

  // ÉDUCATION & TRANSMISSION
  {
    label: 'Freire × Khan Academy',
    sources: [
      'livre:Pédagogie des opprimés — Paulo Freire',
      'https://en.wikipedia.org/wiki/Khan_Academy',
    ],
  },
  {
    label: 'Montessori × Apprentissage autochtone',
    sources: [
      'https://en.wikipedia.org/wiki/Montessori_education',
      'apprentissage traditionnel autochtone australien',
    ],
  },
  {
    label: 'Bloom 2 Sigma × Accès internet Afrique',
    sources: [
      'bloom two sigma problem éducation',
      'accès internet fracture numérique Afrique subsaharienne',
    ],
  },

  // TECHNOLOGIE & HUMANITÉ
  {
    label: 'Constitutional AI × DUDH',
    sources: [
      'Constitutional AI Anthropic alignment',
      "https://fr.wikipedia.org/wiki/D%C3%A9claration_universelle_des_droits_de_l%27homme",
    ],
  },
  {
    label: 'IA rapport Citrini × Psychology of Money',
    sources: [
      'intelligence artificielle économie travail automatisation',
      'livre:The Psychology of Money — Morgan Housel',
    ],
  },
  {
    label: 'LawZero × TEL Manifeste',
    sources: [
      'théorie du droit au-delà des États Law Zero',
      'intelligence collective narrative cross-culturelle expérience',
    ],
  },
]

// ─── Main seeding function ────────────────────────────────────────────────────

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function seedCrossing(
  label: string,
  sources: [string, string],
  index: number,
  total: number
): Promise<boolean> {
  console.log(`\n[${index + 1}/${total}] Croisement : ${label}`)
  console.log(`  Sources : ${sources[0].slice(0, 60)} × ${sources[1].slice(0, 60)}`)

  try {
    const res = await fetch(`${APP_URL}/api/cross`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-seed-key': process.env.ADMIN_SECRET || '',
      },
      body: JSON.stringify({
        inputs: [sources[0], sources[1]],
        contexte: 'exploration',
        lang: 'fr',
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error(`  ✗ Erreur HTTP ${res.status}: ${err.slice(0, 200)}`)
      return false
    }

    const data = await res.json()

    if (!data.success || !data.insight) {
      console.error(`  ✗ Croisement échoué: ${data.error || 'Pas d\'insight'}`)
      return false
    }

    const insight = data.insight
    console.log(`  ✓ Pattern stocké: ${insight.theme || label}`)
    console.log(`    Question: ${(insight.questionNoOneHasAsked || '').slice(0, 100)}…`)

    return true
  } catch (err) {
    console.error(`  ✗ Erreur réseau: ${err instanceof Error ? err.message : err}`)
    return false
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('TEL — Seed 30 patterns fondateurs de la mémoire culturelle')
  console.log('═══════════════════════════════════════════════════════')
  console.log(`Endpoint : ${APP_URL}/api/cross`)
  console.log(`Total : ${CROSSINGS.length} croisements`)
  console.log('ATTENTION : ce script consomme des crédits API.')
  console.log('Il stocke les patterns dans Pinecone si PINECONE_API_KEY est configurée.')
  console.log('═══════════════════════════════════════════════════════\n')

  // Wait 3s to allow the user to cancel
  console.log('Démarrage dans 3 secondes… (Ctrl+C pour annuler)')
  await sleep(3000)

  let succeeded = 0
  let failed = 0

  for (let i = 0; i < CROSSINGS.length; i++) {
    const { label, sources } = CROSSINGS[i]
    const ok = await seedCrossing(label, sources, i, CROSSINGS.length)

    if (ok) succeeded++
    else failed++

    // Rate limiting: 2s between crossings to avoid overwhelming the APIs
    if (i < CROSSINGS.length - 1) {
      await sleep(2000)
    }
  }

  console.log('\n═══════════════════════════════════════════════════════')
  console.log(`Seeding terminé : ${succeeded}/${CROSSINGS.length} réussis, ${failed} échoués`)
  console.log('═══════════════════════════════════════════════════════')
}

main().catch(console.error)
