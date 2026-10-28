'use client';

import { FormEvent, useState } from 'react';
import Header from '../header';
import Link from 'next/link';
import { ArrowLeft, CarFront, Plus, Search, Trash2, Users, X } from 'lucide-react';
import type { TeamRoster } from '../teams';
import { useParticipant, useRoster } from '../participant-context';
import { useAccount } from '../account';

async function changeRoster(path: string, method: 'POST' | 'DELETE', body: object) {
  const response = await fetch(path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json() as { teams?: TeamRoster[]; error?: string };
  if (!response.ok || !data.teams) throw new Error(data.error || 'Не удалось сохранить изменения.');
  return data.teams;
}

export default function TeamsPage() {
  const [query, setQuery] = useState('');
  const { participant, openFinder } = useParticipant();
  const { roster, setRoster } = useRoster();
  const account = useAccount();
  const editing = account !== null;
  const [newTeam, setNewTeam] = useState('');
  const [newMember, setNewMember] = useState<Record<number, string>>({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const normalize = (value: string) => value.toLocaleLowerCase('ru-RU').replaceAll('ё', 'е').trim();
  const term = normalize(query);
  const filteredTeams = roster.flatMap(team => {
    const members = !term || normalize(team.name).includes(term) || String(team.id) === term
      ? team.members : team.members.filter(member => normalize(member).includes(term));
    return members.length || (!term && editing) ? [{ ...team, members }] : [];
  });
  const total = roster.reduce((sum, team) => sum + team.members.length, 0);

  async function run(work: () => Promise<TeamRoster[]>, done: string) {
    setBusy(true);
    try {
      setRoster(await work());
      setMessage(done);
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось сохранить изменения.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function addTeam(event: FormEvent) {
    event.preventDefault();
    const name = newTeam.trim();
    if (await run(() => changeRoster('/api/teams', 'POST', { name }), `Команда «${name}» добавлена.`)) setNewTeam('');
  }

  async function addMember(event: FormEvent, team: TeamRoster) {
    event.preventDefault();
    const name = (newMember[team.id] ?? '').trim();
    if (await run(() => changeRoster('/api/teams/members', 'POST', { teamId: team.id, name }), `«${name}» добавлен(а) в команду «${team.name}».`)) {
      setNewMember((current) => ({ ...current, [team.id]: '' }));
    }
  }

  function removeTeam(team: TeamRoster) {
    if (!window.confirm(`Удалить команду «${team.name}»? Вместе с ней удалятся её участники и все её баллы.`)) return;
    void run(() => changeRoster('/api/teams', 'DELETE', { id: team.id }), `Команда «${team.name}» удалена.`);
  }

  function removeMember(team: TeamRoster, name: string) {
    if (!window.confirm(`Убрать «${name}» из команды «${team.name}»?`)) return;
    void run(() => changeRoster('/api/teams/members', 'DELETE', { teamId: team.id, name }), `«${name}» убран(а) из команды «${team.name}».`);
  }

  return <>
    <Header active="teams"/>
    <main id="main-content" className="main teams-main">
      <div className="teams-intro">
        <p className="eyebrow"><span className="edition-line"/> LET’S MAX · STADA 2026</p>
        <h1>Команды и участники</h1>
        <p>Все пилоты гонки и их команды.</p>
        <div className="teams-summary"><Users size={18}/><strong>{total}</strong> участников · <strong>{roster.length}</strong> команд</div>
      </div>
      <div className="roster-toolbar">
        <label className="roster-search"><Search size={20}/><span className="sr-only">Поиск по нику или команде</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Ник или команда"/>{query && <button type="button" aria-label="Очистить поиск" onClick={() => setQuery('')}><X size={18}/></button>}</label>
        <button className="find-me-button" type="button" onClick={openFinder}><Users size={18}/>{participant ? 'Сменить участника' : 'Найти себя'}</button>
      </div>
      {editing && <form className="roster-add-team" onSubmit={addTeam}>
        <label htmlFor="new-team-name"><CarFront size={15}/>Новая команда на старте</label>
        <input id="new-team-name" value={newTeam} onChange={(event) => setNewTeam(event.target.value)} placeholder="Название новой команды" maxLength={40} required/>
        <button className="find-me-button" disabled={busy}><Plus size={17}/>Добавить команду</button>
      </form>}
      {message && <p className="roster-message" role="status">{message}</p>}
      <p className="roster-result-count" role="status">{term ? `Найдено участников: ${filteredTeams.reduce((sum, team) => sum + team.members.length, 0)}` : 'Все команды'}</p>
      {filteredTeams.length === 0 && <div className="roster-empty"><Search size={28}/><h2>Участники не найдены</h2><p>Попробуйте другой ник или название команды.</p><button className="refresh" onClick={() => setQuery('')}>Сбросить поиск</button></div>}
      <section className="roster-grid" aria-label="Составы команд">
        {filteredTeams.map((team) => {
          const full = roster.find((entry) => entry.id === team.id) ?? team;
          return <article className={`roster-card ${participant?.teamId === team.id ? 'is-own-team' : ''}`} key={team.id} id={`team-roster-${team.id}`}>
            <header>
              <span className={`team-icon tone-${team.id % 4}`}><CarFront size={22}/></span>
              <div><small>КОМАНДА {team.id}</small><h2>{team.name}</h2></div>
              <span className="member-count">{full.members.length}</span>
              {editing && account.role === 'owner' && <button type="button" className="roster-icon-button" onClick={() => removeTeam(full)} disabled={busy} aria-label={`Удалить команду «${team.name}»`} title="Удалить команду"><Trash2 size={17}/></button>}
            </header>
            {team.members.length > 0 && <ol>{team.members.map((member) => <li key={member} className={participant?.name === member && participant.teamId === team.id ? 'is-selected-member' : undefined}>
              <span>{member}{participant?.name === member && participant.teamId === team.id && <small>Это вы</small>}</span>
              {editing && <button type="button" className="roster-icon-button" onClick={() => removeMember(full, member)} disabled={busy} aria-label={`Убрать «${member}»`} title="Убрать участника"><X size={15}/></button>}
            </li>)}</ol>}
            {editing && !term && <form className="roster-add-member" onSubmit={(event) => void addMember(event, full)}>
              <input value={newMember[team.id] ?? ''} onChange={(event) => setNewMember((current) => ({ ...current, [team.id]: event.target.value }))} placeholder="Ник нового участника" maxLength={40} required aria-label={`Новый участник команды «${team.name}»`}/>
              <button type="submit" className="refresh" disabled={busy}><Plus size={15}/>Добавить</button>
            </form>}
          </article>;
        })}
      </section>
      <Link className="back-link" href="/"><ArrowLeft size={17}/>К рейтингу команд</Link>
    </main>
  </>;
}
