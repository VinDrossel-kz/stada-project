'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, UserRoundSearch, X } from 'lucide-react';
import { participants } from './teams';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (teamId: number, participantName: string) => void;
  selectedParticipantName?: string;
  onSkip: () => void;
  onClear: () => void;
};

const normalize = (value: string) => value.toLocaleLowerCase('ru-RU').replaceAll('ё', 'е').trim();

export default function ParticipantFinder({ open, onOpenChange, onSelect, selectedParticipantName, onSkip, onClear }: Props) {
  const [query, setQuery] = useState('');
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const dialog = dialogRef.current;
    const target = window.matchMedia('(max-width: 800px)').matches
      ? dialog?.querySelector<HTMLButtonElement>('.finder-close')
      : dialog?.querySelector<HTMLInputElement>('input');
    target?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
      if (event.key !== 'Tab' || !dialog) return;
      const controls = Array.from(dialog.querySelectorAll<HTMLElement>('button, input, [tabindex="0"]'));
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [open, onOpenChange]);
  const matches = useMemo(() => {
    const normalized = normalize(query);
    if (!normalized) return participants;
    return participants.filter((participant) => normalize(participant.name).includes(normalized));
  }, [query]);

  if (!open) return null;

  return (
    <div className="finder-overlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onOpenChange(false);
    }}>
      <section ref={dialogRef} className="finder-dialog" role="dialog" aria-modal="true" aria-labelledby="finder-title" aria-describedby="finder-description">
        <button className="finder-close" type="button" onClick={() => onOpenChange(false)} aria-label="Закрыть поиск"><X size={20}/></button>
        <span className="finder-icon"><UserRoundSearch size={26}/></span>
        <h2 id="finder-title">Найдите себя в списке</h2>
        <p id="finder-description">Выберите своё имя — мы покажем вашу команду, личную программу и куда идти сейчас.</p>
        <label className="finder-search">
          <span className="sr-only">Введите имя или фамилию</span>
          <Search size={19}/>
          <input type="search" autoComplete="off" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Введите имя или фамилию"/>
        </label>
        <p className="finder-count" role="status">{query ? `Найдено: ${matches.length}` : `Участников: ${matches.length}`}</p>
        <div className="finder-results" role="group" aria-label="Участники">
          {matches.map((participant) => (
            <button type="button" key={`${participant.teamId}-${participant.name}`} onClick={() => { setQuery(''); onSelect(participant.teamId, participant.name); }}>
              <span>{participant.name}</span><small>Команда «{participant.teamName}»</small>
            </button>
          ))}
          {matches.length === 0 && <div className="finder-empty">Ничего не найдено. Проверьте написание имени.</div>}
        </div>
        <button className="finder-skip" type="button" onClick={selectedParticipantName ? onClear : onSkip}>
          {selectedParticipantName ? 'Убрать выбор участника' : 'Продолжить без выбора'}
        </button>
      </section>
    </div>
  );
}
