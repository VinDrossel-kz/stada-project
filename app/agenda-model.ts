import data from './agenda-data.json';

export type AgendaEvent = {
  id: string; date: string; start: string; end: string; allDay: boolean;
  title: string; location: string; lead?: string; block?: boolean;
  teamId?: number; round?: number; opponentId?: number; note?: string;
  details?: { start: string; end: string; title: string; lead?: string }[];
};
export const eventDays = ['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24'];
export const agendaTimezone = 'Asia/Almaty';
export function getAgenda(teamId?: number | null): AgendaEvent[] {
  // Organizer clarification: the last hour is a final task for every team,
  // separate from the seven station rounds in the original CSV cards.
  const general: AgendaEvent[] = [
    ...data.general.map((event) => event.date === '2026-09-23' && event.block && event.start === '14:00'
      ? { ...event, end: '14:30', title: 'Основной блок 3 · заключительная станция' }
      : event),
    { id: 'final-task', date: '2026-09-23', start: '14:30', end: '15:30', allDay: false,
      title: 'Финальное задание для всех команд', location: '' },
  ].sort((a, b) => `${a.date}T${a.start}`.localeCompare(`${b.date}T${b.start}`));
  if (!teamId) return general;
  const rounds = data.personal.filter((event) => event.teamId === teamId);
  if (!rounds.length) return general;
  return [
    ...general.filter((event) => !event.block), ...rounds,
  ].sort((a, b) => `${a.date}T${a.start}`.localeCompare(`${b.date}T${b.start}`));
}
// Conference time is UTC+5, independent of the device timezone.
export function eventStart(event: AgendaEvent) { return Date.parse(`${event.date}T${event.start}:00+05:00`); }
export function eventEnd(event: AgendaEvent) { return event.allDay ? eventStart(event) + 86_400_000 : Date.parse(`${event.date}T${event.end}:00+05:00`); }
export function getAgendaStatus(events: AgendaEvent[], now: number) {
  const timeline = events.flatMap((event) => event.details?.length
    ? event.details.map((detail) => ({ ...event, ...detail, details: undefined }))
    : [event]);
  return {
    current: timeline.find((event) => eventStart(event) <= now && now < eventEnd(event)),
    next: timeline.find((event) => eventStart(event) > now),
  };
}
export function dayLabel(date: string) {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', timeZone: agendaTimezone }).format(new Date(`${date}T12:00:00+05:00`));
}
export function timeLabel(event: AgendaEvent) { return event.allDay ? 'Весь день' : event.start === event.end ? event.start : `${event.start}–${event.end}`; }
