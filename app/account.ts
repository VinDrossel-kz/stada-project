'use client';

import { useEffect, useState } from 'react';

export type Account = { name: string; role: 'owner' | 'judge' };

export const roleLabel = { owner: 'Админ', judge: 'Судья' } as const;

const AUTH_EVENT = 'stada:auth-changed';

/** Tell every mounted header that the organizer signed in or out. */
export function announceAuthChange() {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

/** Set by the score editor so signing out from the header can warn about unsaved scores. */
export const unsavedScores = { count: 0 };

/**
 * The signed-in organizer, or null. `initial` comes from the server where it is already known
 * (the admin page); elsewhere it is fetched once per page and on sign-in/out.
 */
export function useAccount(initial?: Account | null) {
  const [account, setAccount] = useState<Account | null>(initial ?? null);

  useEffect(() => {
    let cancelled = false;
    const load = () => fetch('/api/admin/me', { cache: 'no-store' })
      .then((response) => response.json() as Promise<{ organizer: Account | null }>)
      .then((data) => { if (!cancelled) setAccount(data.organizer); })
      .catch(() => {});
    if (initial === undefined) void load();
    window.addEventListener(AUTH_EVENT, load);
    return () => { cancelled = true; window.removeEventListener(AUTH_EVENT, load); };
  }, [initial]);

  return account;
}
