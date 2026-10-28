import { cookies, headers } from 'next/headers';
import { db } from '@/lib/db';
import { ORGANIZER_COOKIE, createSessionToken, isSameOrigin, organizerCookieOptions } from '@/lib/organizer-session';
import { verifyPassword } from '@/lib/password';
import { clearFailures, lockedFor, recordFailure } from '@/lib/rate-limit';

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: 'Недопустимый источник запроса.' }, { status: 403 });
  let login: unknown, password: unknown;
  try {
    ({ login, password } = await request.json() as { login?: unknown; password?: unknown });
  } catch {
    return Response.json({ error: 'Введите логин и пароль.' }, { status: 400 });
  }
  if (typeof login !== 'string' || typeof password !== 'string' || !login.trim() || !password) {
    return Response.json({ error: 'Введите логин и пароль.' }, { status: 400 });
  }

  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const key = `${ip}:${login.trim().toLowerCase()}`;
  const wait = lockedFor(key);
  if (wait) return Response.json({ error: `Слишком много попыток. Попробуйте через ${wait} с.` }, { status: 429 });

  const { rows: [organizer] } = await db.query<{ id: number; password_hash: string; session_version: number }>(
    'SELECT id, password_hash, session_version FROM organizers WHERE lower(login) = lower($1) AND active', [login.trim()]);
  if (!organizer || !await verifyPassword(password, organizer.password_hash)) {
    recordFailure(key);
    return Response.json({ error: 'Неверный логин или пароль.' }, { status: 401 });
  }

  clearFailures(key);
  const cookieStore = await cookies();
  cookieStore.set(ORGANIZER_COOKIE, await createSessionToken(organizer.id, organizer.session_version), organizerCookieOptions);
  return Response.json({ ok: true });
}
