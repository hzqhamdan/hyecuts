package com.hyecuts.loyalty.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.*;

class InMemoryRateLimiterTest {

    private static final RateLimitPolicy POLICY =
            new RateLimitPolicy("test", 3, Duration.ofMinutes(15));

    private MutableClock clock;
    private InMemoryRateLimiter limiter;

    /** Lets a test move time forward without sleeping. */
    private static final class MutableClock extends Clock {
        private Instant now = Instant.parse("2026-09-12T10:00:00Z");
        @Override public ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(ZoneId zone) { return this; }
        @Override public Instant instant() { return now; }
        void advance(Duration d) { now = now.plus(d); }
    }

    @BeforeEach
    void setUp() {
        clock = new MutableClock();
        limiter = new InMemoryRateLimiter(clock);
    }

    @Test
    void allowsUpToTheLimitThenDenies() {
        assertTrue(limiter.tryAcquire("a", POLICY).allowed());
        assertTrue(limiter.tryAcquire("a", POLICY).allowed());
        assertTrue(limiter.tryAcquire("a", POLICY).allowed());
        assertFalse(limiter.tryAcquire("a", POLICY).allowed(), "4th call exceeds max of 3");
    }

    @Test
    void deniedDecisionCarriesRetryAfter() {
        for (int i = 0; i < 3; i++) limiter.tryAcquire("a", POLICY);

        RateLimiter.Decision denied = limiter.tryAcquire("a", POLICY);

        assertFalse(denied.allowed());
        assertTrue(denied.retryAfterSeconds() > 0 && denied.retryAfterSeconds() <= 900,
                "expected a retry-after inside the 15 minute window, got " + denied.retryAfterSeconds());
    }

    @Test
    void budgetResetsAfterTheWindowElapses() {
        for (int i = 0; i < 3; i++) limiter.tryAcquire("a", POLICY);
        assertFalse(limiter.tryAcquire("a", POLICY).allowed());

        clock.advance(Duration.ofMinutes(15));

        assertTrue(limiter.tryAcquire("a", POLICY).allowed(), "window should have rolled over");
    }

    @Test
    void budgetStillExhaustedJustBeforeWindowEnds() {
        for (int i = 0; i < 3; i++) limiter.tryAcquire("a", POLICY);

        clock.advance(Duration.ofMinutes(14).plusSeconds(59));

        assertFalse(limiter.tryAcquire("a", POLICY).allowed());
    }

    @Test
    void keysAreIndependent() {
        for (int i = 0; i < 3; i++) limiter.tryAcquire("a", POLICY);

        assertFalse(limiter.tryAcquire("a", POLICY).allowed());
        assertTrue(limiter.tryAcquire("b", POLICY).allowed(), "a separate key has its own budget");
    }

    @Test
    void policiesAreIndependentForTheSameKey() {
        RateLimitPolicy other = new RateLimitPolicy("other", 3, Duration.ofMinutes(15));
        for (int i = 0; i < 3; i++) limiter.tryAcquire("a", POLICY);

        assertFalse(limiter.tryAcquire("a", POLICY).allowed());
        assertTrue(limiter.tryAcquire("a", other).allowed(),
                "same raw key under a different policy must not share a counter");
    }

    @Test
    void checkDoesNotConsumeBudget() {
        for (int i = 0; i < 10; i++) {
            assertTrue(limiter.check("a", POLICY).allowed(), "check must never consume");
        }
        assertTrue(limiter.tryAcquire("a", POLICY).allowed());
    }

    @Test
    void checkReportsExhaustionOnceBudgetIsGone() {
        for (int i = 0; i < 3; i++) limiter.tryAcquire("a", POLICY);

        RateLimiter.Decision decision = limiter.check("a", POLICY);

        assertFalse(decision.allowed());
        assertTrue(decision.retryAfterSeconds() > 0);
    }

    @Test
    void deniedCallsDoNotExtendTheWindow() {
        // A fixed window must expire at a fixed time. If extra denied calls
        // pushed the window start forward, an attacker hammering the endpoint
        // would keep a real user locked out indefinitely.
        for (int i = 0; i < 3; i++) limiter.tryAcquire("a", POLICY);

        clock.advance(Duration.ofMinutes(10));
        for (int i = 0; i < 50; i++) limiter.tryAcquire("a", POLICY);

        clock.advance(Duration.ofMinutes(5));
        assertTrue(limiter.tryAcquire("a", POLICY).allowed(),
                "window should still expire 15 minutes after the first request");
    }

    @Test
    void evictsWhenEntryCapIsReached() {
        RateLimitPolicy shortLived = new RateLimitPolicy("short", 1, Duration.ofSeconds(1));
        for (int i = 0; i < InMemoryRateLimiter.MAX_ENTRIES + 100; i++) {
            limiter.tryAcquire("key-" + i, shortLived);
        }
        assertTrue(limiter.size() <= InMemoryRateLimiter.MAX_ENTRIES,
                "a limiter that grows without bound becomes its own DoS; size was " + limiter.size());
    }
}
