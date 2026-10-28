'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { initialTeams, Team } from './teams';
import { games as initialGames, Game } from './games';

const POLL_INTERVAL = 10_000;
/** How long a rank change arrow stays next to a team. */
const MOVEMENT_TTL = 60_000;

export function rankTeams(teams: Team[]) {
  return [...teams].sort((a, b) => b.score - a.score || a.id - b.id);
}

/** Place of each team by score; teams with equal scores share a place. */
export function placesOf(scores: { id: number; score: number }[]) {
  return new Map(scores.map((team) => [team.id, 1 + scores.filter((other) => other.score > team.score).length]));
}

/** Live team scores, polled every 10 s while the tab is visible. */
export function useScores() {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [games, setGames] = useState<Game[]>(initialGames);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  // teamId -> places gained (positive) or lost (negative) at the last reorder.
  const [movement, setMovement] = useState<Map<number, { delta: number; at: number }>>(new Map());
  const inFlight = useRef(false);
  const lastOrder = useRef<number[] | null>(null);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const response = await fetch('/api/scores', { cache: 'no-store', signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw Error();
      const data = await response.json() as { games: Game[]; teams: Team[] };
      // The server list is authoritative: teams can be added or removed by organizers.
      const next = data.teams.map((team) => ({ ...team, game_scores: team.game_scores ?? [] }));
      const order = rankTeams(next).map((team) => team.id);
      const previous = lastOrder.current;
      if (previous) {
        const now = Date.now();
        setMovement((current) => {
          const updated = new Map([...current].filter(([, entry]) => now - entry.at < MOVEMENT_TTL));
          order.forEach((id, index) => {
            const before = previous.indexOf(id);
            const delta = before - index;
            if (before !== -1 && delta !== 0) updated.set(id, { delta, at: now });
          });
          return updated;
        });
      }
      lastOrder.current = order;
      setTeams(next);
      setGames(data.games);
      setLoaded(true);
      setError(false);
    } catch {
      setError(true);
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    const firstLoad = window.setTimeout(refresh, 0);
    const tick = () => { if (document.visibilityState === 'visible') refresh(); };
    const timer = setInterval(tick, POLL_INTERVAL);
    document.addEventListener('visibilitychange', tick);
    return () => { clearTimeout(firstLoad); clearInterval(timer); document.removeEventListener('visibilitychange', tick); };
  }, [refresh]);

  return { teams, games, loaded, error, refresh, movement };
}
