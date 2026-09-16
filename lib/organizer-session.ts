import 'server-only';
import { createHash, timingSafeEqual } from 'node:crypto';

export const ORGANIZER_COOKIE = 'stada_organizer_session';
const EXPECTED_PASSWORD_HASH = '4a61eb655c9649298b2d16bd6f72214eca4faa77a21ec11f9df6a98145b47508';

function passwordHash(value: string) {
  return createHash('sha256').update(value, 'utf8').digest();
}

export function isOrganizerPassword(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const actual = passwordHash(value);
  const expected = Buffer.from(EXPECTED_PASSWORD_HASH, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export const organizerCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 8,
};

export function isSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  return Boolean(origin && origin === new URL(request.url).origin);
}
