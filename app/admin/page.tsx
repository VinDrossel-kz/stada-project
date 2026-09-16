import { cookies } from 'next/headers';
import Header from '../header';
import Editor from './editor';
import LoginForm from './login-form';
import { ORGANIZER_COOKIE, isOrganizerPassword } from '@/lib/organizer-session';
import { SITE_BACKEND } from '@/lib/site-backend';
import { Team } from '../teams';
import { Game, games as defaultGames } from '../games';
export const dynamic = 'force-dynamic';
export default async function Admin() {
  const cookieStore = await cookies();
  const allowed = isOrganizerPassword(cookieStore.get(ORGANIZER_COOKIE)?.value);
  let teams: Team[] = [];
  let games: Game[] = defaultGames;
  if (allowed) {
    try {
      const response = await fetch(SITE_BACKEND + '/api/scores', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json() as { games?: Game[]; teams: Team[] };
        teams = data.teams;
        games = data.games ?? defaultGames;
      }
    } catch {}
  }
  return <>
    <Header active="admin" />
    <main className="main admin-panel" id="main-content">
      <p className="eyebrow">ПАНЕЛЬ ОРГАНИЗАТОРА</p>
      <h1>Результаты команд</h1>
      {allowed ? <Editor initialTeams={teams} initialGames={games} /> : <section className="notice organizer-access">
        <h2>Вход для модератора</h2>
        <p>Введите пароль, чтобы изменять баллы команд.</p>
        <LoginForm />
      </section>}
    </main>
  </>;
}
