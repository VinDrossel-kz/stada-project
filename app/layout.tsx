import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'MAX STADA — Вершина зовёт',description:'Рейтинг 14 команд и программа цикловой конференции STADA в Боровом.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ru"><body>{children}</body></html>}
