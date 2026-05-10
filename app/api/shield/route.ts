/**
 * TEL — The Experience Layer
 * app/api/shield/route.ts — Bouclier RGPD API
 * 
 * Law Zero : la machine qui protège l'humain contre la machine.
 * Génère un email RGPD complet en invoquant les articles 15, 17 et 21.
 */

import { NextResponse } from 'next/server'
import { SHIELD_TARGETS, generateRGPDEmail } from '@/lib/shield-templates'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { platform, userName, userEmail } = body

    if (!platform || !userName || !userEmail) {
      return NextResponse.json(
        { error: 'Champs requis : platform, userName, userEmail' },
        { status: 400 }
      )
    }

    const targetKey = platform.toLowerCase().replace(/[\s\-]/g, '_')

    if (!SHIELD_TARGETS[targetKey]) {
      return NextResponse.json(
        {
          error: `Plateforme "${platform}" non supportée.`,
          supported: Object.keys(SHIELD_TARGETS),
        },
        { status: 400 }
      )
    }

    const email = generateRGPDEmail(targetKey, userName, userEmail)
    const target = SHIELD_TARGETS[targetKey]

    return NextResponse.json({
      success: true,
      platform: target.name,
      email,
      target: {
        name: target.name,
        data_export_url: target.data_export_url,
        disable_training_path: target.disable_training_path,
        known_violations: target.known_violations,
      },
      steps: [
        target.disable_training_path
          ? `1. Désactive l'entraînement IA : ${target.disable_training_path}`
          : null,
        target.data_export_url
          ? `2. Exporte tes données : ${target.data_export_url}`
          : null,
        `3. Envoie cet email à ${email.to} (CC: ${email.cc})`,
        '4. Attends 30 jours. Garde une copie de cet email.',
        '5. Si pas de réponse satisfaisante → Saisir la CNIL : cnil.fr/plainte',
      ].filter(Boolean),
      legal_basis: {
        article_15: 'Droit d\'accès — obtenir toutes les données détenues',
        article_17: 'Droit à l\'effacement — suppression totale et irréversible',
        article_21: 'Droit d\'opposition — blocage de tout traitement futur',
        deadline: '30 jours (article 12§3 RGPD)',
        authority: 'CNIL — cnil.fr/plainte (article 77 RGPD)',
      },
    })
  } catch (err) {
    console.error('Shield API error:', err)
    return NextResponse.json(
      { error: 'Erreur interne du Bouclier' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    module: 'TEL Bouclier RGPD',
    description: 'Génère automatiquement les armes juridiques pour exercer vos droits face aux GAFAM.',
    law_zero: 'La machine qui protège l\'humain contre la machine.',
    supported_platforms: Object.entries(SHIELD_TARGETS).map(([key, target]) => ({
      key,
      name: target.name,
      violations_count: target.known_violations.length,
    })),
  })
}
