// TEL — Health check endpoint
// Used by Docker HEALTHCHECK and Coolify monitoring

import { getSouffleStatut } from '@/lib/souffle'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const souffle = await getSouffleStatut()

    return Response.json({
      ok: true,
      souffle,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    return Response.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
