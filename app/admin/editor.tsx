'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Team } from '../teams';

export default function Editor({ initialTeams }: { initialTeams: Team[] }) {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [draft, setDraft] = useState<Record<number, string>>(() => Object.fromEntries(initialTeams.map((team) => [team.id, String(team.score)])));
  const [message, setMessage] = useState(initialTeams.length ? '' : 'Не удалось загрузить результаты. Нажмите «Обновить».');
  const [busy, setBusy] = useState<number | null>(null);

  async function load() {
    try {
      const response = await fetch('/api/scores', { cache: 'no-store' });
      if (!response.ok) throw new Error();
      const data = await response.json() as { teams: Team[] };
      setTeams(data.teams);
      setDraft(Object.fromEntries(data.teams.map((team) => [team.id, String(team.score)])));
      setMessage('');
    } catch {
      setMessage('Не удалось загрузить результаты. Попробуйте ещё раз.');
    }
  }

  async function save(event: FormEvent<HTMLFormElement>, team: Team) {
    event.preventDefault();
    const value = draft[team.id] ?? '';
    const score = Number(value);
    if (value.trim() === '' || !Number.isInteger(score) || score < 0 || score > 1_000_000) {
      setMessage('Введите целое число от 0 до 1 000 000.');
      return;
    }

    setBusy(team.id);
    try {
      const response = await fetch('/api/scores', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: team.id, score, previous: team.score }),
      });
      const data = await response.json() as { teams?: Team[]; error?: string };
      if (!response.ok || !data.teams) throw new Error(data.error || 'Не удалось сохранить результат.');
      setTeams(data.teams);
      setDraft(Object.fromEntries(data.teams.map((item) => [item.id, String(item.score)])));
      setMessage(`${team.name}: ${score} баллов. Сохранено.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось сохранить результат.');
    } finally {
      setBusy(null);
    }
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.refresh();
  }

  return <>
    <div className="admin-toolbar">
      <p>Изменения сразу появятся в общем рейтинге.</p>
      <button className="refresh" type="button" onClick={logout}>Выйти</button>
    </div>
    <section className="board">
      <div className="board-heading">
        <h2>Баллы команд</h2>
        <button className="refresh" type="button" onClick={() => void load()} disabled={busy !== null}>Обновить</button>
      </div>
      <p className="admin-message" role="status">{message}</p>
      {teams.map((team) => <form key={team.id} className="admin-row" onSubmit={(event) => void save(event, team)}>
        <label htmlFor={`score-${team.id}`}>{team.name}</label>
        <input id={`score-${team.id}`} aria-label={`${team.name} — итоговые баллы`} type="number" min="0" max="1000000" step="1" required value={draft[team.id] ?? ''} onChange={(event) => setDraft((current) => ({ ...current, [team.id]: event.target.value }))} />
        <button className="save-button" disabled={busy !== null}>{busy === team.id ? 'Сохраняем…' : 'Сохранить'}</button>
      </form>)}
    </section>
  </>;
}
