import 'server-only';
import { db, transaction } from './db';
import type { TeamRoster } from '@/app/teams';

const MAX_NAME = 40;

/** Thrown for problems the organizer can fix; the message is shown as is. */
export class RosterError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

function cleanName(value: unknown, what: string) {
  const name = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
  if (!name) throw new RosterError(`Введите ${what}.`, 400);
  if (name.length > MAX_NAME) throw new RosterError(`Слишком длинное название: не больше ${MAX_NAME} символов.`, 400);
  return name;
}

export async function loadRoster(): Promise<TeamRoster[]> {
  const { rows } = await db.query<{ id: number; name: string; members: string[] | null }>(
    `SELECT t.id, t.name, array_agg(m.name ORDER BY m.position, m.id) FILTER (WHERE m.id IS NOT NULL) AS members
       FROM teams t LEFT JOIN members m ON m.team_id = t.id
      GROUP BY t.id ORDER BY t.id`);
  return rows.map((row) => ({ id: row.id, name: row.name, members: row.members ?? [] }));
}

export async function addTeam(rawName: unknown) {
  const name = cleanName(rawName, 'название команды');
  await transaction(async (client) => {
    await client.query('LOCK TABLE teams IN SHARE ROW EXCLUSIVE MODE');
    const { rows: [taken] } = await client.query('SELECT 1 FROM teams WHERE lower(name) = lower($1)', [name]);
    if (taken) throw new RosterError('Команда с таким названием уже есть.', 409);
    await client.query('INSERT INTO teams (id, name) SELECT coalesce(max(id), 0) + 1, $1 FROM teams', [name]);
  });
  return loadRoster();
}

/** Removes a team with its members, scores and their journal entries. */
export async function removeTeam(id: unknown) {
  if (!Number.isInteger(id)) throw new RosterError('Некорректный запрос.', 400);
  const { rowCount } = await db.query('DELETE FROM teams WHERE id = $1', [id]);
  if (!rowCount) throw new RosterError('Команда не найдена.', 404);
  return loadRoster();
}

export async function addMember(teamId: unknown, rawName: unknown) {
  if (!Number.isInteger(teamId)) throw new RosterError('Некорректный запрос.', 400);
  const name = cleanName(rawName, 'ник участника');
  await transaction(async (client) => {
    const { rows: [team] } = await client.query('SELECT 1 FROM teams WHERE id = $1 FOR UPDATE', [teamId]);
    if (!team) throw new RosterError('Команда не найдена.', 404);
    const { rows: [taken] } = await client.query('SELECT 1 FROM members WHERE team_id = $1 AND lower(name) = lower($2)', [teamId, name]);
    if (taken) throw new RosterError('Такой участник в команде уже есть.', 409);
    await client.query(
      'INSERT INTO members (team_id, name, position) SELECT $1, $2, coalesce(max(position), -1) + 1 FROM members WHERE team_id = $1',
      [teamId, name]);
  });
  return loadRoster();
}

export async function removeMember(teamId: unknown, name: unknown) {
  if (!Number.isInteger(teamId) || typeof name !== 'string') throw new RosterError('Некорректный запрос.', 400);
  const { rowCount } = await db.query('DELETE FROM members WHERE team_id = $1 AND name = $2', [teamId, name]);
  if (!rowCount) throw new RosterError('Участник не найден.', 404);
  return loadRoster();
}
