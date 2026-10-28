import 'server-only';
import type { PoolClient } from 'pg';
import { db, transaction } from './db';
import type { Organizer } from './organizer-session';
import type { Game } from '@/app/games';
import type { Team } from '@/app/teams';

export const MAX_SCORE = 1_000_000;

export type ScoreBoard = { games: Game[]; teams: Team[] };

export type LogEntry = {
  id: number;
  team_id: number;
  team_name: string;
  game_id: number;
  game_name: string;
  old_score: number;
  new_score: number;
  organizer_name: string;
  reverts_id: number | null;
  reverted_by: number | null;
  created_at: string;
};

/** Thrown for problems the organizer can fix; the message is shown as is. */
export class ScoreError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

export async function loadScoreBoard(client: Pick<PoolClient, 'query'> = db): Promise<ScoreBoard> {
  const [games, teams, scores] = await Promise.all([
    client.query<Game>('SELECT id, stage, name FROM games ORDER BY position'),
    client.query<{ id: number; name: string }>('SELECT id, name FROM teams ORDER BY id'),
    client.query<{ team_id: number; game_id: number; score: number; updated_at: Date }>('SELECT team_id, game_id, score, updated_at FROM scores'),
  ]);
  return {
    games: games.rows,
    teams: teams.rows.map((team) => {
      const own = scores.rows.filter((entry) => entry.team_id === team.id);
      const latest = own.reduce<Date | null>((max, entry) => (!max || entry.updated_at > max ? entry.updated_at : max), null);
      return {
        id: team.id,
        name: team.name,
        score: own.reduce((sum, entry) => sum + entry.score, 0),
        updated_at: latest?.toISOString() ?? null,
        game_scores: own.map((entry) => ({ game_id: entry.game_id, score: entry.score, updated_at: entry.updated_at.toISOString() })),
      };
    }),
  };
}

async function writeScore(client: PoolClient, organizer: Organizer, teamId: number, gameId: number, score: number, previous: number | null, revertsId: number | null) {
  const exists = await client.query('SELECT (SELECT 1 FROM teams WHERE id = $1) AS team, (SELECT 1 FROM games WHERE id = $2) AS game', [teamId, gameId]);
  if (!exists.rows[0].team || !exists.rows[0].game) throw new ScoreError('Команда или игра не найдена.', 404);
  // Row lock: two organizers saving the same cell are serialized, and the second sees the first one's value.
  const current = await client.query<{ score: number }>('SELECT score FROM scores WHERE team_id = $1 AND game_id = $2 FOR UPDATE', [teamId, gameId]);
  const old = current.rows[0]?.score ?? 0;
  if (previous !== null && previous !== old) {
    throw new ScoreError(`Пока вы вводили баллы, их уже изменили: сейчас ${old}. Обновите страницу и проверьте значение.`, 409);
  }
  if (old === score) return;
  await client.query(
    `INSERT INTO scores (team_id, game_id, score, updated_at, updated_by) VALUES ($1, $2, $3, now(), $4)
     ON CONFLICT (team_id, game_id) DO UPDATE SET score = EXCLUDED.score, updated_at = now(), updated_by = EXCLUDED.updated_by`,
    [teamId, gameId, score, organizer.id],
  );
  await client.query(
    'INSERT INTO score_log (team_id, game_id, old_score, new_score, organizer_id, organizer_name, reverts_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [teamId, gameId, old, score, organizer.id, organizer.name, revertsId],
  );
}

export function saveScore(organizer: Organizer, teamId: number, gameId: number, score: number, previous: number | null) {
  return transaction(async (client) => {
    await writeScore(client, organizer, teamId, gameId, score, previous, null);
    return loadScoreBoard(client);
  });
}

/** Puts a cell back to the value before a journal entry, if nobody has changed it since. */
export function revertLogEntry(organizer: Organizer, logId: number) {
  return transaction(async (client) => {
    const { rows: [entry] } = await client.query<{ team_id: number; game_id: number; old_score: number; new_score: number }>(
      'SELECT team_id, game_id, old_score, new_score FROM score_log WHERE id = $1', [logId]);
    if (!entry) throw new ScoreError('Запись журнала не найдена.', 404);
    const { rows: [later] } = await client.query('SELECT 1 FROM score_log WHERE team_id = $1 AND game_id = $2 AND id > $3 LIMIT 1', [entry.team_id, entry.game_id, logId]);
    if (later) throw new ScoreError('Эту ячейку уже меняли после этой записи — откатить можно только последнее изменение.', 409);
    await writeScore(client, organizer, entry.team_id, entry.game_id, entry.old_score, entry.new_score, logId);
    return loadScoreBoard(client);
  });
}

export async function readLog(limit = 300) {
  const { rows } = await db.query<LogEntry & { created_at: Date }>(
    `SELECT l.id, l.team_id, t.name AS team_name, l.game_id, g.name AS game_name, l.old_score, l.new_score,
            l.organizer_name, l.reverts_id, r.id AS reverted_by, l.created_at
       FROM score_log l
       JOIN teams t ON t.id = l.team_id
       JOIN games g ON g.id = l.game_id
       LEFT JOIN score_log r ON r.reverts_id = l.id
      ORDER BY l.id DESC
      LIMIT $1`, [limit]);
  return rows.map((row) => ({ ...row, created_at: row.created_at.toISOString() }));
}
