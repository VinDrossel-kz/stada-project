import 'server-only';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { db } from './db';

export const ORGANIZER_COOKIE = 'stada_organizer_session';
const SESSION_TTL = 60 * 60 * 12;

export type Organizer = { id: number; login: string; name: string; role: 'owner' | 'judge' };

export const organizerCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production' && process.env.INSECURE_COOKIES !== '1',
  path: '/',
  maxAge: SESSION_TTL,
};

let secretPromise: Promise<string> | null = null;

/** SESSION_SECRET if set, otherwise a random key generated once and kept in the database. */
function sessionSecret() {
  if (process.env.SESSION_SECRET) return Promise.resolve(process.env.SESSION_SECRET);
  secretPromise ??= (async () => {
    await db.query("INSERT INTO settings (key, value) VALUES ('session_secret', $1) ON CONFLICT (key) DO NOTHING", [randomBytes(32).toString('base64url')]);
    const { rows } = await db.query("SELECT value FROM settings WHERE key = 'session_secret'");
    return rows[0].value as string;
  })().catch((error) => { secretPromise = null; throw error; });
  return secretPromise;
}

async function sign(payload: string) {
  return createHmac('sha256', await sessionSecret()).update(payload).digest('base64url');
}

/** Signed token `payload.signature`; the payload carries no secrets, only who and which session version. */
export async function createSessionToken(organizerId: number, sessionVersion: number) {
  const payload = Buffer.from(JSON.stringify({ id: organizerId, v: sessionVersion, exp: Math.floor(Date.now() / 1000) + SESSION_TTL })).toString('base64url');
  return `${payload}.${await sign(payload)}`;
}

export async function organizerFromToken(token: string | undefined): Promise<Organizer | null> {
  if (!token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = Buffer.from(await sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  let data: { id?: number; v?: number; exp?: number };
  try { data = JSON.parse(Buffer.from(payload, 'base64url').toString()); } catch { return null; }
  if (!data.id || !data.exp || data.exp < Date.now() / 1000) return null;
  const { rows } = await db.query<Organizer>(
    'SELECT id, login, name, role FROM organizers WHERE id = $1 AND session_version = $2 AND active',
    [data.id, data.v],
  );
  return rows[0] ?? null;
}

/** The signed-in organizer for the current request, or null. */
export async function currentOrganizer() {
  const cookieStore = await cookies();
  return organizerFromToken(cookieStore.get(ORGANIZER_COOKIE)?.value);
}

/** CSRF guard: the browser's Origin must match the host it sent the request to (works behind Docker and proxies). */
export function isSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (!origin || !host) return false;
  try { return new URL(origin).host === host; } catch { return false; }
}
