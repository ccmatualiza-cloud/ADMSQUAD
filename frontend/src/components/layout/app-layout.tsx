import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './sidebar';

const PAGE_TITLES: Record<string, { eyebrow: string; title: string }> = {
  '/dashboard':      { eyebrow: 'Visão Geral',   title: 'ADMSQUAD - WARRIORS'               },
  '/cx':             { eyebrow: 'Atendimento',    title: 'CX - Cust. Experience' },
  '/pmo':            { eyebrow: 'Projetos',       title: 'PMO - Implantação'       },
  '/operacoes':      { eyebrow: 'Operações',      title: 'Operações'               },
  '/gestao':         { eyebrow: 'Administração',  title: 'Gestão'                  },
  '/consulta':       { eyebrow: 'Consulta',       title: 'Consulta'                },
  '/configuracoes':  { eyebrow: 'Sistema',        title: 'Configurações'           },
};

export default function AppLayout() {
  const { pathname } = useLocation();
  const meta = PAGE_TITLES[pathname] ?? { eyebrow: 'CCM', title: 'Sistema' };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <header className="topbar">
          <div>
            <div className="topbar-eyebrow">{meta.eyebrow}</div>
            <div className="topbar-title">{meta.title}</div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ccm-gray-dark)' }}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </header>
        <main className="page-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
