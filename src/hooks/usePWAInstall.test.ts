import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePWAInstall } from './usePWAInstall';

describe('usePWAInstall', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initially not be installable', () => {
    const { result } = renderHook(() => usePWAInstall());
    expect(result.current.isInstallable).toBe(false);
  });

  it('should become installable when beforeinstallprompt event is fired', () => {
    const { result } = renderHook(() => usePWAInstall());

    const event = new Event('beforeinstallprompt');
    // @ts-ignore
    event.prompt = vi.fn();
    // @ts-ignore
    event.userChoice = Promise.resolve({ outcome: 'dismissed' });
    // Prevent default to simulate standard PWA behavior
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    act(() => {
      window.dispatchEvent(event);
    });

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(result.current.isInstallable).toBe(true);
  });

  it('should call prompt and update state on successful install', async () => {
    const { result } = renderHook(() => usePWAInstall());

    const promptMock = vi.fn().mockResolvedValue(undefined);
    const event = new Event('beforeinstallprompt');
    // @ts-ignore
    event.prompt = promptMock;
    // @ts-ignore
    event.userChoice = Promise.resolve({ outcome: 'accepted' });

    act(() => {
      window.dispatchEvent(event);
    });

    expect(result.current.isInstallable).toBe(true);

    await act(async () => {
      await result.current.install();
    });

    expect(promptMock).toHaveBeenCalled();
    expect(result.current.isInstallable).toBe(false);
  });

  it('should not update state if install is dismissed', async () => {
    const { result } = renderHook(() => usePWAInstall());

    const promptMock = vi.fn().mockResolvedValue(undefined);
    const event = new Event('beforeinstallprompt');
    // @ts-ignore
    event.prompt = promptMock;
    // @ts-ignore
    event.userChoice = Promise.resolve({ outcome: 'dismissed' });

    act(() => {
      window.dispatchEvent(event);
    });

    await act(async () => {
      await result.current.install();
    });

    expect(promptMock).toHaveBeenCalled();
    expect(result.current.isInstallable).toBe(true);
  });
});
