import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNoTokenRedirect } from './useNoTokenRedirect';

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  const noTokenRedirect = useNoTokenRedirect(token);
  if (!token) return <Navigate to={noTokenRedirect} replace />;
  if (user?.role !== 'ROLE_ADMIN') return <Navigate to="/lounge" replace />;
  return <>{children}</>;
}
