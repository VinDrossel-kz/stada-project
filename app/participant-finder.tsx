'use client';

import { useMemo, useState } from 'react';
import { Search, UserRoundSearch, X } from 'lucide-react';
import { participants } from './teams';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (teamId: number, participantName: string) => void;
};

const normalize = (value: string) => value.toLocaleLowerCase('ru-RU').replaceAll('ё', 'е').trim();

export default function ParticipantFinder({ open, onOpenChange, onSelect }: Props) {
  const [query, setQuery] = useState('');
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
      <section className="finder-dialog" role="dialog" aria-modal="true" aria-labelledby="finder-title">
        <button className="finder-close" type="button" onClick={() => onOpenChange(false)} aria-label="Закрыть поиск"><X size={20}/></button>
        <span className="finder-icon"><UserRoundSearch size={26}/></span>
        <h2 id="finder-title">Найдите себя в списке</h2>
        <p>Выберите своё имя — мы сразу покажем место и баллы вашей команды.</p>
        <label className="finder-search">
          <span className="sr-only">Введите имя или фамилию</span>
          <Search size={19}/>
          <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Введите имя или фамилию"/>
        </label>
        <div className="finder-results" role="listbox" aria-label="Участники">
          {matches.map((participant) => (
            <button type="button" role="option" aria-selected="false" key={`${participant.teamId}-${participant.name}`} onClick={() => { setQuery(''); onSelect(participant.teamId, participant.name); }}>
              <span>{participant.name}</span><small>Команда «{participant.teamName}»</small>
            </button>
          ))}
          {matches.length === 0 && <div className="finder-empty">Ничего не найдено. Проверьте написание имени.</div>}
        </div>
        <button className="finder-skip" type="button" onClick={() => onOpenChange(false)}>Перейти к общему рейтингу</button>
      </section>
    </div>
  );
}
