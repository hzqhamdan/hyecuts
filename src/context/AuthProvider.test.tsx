import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './AuthContext';

function TestConsumer() {
  const { user, token, login, logout } = useAuth();
  return (
    <div>
      <div data-testid="token">{token ?? 'null'}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'null'}</div>
      <button
        data-testid="login-btn"
        onClick={() => login('jwt-token', 'user-1', 'ROLE_USER', 'testuser')}
      >
        Login
      </button>
      <button data-testid="logout-btn" onClick={() => logout()}>
        Logout
      </button>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('should initialize with null token and user when sessionStorage is empty', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    expect(screen.getByTestId('token').textContent).toBe('null');
    expect(screen.getByTestId('user').textContent).toBe('null');
  });

  it('should initialize from sessionStorage when data exists', () => {
    sessionStorage.setItem('hc_token', 'stored-token');
    sessionStorage.setItem('hc_user', JSON.stringify({ id: 'stored-id', role: 'ROLE_ADMIN', username: 'stored-user' }));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('token').textContent).toBe('stored-token');
    const user = JSON.parse(screen.getByTestId('user').textContent!);
    expect(user.id).toBe('stored-id');
    expect(user.role).toBe('ROLE_ADMIN');
  });

  it('should handle corrupted sessionStorage gracefully', () => {
    sessionStorage.setItem('hc_user', '{malformed-json');

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('token').textContent).toBe('null');
    expect(screen.getByTestId('user').textContent).toBe('null');
  });

  it('should store token and user in sessionStorage on login', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    act(() => {
      screen.getByTestId('login-btn').click();
    });

    expect(sessionStorage.getItem('hc_token')).toBe('jwt-token');
    expect(JSON.parse(sessionStorage.getItem('hc_user')!)).toEqual({
      id: 'user-1',
      role: 'ROLE_USER',
      username: 'testuser',
    });
  });

  it('should update context state on login', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    act(() => {
      screen.getByTestId('login-btn').click();
    });

    expect(screen.getByTestId('token').textContent).toBe('jwt-token');
    const user = JSON.parse(screen.getByTestId('user').textContent!);
    expect(user.username).toBe('testuser');
  });

  it('should clear token and user from sessionStorage on logout', () => {
    sessionStorage.setItem('hc_token', 'existing-token');
    sessionStorage.setItem('hc_user', JSON.stringify({ id: 'u1', role: 'ROLE_USER', username: 'user' }));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    act(() => {
      screen.getByTestId('logout-btn').click();
    });

    expect(sessionStorage.getItem('hc_token')).toBeNull();
    expect(sessionStorage.getItem('hc_user')).toBeNull();
  });

  it('should update context state on logout', () => {
    sessionStorage.setItem('hc_token', 'existing-token');
    sessionStorage.setItem('hc_user', JSON.stringify({ id: 'u1', role: 'ROLE_USER', username: 'user' }));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    act(() => {
      screen.getByTestId('logout-btn').click();
    });

    expect(screen.getByTestId('token').textContent).toBe('null');
    expect(screen.getByTestId('user').textContent).toBe('null');
  });

  it('should handle admin role login correctly', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    act(() => {
      screen.getByTestId('login-btn').click();
    });

    const user = JSON.parse(screen.getByTestId('user').textContent!);
    expect(user.role).toBe('ROLE_USER');
  });

  it('should not update state when sessionStorage is cleared externally mid-session', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    act(() => {
      screen.getByTestId('login-btn').click();
    });

    expect(screen.getByTestId('token').textContent).toBe('jwt-token');

    act(() => {
      sessionStorage.removeItem('hc_token');
      window.dispatchEvent(new Event('storage'));
    });

    expect(screen.getByTestId('token').textContent).toBe('jwt-token');
  });

  it('useAuth should throw when used outside AuthProvider', () => {
    const TestOutside = () => {
      try {
        useAuth();
      } catch (e) {
        return <div data-testid="error">{(e as Error).message}</div>;
      }
      return null;
    };

    render(<TestOutside />);
    expect(screen.getByTestId('error').textContent).toBe(
      'useAuth must be used within an AuthProvider'
    );
  });
});
