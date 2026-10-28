import 'server-only';

const MAX_FAILURES = 5;
const LOCK_MS = 60_000;
const failures = new Map<string, { count: number; until: number }>();

/** Seconds left on a lock for this key, or 0. In memory: one app instance is enough for the event. */
export function lockedFor(key: string) {
  const entry = failures.get(key);
  if (!entry || entry.until < Date.now()) return 0;
  return Math.ceil((entry.until - Date.now()) / 1000);
}

export function recordFailure(key: string) {
  const entry = failures.get(key);
  const count = entry && entry.until > Date.now() - LOCK_MS ? entry.count + 1 : 1;
  failures.set(key, { count, until: count >= MAX_FAILURES ? Date.now() + LOCK_MS : Date.now() });
}

export function clearFailures(key: string) {
  failures.delete(key);
}
