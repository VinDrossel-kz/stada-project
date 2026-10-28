'use client';

import { KeyboardEvent, MouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, CircleAlert, CircleCheck, Flag, History, MonitorPlay, QrCode, RefreshCw, RotateCcw, Save, UserCog } from 'lucide-react';
import { Game } from '../games';
import { Team } from '../teams';
import { placesOf } from '../use-scores';
import { enterScreen } from '../use-screen';
import QrDialog from './qr-dialog';
import { unsavedScores } from '../account';
import JournalDialog from './journal-dialog';
import OrganizersDialog from './organizers-dialog';
import type { Organizer } from '@/lib/organizer-session';

type Draft = Record<string, string>;

const cellKey = (teamId: number, gameId: number) => `${teamId}:${gameId}`;
const MAX_SCORE = 1_000_000;
const SYNC_INTERVAL = 15_000;

function savedScore(team: Team, gameId: number) {
  return (team.game_scores ?? []).find((entry) => entry.game_id === gameId)?.score ?? 0;
}

function isValidScore(value: string) {
  return /^\d+$/.test(value.trim()) && Number(value) <= MAX_SCORE;
}

export default function Editor({ organizer, initialTeams, initialGames }: { organizer: Organizer; initialTeams: Team[]; initialGames: Game[] }) {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [games, setGames] = useState<Game[]>(initialGames);
  // Only cells the organizer has typed into live here; everything else shows the saved score.
  const [draft, setDraft] = useState<Draft>({});
  const [message, setMessage] = useState(initialTeams.length ? '' : 'Не удалось загрузить результаты. Нажмите «Обновить».');
  const [failed, setFailed] = useState<Set<string>>(new Set());
  // Short confirmation in the bottom-right corner after "Save all".
  const [toast, setToast] = useState<{ id: number; text: string; ok: boolean } | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const busy = progress !== null;
  // Auto-refresh state: when we last heard from the server and what changed since.
  const [syncedAt, setSyncedAt] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState(false);
  const [flashed, setFlashed] = useState<Set<string>>(new Set());
  const [conflicts, setConflicts] = useState<Map<string, number>>(new Map());
  const loading = useRef(false);

  const sortedTeams = [...teams].sort((a, b) => a.id - b.id);
  const dirtyKeys = sortedTeams.flatMap((team) => games
    .map((game) => cellKey(team.id, game.id))
    .filter((key) => key in draft && draft[key].trim() !== String(savedScore(team, Number(key.split(':')[1])))));
  const invalidCount = dirtyKeys.filter((key) => !isValidScore(draft[key])).length;

  // Lets the header warn before signing out with unsaved scores.
  useEffect(() => {
    unsavedScores.count = dirtyKeys.length;
    return () => { unsavedScores.count = 0; };
  }, [dirtyKeys.length]);

  // Forecast: places as they will be once the pending edits are saved.
  const totalsAfter = sortedTeams.map((team) => ({
    id: team.id,
    score: team.score + games.reduce((sum, game) => {
      const key = cellKey(team.id, game.id);
      return dirtyKeys.includes(key) && isValidScore(draft[key]) ? sum + Number(draft[key]) - savedScore(team, game.id) : sum;
    }, 0),
  }));
  const placesBefore = placesOf(sortedTeams);
  const placesAfter = placesOf(totalsAfter);
  const leadersBefore = sortedTeams.filter((team) => team.score > 0 && placesBefore.get(team.id) === 1).map((team) => team.name);
  const leadersAfter = sortedTeams.filter((team, index) => totalsAfter[index].score > 0 && placesAfter.get(team.id) === 1).map((team) => team.name);
  const leaderChanged = leadersAfter.length > 0 && leadersAfter.join() !== leadersBefore.join();
  const [dialog, setDialog] = useState<'qr' | 'journal' | 'organizers' | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const closeDialog = useCallback(() => setDialog(null), []);

  function placeCell(before: number, after: number) {
    if (before === after) return <span className="place-now">{after}</span>;
    const up = after < before;
    return <span className={`place-change ${up ? "is-up" : "is-down"}`} title={`Сейчас ${before}-е место, после сохранения — ${after}-е`}>
      <s>{before}</s>{up ? <ArrowUp size={13}/> : <ArrowDown size={13}/>}<b>{after}</b>
    </span>;
  }

  function openScreen(event: MouseEvent<HTMLAnchorElement>) {
    if (dirtyKeys.length && !window.confirm('Есть несохранённые изменения — они пропадут. Всё равно открыть экран?')) {
      event.preventDefault();
      return;
    }
    enterScreen();
  }

  useEffect(() => {
    if (!dirtyKeys.length) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirtyKeys.length]);

  async function load(silent = false) {
    if (busy || loading.current) return;
    loading.current = true;
    try {
      const response = await fetch('/api/scores', { cache: 'no-store', signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error();
      const data = await response.json() as { games: Game[]; teams: Team[] };
      // Compare with what is on screen so changes made by other organizers are visible.
      const updated: string[] = [];
      const nextConflicts = new Map(conflicts);
      for (const team of data.teams) {
        const before = teams.find((item) => item.id === team.id);
        if (!before) continue;
        for (const game of data.games) {
          const key = cellKey(team.id, game.id);
          const score = savedScore(team, game.id);
          if (savedScore(before, game.id) === score) continue;
          if (key in draft && draft[key] !== String(score)) nextConflicts.set(key, score);
          else updated.push(key);
        }
      }
      setTeams(data.teams);
      setGames(data.games);
      setConflicts(nextConflicts);
      setSyncedAt(new Date());
      setSyncError(false);
      if (updated.length) {
        setFlashed(new Set(updated));
        window.setTimeout(() => setFlashed(new Set()), 3000);
      }
      if (nextConflicts.size > conflicts.size) {
        setMessage(`Пока вы правили, другой организатор изменил ячейки (${nextConflicts.size}) — они обведены оранжевым. Наведите на ячейку, чтобы увидеть его значение. При сохранении останутся ваши значения.`);
      } else if (!silent) {
        setMessage(dirtyKeys.length ? 'Результаты обновлены. Несохранённые правки остались на месте.' : 'Результаты обновлены.');
      }
    } catch {
      setSyncError(true);
      if (!silent) setMessage('Не удалось загрузить результаты. Попробуйте ещё раз.');
    } finally {
      loading.current = false;
    }
  }

  const loadRef = useRef(load);
  useEffect(() => { loadRef.current = load; });

  useEffect(() => {
    const tick = () => { if (document.visibilityState === 'visible') void loadRef.current(true); };
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, SYNC_INTERVAL);
    document.addEventListener('visibilitychange', tick);
    return () => { clearTimeout(first); clearInterval(timer); document.removeEventListener('visibilitychange', tick); };
  }, []);

  function forget(keys: string[]) {
    setConflicts((current) => {
      if (!keys.some((key) => current.has(key))) return current;
      const next = new Map(current);
      keys.forEach((key) => next.delete(key));
      return next;
    });
  }

  async function saveAll() {
    if (busy || !dirtyKeys.length) return;
    if (invalidCount) {
      setMessage(`Исправьте ячейки с ошибкой (${invalidCount}): нужно целое число от 0 до 1 000 000.`);
      return;
    }
    const queue = [...dirtyKeys];
    let latest = teams;
    const errors = new Map<string, string>();
    setFailed(new Set());
    setProgress({ done: 0, total: queue.length });
    for (const [index, key] of queue.entries()) {
      const [teamId, gameId] = key.split(':').map(Number);
      const team = latest.find((item) => item.id === teamId);
      try {
        const response = await fetch('/api/scores', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamId, gameId, score: Number(draft[key]), previous: team ? savedScore(team, gameId) : 0 }),
        });
        const data = await response.json() as { games?: Game[]; teams?: Team[]; error?: string };
        if (!response.ok || !data.teams || !data.games) throw new Error(data.error || 'Не удалось сохранить результат.');
        latest = data.teams;
        setTeams(data.teams);
        setGames(data.games);
        setDraft((current) => {
          const next = { ...current };
          if (next[key] === draft[key]) delete next[key];
          return next;
        });
        forget([key]);
      } catch (error) {
        errors.set(key, error instanceof Error ? error.message : 'Не удалось сохранить результат.');
        if (error instanceof Error && /сессия/i.test(error.message)) break;
      }
      setProgress({ done: index + 1, total: queue.length });
    }
    setProgress(null);
    setFailed(new Set(errors.keys()));
    const saved = queue.length - errors.size;
    setMessage(errors.size ? `Сохранено ${saved} из ${queue.length}. Не сохранились ячейки с красной рамкой: ${[...new Set(errors.values())].join(' ')}` : '');
    setToast({ id: Date.now(), ok: !errors.size, text: errors.size ? `Сохранено ${saved} из ${queue.length}` : 'Изменения сохранены' });
  }

  const saveAllRef = useRef(saveAll);
  useEffect(() => { saveAllRef.current = saveAll; });

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void saveAllRef.current();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  function moveFocus(event: KeyboardEvent<HTMLInputElement>, row: number, column: number) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const nextRow = row + (event.shiftKey ? -1 : 1);
    document.getElementById(`cell-${nextRow}-${column}`)?.focus();
  }

  return <>
    <nav className="admin-screens" aria-label="Экраны для проектора">
      <span>Инструменты:</span>
      <Link className="refresh" href="/broadcast" onClick={openScreen}><MonitorPlay size={15}/>Трансляция рейтинга</Link>
      <button className="refresh" type="button" onClick={() => setDialog('qr')}><QrCode size={15}/>QR-код сайта</button>
      <button className="refresh" type="button" onClick={() => setDialog('journal')}><History size={15}/>Журнал изменений</button>
      <button className="refresh" type="button" onClick={() => setDialog('organizers')}><UserCog size={15}/>{organizer.role === 'owner' ? 'Организаторы' : 'Мой аккаунт'}</button>
    </nav>
    {dialog === 'qr' && <QrDialog onClose={closeDialog}/>}
    {dialog === 'journal' && <JournalDialog onClose={closeDialog} onBoard={(board) => { setTeams(board.teams); setGames(board.games); }}/>}
    {dialog === 'organizers' && <OrganizersDialog me={organizer} onClose={closeDialog}/>}
    {toast && <div key={toast.id} className={`admin-toast ${toast.ok ? "" : "is-error"}`} role="status">{toast.ok ? <CircleCheck size={18}/> : <CircleAlert size={18}/>}{toast.text}</div>}
    <section className="admin-scoreboard">
      <div className="admin-scoreboard-heading">
        <div>
          <h2>Баллы по играм</h2>
          <p>Изменённые ячейки подсвечены жёлтым, пока вы их не сохраните.</p>
          <p className={`admin-sync ${syncError ? 'is-offline' : ''}`}>
            {syncError ? 'Нет связи — повторим автоматически' : syncedAt ? `Автообновление · данные на ${syncedAt.toLocaleTimeString('ru-RU')}` : 'Автообновление каждые 15 секунд'}
          </p>
          {leaderChanged && <p className="admin-leader-forecast"><Flag size={14}/>После сохранения {leadersAfter.length > 1 ? `лидерство разделят: ${leadersAfter.join(", ")}` : `лидером станет «${leadersAfter[0]}»`}</p>}
        </div>
        <div className="admin-actions">
          <button className="refresh" type="button" onClick={() => void load()} disabled={busy}><RefreshCw size={15}/>Обновить</button>
          <button className="refresh" type="button" onClick={() => { setDraft({}); setFailed(new Set()); setConflicts(new Map()); setMessage('Изменения отменены.'); }} disabled={busy || !dirtyKeys.length}><RotateCcw size={15}/>Отменить</button>
          <button className="save-button admin-save-all" type="button" onClick={() => void saveAll()} disabled={busy || !dirtyKeys.length}>
            <Save size={16}/>{progress ? `Сохраняем ${progress.done} из ${progress.total}…` : `Сохранить всё${dirtyKeys.length ? ` (${dirtyKeys.length})` : ''}`}
          </button>
        </div>
      </div>
      <p className="admin-message" role="status">{message}</p>
      <div className="admin-matrix-scroll">
        <table className="admin-matrix">
          <caption className="sr-only">Баллы команд по играм</caption>
          <thead>
            <tr>
              <th scope="col" className="admin-matrix-team">Команда</th>
              {games.map((game) => <th scope="col" key={game.id}><small>{game.stage}</small><span>{game.name}</span></th>)}
              <th scope="col" className="admin-matrix-total">Итого</th>
              <th scope="col" className="admin-matrix-place">Место</th>
            </tr>
          </thead>
          <tbody>
            {sortedTeams.map((team, row) => {
              const total = games.reduce((sum, game) => {
                const key = cellKey(team.id, game.id);
                return sum + (key in draft && isValidScore(draft[key]) ? Number(draft[key]) : savedScore(team, game.id));
              }, 0);
              return <tr key={team.id}>
                <th scope="row" className="admin-matrix-team"><small>{team.id}</small>{team.name}</th>
                {games.map((game, column) => {
                  const key = cellKey(team.id, game.id);
                  const value = draft[key] ?? String(savedScore(team, game.id));
                  const dirty = dirtyKeys.includes(key);
                  const invalid = dirty && !isValidScore(value);
                  const theirs = dirty ? conflicts.get(key) : undefined;
                  return <td key={game.id}>
                    <input id={`cell-${row}-${column}`} className={`${dirty ? 'is-dirty' : ''} ${invalid || failed.has(key) ? 'is-invalid' : ''} ${theirs !== undefined ? 'is-conflict' : ''} ${flashed.has(key) ? 'is-remote-update' : ''}`}
                      title={theirs !== undefined ? `Другой организатор сохранил: ${theirs}` : undefined}
                      aria-label={`${team.name}, ${game.name} — баллы${theirs !== undefined ? `. Другой организатор сохранил ${theirs}` : ''}`} aria-invalid={invalid || undefined}
                      type="text" inputMode="numeric" autoComplete="off" value={value} disabled={busy}
                      onFocus={(event) => event.target.select()}
                      onKeyDown={(event) => moveFocus(event, row, column)}
                      onChange={(event) => { forget([key]); setDraft((current) => ({ ...current, [key]: event.target.value.replace(/[^\d]/g, '') })); }}/>
                  </td>;
                })}
                <td className="admin-matrix-total"><strong>{total}</strong>{total !== team.score && <small>было {team.score}</small>}</td>
                <td className="admin-matrix-place">{placeCell(placesBefore.get(team.id) ?? 0, placesAfter.get(team.id) ?? 0)}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </section>
  </>;
}
