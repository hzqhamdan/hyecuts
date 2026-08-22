import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import { AuthContext, type AuthContextType } from '../../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

function createWrapper(contextValue: AuthContextType) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AuthContext.Provider value={contextValue}>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/protected" element={children} />
            <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };
}

const mockLoginFn = () => {};
const mockLogoutFn = () => {};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('should render children when token is present', () => {
    const contextValue: AuthContextType = {
      user: { id: '1', role: 'ROLE_USER', username: 'testuser' },
      token: 'valid-token',
      login: mockLoginFn,
      logout: mockLogoutFn,
    };

    render(
      <ProtectedRoute>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>,
      { wrapper: createWrapper(contextValue) }
    );

    expect(screen.getByTestId('protected-content')).toBeDefined();
    expect(screen.queryByTestId('login-page')).toBeNull();
  });

  it('should redirect to /login when token is null', () => {
    const contextValue: AuthContextType = {
      user: null,
      token: null,
      login: mockLoginFn,
      logout: mockLogoutFn,
    };

    render(
      <ProtectedRoute>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>,
      { wrapper: createWrapper(contextValue) }
    );

    expect(screen.getByTestId('login-page')).toBeDefined();
    expect(screen.queryByTestId('protected-content')).toBeNull();
  });

  it('should redirect to /login when token is empty string', () => {
    const contextValue: AuthContextType = {
      user: null,
      token: '',
      login: mockLoginFn,
      logout: mockLogoutFn,
    };

    render(
      <ProtectedRoute>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>,
      { wrapper: createWrapper(contextValue) }
    );

    expect(screen.getByTestId('login-page')).toBeDefined();
  });

  it('should handle user being null but token present', () => {
    const contextValue: AuthContextType = {
      user: null,
      token: 'some-token',
      login: mockLoginFn,
      logout: mockLogoutFn,
    };

    render(
      <ProtectedRoute>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>,
      { wrapper: createWrapper(contextValue) }
    );

    expect(screen.getByTestId('protected-content')).toBeDefined();
  });
});
