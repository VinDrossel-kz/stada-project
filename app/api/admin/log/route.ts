import { currentOrganizer, isSameOrigin } from '@/lib/organizer-session';
import { ScoreError, readLog, revertLogEntry } from '@/lib/scores';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store' };

export async function GET() {
  if (!await currentOrganizer()) return Response.json({ error: 'Сессия истекла. Войдите снова.' }, { status: 401, headers });
  return Response.json({ entries: await readLog() }, { headers });
}

/** Revert one journal entry: { id }. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: 'Недопустимый источник запроса.' }, { status: 403, headers });
  const organizer = await currentOrganizer();
  if (!organizer) return Response.json({ error: 'Сессия истекла. Войдите снова.' }, { status: 401, headers });
  let id: unknown;
  try { ({ id } = await request.json() as { id?: unknown }); } catch {}
  if (!Number.isInteger(id)) return Response.json({ error: 'Некорректный запрос.' }, { status: 400, headers });
  try {
    const board = await revertLogEntry(organizer, id as number);
    return Response.json({ ...board, entries: await readLog() }, { headers });
  } catch (error) {
    if (error instanceof ScoreError) return Response.json({ error: error.message }, { status: error.status, headers });
    console.error('Revert failed', error);
    return Response.json({ error: 'Не удалось откатить изменение.' }, { status: 503, headers });
  }
}
