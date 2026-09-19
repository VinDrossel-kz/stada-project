'use client';

import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, Compass, Flag, MapPin, Mountain, RefreshCw, Search, Trophy } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Header from './header';
import ScoreMountain from './score-mountain';
import { useParticipant } from './participant-context';
import { initialTeams, Team } from './teams';
import { games as initialGames, Game } from './games';

export default function Board() {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [status, setStatus] = useState('Загружаем результаты');
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { participant, openFinder } = useParticipant();
  const selectedTeamId = participant?.teamId ?? null;
  const selectedParticipant = participant?.name ?? '';
  const [games, setGames] = useState<Game[]>(initialGames);
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setRefreshing(true);
    try {
      const response = await fetch('/api/scores', { cache: 'no-store', signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw Error();
      const data = await response.json() as { games: Game[]; teams: Team[] };
      const scores = new Map(data.teams.map((team) => [team.id, team]));
      setTeams(initialTeams.map((team) => {
        const live = scores.get(team.id);
        return { ...team, score: live?.score ?? 0, updated_at: live?.updated_at ?? null, game_scores: live?.game_scores ?? [] };
      }));
      setGames(data.games);
      setLoaded(true);
      setError(false);
      setStatus('Обновлено в ' + new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }));
    } catch {
      setError(true);
      setStatus('Нет связи · повторить');
    } finally {
      inFlight.current = false;
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const firstLoad = window.setTimeout(refresh, 0);
    const tick = () => { if (document.visibilityState === 'visible') refresh(); };
    const timer = setInterval(tick, 10000);
    document.addEventListener('visibilitychange', tick);
    return () => { clearTimeout(firstLoad); clearInterval(timer); document.removeEventListener('visibilitychange', tick); };
  }, [refresh]);

  useEffect(() => {
    if (!selectedTeamId) return;
    const timer = window.setTimeout(() => setExpandedTeamId(selectedTeamId), 0);
    return () => clearTimeout(timer);
  }, [selectedTeamId]);

  const sorted = [...teams].sort((a, b) => b.score - a.score || a.id - b.id);
  const started = teams.some((team) => team.score !== 0);
  const max = sorted[0]?.score || 0;
  const leaders = teams.filter((team) => team.score === max);

  return <>
    <Header/>
    <main id="main-content" className="main leaderboard-main">
      <section className="expedition-cover" aria-labelledby="expedition-title">
        <img className="cover-photo" src="/images/expedition.jpg" alt="Путешественник перед горным хребтом"/>
        <div className="cover-shade"/>
        <div className="cover-content">
          <p className="eyebrow"><span className="edition-line"/> LET’S MAX · STADA 2026</p>
          <h1 id="expedition-title">ВЕРШИНА <span>ЗОВЁТ.</span></h1>
          <p className="cover-caption">14 команд на пути к общей вершине</p>
        </div>
        <div className="cover-location"><MapPin size={16}/><span>БОРОВОЕ<small>КАЗАХСТАН</small></span></div>
        <div className="cover-coordinate" aria-hidden="true"><Compass size={44}/></div>
        <section className="stats" aria-label="Итоги соревнования">
          <div className="team-stat"><span className="stat-symbol"><Flag size={19}/></span><div><span className="stat-label">НА СТАРТЕ</span><strong>14 <small>команд</small></strong></div></div>
          <div><span className="stat-symbol"><Mountain size={22}/></span><div><span className="stat-label">ЛУЧШИЙ РЕЗУЛЬТАТ</span><strong>{!loaded ? '—' : max}<small> баллов</small></strong></div></div>
          <div className="leader-stat"><span className="stat-symbol"><Trophy size={21}/></span><div><span className="stat-label">{started ? 'ЛИДЕР ЭКСПЕДИЦИИ' : 'ЭКСПЕДИЦИЯ НАЧИНАЕТСЯ'}</span><strong>{!loaded ? (error ? 'Нет связи' : 'Загружаем…') : started ? (leaders.length === 1 ? leaders[0].name : `Лидеров: ${leaders.length}`) : 'Всё ещё впереди'}</strong></div></div>
        </section>
      </section>
      <section className="board">
        <div className="board-heading">
          <div className="board-title"><span className="section-index"><Trophy size={22}/></span><div><h2>Рейтинг команд</h2><p>Нажмите на команду, чтобы увидеть баллы по играм</p></div></div>
          <div className="board-heading-actions">
            <button className="find-me-button" type="button" onClick={openFinder}><Search size={15}/>{selectedParticipant ? 'Сменить участника' : 'Найти себя'}</button>
            <button disabled={refreshing} aria-busy={refreshing} className={'refresh ' + (error ? 'error ' : '') + (refreshing ? 'is-refreshing' : '')} onClick={refresh} aria-label={status + '. Обновить результаты'}><RefreshCw size={14}/><span>{refreshing ? 'Обновляем…' : status}</span></button>
          </div>
        </div>
        {selectedParticipant && <div className="selected-team-notice"><span><strong>{selectedParticipant}</strong> · {participant?.teamName}</span><button type="button" onClick={() => {
          setExpandedTeamId(selectedTeamId);
          document.getElementById(`team-${selectedTeamId}`)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
        }}>К моей команде</button></div>}
        {error && <p className="connection-notice" role="status">{loaded ? 'Показываем последние загруженные баллы. Связь восстанавливается.' : 'Не удалось загрузить баллы. Проверьте соединение и нажмите «Повторить».'}</p>}
        <Table>
          <caption className="sr-only">Рейтинг 14 команд — места и количество баллов</caption>
          <TableHeader><TableRow><TableHead className="rank">МЕСТО</TableHead><TableHead>КОМАНДА</TableHead><TableHead className="progress-head">ПУТЬ К ВЕРШИНЕ</TableHead><TableHead className="points">БАЛЛЫ</TableHead></TableRow></TableHeader>
          <TableBody>{sorted.map((team) => {
            const rank = started ? sorted.findIndex((entry) => entry.score === team.score) + 1 : null;
            const selected = team.id === selectedTeamId;
            const expanded = expandedTeamId === team.id;
            return <Fragment key={team.id}><TableRow id={`team-${team.id}`} className={`${rank === 1 ? 'leading-row ' : ''}${selected ? 'own-team-row' : ''}`}>
              <TableCell className="rank"><span className={rank === 1 ? 'rank-number first' : 'rank-number'}>{rank === null ? '—' : String(rank).padStart(2, '0')}</span></TableCell>
              <TableCell><button type="button" className="team team-expand" aria-expanded={expanded} aria-controls={`team-games-${team.id}`} onClick={() => setExpandedTeamId(expanded ? null : team.id)}><span className={`team-icon tone-${team.id % 4}`}><Mountain size={22}/></span><span className="team-info"><strong>{team.name}</strong><span>КОМАНДА {String(team.id).padStart(2, '0')}</span></span><span className="team-statuses">{rank === 1 && <span className="leader-badge"><Trophy size={13}/>Лидер</span>}{selected && <span className="own-team-badge">Ваша команда</span>}</span><ChevronDown className={`team-chevron ${expanded ? 'is-open' : ''}`} size={18}/></button></TableCell>
              <TableCell className="progress-cell"><ScoreMountain score={team.score} max={max} loaded={loaded}/></TableCell>
              <TableCell className="points"><strong>{!loaded ? '—' : team.score}</strong><div className="mobile-mountain"><ScoreMountain score={team.score} max={max} loaded={loaded}/></div></TableCell>
            </TableRow>{expanded && <TableRow id={`team-games-${team.id}`} className={`team-details-row ${selected ? 'own-team-details' : ''}`}><TableCell colSpan={4}><div className="game-breakdown"><div className="game-breakdown-heading"><strong>Баллы по играм</strong><span>Итого: {loaded ? team.score : '—'}</span></div><div className="game-score-grid">{games.map((game) => <div className="game-score-item" key={game.id}><span><small>{game.stage}</small>{game.name}</span><strong>{loaded ? (team.game_scores.find((entry) => entry.game_id === game.id)?.score ?? 0) : '—'}</strong></div>)}</div></div></TableCell></TableRow>}</Fragment>;
          })}</TableBody>
        </Table>
        <div className="board-footer"><span>Высота горы — баллы относительно лидера. При равенстве баллов команды делят место.</span><span><RefreshCw size={12}/> Автообновление каждые 10 сек.</span></div>
      </section>
    </main>
    <footer><span className="footer-brand">LET’S MAX STADA 2026 <span>/</span> ВЕРШИНА ЗОВЁТ</span><span>Боровое, Казахстан</span></footer>
  </>;
}

