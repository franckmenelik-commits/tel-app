// TEL — The Experience Layer
// /api/seed — Endpoint protégé pour déclencher le seeding Pinecone
//
// Méthode : POST
// Header requis : x-admin-key: <ADMIN_SECRET>
// Corps : {} (vide)
//
// Retourne : { total, indexed, cached, errors }

import { seedKnowledge } from '@/lib/seed-knowledge'

export const maxDuration = 300 // 5 minutes — le seeding peut prendre du temps

export async function POST(request: Request) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const adminKey = request.headers.get('x-admin-key')
  const expectedKey = process.env.ADMIN_SECRET

  if (!expectedKey) {
    return new Response(
      JSON.stringify({ error: 'ADMIN_SECRET non configuré dans les variables d\'environnement' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (!adminKey || adminKey !== expectedKey) {
    return new Response(
      JSON.stringify({ error: 'Non autorisé — header x-admin-key invalide ou manquant' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // ── Seed ────────────────────────────────────────────────────────────────────
  try {
    console.log('[/api/seed] Déclenchement du seeding par admin')
    const result = await seedKnowledge()

    return new Response(
      JSON.stringify({
        success: true,
        message: `Seeding terminé — ${result.indexed} indexés Pinecone, ${result.cached} en cache JSON`,
        ...result,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('[/api/seed] Erreur:', err)
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : 'Erreur inconnue',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// Empêcher GET accidentel
export async function GET() {
  return new Response(
    JSON.stringify({ error: 'Méthode non autorisée — utilisez POST avec x-admin-key' }),
    { status: 405, headers: { 'Content-Type': 'application/json' } }
  )
}
