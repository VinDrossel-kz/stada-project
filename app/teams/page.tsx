import Header from '../header';
import Link from 'next/link';
import { ArrowLeft, Mountain, Users } from 'lucide-react';
import { teamRosters } from '../teams';

export default function TeamsPage() {
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
      <section className="roster-grid" aria-label="Составы команд">
        {teamRosters.map((team) => <article className="roster-card" key={team.id} id={`team-roster-${team.id}`}>
          <header><span className={`team-icon tone-${team.id % 4}`}><Mountain size={22}/></span><div><small>КОМАНДА {String(team.id).padStart(2, '0')}</small><h2>{team.name}</h2></div><span className="member-count">{team.members.length}</span></header>
          <ol>{team.members.map((member) => <li key={member}><span>{member}</span></li>)}</ol>
        </article>)}
      </section>
      <Link className="back-link" href="/"><ArrowLeft size={17}/>К рейтингу команд</Link>
    </main>
  </>;
}
