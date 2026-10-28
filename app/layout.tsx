import type {Metadata} from 'next';
import {Russo_One} from 'next/font/google';
import '@fontsource-variable/noto-sans';
import './globals.css';
import { ParticipantProvider } from './participant-context';
const display = Russo_One({weight:'400',subsets:['latin','cyrillic'],variable:'--font-display',display:'swap'});
export const metadata:Metadata={title:'LET’S MAX STADA 2026 — Жми на газ',description:'Рейтинг команд, составы участников и программа цикловой конференции STADA.',icons:'/favicon.svg'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ru" className={display.variable}><body><ParticipantProvider>{children}</ParticipantProvider></body></html>}
