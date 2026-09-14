import {LockKeyhole, Trophy, CalendarDays} from 'lucide-react';
import Link from 'next/link';
export default function Header({active='standings'}:{active?:string}) {
  return <>
    <a className="skip-link" href="#main-content">Перейти к содержимому</a>
    <header className="site-header">
      <Link href="/" className="brand" aria-label="LET’S MAX STADA 2026 — главная">
        <span className="brand-logo"><img src="/images/letsmax-stada.svg" width="139" height="87" alt="LET’S MAX STADA 2026"/></span>
        <span className="brand-caption">Цикловая конференция<small>Боровое · Казахстан</small></span>
      </Link>
      <nav aria-label="Главное меню">
        <Link href="/" aria-current={active==='standings'?'page':undefined}><Trophy size={18}/>Рейтинг команд</Link>
        <Link href="/agenda" aria-current={active==='agenda'?'page':undefined}><CalendarDays size={18}/>Программа</Link>
      </nav>
      <a className="organizer" href="/admin" aria-label="Кабинет организатора"><LockKeyhole size={17}/><span>Организатор</span></a>
    </header>
  </>;
}
