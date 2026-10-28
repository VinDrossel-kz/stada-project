'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/** Opens a projector screen in browser fullscreen; call from the click that leads to it. */
export function enterScreen() {
  document.documentElement.requestFullscreen?.().catch(() => {});
}

/**
 * Shared behaviour of the projector screens (broadcast, awards, QR): dark page,
 * Esc leaves at once, and the exit button shows for 2 s after the mouse moves.
 * In browser fullscreen Esc is consumed by the browser, so leaving fullscreen counts as Esc.
 */
export function useScreen(exitTo: string) {
  const router = useRouter();
  const [controls, setControls] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('is-broadcast');
    return () => root.classList.remove('is-broadcast');
  }, []);

  useEffect(() => {
    let timer = 0;
    const reveal = () => {
      setControls(true);
      clearTimeout(timer);
      timer = window.setTimeout(() => setControls(false), 2000);
    };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') router.push(exitTo); };
    const onFullscreen = () => { if (!document.fullscreenElement) router.push(exitTo); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousemove', reveal);
    document.addEventListener('touchstart', reveal);
    document.addEventListener('fullscreenchange', onFullscreen);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousemove', reveal);
      document.removeEventListener('touchstart', reveal);
      document.removeEventListener('fullscreenchange', onFullscreen);
    };
  }, [router, exitTo]);

  function exit() {
    // Leaving fullscreen navigates through the fullscreenchange listener.
    if (document.fullscreenElement) document.exitFullscreen().catch(() => router.push(exitTo));
    else router.push(exitTo);
  }

  return { controls, exit };
}
