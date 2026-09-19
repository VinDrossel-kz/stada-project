'use client';

import { useState } from 'react';
import Header from '../header';
import Link from 'next/link';
import { ArrowLeft, Mountain, Search, Users, X } from 'lucide-react';
import { teamRosters } from '../teams';
import { useParticipant } from '../participant-context';

export default function TeamsPage() {
  const [query, setQuery] = useState('');
  const { participant, openFinder } = useParticipant();
  const normalize = (value: string) => value.toLocaleLowerCase('ru-RU').replaceAll('ё', 'е').trim();
  const term = normalize(query);
  const filteredTeams = teamRosters.flatMap(team => {
    const members = !term || normalize(team.name).includes(term) || String(team.id) === term
      ? team.members : team.members.filter(member => normalize(member).includes(term));
    return members.length ? [{ ...team, members }] : [];
  });
  const total = teamRosters.reduce((sum, team) => sum + team.members.length, 0);
  return <>
    <Header active="teams"/>
    <main id="main-content" className="main teams-main">
      <div className="teams-intro">
        <p className="eyebrow"><span className="edition-line"/> LET’S MAX · STADA 2026</p>
        <h1>Команды и участники</h1>
        <p>Все участники экспедиции и их горные команды.</p>
        <div className="teams-summary"><Users size={18}/><strong>{total}</strong> участников · <strong>{teamRosters.length}</strong> команд</div>
      </div>
      <div className="roster-toolbar">
        <label className="roster-search"><Search size={20}/><span className="sr-only">Поиск по имени или команде</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Имя, фамилия или команда"/>{query && <button type="button" aria-label="Очистить поиск" onClick={() => setQuery('')}><X size={18}/></button>}</label>
        <button className="find-me-button" type="button" onClick={openFinder}><Users size={18}/>{participant ? 'Сменить участника' : 'Найти себя'}</button>
      </div>
      <p className="roster-result-count" role="status">{term ? `Найдено участников: ${filteredTeams.reduce((sum, team) => sum + team.members.length, 0)}` : 'Все команды'}</p>
      {filteredTeams.length === 0 && <div className="roster-empty"><Search size={28}/><h2>Участники не найдены</h2><p>Попробуйте другую фамилию или название команды.</p><button className="refresh" onClick={() => setQuery('')}>Сбросить поиск</button></div>}
      <section className="roster-grid" aria-label="Составы команд">
        {filteredTeams.map((team) => <article className={`roster-card ${participant?.teamId === team.id ? 'is-own-team' : ''}`} key={team.id} id={`team-roster-${team.id}`}>
          <header><span className={`team-icon tone-${team.id % 4}`}><Mountain size={22}/></span><div><small>КОМАНДА {String(team.id).padStart(2, '0')}</small><h2>{team.name}</h2></div><span className="member-count">{team.members.length}</span></header>
          <ol>{team.members.map((member) => <li key={member} className={participant?.name === member ? 'is-selected-member' : undefined}><span>{member}{participant?.name === member && <small>Это вы</small>}</span></li>)}</ol>
        </article>)}
      </section>
      <Link className="back-link" href="/"><ArrowLeft size={17}/>К рейтингу команд</Link>
    </main>
  </>;
}
