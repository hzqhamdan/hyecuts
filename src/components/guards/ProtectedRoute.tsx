import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNoTokenRedirect } from './useNoTokenRedirect';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const noTokenRedirect = useNoTokenRedirect(token);
  if (!token) return <Navigate to={noTokenRedirect} replace />;
  return <>{children}</>;
}
