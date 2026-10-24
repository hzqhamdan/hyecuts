import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

// Only the theme toggle is under test; stub the lazily loaded landing page
// so rendering "/" doesn't pull in its data fetching and animations.
vi.mock('./LandingPage', () => ({ default: () => <div>landing</div> }));

const THEME_STORAGE_KEY = 'hyecuts-theme-v2';

// Node 22+ ships its own global localStorage that shadows jsdom's and is
// undefined unless node runs with --localstorage-file, so give the test an
// in-memory one.
function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() { return store.size; },
    clear: () => { store.clear(); },
    getItem: (key) => store.get(key) ?? null,
    key: (index) => [...store.keys()][index] ?? null,
    removeItem: (key) => { store.delete(key); },
    setItem: (key, value) => { store.set(key, value); },
  };
}

describe('App theme toggle', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: createMemoryStorage(), configurable: true });
    document.documentElement.classList.remove('dark');
  });

  it('starts in light mode when nothing is saved', () => {
    render(<App />);

    expect(document.documentElement).not.toHaveClass('dark');
    expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeInTheDocument();
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('restores a saved dark theme on load', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    render(<App />);

    expect(document.documentElement).toHaveClass('dark');
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument();
  });

  it('treats an unrecognised saved value as light', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'purple');

    render(<App />);

    expect(document.documentElement).not.toHaveClass('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('applies and persists the theme each time it is toggled', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }));
    expect(document.documentElement).toHaveClass('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    await user.click(screen.getByRole('button', { name: 'Switch to light mode' }));
    expect(document.documentElement).not.toHaveClass('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });
});
