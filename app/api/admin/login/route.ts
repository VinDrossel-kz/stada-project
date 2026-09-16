import { cookies } from 'next/headers';
import { ORGANIZER_COOKIE, isOrganizerPassword, isSameOrigin, organizerCookieOptions } from '@/lib/organizer-session';

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: 'Недопустимый источник запроса.' }, { status: 403 });
  let password: unknown;
  try {
    ({ password } = await request.json() as { password?: unknown });
  } catch {
    return Response.json({ error: 'Введите пароль.' }, { status: 400 });
  }
  if (!isOrganizerPassword(password)) return Response.json({ error: 'Неверный пароль.' }, { status: 401 });
  const cookieStore = await cookies();
  cookieStore.set(ORGANIZER_COOKIE, password, organizerCookieOptions);
  return Response.json({ ok: true });
}
