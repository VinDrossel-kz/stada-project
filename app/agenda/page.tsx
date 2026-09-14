import Header from '../header';
import Link from 'next/link';
import { CalendarDays, ArrowLeft } from 'lucide-react';
export default function Agenda() {
  return <><Header active="agenda"/><main id="main-content" className="main agenda-main">
    <p className="eyebrow">LET’S MAX · STADA 2026</p>
    <h1>Программа конференции</h1>
    <section className="agenda-empty">
      <span className="agenda-icon"><CalendarDays size={32}/></span>
      <h2>Программа пока не опубликована</h2>
      <p>Уточните расписание у организаторов конференции.</p>
      <Link className="back-link" href="/"><ArrowLeft size={17}/>К рейтингу команд</Link>
    </section>
  </main></>;
}
