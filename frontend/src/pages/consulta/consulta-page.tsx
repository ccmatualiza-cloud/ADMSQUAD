import { useState } from 'react';
import ClientesListPage from '../cx/clientes-list-page';
import BiPage          from '../gestao/bi-page';

type SubPage = null | 'clientes' | 'bi';

interface CardProps {
  title: string; desc: string; color: string; bg: string; icon: string; onClick: () => void;
}

function Card({ title, desc, color, bg, icon, onClick }: CardProps) {
  return (
    <div onClick={onClick} style={{ background: '#fff', borderRadius: 8, padding: '24px 20px', cursor: 'pointer', borderTop: `3px solid ${color}`, boxShadow: '0 1px 4px rgba(12,25,33,.07)', transition: 'box-shadow .2s, transform .15s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(12,25,33,.13)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(12,25,33,.07)'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <i className={`bi ${icon}`} style={{ color, fontSize: 20 }} />
      </div>
      <div style={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ccm-ink)', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--ccm-gray-dark)', lineHeight: 1.5 }}>{desc}</div>
    </div>
  );
}

export default function ConsultaPage() {
  const [subPage, setSubPage] = useState<SubPage>(null);

  if (subPage === 'clientes') return <ClientesListPage onBack={() => setSubPage(null)} />;
  if (subPage === 'bi')       return <BiPage           onBack={() => setSubPage(null)} />;

  return (
    <div>
      <div className="section-title mb-4" style={{ textAlign: 'center' }}>Consulta</div>
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-lg-4">
          <Card title="Clientes"  desc="Consulta e gestão da base de clientes." color="var(--ccm-blue)" bg="#E8EDF7" icon="bi-people-fill"    onClick={() => setSubPage('clientes')} />
        </div>
        <div className="col-12 col-sm-6 col-lg-4">
          <Card title="B.I."      desc="Business Intelligence — indicadores e gráficos." color="#7F77DD" bg="#F0EFFE" icon="bi-bar-chart-fill" onClick={() => setSubPage('bi')} />
        </div>
      </div>
    </div>
  );
}
