import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import { AuthContext, type AuthContextType } from '../../context/AuthContext';
import AdminRoute from './AdminRoute';

function createWrapper(contextValue: AuthContextType) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AuthContext.Provider value={contextValue}>
        <MemoryRouter initialEntries={['/admin-dashboard']}>
          <Routes>
            <Route path="/admin-dashboard" element={children} />
            <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
            <Route path="/lounge" element={<div data-testid="lounge-page">Lounge</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };
}

const mockLoginFn = () => {};
const mockLogoutFn = () => {};

describe('AdminRoute', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('should render children when user has ROLE_ADMIN', () => {
    const contextValue: AuthContextType = {
      user: { id: '1', role: 'ROLE_ADMIN', username: 'admin' },
      token: 'admin-token',
      login: mockLoginFn,
      logout: mockLogoutFn,
    };

    render(
      <AdminRoute>
        <div data-testid="admin-content">Admin Content</div>
      </AdminRoute>,
      { wrapper: createWrapper(contextValue) }
    );

    expect(screen.getByTestId('admin-content')).toBeDefined();
    expect(screen.queryByTestId('login-page')).toBeNull();
    expect(screen.queryByTestId('lounge-page')).toBeNull();
  });

  it('should redirect to /login when token is null even with role', () => {
    const contextValue: AuthContextType = {
      user: { id: '1', role: 'ROLE_ADMIN', username: 'admin' },
      token: null,
      login: mockLoginFn,
      logout: mockLogoutFn,
    };

    render(
      <AdminRoute>
        <div data-testid="admin-content">Admin Content</div>
      </AdminRoute>,
      { wrapper: createWrapper(contextValue) }
    );

    expect(screen.getByTestId('login-page')).toBeDefined();
    expect(screen.queryByTestId('admin-content')).toBeNull();
  });

  it('should redirect to /lounge when user has ROLE_USER', () => {
    const contextValue: AuthContextType = {
      user: { id: '2', role: 'ROLE_USER', username: 'regular' },
      token: 'user-token',
      login: mockLoginFn,
      logout: mockLogoutFn,
    };

    render(
      <AdminRoute>
        <div data-testid="admin-content">Admin Content</div>
      </AdminRoute>,
      { wrapper: createWrapper(contextValue) }
    );

    expect(screen.getByTestId('lounge-page')).toBeDefined();
    expect(screen.queryByTestId('admin-content')).toBeNull();
  });

  it('should redirect to /login when both token and user are null', () => {
    const contextValue: AuthContextType = {
      user: null,
      token: null,
      login: mockLoginFn,
      logout: mockLogoutFn,
    };

    render(
      <AdminRoute>
        <div data-testid="admin-content">Admin Content</div>
      </AdminRoute>,
      { wrapper: createWrapper(contextValue) }
    );

    expect(screen.getByTestId('login-page')).toBeDefined();
  });

  it('should handle token present but user null (edge case)', () => {
    const contextValue: AuthContextType = {
      user: null,
      token: 'some-token',
      login: mockLoginFn,
      logout: mockLogoutFn,
    };

    render(
      <AdminRoute>
        <div data-testid="admin-content">Admin Content</div>
      </AdminRoute>,
      { wrapper: createWrapper(contextValue) }
    );

    expect(screen.getByTestId('lounge-page')).toBeDefined();
  });

  it('should redirect to /lounge when role is undefined', () => {
    const contextValue: AuthContextType = {
      user: { id: '3', role: '', username: 'norole' },
      token: 'token',
      login: mockLoginFn,
      logout: mockLogoutFn,
    };

    render(
      <AdminRoute>
        <div data-testid="admin-content">Admin Content</div>
      </AdminRoute>,
      { wrapper: createWrapper(contextValue) }
    );

    expect(screen.getByTestId('lounge-page')).toBeDefined();
  });
});
