import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: { id: string; username: string; role: string } | null;
  token: string | null;
  login: (token: string, userId: string, role: string, username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; username: string; role: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = sessionStorage.getItem('hc_token');
    const storedUser = sessionStorage.getItem('hc_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (newToken: string, userId: string, role: string, username: string) => {
    const userData = { id: userId, role, username };
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
