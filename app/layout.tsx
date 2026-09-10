import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'STADA | Borovoe Cycle Meeting',description:'Fourteen mountain teams, live standings and the STADA Cycle Meeting agenda in Borovoe, Kazakhstan.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
