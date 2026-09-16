import type {Metadata} from 'next';
import '@fontsource-variable/noto-sans';
import './globals.css';
export const metadata:Metadata={title:'LET’S MAX STADA 2026 — Вершина зовёт',description:'Рейтинг 14 команд, составы участников и программа цикловой конференции STADA в Боровом.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ru"><body>{children}</body></html>}
