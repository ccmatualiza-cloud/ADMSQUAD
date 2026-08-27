import { useState } from 'react';
import ClientesListPage     from './clientes-list-page';
import MonitorAtualizacoes  from './monitor-atualizacoes';
import AgendarAtualizacao   from './agendar-atualizacao';
import AdiantarAtendimentos from './adiantar-atendimentos';
import ZohoDeskDashboard    from './zoho-desk-dashboard';
import TouchPointsPage      from './touchpoints-page';
import ConsultarAtualizacaoLinx from './consultar-atualizacao-linx';

type SubPage = null | 'clientes' | 'monitor' | 'agendar' | 'consultar' | 'adiantar' | 'zoho' | 'touchpoints';

export default function CxPage() {
  const [subPage, setSubPage] = useState<SubPage>(null);

  if (subPage === 'clientes')  return <ClientesListPage    onBack={() => setSubPage(null)} />;
  if (subPage === 'monitor')   return <MonitorAtualizacoes onBack={() => setSubPage(null)} />;
  if (subPage === 'agendar')   return <AgendarAtualizacao  onBack={() => setSubPage(null)} />;
  if (subPage === 'consultar') return <ConsultarAtualizacaoLinx onBack={() => setSubPage(null)} />;
  if (subPage === 'adiantar')  return <AdiantarAtendimentos onBack={() => setSubPage(null)} />;
  if (subPage === 'zoho')        return <ZohoDeskDashboard   onBack={() => setSubPage(null)} />;
  if (subPage === 'touchpoints') return <TouchPointsPage     onBack={() => setSubPage(null)} />;

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
      <div className="section-eyebrow mb-1">Atendimento</div>
      <div className="section-title mb-4">CX — Customer Experience</div>
      <div className="row g-3">
        <Card title="Clientes"                   desc="Consultar e visualizar dados dos clientes parceria Linx."    color="#00B0FA" icon="bi-people-fill"          onClick={() => setSubPage('clientes')} />
        <Card title="Monitor de Atualizações"    desc="Acompanhar as atualizações Linx de hoje."                   color="#1DB954" icon="bi-arrow-repeat"         onClick={() => setSubPage('monitor')}  />
        <Card title="Agendar Atualização Linx"   desc="Registrar agendamentos de atualizações Linx."               color="#7F77DD" icon="bi-calendar-plus"        onClick={() => setSubPage('agendar')}  />
        <Card title="Consultar Atualização Linx" desc="Consultar última atualização do cliente."                   color="#F9A825" icon="bi-search"               onClick={() => setSubPage('consultar')} />
        <Card title="Adiantar Atendimento Linx"  desc="Registrar atendimentos sem ticket aberto."                  color="#E74C3C" icon="bi-ticket-detailed"      onClick={() => setSubPage('adiantar')} />
        <Card title="Dashboard Zoho Desk"         desc="Informações de tickets da squad."                          color="#E44C37" icon="bi-headset"               onClick={() => setSubPage('zoho')} />
        <Card title="TouchPoints"                 desc="Controle de contatos e interações com clientes."          color="#1DB954" icon="bi-telephone-fill"        onClick={() => setSubPage('touchpoints')} />
        <div className="col-12 col-md-4 col-lg-3">
          <div style={{ background: '#F7F8FA', border: '1px dashed var(--ccm-line)', borderRadius: 6, padding: '20px 22px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120, color: 'var(--ccm-gray-medium)', fontSize: 12, letterSpacing: '.08em' }}>
            <i className="bi bi-plus-circle me-2" />Em breve
          </div>
        </div>
      </div>
    </div>
  );
}
