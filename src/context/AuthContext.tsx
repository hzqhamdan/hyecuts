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
    const storedToken = localStorage.getItem('hc_token');
    const storedUser = localStorage.getItem('hc_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (newToken: string, userId: string, role: string, username: string) => {
    const userData = { id: userId, role, username };
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('hc_token', newToken);
    localStorage.setItem('hc_user', JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('hc_token');
    localStorage.removeItem('hc_user');
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
