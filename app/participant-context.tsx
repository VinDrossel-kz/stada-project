'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import ParticipantFinder from './participant-finder';
import { teamRosters as seedRosters, toParticipants, type Participant, type TeamRoster } from './teams';
const cookieName = 'stada_participant';
const skippedCookieName = 'stada_participant_skipped';
function hasSkippedParticipant() {
  return document.cookie.split('; ').some((cookie) => cookie.startsWith(`${skippedCookieName}=`));
}
function expireCookie(name: string) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${secure}`;
}
function rememberSkippedParticipant() {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${skippedCookieName}=1; Max-Age=${60 * 60 * 24 * 180}; Path=/; SameSite=Lax${secure}`;
}
function readSavedParticipant(participants: Participant[]) {
  const entry = document.cookie.split('; ').find((cookie) => cookie.startsWith(`${cookieName}=`));
  if (!entry) return null;
  try {
    const saved = JSON.parse(decodeURIComponent(entry.slice(cookieName.length + 1)));
    return participants.find((person) => person.name === saved.name && person.teamId === saved.teamId)
      ?? participants.find((person) => person.name === saved.name)
      ?? null;
  } catch { return null; }
}
const ParticipantContext = createContext<{
  participant: Participant | null; ready: boolean; openFinder: () => void;
  roster: TeamRoster[]; setRoster: (roster: TeamRoster[]) => void;
}>({ participant: null, ready: false, openFinder: () => {}, roster: seedRosters, setRoster: () => {} });
export function ParticipantProvider({ children }: { children: React.ReactNode }) {
  // Teams come from the database; the bundled roster only fills the first paint.
  const [roster, setRosterState] = useState<TeamRoster[]>(seedRosters);
  const participants = useMemo(() => toParticipants(roster), [roster]);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  const setRoster = useCallback((next: TeamRoster[]) => {
    setRosterState(next);
    // The saved participant may have been renamed away or removed with their team.
    setParticipant(readSavedParticipant(toParticipants(next)));
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/teams', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() as Promise<{ teams: TeamRoster[] }> : null)
      .then((data) => { if (data && !cancelled) setRoster(data.teams); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [setRoster]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = readSavedParticipant(participants);
      setParticipant(saved);
      // Event screens run unattended, so never greet them with the finder.
      setOpen(!saved && !hasSkippedParticipant() && !/^\/broadcast(\/|$)/.test(window.location.pathname));
      setReady(true);
    }, 0);
    return () => clearTimeout(timer);
    // Only on first load; later roster updates go through setRoster.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const restore = () => setParticipant(readSavedParticipant(participants));
    const visible = () => { if (document.visibilityState === 'visible') restore(); };
    window.addEventListener('focus', restore);
    document.addEventListener('visibilitychange', visible);
    return () => { window.removeEventListener('focus', restore); document.removeEventListener('visibilitychange', visible); };
  }, [participants]);

  return <ParticipantContext.Provider value={{ participant, ready, openFinder: () => setOpen(true), roster, setRoster }}>
    {children}
    <ParticipantFinder
      open={open}
      participants={participants}
      onOpenChange={setOpen}
      selectedParticipantName={participant?.name}
      onSkip={() => { rememberSkippedParticipant(); setOpen(false); }}
      onClear={() => {
        expireCookie(cookieName);
        rememberSkippedParticipant();
        setParticipant(null);
        setOpen(false);
      }}
      onSelect={(teamId, name) => {
      const person = participants.find((entry) => entry.teamId === teamId && entry.name === name);
      if (!person) return;
      const secure = window.location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `${cookieName}=${encodeURIComponent(JSON.stringify({ teamId, name }))}; Max-Age=${60 * 60 * 24 * 180}; Path=/; SameSite=Lax${secure}`;
      expireCookie(skippedCookieName);
      setParticipant(person); setOpen(false);
    }}/>
  </ParticipantContext.Provider>;
}
export const useParticipant = () => useContext(ParticipantContext);
/** Current teams and members, kept in sync with the database. */
export const useRoster = () => {
  const { roster, setRoster } = useContext(ParticipantContext);
  return { roster, setRoster };
};
