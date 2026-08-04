import { useState } from 'react';
import ClientesPmoPage     from './clientes-pmo-page';
import FranquiasPage       from './franquias-page';
import ClientesListPage          from '../cx/clientes-list-page';
import CancelamentoClientePage  from './cancelamento-cliente-page';
import ZohoProjectsDashboard   from './zoho-projects-dashboard';

type SubPage = null | 'implantacao' | 'franquias' | 'clientes' | 'cancelamento' | 'zoho';

export default function PmoPage() {
  const [subPage, setSubPage] = useState<SubPage>(null);

  if (subPage === 'implantacao') return <ClientesPmoPage  onBack={() => setSubPage(null)} />;
  if (subPage === 'franquias')   return <FranquiasPage    onBack={() => setSubPage(null)} />;
  if (subPage === 'clientes')      return <ClientesListPage          onBack={() => setSubPage(null)} />;
  if (subPage === 'cancelamento')  return <CancelamentoClientePage  onBack={() => setSubPage(null)} />;
  if (subPage === 'zoho')          return <ZohoProjectsDashboard    onBack={() => setSubPage(null)} />;

  const Card = ({ title, desc, color, icon, onClick }: { title: string; desc: string; color: string; icon: string; onClick: () => void }) => (
    <div className="col-12 col-md-4 col-lg-3">
      <div onClick={onClick} style={{ background: '#fff', border: '1px solid var(--ccm-line)', borderTop: `3px solid ${color}`, borderRadius: 6, padding: '20px 22px', cursor: 'pointer', transition: 'box-shadow .15s, transform .15s', boxShadow: '0 1px 4px rgba(12,25,33,.07)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 16px ${color}33`; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(12,25,33,.07)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
      <div className="section-eyebrow mb-1">Projetos</div>
      <div className="section-title mb-4">PMO — Implantação</div>
      <div className="row g-3">
        <Card title="Novo Cliente"     desc="Clientes em processo de implantação."              color="#1DB954" icon="bi-person-plus-fill"  onClick={() => setSubPage('implantacao')} />
        <Card title="Clientes"         desc="Consultar e visualizar dados dos clientes parceria Linx." color="#00B0FA" icon="bi-people-fill" onClick={() => setSubPage('clientes')} />
        <Card title="Franquias Linx"       desc="Gerenciar franquias e parceiros Linx."             color="#7F77DD" icon="bi-building"          onClick={() => setSubPage('franquias')} />
        <Card title="Cancelamento de Cliente"  desc="Clientes inativos com status 9 - INATIVO."          color="#E74C3C" icon="bi-x-circle-fill"     onClick={() => setSubPage('cancelamento')} />
        <Card title="Dashboard Zoho Projects"   desc="Informações de projetos da squad."               color="#1A73E8" icon="bi-kanban-fill"        onClick={() => setSubPage('zoho')} />
        <div className="col-12 col-md-4 col-lg-3">
          <div style={{ background: '#F7F8FA', border: '1px dashed var(--ccm-line)', borderRadius: 6, padding: '20px 22px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120, color: 'var(--ccm-gray-medium)', fontSize: 12, letterSpacing: '.08em' }}>
            <i className="bi bi-plus-circle me-2" />Em breve
          </div>
        </div>
      </div>
    </div>
  );
}
