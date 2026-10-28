'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, RotateCcw, Search } from 'lucide-react';
import type { Game } from '../games';
import type { Team } from '../teams';
import type { LogEntry } from '@/lib/scores';
import Dialog from './dialog';

const timeFormat = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
const normalize = (value: string) => value.toLocaleLowerCase('ru-RU').replaceAll('ё', 'е');

/** Every score change with author and time; the latest change of a cell can be reverted. */
export default function JournalDialog({ onClose, onBoard }: { onClose: () => void; onBoard: (board: { games: Game[]; teams: Team[] }) => void }) {
  const [entries, setEntries] = useState<LogEntry[] | null>(null);
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/log', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json() as { entries?: LogEntry[]; error?: string };
        if (!response.ok || !data.entries) throw new Error(data.error || 'Не удалось загрузить журнал.');
        if (!cancelled) setEntries(data.entries);
      })
      .catch((error: Error) => { if (!cancelled) setMessage(error.message); });
    return () => { cancelled = true; };
  }, []);

  async function revert(entry: LogEntry) {
    if (!window.confirm(`Вернуть «${entry.team_name} · ${entry.game_name}» к ${entry.old_score}?`)) return;
    setBusy(entry.id);
    try {
      const response = await fetch('/api/admin/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: entry.id }) });
      const data = await response.json() as { entries?: LogEntry[]; games?: Game[]; teams?: Team[]; error?: string };
      if (!response.ok || !data.entries || !data.teams || !data.games) throw new Error(data.error || 'Не удалось откатить изменение.');
      setEntries(data.entries);
      onBoard({ games: data.games, teams: data.teams });
      setMessage(`Откатили: ${entry.team_name} · ${entry.game_name} снова ${entry.old_score}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось откатить изменение.');
    } finally {
      setBusy(null);
    }
  }

  // Only the newest change of each cell can be reverted; the server enforces the same rule.
  const latestPerCell = new Set<number>();
  const seen = new Set<string>();
  for (const entry of entries ?? []) {
    const cell = `${entry.team_id}:${entry.game_id}`;
    if (!seen.has(cell)) { seen.add(cell); latestPerCell.add(entry.id); }
  }
  const term = normalize(query.trim());
  const shown = (entries ?? []).filter((entry) => !term || normalize(`${entry.team_name} ${entry.game_name} ${entry.organizer_name}`).includes(term));

  return <Dialog title="Журнал изменений" onClose={onClose} wide>
    <div className="journal-toolbar">
      <label className="journal-search"><Search size={16}/><span className="sr-only">Поиск по журналу</span>
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Команда, игра или организатор"/>
      </label>
      <span>{entries ? `Записей: ${shown.length}` : ''}</span>
    </div>
    {message && <p className="admin-dialog-message" role="status">{message}</p>}
    {!entries ? <p className="journal-empty">{message ? '' : 'Загружаем журнал…'}</p>
      : shown.length === 0 ? <p className="journal-empty">{entries.length ? 'Ничего не найдено.' : 'Изменений пока не было. Здесь появится каждое сохранение баллов.'}</p>
      : <ol className="journal-list">{shown.map((entry) => {
        const delta = entry.new_score - entry.old_score;
        return <li key={entry.id} className={entry.reverted_by ? 'is-reverted' : undefined}>
          <time dateTime={entry.created_at}>{timeFormat.format(new Date(entry.created_at))}</time>
          <div className="journal-what">
            <strong>{entry.team_name}</strong> · {entry.game_name}
            <small>{entry.organizer_name}{entry.reverts_id ? ' · откат изменения' : ''}{entry.reverted_by ? ' · отменено' : ''}</small>
          </div>
          <div className="journal-change">
            <span>{entry.old_score}</span><ArrowRight size={14}/><b>{entry.new_score}</b>
            <em className={delta > 0 ? 'is-up' : 'is-down'}>{delta > 0 ? '+' : '−'}{Math.abs(delta)}</em>
          </div>
          {latestPerCell.has(entry.id) && !entry.reverted_by
            ? <button type="button" className="refresh journal-revert" onClick={() => void revert(entry)} disabled={busy !== null}><RotateCcw size={14}/>{busy === entry.id ? 'Откатываем…' : 'Откатить'}</button>
            : <span/>}
        </li>;
      })}</ol>}
  </Dialog>;
}
