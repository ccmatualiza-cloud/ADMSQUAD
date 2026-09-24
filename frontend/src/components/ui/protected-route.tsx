import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth-store';

interface Props {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export default function ProtectedRoute({ children, requiredRoles }: Props) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const role            = useAuthStore((s) => s.user?.role ?? '');
  const { pathname }    = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // consult só pode acessar /consulta
  if (role === 'consult' && pathname !== '/consulta') {
    return <Navigate to="/consulta" replace />;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    if (!requiredRoles.includes(role)) {
      return <Navigate to={role === 'consult' ? '/consulta' : '/dashboard'} replace />;
    }
  }

  return <>{children}</>;
}
