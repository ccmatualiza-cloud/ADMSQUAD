import { useState } from 'react';
import DailyPendencias  from './daily-pendencias';
import TarefasPage      from './tarefas-page';
import MonitorAtividades       from './monitor-atividades';
import ConsultasAnalistasPage from './consultas-analistas-page';
import ApoiosHelpPage    from './apoios-help-page';
import GeradorCodigoCCM from './gerador-codigo-ccm';

type SubPage = null | 'daily' | 'tarefas' | 'atividades' | 'gerador' | 'apoios' | 'consultas';

export default function OperacoesPage() {
  const [subPage, setSubPage] = useState<SubPage>(null);

  if (subPage === 'daily')      return <DailyPendencias   onBack={() => setSubPage(null)} />;
  if (subPage === 'tarefas')    return <TarefasPage        onBack={() => setSubPage(null)} />;
  if (subPage === 'atividades') return <MonitorAtividades  onBack={() => setSubPage(null)} />;
  if (subPage === 'gerador')    return <GeradorCodigoCCM    onBack={() => setSubPage(null)} />;
  if (subPage === 'apoios')     return <ApoiosHelpPage         onBack={() => setSubPage(null)} />;
  if (subPage === 'consultas')  return <ConsultasAnalistasPage  onBack={() => setSubPage(null)} />;

  const Card = ({ title, desc, color, bg, icon, onClick, external }: { title: string; desc: string; color: string; bg: string; icon: string; onClick?: () => void; external?: string }) => (
    <div className="col-12 col-md-4 col-lg-3">
      <div onClick={external ? () => window.open(external, '_blank') : onClick}
        style={{ background: '#fff', border: '1px solid var(--ccm-line)', borderTop: `3px solid ${color}`, borderRadius: 6, padding: '20px 22px', cursor: 'pointer', transition: 'box-shadow .15s, transform .15s', boxShadow: '0 1px 4px rgba(12,25,33,.07)' }}
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
          {external ? <>Abrir <i className="bi bi-box-arrow-up-right ms-1" /></> : <>Acessar <i className="bi bi-arrow-right" /></>}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="section-eyebrow mb-1">Operações</div>
      <div className="section-title mb-4">Operações</div>
      <div className="row g-3">
        <Card title="Daily — Pendências"    desc="Registrar pendências e impedimentos da equipe."      color="#F9E000" bg="#FFF8CC" icon="bi-exclamation-triangle-fill" onClick={() => setSubPage('daily')} />
        <Card title="Consultas Analistas"   desc="Consultas e relatórios por analista."               color="#00B0FA" bg="#E8F7FF" icon="bi-person-lines-fill"         onClick={() => setSubPage('consultas')} />
        <Card title="Apoios — Help"          desc="Registrar e acompanhar apoios e solicitações de help." color="#F9A825" bg="#FFF3E0" icon="bi-life-preserver"            onClick={() => setSubPage('apoios')} />
        <Card title="Tarefas"              desc="Consultar tarefas e atualizações dos clientes."       color="#00B0FA" bg="#E8F7FF" icon="bi-list-task"                 onClick={() => setSubPage('tarefas')} />
        <Card title="Monitor de Atividades" desc="Registrar e monitorar atividades da equipe."         color="#7F77DD" bg="#F0EEFF" icon="bi-activity"                  onClick={() => setSubPage('atividades')} />
        <Card title="API — Whatsapp"       desc="Acessar o painel da API de Whatsapp CCM Cloud."      color="#25D366" bg="#E8FBF0" icon="bi-whatsapp"                   external="https://api.ccmcloud.com.br/app/login" />
        <Card title="Evolution API"         desc="Acessar o painel da Evolution API."                   color="#7F77DD" bg="#F0EEFF" icon="bi-broadcast"                 external="https://evolution-evolution-api.2jgevz.easypanel.host/manager/login" />
        <Card title="PHPMyAdmin"            desc="Acessar o gerenciador de banco de dados."             color="#E74C3C" bg="#FDE8E8" icon="bi-database-fill"              external="https://databases-phpmyadmin.2jgevz.easypanel.host/" />
        <Card title="N8N"                   desc="Acessar o N8N."                                      color="#F9A825" bg="#FFF8E1" icon="bi-diagram-3-fill"            external="https://apps-n8n.2jgevz.easypanel.host/signin?redirect=%252Fworkflow%252Fd1WIDrGFsoFflbqe" />
        <Card title="Apps Zoho"             desc="Acessar os aplicativos Zoho."                        color="#E44C37" bg="#FDE8E5" icon="bi-grid-3x3-gap-fill"          external="https://one.zoho.com/zohoone/ccmint/home#/myapps" />
        <Card title="PMP"                   desc="Acesso aos servidores de clientes."                  color="#204294" bg="#E8EDF7" icon="bi-server"                     external="https://pmp.ccm.local:7272/" />
        <Card title="Zabbix"                desc="Monitoramento de clientes."                          color="#CC0000" bg="#FDEAEA" icon="bi-activity"                   external="https://zbx.ccmcloud.com.br/index.php?request=zabbix.php%3Faction%3Dlatest.view" />
        <Card title="Grafana"               desc="Monitoramento gráfico de clientes."                  color="#F46800" bg="#FEF0E6" icon="bi-bar-chart-line-fill"        external="https://monitor.ccmtecnologia.com.br/login" />
        <Card title="Smart Time"            desc="Controle ausências, trocas de turno e plantões."      color="#00B0FA" bg="#E8F7FF" icon="bi-clock-history"              external="https://cliq.ccmtecnologia.com.br/company/690505464/bots/smarttimebot" />
        <Card title="Gerador de Código CCM"  desc="Gerar códigos CCM integrado ao sistema."             color="#204294" bg="#E8EDF7" icon="bi-qr-code"                   onClick={() => setSubPage('gerador')} />
        <div className="col-12 col-md-4 col-lg-3">
          <div style={{ background: '#F7F8FA', border: '1px dashed var(--ccm-line)', borderRadius: 6, padding: '20px 22px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120, color: 'var(--ccm-gray-medium)', fontSize: 12, letterSpacing: '.08em' }}>
            <i className="bi bi-plus-circle me-2" />Em breve
          </div>
        </div>
      </div>
    </div>
  );
}
