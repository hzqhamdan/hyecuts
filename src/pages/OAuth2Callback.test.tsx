import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import OAuth2Callback from './OAuth2Callback';
import { AuthContext, type AuthContextType } from '../context/AuthContext';
import { api } from '../api/client';

vi.mock('../api/client', () => ({
  api: {
    post: vi.fn(),
  },
}));

const mockPost = vi.mocked(api.post);

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

  it('should exchange the code and call login + navigate to /lounge for ROLE_USER', async () => {
    mockPost.mockResolvedValueOnce({ token: 'oauth-jwt', userId: 'u123', role: 'ROLE_USER', username: 'johndoe' });
    const contextValue: AuthContextType = { user: null, token: null, login: mockLoginFn, logout: mockLogoutFn };

    render(<OAuth2Callback />, { wrapper: createWrapper(contextValue, ['/oauth2/callback?code=abc123']) });

    expect(mockPost).toHaveBeenCalledWith('/auth/oauth2/exchange', { body: { code: 'abc123' } });
    await waitFor(() => { expect(mockLoginFn).toHaveBeenCalledWith('oauth-jwt', 'u123', 'ROLE_USER', 'johndoe'); });
  });

  it('should navigate to /admin for ROLE_ADMIN', async () => {
    mockPost.mockResolvedValueOnce({ token: 'admin-jwt', userId: 'u1', role: 'ROLE_ADMIN', username: 'admin' });
    const contextValue: AuthContextType = { user: null, token: null, login: mockLoginFn, logout: mockLogoutFn };

    render(<OAuth2Callback />, { wrapper: createWrapper(contextValue, ['/oauth2/callback?code=abc123']) });

    await waitFor(() => { expect(mockLoginFn).toHaveBeenCalledWith('admin-jwt', 'u1', 'ROLE_ADMIN', 'admin'); });
  });

  it('should redirect to /login without calling the exchange endpoint when code is missing', () => {
    const contextValue: AuthContextType = { user: null, token: null, login: mockLoginFn, logout: mockLogoutFn };

    render(<OAuth2Callback />, { wrapper: createWrapper(contextValue, ['/oauth2/callback']) });

    expect(mockPost).not.toHaveBeenCalled();
    expect(mockLoginFn).not.toHaveBeenCalled();
  });

  it('should not call login when the exchange fails (invalid or expired code)', async () => {
    mockPost.mockRejectedValueOnce(new Error('Invalid or expired code'));
    const contextValue: AuthContextType = { user: null, token: null, login: mockLoginFn, logout: mockLogoutFn };

    render(<OAuth2Callback />, { wrapper: createWrapper(contextValue, ['/oauth2/callback?code=bad-code']) });

    await waitFor(() => { expect(mockPost).toHaveBeenCalled(); });
    expect(mockLoginFn).not.toHaveBeenCalled();
  });

  it('should call login with empty string username when the response omits it', async () => {
    mockPost.mockResolvedValueOnce({ token: 'jwt', userId: 'u1', role: 'ROLE_USER', username: '' });
    const contextValue: AuthContextType = { user: null, token: null, login: mockLoginFn, logout: mockLogoutFn };

    render(<OAuth2Callback />, { wrapper: createWrapper(contextValue, ['/oauth2/callback?code=abc123']) });

    await waitFor(() => { expect(mockLoginFn).toHaveBeenCalledWith('jwt', 'u1', 'ROLE_USER', ''); });
  });

  it('should ignore extra query params and only forward the code', async () => {
    mockPost.mockResolvedValueOnce({ token: 'jwt', userId: 'u1', role: 'ROLE_USER', username: 'test' });
    const contextValue: AuthContextType = { user: null, token: null, login: mockLoginFn, logout: mockLogoutFn };

    render(<OAuth2Callback />, {
      wrapper: createWrapper(contextValue, ['/oauth2/callback?code=abc123&state=xyz&extra=value']),
    });

    expect(mockPost).toHaveBeenCalledWith('/auth/oauth2/exchange', { body: { code: 'abc123' } });
    await waitFor(() => { expect(mockLoginFn).toHaveBeenCalledWith('jwt', 'u1', 'ROLE_USER', 'test'); });
  });

  it('should not exchange the code multiple times on re-render', async () => {
    mockPost.mockResolvedValueOnce({ token: 'jwt', userId: 'u1', role: 'ROLE_USER', username: 'test' });
    const contextValue: AuthContextType = { user: null, token: null, login: mockLoginFn, logout: mockLogoutFn };

    const { rerender } = render(<OAuth2Callback />, {
      wrapper: createWrapper(contextValue, ['/oauth2/callback?code=abc123']),
    });

    await waitFor(() => { expect(mockLoginFn).toHaveBeenCalledTimes(1); });

    rerender(<OAuth2Callback />);

    expect(mockLoginFn).toHaveBeenCalledTimes(1);
    expect(mockPost).toHaveBeenCalledTimes(1);
  });

  it('should render without crashing', async () => {
    mockPost.mockResolvedValueOnce({ token: 'jwt', userId: 'u1', role: 'ROLE_USER', username: 'test' });
    const contextValue: AuthContextType = { user: null, token: null, login: mockLoginFn, logout: mockLogoutFn };

    render(<OAuth2Callback />, { wrapper: createWrapper(contextValue, ['/oauth2/callback?code=abc123']) });

    await waitFor(() => { expect(mockLoginFn).toHaveBeenCalled(); });
  });
});
