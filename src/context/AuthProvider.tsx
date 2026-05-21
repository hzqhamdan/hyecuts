import React, { useState } from 'react';
import { AuthContext, type User } from './AuthContext';

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
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('hc_token');
    sessionStorage.removeItem('hc_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
