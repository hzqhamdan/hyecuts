import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

interface OAuth2ExchangeResponse {
  token: string;
  userId: string;
  role: string;
  username: string;
}

export default function OAuth2Callback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    // The redirect only ever carries a short-lived, single-use code — never
    // the token itself (see OAuth2CodeExchangeService on the backend for why).
    // It's exchanged here over a POST body instead of sitting in the URL.
    const code = searchParams.get('code');

    if (!code) {
      void navigate('/login', { replace: true });
      return;
    }

    api.post<OAuth2ExchangeResponse>('/auth/oauth2/exchange', { body: { code } })
      .then((data) => {
        login(data.token, data.userId, data.role, data.username || '');
        void navigate(data.role === 'ROLE_ADMIN' ? '/admin' : '/lounge', { replace: true });
      })
      .catch(() => {
        void navigate('/login', { replace: true });
      });
  }, [searchParams, login, navigate]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#1A1A1A] flex items-center justify-center">
      <div className="text-black dark:text-white font-serif text-xl">Signing in...</div>
    </div>
  );
}
