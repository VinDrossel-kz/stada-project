import { SITE_BACKEND } from '@/lib/site-backend';
import { cookies } from 'next/headers';
import { ORGANIZER_COOKIE, isOrganizerPassword, isSameOrigin } from '@/lib/organizer-session';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store' };

export async function GET() {
  try {
    const response = await fetch(SITE_BACKEND + '/api/scores', {
      cache: 'no-store', signal: AbortSignal.timeout(10000), redirect: 'error',
    });
    if (!response.ok) throw new Error('Scores returned ' + response.status);
    const data = await response.json();
    if (!data || typeof data !== 'object' || !('teams' in data) || !Array.isArray(data.teams) || !('games' in data) || !Array.isArray(data.games)) throw new Error('Invalid scores response');
    return Response.json({ games: data.games, teams: data.teams }, { headers });
  } catch (error) {
    console.error('Load scores failed', error);
    return Response.json(
      { error: 'Результаты временно недоступны. Попробуйте ещё раз.' },
      { status: 503, headers },
    );
  }
}

export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: 'Недопустимый источник запроса.' }, { status: 403, headers });
  const cookieStore = await cookies();
  const password = cookieStore.get(ORGANIZER_COOKIE)?.value;
  if (!isOrganizerPassword(password)) return Response.json({ error: 'Сессия истекла. Войдите снова.' }, { status: 401, headers });

  let body: unknown;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Некорректный запрос.' }, { status: 400, headers });
  }

  try {
    const response = await fetch(SITE_BACKEND + '/api/scores', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Organizer-Password': password },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
      redirect: 'error',
    });
    return Response.json(await response.json(), { status: response.status, headers });
  } catch (error) {
    console.error('Save score failed', error);
    return Response.json({ error: 'Не удалось сохранить результат. Попробуйте ещё раз.' }, { status: 503, headers });
  }
}
