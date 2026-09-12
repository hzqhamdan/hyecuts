package com.hyecuts.loyalty.security;

import org.springframework.beans.factory.annotation.Autowired;
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
     * Soft ceiling on tracked keys. A rate limiter that grows without bound is
     * itself a denial-of-service, so around this point the oldest windows are
     * evicted rather than failing open (which would disable enforcement at
     * exactly the moment it matters).
     *
     * <p>Soft, not hard: the size check and the insert are not performed under a
     * single lock, so concurrent writers can briefly carry the map past this
     * number. The overshoot is bounded by the number of threads in flight, which
     * is what makes the unsynchronised check acceptable — a real lock on every
     * write would cost far more than the few extra entries it would save.
     */
    static final int MAX_ENTRIES = 100_000;

    /**
     * How far below the cap one eviction pass reclaims. Evicting a single entry
     * would leave the map permanently full, so every subsequent write would pay
     * another full sweep and sort. Batching means one caller in roughly
     * {@code MAX_ENTRIES / 10} pays that cost and every other caller
     * short-circuits on the size check.
     */
    private static final double EVICTION_TARGET_RATIO = 0.9;

    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();
    private final Clock clock;
    private final int maxEntries;

    // Explicit, because a second (package-private) constructor exists below for
    // tests. With two declared constructors and neither marked, Spring cannot
    // infer which one to autowire and falls back to a no-arg constructor that
    // does not exist, failing at startup.
    @Autowired
    public InMemoryRateLimiter(Clock clock) {
        this(clock, MAX_ENTRIES);
    }

    /** Visible for testing: a small cap keeps eviction tests fast. */
    InMemoryRateLimiter(Clock clock, int maxEntries) {
        this.clock = clock;
        this.maxEntries = maxEntries;
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
        long seconds = Math.max(1L, (remainingMillis + 999L) / 1000L);
        // Clock.systemUTC() is wall-clock: a backwards NTP step can make `now`
        // precede startMillis, which would otherwise inflate remainingMillis far
        // past the window. Shared by both tryAcquire and check, since both route
        // through this method.
        long windowSeconds = window.windowMillis / 1000L;
        return Math.min(seconds, windowSeconds);
    }

    /**
     * Pruning is deferred until the map is actually full. Sweeping on every
     * write would be O(n) per request, which is a worse problem than holding a
     * few stale entries.
     */
    private void evictIfFull(long now) {
        if (windows.size() < maxEntries) {
            return;
        }
        windows.entrySet().removeIf(e -> now - e.getValue().startMillis >= e.getValue().windowMillis);

        int target = (int) (maxEntries * EVICTION_TARGET_RATIO);
        int overflow = windows.size() - target;
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
