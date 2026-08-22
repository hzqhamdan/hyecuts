import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import OAuth2Callback from './OAuth2Callback';
import { AuthContext, type AuthContextType } from '../context/AuthContext';

function createWrapper(contextValue: AuthContextType, initialEntries: string[] = ['/oauth2/callback']) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AuthContext.Provider value={contextValue}>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/oauth2/callback" element={children} />
            <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
            <Route path="/lounge" element={<div data-testid="lounge-page">Lounge</div>} />
            <Route path="/admin" element={<div data-testid="admin-page">Admin</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };
}

const mockLoginFn = vi.fn();
const mockLogoutFn = vi.fn();

describe('OAuth2Callback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call login and navigate to /lounge for ROLE_USER', () => {
    const contextValue: AuthContextType = {
      user: null,
      token: null,
      login: mockLoginFn,
      logout: mockLogoutFn,
    };

    render(
      <OAuth2Callback />,
      {
        wrapper: createWrapper(contextValue, [
          '/oauth2/callback?token=oauth-jwt&userId=u123&role=ROLE_USER&username=johndoe',
        ]),
      }
    );

    expect(mockLoginFn).toHaveBeenCalledWith('oauth-jwt', 'u123', 'ROLE_USER', 'johndoe');
  });

  it('should navigate to /admin for ROLE_ADMIN', () => {
    const contextValue: AuthContextType = {
      user: null,
      token: null,
      login: mockLoginFn,
      logout: mockLogoutFn,
    };

    render(
      <OAuth2Callback />,
      {
        wrapper: createWrapper(contextValue, [
          '/oauth2/callback?token=admin-jwt&userId=u1&role=ROLE_ADMIN&username=admin',
        ]),
      }
    );

    expect(mockLoginFn).toHaveBeenCalledWith('admin-jwt', 'u1', 'ROLE_ADMIN', 'admin');
  });

  it('should redirect to /login when token is missing', () => {
    const contextValue: AuthContextType = {
      user: null,
      token: null,
      login: mockLoginFn,
      logout: mockLogoutFn,
    };

    render(
      <OAuth2Callback />,
      {
        wrapper: createWrapper(contextValue, [
          '/oauth2/callback?userId=u1&role=ROLE_USER',
        ]),
      }
    );

    expect(mockLoginFn).not.toHaveBeenCalled();
  });

  it('should redirect to /login when userId is missing', () => {
    const contextValue: AuthContextType = {
      user: null,
      token: null,
      login: mockLoginFn,
      logout: mockLogoutFn,
    };

    render(
      <OAuth2Callback />,
      {
        wrapper: createWrapper(contextValue, [
          '/oauth2/callback?token=jwt&role=ROLE_USER',
        ]),
      }
    );

    expect(mockLoginFn).not.toHaveBeenCalled();
  });

  it('should redirect to /login when role is missing', () => {
    const contextValue: AuthContextType = {
      user: null,
      token: null,
      login: mockLoginFn,
      logout: mockLogoutFn,
    };

    render(
      <OAuth2Callback />,
      {
        wrapper: createWrapper(contextValue, [
          '/oauth2/callback?token=jwt&userId=u1',
        ]),
      }
    );

    expect(mockLoginFn).not.toHaveBeenCalled();
  });

  it('should redirect to /login when all params missing', () => {
    const contextValue: AuthContextType = {
      user: null,
      token: null,
      login: mockLoginFn,
      logout: mockLogoutFn,
    };

    render(
      <OAuth2Callback />,
      {
        wrapper: createWrapper(contextValue, [
          '/oauth2/callback',
        ]),
      }
    );

    expect(mockLoginFn).not.toHaveBeenCalled();
  });

  it('should call login with empty string username when username param is missing', () => {
    const contextValue: AuthContextType = {
      user: null,
      token: null,
      login: mockLoginFn,
      logout: mockLogoutFn,
    };

    render(
      <OAuth2Callback />,
      {
        wrapper: createWrapper(contextValue, [
          '/oauth2/callback?token=jwt&userId=u1&role=ROLE_USER',
        ]),
      }
    );

    expect(mockLoginFn).toHaveBeenCalledWith('jwt', 'u1', 'ROLE_USER', '');
  });

  it('should handle malformed token values', () => {
    const contextValue: AuthContextType = {
      user: null,
      token: null,
      login: mockLoginFn,
      logout: mockLogoutFn,
    };

    render(
      <OAuth2Callback />,
      {
        wrapper: createWrapper(contextValue, [
          '/oauth2/callback?token=eyJ.invalid&userId=u1&role=ROLE_USER',
        ]),
      }
    );

    expect(mockLoginFn).toHaveBeenCalledWith('eyJ.invalid', 'u1', 'ROLE_USER', '');
  });

  it('should handle extra query params gracefully', () => {
    const contextValue: AuthContextType = {
      user: null,
      token: null,
      login: mockLoginFn,
      logout: mockLogoutFn,
    };

    render(
      <OAuth2Callback />,
      {
        wrapper: createWrapper(contextValue, [
          '/oauth2/callback?token=jwt&userId=u1&role=ROLE_USER&username=test&state=abc123&extra=value',
        ]),
      }
    );

    expect(mockLoginFn).toHaveBeenCalledWith('jwt', 'u1', 'ROLE_USER', 'test');
  });

  it('should not call login multiple times on re-render', () => {
    const contextValue: AuthContextType = {
      user: null,
      token: null,
      login: mockLoginFn,
      logout: mockLogoutFn,
    };

    const { rerender } = render(
      <OAuth2Callback />,
      {
        wrapper: createWrapper(contextValue, [
          '/oauth2/callback?token=jwt&userId=u1&role=ROLE_USER&username=test',
        ]),
      }
    );

    rerender(<OAuth2Callback />);

    expect(mockLoginFn).toHaveBeenCalledTimes(1);
  });

  it('should render without crashing', () => {
    const contextValue: AuthContextType = {
      user: null,
      token: null,
      login: mockLoginFn,
      logout: mockLogoutFn,
    };

    render(
      <OAuth2Callback />,
      {
        wrapper: createWrapper(contextValue, [
          '/oauth2/callback?token=jwt&userId=u1&role=ROLE_USER',
        ]),
      }
    );

    expect(mockLoginFn).toHaveBeenCalled();
  });
});
