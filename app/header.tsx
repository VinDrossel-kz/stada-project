'use client';
import {LockKeyhole, LogOut, Trophy, CalendarDays, Users, ShieldCheck, UserRound} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { announceAuthChange, roleLabel, unsavedScores, useAccount, type Account } from './account';

export default function Header({active='standings', account: initialAccount}:{active?:string; account?: Account | null}) {
  const router = useRouter();
  const account = useAccount(initialAccount);

  async function logout() {
    if (unsavedScores.count && !window.confirm('Есть несохранённые баллы. Всё равно выйти?')) return;
    await fetch('/api/admin/logout', { method: 'POST' });
    announceAuthChange();
    router.refresh();
  }

  return <>
    <a className="skip-link" href="#main-content">Перейти к содержимому</a>
    <header className="site-header">
      <Link href="/" className="brand" aria-label="LET’S MAX STADA 2026 — главная">
        <span className="brand-logo"><img src="/images/letsmax-stada.svg" width="139" height="87" alt="LET’S MAX STADA 2026"/></span>
        <span className="brand-caption">Цикловая конференция<small>Гран-при STADA 2026</small></span>
      </Link>
      <nav aria-label="Главное меню">
        <Link href="/" aria-current={active==='standings'?'page':undefined}><Trophy size={18}/>Рейтинг</Link>
        <Link href="/teams" aria-current={active==='teams'?'page':undefined}><Users size={18}/>Участники</Link>
        <Link href="/agenda" aria-current={active==='agenda'?'page':undefined}><CalendarDays size={18}/>Программа</Link>
        <Link href="/briefing" aria-current={active==='briefing'?'page':undefined}><ShieldCheck size={18}/>Инструктаж</Link>
      </nav>
      {account ? <div className="header-account">
        <Link className="organizer" href="/admin" aria-current={active === 'admin' ? 'page' : undefined} aria-label={`${roleLabel[account.role]} ${account.name} — панель организатора`}><UserRound size={17}/><span>{roleLabel[account.role]}</span></Link>
        <button className="organizer header-logout" type="button" onClick={() => void logout()} aria-label="Выйти"><LogOut size={17}/><span>Выйти</span></button>
      </div> : <Link className="organizer" href="/admin" aria-current={active === 'admin' ? 'page' : undefined} aria-label="Кабинет организатора"><LockKeyhole size={17}/><span>Организатор</span></Link>}
    </header>
  </>;
}
