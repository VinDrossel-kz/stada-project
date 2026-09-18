'use client';
import { useState } from 'react';
import { CalendarDays, MapPin, Users, UserRound } from 'lucide-react';
import Header from '../header';
import { useParticipant } from '../participant-context';
import { agendaTimezone, dayLabel, eventDays, getAgenda, getAgendaStatus, scheduleNote, timeLabel } from '../agenda-model';
import { teamRosters } from '../teams';
import { useConferenceClock } from '../use-conference-clock';
export default function Agenda() {
  const { participant, openFinder } = useParticipant();
  const [chosenDay, setChosenDay] = useState<string | null>(null);
  const [view, setView] = useState<'personal' | 'general'>('personal');
  const now = useConferenceClock();
  const today = now === null ? '' : new Intl.DateTimeFormat('en-CA', { timeZone: agendaTimezone }).format(now);
  const day = chosenDay ?? (eventDays.includes(today) ? today : eventDays[0]);
  const personal = Boolean(participant && view === 'personal');
  const events = getAgenda(personal ? participant?.teamId : null);
  const current = now === null ? undefined : getAgendaStatus(events, now).current;
  return <><Header active="agenda"/><main id="main-content" className="main agenda-main">
    <p className="eyebrow">21–24 СЕНТЯБРЯ · БОРОВОЕ</p>
    <h1>Программа конференции</h1>
    <p className="agenda-intro">Все встречи и ваш маршрут по станциям. Время Борового, Казахстан · UTC+5.</p>
    <section className="agenda-selection" aria-label="Участник и программа">
      <div><UserRound size={24}/><span><strong>{participant?.name ?? 'Ваша команда — ваш маршрут'}</strong><small>{participant ? `Команда ${participant.teamId} · ${participant.teamName}` : 'Выберите себя, чтобы увидеть свои раунды, залы и соперников.'}</small></span></div>
      <button className="find-me-button" type="button" onClick={openFinder}>{participant ? 'Сменить участника' : 'Найти себя'}</button>
    </section>
    {participant && <div className="agenda-view" role="group" aria-label="Вид программы"><button type="button" aria-pressed={view === 'personal'} onClick={() => setView('personal')}>Моя программа</button><button type="button" aria-pressed={view === 'general'} onClick={() => setView('general')}>Общая программа</button></div>}
    <div className="agenda-days" role="group" aria-label="День конференции">{eventDays.map((date, index) => <button type="button" key={date} aria-pressed={day === date} onClick={() => setChosenDay(date)}><small>ДЕНЬ {index + 1}</small><strong>{dayLabel(date)}</strong><span>{['Заезд', 'Общая программа', 'Командные станции', 'Выезд'][index]}</span></button>)}</div>
    <div className="agenda-day-heading"><h2><CalendarDays size={22}/>{dayLabel(day)}</h2><span>{personal ? `Маршрут команды «${participant?.teamName}»` : 'Общая программа'}</span></div>
    {day === '2026-09-23' && <p className="agenda-note">{scheduleNote}</p>}
    <ol className="agenda-events">{events.filter((event) => event.date === day).map((event) => <li key={event.id} className={`agenda-event ${event.id === current?.id ? 'is-current' : ''}`}>
      <div className="agenda-time">{timeLabel(event)}{event.id === current?.id && <span>Сейчас</span>}</div>
      <div className="agenda-event-body">
        {event.round && <p className="agenda-round">РАУНД {event.round} / 7</p>}
        <h3>{event.title}</h3>
        {event.location ? <p className="agenda-location"><MapPin size={17}/>{event.location}</p> : <p className="agenda-location muted"><MapPin size={17}/>Место уточните у организаторов</p>}
        {event.opponentId && <p className="agenda-opponent"><Users size={16}/>Соперник: команда {event.opponentId} · {teamRosters.find((team) => team.id === event.opponentId)?.name}</p>}
        {event.lead && <p className="agenda-lead">Лидирует: {event.lead.replaceAll('\n', ', ')}</p>}
        {event.note && <p className="agenda-note-inline">{event.note}</p>}
        {event.block && !personal && <button className="agenda-inline-button" type="button" onClick={() => { if (participant) setView('personal'); else openFinder(); }}>Показать мой маршрут</button>}
      </div>
    </li>)}</ol>
  </main></>;
}
