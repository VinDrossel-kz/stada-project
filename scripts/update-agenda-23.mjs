import fs from 'node:fs';

const agendaUrl = new URL('../app/agenda-data.json', import.meta.url);
const data = JSON.parse(fs.readFileSync(agendaUrl, 'utf8'));

const stations = {
  'Коридор': 'BASE CAMP «Продай за минуту»',
  'Байтерек 1': 'PACK YOUR BAG «Эстафета снаряжения»',
  'Стамбул': 'ROUTE PLANNING «Своя игра»',
  'Алматы': 'THE CLIMB — визит в аптеку/к врачу',
  'Анкара': 'THE STORM — карточки / КВН',
  'VIP-зал': 'FINAL RIDGE — защита решения',
  'Астана': 'КАМНЕПАД — расставь в правильном порядке',
};

const schedule = {
  1: [['Коридор', 8], ['Стамбул', 9], ['Анкара', 10], ['Астана', 11], ['Байтерек 1', 12], ['Алматы', 13], ['VIP-зал', 14]],
  2: [['Байтерек 1', 9], ['Алматы', 10], ['VIP-зал', 11], ['Коридор', 12], ['Стамбул', 13], ['Анкара', 14], ['Астана', 8]],
  3: [['Стамбул', 10], ['Анкара', 11], ['Астана', 12], ['Байтерек 1', 13], ['Алматы', 14], ['VIP-зал', 8], ['Коридор', 9]],
  4: [['Алматы', 11], ['VIP-зал', 12], ['Коридор', 13], ['Стамбул', 14], ['Анкара', 8], ['Астана', 9], ['Байтерек 1', 10]],
  5: [['Анкара', 12], ['Астана', 13], ['Байтерек 1', 14], ['Алматы', 8], ['VIP-зал', 9], ['Коридор', 10], ['Стамбул', 11]],
  6: [['VIP-зал', 13], ['Коридор', 14], ['Стамбул', 8], ['Анкара', 9], ['Астана', 10], ['Байтерек 1', 11], ['Алматы', 12]],
  7: [['Астана', 14], ['Байтерек 1', 8], ['Алматы', 9], ['VIP-зал', 10], ['Коридор', 11], ['Стамбул', 12], ['Анкара', 13]],
  8: [['Коридор', 1], ['Байтерек 1', 7], ['Стамбул', 6], ['Алматы', 5], ['Анкара', 4], ['VIP-зал', 3], ['Астана', 2]],
  9: [['Байтерек 1', 2], ['Стамбул', 1], ['Алматы', 7], ['Анкара', 6], ['VIP-зал', 5], ['Астана', 4], ['Коридор', 3]],
  10: [['Стамбул', 3], ['Алматы', 2], ['Анкара', 1], ['VIP-зал', 7], ['Астана', 6], ['Коридор', 5], ['Байтерек 1', 4]],
  11: [['Алматы', 4], ['Анкара', 3], ['VIP-зал', 2], ['Астана', 1], ['Коридор', 7], ['Байтерек 1', 6], ['Стамбул', 5]],
  12: [['Анкара', 5], ['VIP-зал', 4], ['Астана', 3], ['Коридор', 2], ['Байтерек 1', 1], ['Стамбул', 7], ['Алматы', 6]],
  13: [['VIP-зал', 6], ['Астана', 5], ['Коридор', 4], ['Байтерек 1', 3], ['Стамбул', 2], ['Алматы', 1], ['Анкара', 7]],
  14: [['Астана', 7], ['Коридор', 6], ['Байтерек 1', 5], ['Стамбул', 4], ['Алматы', 3], ['Анкара', 2], ['VIP-зал', 1]],
};

const times = [
  ['09:30', '10:00'], ['10:00', '10:30'], ['10:30', '11:00'],
  ['11:30', '12:00'], ['12:00', '12:30'], ['12:30', '13:00'], ['14:00', '14:30'],
];
const summitOpponents = { 1: 2, 2: 1, 3: 4, 4: 3, 5: 6, 6: 5, 7: 8, 8: 7, 9: 10, 10: 9, 11: 12, 12: 11, 13: 14, 14: 13 };

const personal = [];
for (let teamId = 1; teamId <= 14; teamId++) {
  schedule[teamId].forEach(([room, opponentId], index) => {
    const round = index + 1;
    personal.push({
      id: `team-${teamId}-Р${round}`,
      date: '2026-09-23',
      start: times[index][0],
      end: times[index][1],
      allDay: false,
      teamId,
      round,
      title: stations[room],
      location: `Зал «${room}»`,
      opponentId,
    });
  });
  personal.push({
    id: `team-${teamId}-summit`,
    date: '2026-09-23',
    start: '14:30',
    end: '15:30',
    allDay: false,
    teamId,
    title: 'SUMMIT — финальное задание',
    location: 'Зал «Байтерек ФЛАГ»',
    opponentId: summitOpponents[teamId],
  });
}

data.personal = [
  ...data.personal.filter((event) => event.date !== '2026-09-23'),
  ...personal,
];

data.general = data.general.map((event) => {
  if (event.id === 'general-14') return { ...event, title: 'Основной блок 3 · Раунд 7 и SUMMIT' };
  if (event.id === 'general-2026-09-23-1600') return { ...event, title: 'Предварительные результаты, ОС' };
  if (event.id === 'general-16') return { ...event, end: '22:00', title: 'Гала-ужин' };
  return event;
});

const galaIndex = data.general.findIndex((event) => event.id === 'general-16');
if (!data.general.some((event) => event.id === 'general-2026-09-23-1630')) {
  data.general.splice(galaIndex, 0, {
    id: 'general-2026-09-23-1630',
    date: '2026-09-23',
    start: '16:30',
    end: '19:00',
    allDay: false,
    title: 'Подготовка к гала-ужину',
    lead: '',
    location: '',
    block: false,
  });
}

fs.writeFileSync(agendaUrl, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Updated 23 September: ${personal.length} personal events.`);
