import fs from 'node:fs';

// Semicolon-delimited CSV, including escaped quotes and multiline fields.
function parseCsv(text) {
  const rows = []; let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (!quoted && (char === ';' || char === '\n')) {
      row.push(cell.trim()); cell = '';
      if (char === '\n') { rows.push(row); row = []; }
    } else cell += char;
  }
  if (cell || row.length) { row.push(cell.trim()); rows.push(row); }
  return rows;
}
const [generalPath, personalPath] = process.argv.slice(2);
if (!generalPath || !personalPath) throw new Error('Supply general and personal agenda CSV paths.');
const read = (path) => parseCsv(fs.readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
const time = (value) => value.replace('.', ':').padStart(5, '0');
const general = []; let date;
for (const row of read(generalPath)) {
  if (/^\d+ сентября$/.test(row[1])) { date = `2026-09-${row[1].split(' ')[0]}`; continue; }
  if (!date || !row[0] || !row[1]) continue;
  const allDay = row[0] === 'весь день';
  const [start, end] = allDay ? ['00:00', '00:00'] : row[0].split('-').map(time);
  general.push({ id: `general-${general.length + 1}`, date, start, end, allDay, title: row[1], lead: row[2] || '', location: '', block: row[1].startsWith('Основной блок') });
}
const personal = []; let teamId;
for (const row of read(personalPath)) {
  if (/^Команда \d+$/.test(row[0])) { teamId = Number(row[0].split(' ')[1]); continue; }
  if (!/^Р\d+$/.test(row[0])) continue;
  const match = row[2].match(/^Зал "([^"]+)" — (.+)$/);
  if (!match || !teamId) throw new Error(`Unrecognized station: ${row[2]}`);
  const [start, end] = row[1].split('-').map(time);
  personal.push({ id: `team-${teamId}-${row[0]}`, date: '2026-09-23', start, end, allDay: false, teamId, round: Number(row[0].slice(1)), title: match[2], location: `Зал «${match[1]}»`, opponentId: Number(row[3].split(' ')[1]) });
}
if (general.length !== 17 || personal.length !== 98) throw new Error(`Unexpected counts: ${general.length} general, ${personal.length} personal`);
fs.writeFileSync(new URL('../app/agenda-data.json', import.meta.url), JSON.stringify({ sources: [generalPath.split(/[\\/]/).pop(), personalPath.split(/[\\/]/).pop()], general, personal }, null, 2) + '\n');
console.log(`Imported ${general.length} general events and ${personal.length} team rounds.`);
