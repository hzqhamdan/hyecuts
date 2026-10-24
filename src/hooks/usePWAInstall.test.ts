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

    const event = Object.assign(new Event('beforeinstallprompt'), {
      prompt: vi.fn(),
      userChoice: Promise.resolve({ outcome: 'dismissed' }),
    });
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
    const event = Object.assign(new Event('beforeinstallprompt'), {
      prompt: promptMock,
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    });

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
    const event = Object.assign(new Event('beforeinstallprompt'), {
      prompt: promptMock,
      userChoice: Promise.resolve({ outcome: 'dismissed' }),
    });

    act(() => {
      window.dispatchEvent(event);
    });

    await act(async () => {
      await result.current.install();
    });

    expect(promptMock).toHaveBeenCalled();
    expect(result.current.isInstallable).toBe(true);
  });

  it('should do nothing when install is called before any prompt event', async () => {
    const { result } = renderHook(() => usePWAInstall());

    await act(async () => {
      await result.current.install();
    });

    expect(result.current.isInstallable).toBe(false);
  });

  it('should remove its beforeinstallprompt listener on unmount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => usePWAInstall());
    const handler = addSpy.mock.calls.find(([type]) => type === 'beforeinstallprompt')?.[1];
    expect(handler).toBeDefined();

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('beforeinstallprompt', handler);
    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('should ignore prompt events fired after unmount', () => {
    const { result, unmount } = renderHook(() => usePWAInstall());
    unmount();

    const event = new Event('beforeinstallprompt');
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    window.dispatchEvent(event);

    expect(preventDefaultSpy).not.toHaveBeenCalled();
    expect(result.current.isInstallable).toBe(false);
  });
});
