package com.hyecuts.loyalty.security;

import org.springframework.stereotype.Component;

import java.time.Clock;
import java.util.Comparator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Fixed-window counters held in memory.
 *
 * <p>Same shape, and the same caveat, as {@link TokenRevocationService}: fine
 * for a single instance. With multiple replicas each one keeps its own counts,
 * so the effective limit becomes N x the configured value.
 *
 * <p>A fixed window permits a burst of up to 2x the limit across a window
 * boundary. That is an accepted trade-off — the job here is stopping thousands
 * of attempts, not metering precisely.
 */
@Component
public class InMemoryRateLimiter implements RateLimiter {

    /**
     * Hard ceiling on tracked keys. A rate limiter that grows without bound is
     * itself a denial-of-service, so past this point the oldest windows are
     * evicted rather than failing open (which would disable enforcement at
     * exactly the moment it matters).
     */
    static final int MAX_ENTRIES = 100_000;

    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();
    private final Clock clock;

    public InMemoryRateLimiter(Clock clock) {
        this.clock = clock;
    }

    @Override
    public Decision tryAcquire(String key, RateLimitPolicy policy) {
        long now = clock.millis();
        long windowMillis = policy.window().toMillis();
        evictIfFull(now);

        Window updated = windows.compute(storageKey(key, policy), (k, existing) -> {
            if (existing == null || now - existing.startMillis >= windowMillis) {
                return new Window(now, windowMillis, 1);
            }
            // Keep the original start: the window must expire at a fixed time,
            // otherwise continued hammering would extend the block forever.
            return new Window(existing.startMillis, windowMillis, existing.count + 1);
        });

        return updated.count > policy.max()
                ? new Decision(false, retryAfterSeconds(updated, now))
                : new Decision(true, 0L);
    }

    @Override
    public Decision check(String key, RateLimitPolicy policy) {
        long now = clock.millis();
        Window existing = windows.get(storageKey(key, policy));

        if (existing == null || now - existing.startMillis >= existing.windowMillis) {
            return new Decision(true, 0L);
        }
        return existing.count >= policy.max()
                ? new Decision(false, retryAfterSeconds(existing, now))
                : new Decision(true, 0L);
    }

    /** Visible for testing. */
    int size() {
        return windows.size();
    }

    private static String storageKey(String key, RateLimitPolicy policy) {
        return policy.name() + '|' + key;
    }

    private static long retryAfterSeconds(Window window, long now) {
        long remainingMillis = (window.startMillis + window.windowMillis) - now;
        // Round up, and never report 0 — a client told to retry after 0 retries immediately.
        return Math.max(1L, (remainingMillis + 999L) / 1000L);
    }

    /**
     * Pruning is deferred until the map is actually full. Sweeping on every
     * write would be O(n) per request, which is a worse problem than holding a
     * few stale entries.
     */
    private void evictIfFull(long now) {
        if (windows.size() < MAX_ENTRIES) {
            return;
        }
        windows.entrySet().removeIf(e -> now - e.getValue().startMillis >= e.getValue().windowMillis);

        int overflow = windows.size() - MAX_ENTRIES + 1;
        if (overflow > 0) {
            windows.entrySet().stream()
                    .sorted(Comparator.comparingLong(e -> e.getValue().startMillis))
                    .limit(overflow)
                    .map(Map.Entry::getKey)
                    .toList()
                    .forEach(windows::remove);
        }
    }

    /** Immutable so it can be swapped atomically inside {@code compute}. */
    private record Window(long startMillis, long windowMillis, int count) {}
}
