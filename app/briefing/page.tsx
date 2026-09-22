import Header from '../header';
import { Download, ExternalLink, ShieldCheck } from 'lucide-react';

const presentationPdf = '/presentations/instruktazh-tekhnika-bezopasnosti.pdf';
const presentationPptx = '/presentations/instruktazh-tekhnika-bezopasnosti.pptx';

export default function Briefing() {
  return <>
    <Header active="briefing"/>
    <main id="main-content" className="main briefing-main">
      <section className="briefing-heading">
        <div>
          <p className="eyebrow"><ShieldCheck size={17}/>LET’S MAX · STADA 2026</p>
          <h1>Инструктаж</h1>
          <p>Организационная информация и техника безопасности</p>
        </div>
        <div className="briefing-actions">
          <a className="briefing-secondary-action" href={presentationPdf} target="_blank" rel="noreferrer">
            <ExternalLink size={18}/>Открыть на весь экран
          </a>
          <a className="briefing-primary-action" href={presentationPptx} download>
            <Download size={18}/>Скачать презентацию
          </a>
        </div>
      </section>

      <section className="presentation-viewer" aria-label="Презентация инструктажа">
        <object data={presentationPdf} type="application/pdf" title="Организационная информация и целевой инструктаж">
          <div className="presentation-fallback">
            <ShieldCheck size={38}/>
            <h2>Просмотр PDF недоступен в этом браузере</h2>
            <p>Откройте презентацию в новой вкладке или скачайте оригинал PowerPoint.</p>
            <a href={presentationPdf} target="_blank" rel="noreferrer">Открыть PDF</a>
          </div>
        </object>
      </section>
    </main>
  </>;
}
