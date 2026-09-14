import { SITE_BACKEND } from '@/lib/site-backend';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store' };

// Public reads only; authentication and writes stay on the original site.
export async function GET() {
  try {
    const response = await fetch(SITE_BACKEND + '/api/scores', {
      cache: 'no-store', signal: AbortSignal.timeout(10000), redirect: 'error',
    });
    if (!response.ok) throw new Error('Scores returned ' + response.status);
    const data = await response.json();
    if (!data || typeof data !== 'object' || !('teams' in data) || !Array.isArray(data.teams)) throw new Error('Invalid scores response');
    return Response.json({ teams: data.teams }, { headers });
  } catch (error) {
    console.error('Load scores failed', error);
    return Response.json(
      { error: 'Результаты временно недоступны. Попробуйте ещё раз.' },
      { status: 503, headers },
    );
  }
}
