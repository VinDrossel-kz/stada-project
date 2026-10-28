'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import QRCode from 'qrcode';

/** Small modal with a QR code that opens the site's home page. */
export default function QrDialog({ onClose }: { onClose: () => void }) {
  const [qr, setQr] = useState<{ url: string; svg: string } | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const url = window.location.origin;
    let cancelled = false;
    QRCode.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#16181d', light: '#ffffff' } })
      .then((svg) => { if (!cancelled) setQr({ url, svg }); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); previous?.focus(); };
  }, [onClose]);

  return <div className="qr-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="qr-dialog" role="dialog" aria-modal="true" aria-label="QR-код сайта">
      <button ref={closeRef} type="button" className="qr-close" onClick={onClose} aria-label="Закрыть"><X size={18}/></button>
      {qr ? <div className="qr-image" role="img" aria-label={`QR-код: ${qr.url}`} dangerouslySetInnerHTML={{ __html: qr.svg }}/> : <div className="qr-image is-loading"/>}
    </div>
  </div>;
}
