import { useState } from 'react';
import LinksUteisPage  from './links-uteis-page';
import ResultadosPage  from './resultados-page';
import SmartbooksPage  from './smartbooks-page';
import BiPage          from './bi-page';
import CaminhoBdPage      from './caminho-bd-page';
import CaminhoUpdatesPage from './caminho-updates-page';

type SubPage = null | 'links' | 'resultados' | 'smartbooks' | 'bi' | 'caminhobd' | 'caminhoup';

export default function GestaoPage() {
  const [subPage, setSubPage] = useState<SubPage>(null);

  if (subPage === 'links')      return <LinksUteisPage onBack={() => setSubPage(null)} />;
  if (subPage === 'resultados')  return <ResultadosPage  onBack={() => setSubPage(null)} />;
  if (subPage === 'smartbooks')  return <SmartbooksPage   onBack={() => setSubPage(null)} />;
  if (subPage === 'bi')          return <BiPage           onBack={() => setSubPage(null)} />;
  if (subPage === 'caminhobd')   return <CaminhoBdPage      onBack={() => setSubPage(null)} />;
  if (subPage === 'caminhoup')   return <CaminhoUpdatesPage onBack={() => setSubPage(null)} />;

  const Card = ({ title, desc, color, bg, icon, onClick }: { title: string; desc: string; color: string; bg: string; icon: string; onClick: () => void }) => (
    <div className="col-12 col-md-4 col-lg-3">
      <div onClick={onClick} style={{ background: '#fff', border: '1px solid var(--ccm-line)', borderTop: `3px solid ${color}`, borderRadius: 6, padding: '20px 22px', cursor: 'pointer', transition: 'box-shadow .15s, transform .15s', boxShadow: '0 1px 4px rgba(12,25,33,.07)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 16px ${color}44`; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(12,25,33,.07)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className={`bi ${icon}`} style={{ fontSize: 20, color }} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ccm-ink)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{title}</div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ccm-gray-dark)', lineHeight: 1.5 }}>{desc}</div>
        <div style={{ marginTop: 12, fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          Acessar <i className="bi bi-arrow-right" />
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="section-eyebrow mb-1">Administração</div>
      <div className="section-title mb-4">Gestão</div>
      <div className="row g-3">
        <Card title="Links Úteis" desc="Gerenciar links e acessos úteis da equipe." color="#7F77DD" bg="#F0EEFF" icon="bi-link-45deg" onClick={() => setSubPage('links')} />
        <Card title="Resultados"  desc="Resultados de quarter da equipe."  color="#1DB954" bg="#E8FBF0" icon="bi-bar-chart-fill" onClick={() => setSubPage('resultados')} />
        <Card title="Smartbooks"  desc="Trilhas de aprendizado da equipe."  color="#00B0FA" bg="#E8F7FF" icon="bi-book-fill"       onClick={() => setSubPage('smartbooks')} />
        <Card title="B.I."         desc="Estatísticas de Squad."            color="#204294" bg="#E8EDF7" icon="bi-graph-up-arrow"  onClick={() => setSubPage('bi')} />
        <Card title="Caminho BD"      desc="Banco de dados dos atualizadores." color="#0F6E56" bg="#E8F5F1" icon="bi-database-fill-gear" onClick={() => setSubPage('caminhobd')} />
        <Card title="Caminho Updates" desc="Link updates Linx."                  color="#7F77DD" bg="#F0EFFE" icon="bi-arrow-repeat"       onClick={() => setSubPage('caminhoup')} />
        <div className="col-12 col-md-4 col-lg-3">
          <div style={{ background: '#F7F8FA', border: '1px dashed var(--ccm-line)', borderRadius: 6, padding: '20px 22px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120, color: 'var(--ccm-gray-medium)', fontSize: 12, letterSpacing: '.08em' }}>
            <i className="bi bi-plus-circle me-2" />Em breve
          </div>
        </div>
      </div>
    </div>
  );
}
