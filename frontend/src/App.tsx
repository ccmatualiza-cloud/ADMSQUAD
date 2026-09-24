import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage         from './pages/login/login-page';
import DashboardPage     from './pages/dashboard/dashboard-page';
import CxPage            from './pages/cx/cx-page';
import PmoPage           from './pages/pmo/pmo-page';
import GestaoPage        from './pages/gestao/gestao-page';
import ConfiguracoesPage from './pages/configuracoes/configuracoes-page';
import OperacoesPage     from './pages/operacoes/operacoes-page';
import ConsultaPage      from './pages/consulta/consulta-page';
import AppLayout         from './components/layout/app-layout';
import ProtectedRoute    from './components/ui/protected-route';
import { useAuthStore }  from './store/auth-store';

const ALL     = ['admin', 'gestor', 'operador_cx', 'operador_pmo', 'trcx', 'prcx', 'user', 'operador_cxpmo', 'consult'];
const CX      = ['admin', 'gestor', 'operador_cx', 'trcx', 'operador_cxpmo'];
const PMO     = ['admin', 'gestor', 'operador_pmo', 'prcx', 'operador_cxpmo'];
const OPS     = ['admin', 'gestor', 'operador_cx', 'operador_pmo', 'trcx', 'prcx', 'operador_cxpmo'];
const GEST    = ['admin', 'gestor'];
const ADM     = ['admin'];
const CONSULT = ['admin', 'gestor', 'operador_cx', 'operador_pmo', 'trcx', 'prcx', 'user', 'operador_cxpmo', 'consult'];

function IndexRedirect() {
  const role = useAuthStore(s => s.user?.role ?? '');
  return <Navigate to={role === 'consult' ? '/consulta' : '/dashboard'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<IndexRedirect />} />
        <Route path="dashboard"     element={<ProtectedRoute requiredRoles={ALL}>     <DashboardPage />     </ProtectedRoute>} />
        <Route path="cx"            element={<ProtectedRoute requiredRoles={CX}>      <CxPage />            </ProtectedRoute>} />
        <Route path="pmo"           element={<ProtectedRoute requiredRoles={PMO}>     <PmoPage />           </ProtectedRoute>} />
        <Route path="operacoes"     element={<ProtectedRoute requiredRoles={OPS}>     <OperacoesPage />     </ProtectedRoute>} />
        <Route path="gestao"        element={<ProtectedRoute requiredRoles={GEST}>    <GestaoPage />        </ProtectedRoute>} />
        <Route path="consulta"      element={<ProtectedRoute requiredRoles={CONSULT}> <ConsultaPage />      </ProtectedRoute>} />
        <Route path="configuracoes" element={<ProtectedRoute requiredRoles={ADM}>     <ConfiguracoesPage /> </ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
