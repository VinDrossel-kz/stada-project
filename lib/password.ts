import 'server-only';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, length: number, options: { N: number; r: number; p: number }) => Promise<Buffer>;
const COST = 16384;

/** Stored as `scrypt$N$salt$hash` (base64); the same format is written by db/migrate.mjs. */
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, 64, { N: COST, r: 8, p: 1 });
  return `scrypt$${COST}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, cost, salt, hash] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64');
  const actual = await scryptAsync(password, Buffer.from(salt, 'base64'), expected.length, { N: Number(cost), r: 8, p: 1 });
  return timingSafeEqual(actual, expected);
}
