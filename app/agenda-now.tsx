'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MapPin, ArrowRight, UserRound } from 'lucide-react';
import { useParticipant } from './participant-context';
import { dayLabel, getAgenda, getAgendaStatus, timeLabel } from './agenda-model';
import { useConferenceClock } from './use-conference-clock';
export default function AgendaNow() {
  const { participant, ready, openFinder } = useParticipant();
  const now = useConferenceClock();
  const ref = useRef<HTMLElement>(null);
  const [height, setHeight] = useState(180);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => setHeight(entry.target.getBoundingClientRect().height));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  const { current, next } = now === null ? {} : getAgendaStatus(getAgenda(participant?.teamId), now);
  const event = current ?? next;
  return <>
    <div aria-hidden="true" style={{ height: height + 24 }}/>
    <aside ref={ref} className="agenda-now" aria-label="Ваш маршрут сейчас">
      <div className="agenda-now-inner">
        <button type="button" className="agenda-person" onClick={openFinder}><UserRound size={19}/><span><strong>{participant?.name ?? 'Найти себя'}</strong><small>{participant ? `Команда ${participant.teamId} · ${participant.teamName} · сменить` : 'Открыть свой маршрут'}</small></span></button>
        <div className="agenda-now-event" role="status" aria-live="polite">
          <span className="agenda-now-label">{!ready || now === null ? 'ПРОГРАММА КОНФЕРЕНЦИИ' : current ? 'СЕЙЧАС' : next ? 'ДАЛЕЕ' : 'ПРОГРАММА ЗАВЕРШЕНА'} <span>· Боровое, UTC+5</span></span>
          {event ? <><strong>{event.title}</strong><span><MapPin size={15}/>{event.location || (event.block && !participant ? 'Выберите участника, чтобы увидеть зал' : 'Место уточните у организаторов')}</span><small>{dayLabel(event.date)} · {timeLabel(event)}{current && next?.date === current.date ? ` · Далее в ${next.start}: ${next.location || next.title}` : ''}</small></> : <strong>{now === null ? 'Загружаем расписание…' : 'Спасибо за участие!'}</strong>}
        </div>
        <Link className="agenda-now-link" href="/agenda">{participant ? 'Моя программа' : 'Программа'}<ArrowRight size={17}/></Link>
      </div>
    </aside>
  </>;
}
