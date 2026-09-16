'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Game } from '../games';
import { Team } from '../teams';

function draftFromTeams(teams: Team[]) {
  return Object.fromEntries(teams.flatMap((team) => (team.game_scores ?? []).map((entry) => [`${team.id}:${entry.game_id}`, String(entry.score)])));
}

export default function Editor({ initialTeams, initialGames }: { initialTeams: Team[]; initialGames: Game[] }) {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [games, setGames] = useState<Game[]>(initialGames);
  const [draft, setDraft] = useState<Record<string, string>>(() => draftFromTeams(initialTeams));
  const [message, setMessage] = useState(initialTeams.length ? '' : 'Не удалось загрузить результаты. Нажмите «Обновить».');
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    try {
      const response = await fetch('/api/scores', { cache: 'no-store' });
      if (!response.ok) throw new Error();
      const data = await response.json() as { games: Game[]; teams: Team[] };
      setTeams(data.teams);
      setGames(data.games);
      setDraft(draftFromTeams(data.teams));
      setMessage('Результаты обновлены.');
    } catch {
      setMessage('Не удалось загрузить результаты. Попробуйте ещё раз.');
    }
  }

  async function save(event: FormEvent<HTMLFormElement>, team: Team, game: Game) {
    event.preventDefault();
    const key = `${team.id}:${game.id}`;
    const value = draft[key] ?? '';
    const score = Number(value);
    const previous = (team.game_scores ?? []).find((entry) => entry.game_id === game.id)?.score ?? 0;
    if (value.trim() === '' || !Number.isInteger(score) || score < 0 || score > 1_000_000) {
      setMessage('Введите целое число от 0 до 1 000 000.');
      return;
    }

    setBusy(key);
    try {
      const response = await fetch('/api/scores', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: team.id, gameId: game.id, score, previous }),
      });
      const data = await response.json() as { games?: Game[]; teams?: Team[]; error?: string };
      if (!response.ok || !data.teams || !data.games) throw new Error(data.error || 'Не удалось сохранить результат.');
      setTeams(data.teams);
      setGames(data.games);
      setDraft(draftFromTeams(data.teams));
      const total = data.teams.find((item) => item.id === team.id)?.score ?? score;
      setMessage(`${team.name} · ${game.name}: ${score}. Итого: ${total} баллов.`);
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
      <p>Баллы за игры автоматически складываются в общий результат команды.</p>
      <button className="refresh" type="button" onClick={logout}>Выйти</button>
    </div>
    <section className="admin-scoreboard">
      <div className="admin-scoreboard-heading">
        <div><h2>Баллы по играм</h2><p>Откройте нужную гору и внесите результат игры.</p></div>
        <button className="refresh" type="button" onClick={() => void load()} disabled={busy !== null}>Обновить</button>
      </div>
      <p className="admin-message" role="status">{message}</p>
      <div className="admin-team-list">
        {teams.map((team, index) => <details className="admin-team-card" key={team.id} open={index === 0}>
          <summary><span><small>КОМАНДА {String(team.id).padStart(2, '0')}</small><strong>{team.name}</strong></span><span className="admin-total"><small>ИТОГО</small><strong>{team.score}</strong></span></summary>
          <div className="admin-games">
            {games.map((game) => {
              const key = `${team.id}:${game.id}`;
              return <form key={game.id} className="admin-game-row" onSubmit={(event) => void save(event, team, game)}>
                <label htmlFor={`score-${team.id}-${game.id}`}><small>{game.stage}</small><span>{game.name}</span></label>
                <input id={`score-${team.id}-${game.id}`} aria-label={`${team.name}, ${game.name} — баллы`} type="number" min="0" max="1000000" step="1" required value={draft[key] ?? '0'} onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))} />
                <button className="save-button" disabled={busy !== null}>{busy === key ? 'Сохраняем…' : 'Сохранить'}</button>
              </form>;
            })}
          </div>
        </details>)}
      </div>
    </section>
  </>;
}
