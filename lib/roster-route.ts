import 'server-only';
import { currentOrganizer, isSameOrigin, type Organizer } from './organizer-session';
import { RosterError } from './roster';

const headers = { 'Cache-Control': 'no-store' };

/** Shared by the roster routes: same-origin organizer, optionally the owner only. */
export async function rosterChange(request: Request, ownerOnly: boolean, change: (organizer: Organizer, body: Record<string, unknown>) => Promise<unknown>) {
  if (!isSameOrigin(request)) return Response.json({ error: 'Недопустимый источник запроса.' }, { status: 403, headers });
  const organizer = await currentOrganizer();
  if (!organizer) return Response.json({ error: 'Сессия истекла. Войдите снова.' }, { status: 401, headers });
  if (ownerOnly && organizer.role !== 'owner') return Response.json({ error: 'Удалять команды может только админ.' }, { status: 403, headers });
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  try {
    return Response.json({ teams: await change(organizer, body) }, { headers });
  } catch (error) {
    if (error instanceof RosterError) return Response.json({ error: error.message }, { status: error.status, headers });
    console.error('Roster change failed', error);
    return Response.json({ error: 'Не удалось сохранить изменения.' }, { status: 503, headers });
  }
}
