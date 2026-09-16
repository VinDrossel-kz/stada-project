'use client';

import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, Compass, Flag, MapPin, Mountain, RefreshCw, Search, Trophy } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Header from './header';
import ParticipantFinder from './participant-finder';
import { initialTeams, participants, Team } from './teams';
import { games as initialGames, Game } from './games';

const PARTICIPANT_COOKIE = 'stada_participant';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180;

function readSavedParticipant() {
  const entry = document.cookie.split('; ').find((cookie) => cookie.startsWith(`${PARTICIPANT_COOKIE}=`));
  if (!entry) return null;
  try {
    const saved = JSON.parse(decodeURIComponent(entry.slice(PARTICIPANT_COOKIE.length + 1))) as { name?: string; teamId?: number };
    return participants.find((participant) => participant.name === saved.name && participant.teamId === saved.teamId) ?? null;
  } catch {
    return null;
  }
}

function saveParticipant(teamId: number, name: string) {
  const value = encodeURIComponent(JSON.stringify({ teamId, name }));
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${PARTICIPANT_COOKIE}=${value}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
}

export default function Board() {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [status, setStatus] = useState('Загружаем результаты');
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [finderOpen, setFinderOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState('');
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
    let scrollTimer: number | undefined;
    const restoreTimer = window.setTimeout(() => {
      const saved = readSavedParticipant();
      if (!saved) {
        setFinderOpen(true);
        return;
      }
      setSelectedTeamId(saved.teamId);
      setSelectedParticipant(saved.name);
      setExpandedTeamId(saved.teamId);
      scrollTimer = window.setTimeout(() => {
        document.getElementById(`team-games-${saved.teamId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 350);
    }, 0);
    return () => { clearTimeout(restoreTimer); if (scrollTimer) clearTimeout(scrollTimer); };
  }, []);

  const showTeam = (teamId: number, participantName: string) => {
    saveParticipant(teamId, participantName);
    setFinderOpen(false);
    setSelectedTeamId(teamId);
    setSelectedParticipant(participantName);
    setExpandedTeamId(teamId);
    window.setTimeout(() => {
      document.getElementById(`team-games-${teamId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);
  };

  const sorted = [...teams].sort((a, b) => b.score - a.score || a.id - b.id);
  const started = teams.some((team) => team.score !== 0);
  const max = sorted[0]?.score || 0;
  const leaders = teams.filter((team) => team.score === max);

  return <>
    <Header/>
    <ParticipantFinder open={finderOpen} onOpenChange={setFinderOpen} onSelect={showTeam}/>
    <main id="main-content" className="main leaderboard-main">
      <section className="expedition-cover" aria-labelledby="expedition-title">
        <img className="cover-photo" src="/images/expedition.jpg" alt="Путешественник перед горным хребтом"/>
        <div className="cover-shade"/>
        <div className="cover-content">
          <p className="eyebrow"><span className="edition-line"/> LET’S MAX · STADA 2026</p>
          <h1 id="expedition-title">ВЕРШИНА<br/><span>ЗОВЁТ.</span></h1>
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
          <div className="board-title"><span className="section-index">01 /</span><div><h2>Рейтинг команд</h2><p>Каждый балл приближает к вершине</p></div></div>
          <div className="board-heading-actions">
            <button className="find-me-button" type="button" onClick={() => setFinderOpen(true)}><Search size={15}/>{selectedParticipant ? 'Сменить участника' : 'Найти себя'}</button>
            <button disabled={refreshing} aria-busy={refreshing} className={'refresh ' + (error ? 'error ' : '') + (refreshing ? 'is-refreshing' : '')} onClick={refresh} aria-label={status + '. Обновить результаты'}><RefreshCw size={14}/><span role="status" aria-live="polite">{refreshing ? 'Обновляем…' : status}</span></button>
          </div>
        </div>
        {selectedParticipant && <div className="selected-team-notice" role="status"><span><strong>{selectedParticipant}</strong>, ваша команда сохранена на этом устройстве.</span><button type="button" onClick={() => setFinderOpen(true)}>Сменить</button></div>}
        {error && loaded && <p className="connection-notice" role="status">Показываем последние загруженные баллы. Связь восстанавливается.</p>}
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
              <TableCell className="progress-cell"><div className="score-track"><div style={{ width: max > 0 ? `${Math.max(0, team.score) / max * 100}%` : '0%' }}/></div></TableCell>
              <TableCell className="points"><strong>{!loaded ? '—' : team.score}</strong></TableCell>
            </TableRow>{expanded && <TableRow id={`team-games-${team.id}`} className={`team-details-row ${selected ? 'own-team-details' : ''}`}><TableCell colSpan={4}><div className="game-breakdown"><div className="game-breakdown-heading"><strong>Баллы по играм</strong><span>Итого: {team.score}</span></div><div className="game-score-grid">{games.map((game) => <div className="game-score-item" key={game.id}><span><small>{game.stage}</small>{game.name}</span><strong>{team.game_scores.find((entry) => entry.game_id === game.id)?.score ?? 0}</strong></div>)}</div></div></TableCell></TableRow>}</Fragment>;
          })}</TableBody>
        </Table>
        <div className="board-footer"><span>При равном количестве баллов команды делят место.</span><span><RefreshCw size={12}/> Автообновление каждые 10 сек.</span></div>
      </section>
    </main>
    <footer><span className="footer-brand">LET’S MAX STADA 2026 <span>/</span> ВЕРШИНА ЗОВЁТ</span><span>Боровое, Казахстан</span></footer>
  </>;
}
