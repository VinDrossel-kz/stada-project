import Header from '../header';
import Editor from './editor';
import LoginForm from './login-form';
import { currentOrganizer } from '@/lib/organizer-session';
import { loadScoreBoard, type ScoreBoard } from '@/lib/scores';
export const dynamic = 'force-dynamic';

export default async function Admin() {
  let organizer = null;
  let board: ScoreBoard = { games: [], teams: [] };
  let unavailable = false;
  try {
    organizer = await currentOrganizer();
    if (organizer) board = await loadScoreBoard();
  } catch (error) {
    console.error('Admin page: database unavailable', error);
    unavailable = true;
  }
  return <>
    <Header active="admin" account={organizer && { name: organizer.name, role: organizer.role }} />
    <main className={`main admin-panel ${organizer ? '' : 'is-login'}`} id="main-content">
      <p className="eyebrow">ПАНЕЛЬ ОРГАНИЗАТОРА</p>
      <h1>Результаты команд</h1>
      {organizer ? <Editor organizer={organizer} initialTeams={board.teams} initialGames={board.games} /> : <section className="notice organizer-access">
        <h2>Вход для организатора</h2>
        <p>{unavailable ? 'База данных недоступна. Проверьте, что она запущена, и обновите страницу.' : 'Войдите, чтобы вносить баллы команд.'}</p>
        <LoginForm />
      </section>}
    </main>
  </>;
}
