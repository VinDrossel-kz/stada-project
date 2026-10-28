'use client';

import { Fragment, useEffect, useState } from 'react';
import Link from 'next/link';
import { CarFront, ChevronDown, Flag, Gauge, MonitorPlay, RefreshCw, Search, Trophy } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Header from './header';
import ScoreTrack from './score-track';
import { useParticipant } from './participant-context';
import { rankTeams, useScores } from './use-scores';
import { enterScreen } from './use-screen';

/** Russian plural form for a count: 1 команда, 2 команды, 5 команд. */
function plural(count: number, [one, few, many]: [string, string, string]) {
  const tens = count % 100, units = count % 10;
  if (tens >= 11 && tens <= 14) return many;
  return units === 1 ? one : units >= 2 && units <= 4 ? few : many;
}

export default function Board() {
  const { teams, games, loaded, error, refresh } = useScores();
  const { participant, openFinder } = useParticipant();
  const selectedTeamId = participant?.teamId ?? null;
  const selectedParticipant = participant?.name ?? '';
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null);

  useEffect(() => {
    if (!selectedTeamId) return;
    const timer = window.setTimeout(() => setExpandedTeamId(selectedTeamId), 0);
    return () => clearTimeout(timer);
  }, [selectedTeamId]);

  const sorted = rankTeams(teams);
  const started = teams.some((team) => team.score !== 0);
  const max = sorted[0]?.score || 0;
  const leaders = teams.filter((team) => team.score === max);

  return <>
    <Header/>
    <main id="main-content" className="main leaderboard-main">
      <section className="expedition-cover" aria-labelledby="expedition-title">
        <img className="cover-photo" src="/images/race-cover.svg" alt=""/>
        <div className="cover-shade"/>
        <div className="cover-content">
          <p className="eyebrow"><span className="edition-line"/> LET’S MAX · STADA 2026 · ГРАН-ПРИ</p>
          <h1 id="expedition-title">ЖМИ <span>НА ГАЗ!</span></h1>
          <div className="cover-checker" aria-hidden="true"/>
          <p className="cover-caption">{teams.length} {plural(teams.length, ['команда', 'команды', 'команд'])} на одной трассе. Финиш — только вперёд.</p>
        </div>
        <div className="cover-coordinate" aria-hidden="true"><Gauge size={44}/></div>
        <section className="stats" aria-label="Итоги соревнования">
          <div className="team-stat"><span className="stat-symbol"><Flag size={19}/></span><div><span className="stat-label">НА СТАРТЕ</span><strong>{teams.length} <small>{plural(teams.length, ['команда', 'команды', 'команд'])}</small></strong></div></div>
          <div><span className="stat-symbol"><Gauge size={22}/></span><div><span className="stat-label">ЛУЧШИЙ РЕЗУЛЬТАТ</span><strong>{!loaded ? '—' : max}<small> баллов</small></strong></div></div>
          <div className="leader-stat"><span className="stat-symbol"><Trophy size={21}/></span><div><span className="stat-label">{started ? 'ЛИДЕР ГОНКИ' : 'ГОНКА СКОРО СТАРТУЕТ'}</span><strong>{!loaded ? (error ? 'Нет связи' : 'Загружаем…') : started ? (leaders.length === 1 ? leaders[0].name : `Лидеров: ${leaders.length}`) : 'Моторы прогреваются'}</strong></div></div>
        </section>
      </section>
      <section className="board">
        <div className="board-heading">
          <div className="board-title"><span className="section-index"><Trophy size={22}/></span><div><h2>Рейтинг команд</h2><p>Нажмите на команду, чтобы увидеть баллы по играм</p></div></div>
          <div className="board-heading-actions">
            <Link className="refresh broadcast-link" href="/broadcast" onClick={enterScreen}><MonitorPlay size={15}/>Режим трансляции</Link>
            <button className="find-me-button" type="button" onClick={openFinder}><Search size={15}/>{selectedParticipant ? 'Сменить участника' : 'Найти себя'}</button>
          </div>
        </div>
        {error && <div className="connection-notice" role="status"><span>{loaded ? 'Показываем последние загруженные баллы. Связь восстанавливается.' : 'Не удалось загрузить баллы. Проверьте соединение.'}</span><button type="button" onClick={refresh}><RefreshCw size={14}/>Повторить</button></div>}
        <Table>
          <caption className="sr-only">Рейтинг команд — места и количество баллов</caption>
          <TableHeader><TableRow><TableHead className="rank">МЕСТО</TableHead><TableHead>КОМАНДА</TableHead><TableHead className="progress-head">ДИСТАНЦИЯ</TableHead><TableHead className="points">БАЛЛЫ</TableHead></TableRow></TableHeader>
          <TableBody>{sorted.map((team) => {
            const rank = started ? sorted.findIndex((entry) => entry.score === team.score) + 1 : null;
            const selected = team.id === selectedTeamId;
            const expanded = expandedTeamId === team.id;
            return <Fragment key={team.id}><TableRow id={`team-${team.id}`} className={`${rank === 1 ? 'leading-row ' : ''}${rank === 1 && team.id !== sorted[0].id ? 'co-leader-row ' : ''}${selected ? 'own-team-row' : ''}`}>
              <TableCell className="rank"><span className={`rank-number ${rank !== null && rank <= 3 ? ['first', 'second', 'third'][rank - 1] : ''}`}>{rank === null ? '—' : rank}</span></TableCell>
              <TableCell><button type="button" className="team team-expand" aria-expanded={expanded} aria-controls={`team-games-${team.id}`} onClick={() => setExpandedTeamId(expanded ? null : team.id)}><span className={`team-icon tone-${team.id % 4}`}><CarFront size={22}/></span><span className="team-info"><strong>{team.name}</strong><span>КОМАНДА {team.id}</span></span><span className="team-statuses">{rank === 1 && <span className="leader-badge"><Trophy size={13}/>Лидер</span>}{selected && <span className="own-team-badge">Ваша команда</span>}</span><ChevronDown className={`team-chevron ${expanded ? 'is-open' : ''}`} size={18}/></button></TableCell>
              <TableCell className="progress-cell"><ScoreTrack score={team.score} max={max} loaded={loaded}/></TableCell>
              <TableCell className="points"><strong>{!loaded ? '—' : team.score}</strong><div className="mobile-track"><ScoreTrack score={team.score} max={max} loaded={loaded}/></div></TableCell>
            </TableRow>{expanded && <TableRow id={`team-games-${team.id}`} className={`team-details-row ${selected ? 'own-team-details' : ''}`}><TableCell colSpan={4}><div className="game-breakdown"><div className="game-breakdown-heading"><strong>Баллы по играм</strong><span>Итого: {loaded ? team.score : '—'}</span></div><div className="game-score-grid">{games.map((game) => <div className="game-score-item" key={game.id}><span><small>{game.stage}</small>{game.name}</span><strong>{loaded ? (team.game_scores.find((entry) => entry.game_id === game.id)?.score ?? 0) : '—'}</strong></div>)}</div></div></TableCell></TableRow>}</Fragment>;
          })}</TableBody>
        </Table>
        <div className="board-footer"><span>Положение машины — баллы относительно лидера. При равенстве баллов команды делят место.</span></div>
      </section>
    </main>
    <footer><span className="footer-brand">LET’S MAX STADA 2026 <span>/</span> ЖМИ НА ГАЗ</span><span>Гран-при STADA 2026</span></footer>
  </>;
}

