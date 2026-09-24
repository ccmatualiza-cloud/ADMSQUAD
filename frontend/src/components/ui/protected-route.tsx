import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth-store';

interface Props {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export default function ProtectedRoute({ children, requiredRoles }: Props) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const role = useAuthStore((s) => s.user?.role ?? '');

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // consult users go directly to /consulta
  if (role === 'consult' && !requiredRoles) {
    return <Navigate to="/consulta" replace />;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    if (!requiredRoles.includes(role)) {
      // consult users redirect to /consulta instead of /dashboard
      return <Navigate to={role === 'consult' ? '/consulta' : '/dashboard'} replace />;
    }
  }

  return <>{children}</>;
}
