import data from './agenda-data.json';

export type AgendaEvent = {
  id: string; date: string; start: string; end: string; allDay: boolean;
  title: string; location: string; lead?: string; block?: boolean;
  teamId?: number; round?: number; opponentId?: number; note?: string;
};
export const eventDays = ['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24'];
export const agendaTimezone = 'Asia/Almaty';
export const scheduleNote = 'В карточках команд указаны 7 раундов до 14:30. В общей программе последний блок длится до 15:30. Расписание на 14:30–15:30 уточните у организаторов.';
export function getAgenda(teamId?: number | null): AgendaEvent[] {
  const general: AgendaEvent[] = data.general;
  if (!teamId) return general;
  const rounds = data.personal.filter((event) => event.teamId === teamId);
  if (!rounds.length) return general;
  return [
    ...general.filter((event) => !event.block), ...rounds,
    { id: 'unconfirmed-final-block', date: '2026-09-23', start: '14:30', end: '15:30', allDay: false,
      title: 'Продолжение блока · уточняется', location: '', note: 'В индивидуальной карточке это время не расписано. Уточните программу и зал у организаторов.' },
  ].sort((a, b) => `${a.date}T${a.start}`.localeCompare(`${b.date}T${b.start}`));
}
// Conference time is UTC+5, independent of the device timezone.
export function eventStart(event: AgendaEvent) { return Date.parse(`${event.date}T${event.start}:00+05:00`); }
export function eventEnd(event: AgendaEvent) { return event.allDay ? eventStart(event) + 86_400_000 : Date.parse(`${event.date}T${event.end}:00+05:00`); }
export function getAgendaStatus(events: AgendaEvent[], now: number) {
  return {
    current: events.find((event) => eventStart(event) <= now && now < eventEnd(event)),
    next: events.find((event) => eventStart(event) > now),
  };
}
export function dayLabel(date: string) {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', timeZone: agendaTimezone }).format(new Date(`${date}T12:00:00+05:00`));
}
export function timeLabel(event: AgendaEvent) { return event.allDay ? 'Весь день' : `${event.start}–${event.end}`; }
