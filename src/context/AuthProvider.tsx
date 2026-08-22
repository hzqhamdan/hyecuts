import React, { useState } from 'react';
import { AuthContext, type User } from './AuthContext';
import { api } from '../api/client';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = sessionStorage.getItem('hc_user');
      return storedUser ? (JSON.parse(storedUser) as User) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('hc_token'));

  const login = (newToken: string, userId: string, role: string, username: string) => {
    const userData: User = { id: userId, role, username };
    setToken(newToken);
    setUser(userData);
    sessionStorage.setItem('hc_token', newToken);
    sessionStorage.setItem('hc_user', JSON.stringify(userData));
  };

  const logout = () => {
    const currentToken = token;
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('hc_token');
    sessionStorage.removeItem('hc_user');

    if (currentToken) {
      // Best-effort: revoke the token server-side so a copied/stolen token
      // can't keep being used after this. Never block the local logout on it.
      api.post('/auth/logout', { token: currentToken }).catch(() => { /* local logout already happened */ });
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
