'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ArrowDown, ArrowUp, CarFront, Crown, LogOut } from 'lucide-react';
import ScoreTrack from '../score-track';
import { rankTeams, useScores } from '../use-scores';
import { useScreen } from '../use-screen';

const timeFormat = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' });
const clockFormat = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

/** Full-screen leaderboard for event screens and projectors. */
export default function Broadcast() {
  const { teams, games, loaded, error, movement } = useScores();
  const [now, setNow] = useState<Date | null>(null);
  const { controls, exit } = useScreen('/');
  // Row height is measured, not guessed: the ladder fills exactly the space between header and ticker.
  const ladderRef = useRef<HTMLElement>(null);
  const [row, setRow] = useState<number | null>(null);
  const teamCount = Math.max(teams.length, 1);

  useEffect(() => {
    const ladder = ladderRef.current;
    if (!ladder) return;
    const measure = () => {
      const head = ladder.querySelector<HTMLElement>('.bc-ladder-head');
      const free = ladder.clientHeight - (head?.offsetHeight ?? 0) - 4;
      setRow(Math.max(34, Math.min(84, Math.floor(free / teamCount))));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(ladder);
    return () => observer.disconnect();
  }, [teamCount]);
  // Rows snap into place on the first load and only glide on later reorders.
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (!loaded) return;
    const timer = window.setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, [loaded]);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 1000);
    return () => { clearTimeout(first); clearInterval(timer); };
  }, []);

  const ranked = rankTeams(teams);
  const started = teams.some((team) => team.score !== 0);
  const max = ranked[0]?.score || 0;
  const played = games.filter((game) => teams.some((team) => team.game_scores.some((entry) => entry.game_id === game.id && entry.score > 0))).length;

  const bestPerGame = useMemo(() => games.map((game) => {
    let best: { name: string; score: number } | null = null;
    for (const team of teams) {
      const score = team.game_scores.find((entry) => entry.game_id === game.id)?.score ?? 0;
      if (score > 0 && (!best || score > best.score)) best = { name: team.name, score };
    }
    return { game, best };
  }), [games, teams]);

  const results = useMemo(() => teams
    .flatMap((team) => team.game_scores
      .filter((entry) => entry.score > 0 && entry.updated_at)
      .map((entry) => ({ team, game: games.find((game) => game.id === entry.game_id), score: entry.score, at: new Date(entry.updated_at as string) })))
    .filter((entry) => entry.game && !Number.isNaN(entry.at.getTime()))
    .sort((a, b) => b.at.getTime() - a.at.getTime()), [games, teams]);

  // Stable DOM order, position by rank: rows glide instead of jumping when places change.
  const rows = [...teams].sort((a, b) => a.id - b.id);

  return <main className={`broadcast ${controls ? 'show-controls' : ''} ${animate ? 'is-animated' : ''}`} id="main-content" style={{ '--team-count': teamCount, ...(row ? { '--row': `${row}px` } : {}) } as CSSProperties}>
    <button type="button" className="bc-exit" onClick={exit} tabIndex={controls ? 0 : -1}><LogOut size={16}/>Выйти<kbd>Esc</kbd></button>
    <header className="bc-top">
      <div className="bc-brand">
        <span className="bc-logo"><img src="/images/letsmax-stada.svg" width="139" height="87" alt="LET’S MAX STADA 2026"/></span>
        <div><small>LET’S MAX · STADA 2026</small><strong>Гран-при STADA</strong></div>
      </div>
      <div className="bc-clock"><small>{error ? 'Нет связи — показываем последние баллы' : 'Рейтинг в прямом эфире'}</small><strong>{now ? clockFormat.format(now) : '——:——:——'}</strong></div>
      <dl className="bc-stats">
        <div><dt>Команд</dt><dd>{teams.length}</dd></div>
        <div><dt>Игр сыграно</dt><dd>{loaded ? `${played}/${games.length}` : '—'}</dd></div>
        <div><dt>Лучший</dt><dd>{loaded ? max : '—'}</dd></div>
      </dl>
    </header>

    <div className="bc-body">
      <section ref={ladderRef} className="bc-ladder" aria-label="Рейтинг команд">
        <div className="bc-ladder-head"><span>Место</span><span>Команда</span><span>Дистанция</span><span>Баллы</span></div>
        <ol style={{ '--rows': rows.length } as CSSProperties}>
          {rows.map((team) => {
            const index = ranked.indexOf(team);
            const rank = started ? ranked.findIndex((entry) => entry.score === team.score) + 1 : null;
            const leader = rank === 1;
            const coLeader = leader && team.id !== ranked[0].id;
            const move = movement.get(team.id)?.delta ?? 0;
            return <li key={team.id} className={`${leader ? 'leading-row is-leader ' : ''}${coLeader ? 'co-leader-row ' : ''}${rank !== null && rank <= 3 ? `podium-${rank}` : ''}`} style={{ '--index': index } as CSSProperties}>
              <span className="bc-rank">
                {leader ? <Crown size={26}/> : rank ?? '—'}
                {move !== 0 && <span className={`bc-move ${move > 0 ? 'is-up' : 'is-down'}`}>{move > 0 ? <ArrowUp size={13}/> : <ArrowDown size={13}/>}{Math.abs(move)}</span>}
              </span>
              <span className="bc-name"><span className="team-icon"><CarFront size={22}/></span><span><strong>{team.name}</strong><small>Команда {team.id}</small></span></span>
              <span className="bc-track"><ScoreTrack score={team.score} max={max} loaded={loaded}/></span>
              <span className="bc-points">{loaded ? team.score : '—'}</span>
            </li>;
          })}
        </ol>
      </section>

      <aside className="bc-side">
        <section>
          <h2>Лучшие по играм</h2>
          <ol className="bc-best">{bestPerGame.map(({ game, best }) => <li key={game.id} className={best ? 'is-taken' : undefined}>
            <span><small>{game.stage}</small>{game.name}</span>
            <em>{best ? <><strong>{best.name}</strong> · {best.score}</> : 'ещё не сыграно'}</em>
          </li>)}</ol>
        </section>
        <section>
          <h2>Последние результаты</h2>
          {results.length ? <ol className="bc-events">{results.slice(0, 6).map((entry) => <li key={`${entry.team.id}-${entry.game?.id}`}>
            <span><strong>{entry.team.name}</strong> · {entry.game?.name}</span>
            <b>+{entry.score}</b>
            <time>{timeFormat.format(entry.at)}</time>
          </li>)}</ol> : <p className="bc-empty">Моторы прогреваются — результатов пока нет.</p>}
        </section>
      </aside>
    </div>

    {results.length > 0 && <footer className="bc-ticker" aria-hidden="true">
      <div className="bc-ticker-track">
        {[0, 1].map((copy) => <span key={copy}>{results.slice(0, 14).map((entry) => <span key={`${entry.team.id}-${entry.game?.id}`} className="bc-tick">
          🏁 <strong>{entry.team.name}</strong> · {entry.game?.name}: +{entry.score} · {timeFormat.format(entry.at)}
        </span>)}</span>)}
      </div>
    </footer>}
  </main>;
}
