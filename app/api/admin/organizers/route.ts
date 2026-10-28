import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { ORGANIZER_COOKIE, createSessionToken, currentOrganizer, isSameOrigin, organizerCookieOptions, type Organizer } from '@/lib/organizer-session';
import { hashPassword, verifyPassword } from '@/lib/password';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store' };
const fail = (error: string, status: number) => Response.json({ error }, { status, headers });

async function list() {
  const { rows } = await db.query('SELECT id, login, name, role, active FROM organizers ORDER BY active DESC, role DESC, name');
  return rows;
}

async function guard(request: Request | null, ownerOnly: boolean): Promise<Organizer | Response> {
  if (request && !isSameOrigin(request)) return fail('Недопустимый источник запроса.', 403);
  const organizer = await currentOrganizer();
  if (!organizer) return fail('Сессия истекла. Войдите снова.', 401);
  if (ownerOnly && organizer.role !== 'owner') return fail('Это может сделать только админ.', 403);
  return organizer;
}

export async function GET() {
  const me = await guard(null, false);
  if (me instanceof Response) return me;
  return Response.json({ me, organizers: me.role === 'owner' ? await list() : [] }, { headers });
}

/** Owner adds an organizer: { login, name, password, role }. */
export async function POST(request: Request) {
  const me = await guard(request, true);
  if (me instanceof Response) return me;
  const body = await request.json().catch(() => ({})) as { login?: unknown; name?: unknown; password?: unknown; role?: unknown };
  const login = typeof body.login === 'string' ? body.login.trim() : '';
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const role = body.role === 'owner' ? 'owner' : 'judge';
  if (!/^[a-zA-Z0-9._-]{3,32}$/.test(login)) return fail('Логин: 3–32 символа, латиница, цифры, точка, дефис.', 400);
  if (!name || name.length > 60) return fail('Укажите имя организатора.', 400);
  if (typeof body.password !== 'string' || body.password.length < 8) return fail('Пароль — не короче 8 символов.', 400);
  const { rowCount } = await db.query(
    'INSERT INTO organizers (login, name, role, password_hash) VALUES ($1, $2, $3, $4) ON CONFLICT (login) DO NOTHING',
    [login, name, role, await hashPassword(body.password)]);
  if (!rowCount) return fail('Такой логин уже есть.', 409);
  return Response.json({ organizers: await list() }, { headers });
}

/**
 * Change a password or switch an account off.
 * Anyone: { id: self, currentPassword, password }. Owner: { id, password } or { id, active }.
 * Both end the account's existing sessions.
 */
export async function PATCH(request: Request) {
  const me = await guard(request, false);
  if (me instanceof Response) return me;
  const body = await request.json().catch(() => ({})) as { id?: unknown; password?: unknown; currentPassword?: unknown; active?: unknown };
  if (!Number.isInteger(body.id)) return fail('Некорректный запрос.', 400);
  const self = body.id === me.id;
  if (!self && me.role !== 'owner') return fail('Это может сделать только админ.', 403);

  if (typeof body.active === 'boolean') {
    if (self) return fail('Нельзя отключить собственный аккаунт.', 400);
    await db.query('UPDATE organizers SET active = $2, session_version = session_version + 1 WHERE id = $1', [body.id, body.active]);
  } else {
    if (typeof body.password !== 'string' || body.password.length < 8) return fail('Пароль — не короче 8 символов.', 400);
    if (self) {
      const { rows: [row] } = await db.query<{ password_hash: string }>('SELECT password_hash FROM organizers WHERE id = $1', [me.id]);
      if (typeof body.currentPassword !== 'string' || !await verifyPassword(body.currentPassword, row.password_hash)) return fail('Текущий пароль указан неверно.', 400);
    }
    const { rows: [updated] } = await db.query<{ session_version: number }>(
      'UPDATE organizers SET password_hash = $2, session_version = session_version + 1 WHERE id = $1 RETURNING session_version',
      [body.id, await hashPassword(body.password)]);
    // Other devices are signed out; this one gets a fresh session.
    if (self && updated) (await cookies()).set(ORGANIZER_COOKIE, await createSessionToken(me.id, updated.session_version), organizerCookieOptions);
  }
  return Response.json({ organizers: me.role === 'owner' ? await list() : [] }, { headers });
}
