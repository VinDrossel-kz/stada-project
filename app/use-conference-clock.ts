'use client';
import { useEffect, useState } from 'react';
export function useConferenceClock() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setNow(Date.now());
    const initial = window.setTimeout(update, 0);
    const timer = window.setInterval(update, 15_000);
    document.addEventListener('visibilitychange', update);
    return () => { clearTimeout(initial); clearInterval(timer); document.removeEventListener('visibilitychange', update); };
  }, []);
  return now;
}
