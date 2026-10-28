import { currentOrganizer, isSameOrigin } from '@/lib/organizer-session';
import { MAX_SCORE, ScoreError, loadScoreBoard, saveScore } from '@/lib/scores';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store' };

export async function GET() {
  try {
    return Response.json(await loadScoreBoard(), { headers });
  } catch (error) {
    console.error('Load scores failed', error);
    return Response.json({ error: 'Результаты временно недоступны. Попробуйте ещё раз.' }, { status: 503, headers });
  }
}

export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: 'Недопустимый источник запроса.' }, { status: 403, headers });
  const organizer = await currentOrganizer();
  if (!organizer) return Response.json({ error: 'Сессия истекла. Войдите снова.' }, { status: 401, headers });

  let body: { teamId?: unknown; gameId?: unknown; score?: unknown; previous?: unknown };
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Некорректный запрос.' }, { status: 400, headers });
  }
  const { teamId, gameId, score, previous } = body;
  if (!Number.isInteger(teamId) || !Number.isInteger(gameId) || !Number.isInteger(score) || (score as number) < 0 || (score as number) > MAX_SCORE
    || (previous !== undefined && !Number.isInteger(previous))) {
    return Response.json({ error: 'Введите целое число от 0 до 1 000 000.' }, { status: 400, headers });
  }

  try {
    const board = await saveScore(organizer, teamId as number, gameId as number, score as number, previous === undefined ? null : previous as number);
    return Response.json(board, { headers });
  } catch (error) {
    if (error instanceof ScoreError) return Response.json({ error: error.message }, { status: error.status, headers });
    console.error('Save score failed', error);
    return Response.json({ error: 'Не удалось сохранить результат. Попробуйте ещё раз.' }, { status: 503, headers });
  }
}
