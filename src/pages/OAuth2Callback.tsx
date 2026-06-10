import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function OAuth2Callback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const token = searchParams.get('token');
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');
    const username = searchParams.get('username');

    if (token && userId && role) {
      login(token, userId, role, username || '');
      navigate(role === 'ROLE_ADMIN' ? '/admin' : '/lounge', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [searchParams, login, navigate]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#1A1A1A] flex items-center justify-center">
      <div className="text-black dark:text-white font-serif text-xl">Signing in...</div>
    </div>
  );
}
