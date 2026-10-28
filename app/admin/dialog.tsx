'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

/** Modal shell for organizer tools: Esc or a click outside closes it, focus returns to the opener. */
export default function Dialog({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
      previous?.focus();
    };
  }, [onClose]);

  return <div className="admin-dialog-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className={`admin-dialog ${wide ? 'is-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="admin-dialog-title">
      <header>
        <h2 id="admin-dialog-title">{title}</h2>
        <button ref={closeRef} type="button" className="admin-dialog-close" onClick={onClose} aria-label="Закрыть"><X size={18}/></button>
      </header>
      <div className="admin-dialog-body">{children}</div>
    </section>
  </div>;
}
