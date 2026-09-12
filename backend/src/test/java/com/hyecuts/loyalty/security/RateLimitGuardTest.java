package com.hyecuts.loyalty.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class RateLimitGuardTest {

    private RateLimitGuard guard;

    @BeforeEach
    void setUp() {
        Clock fixed = Clock.fixed(Instant.parse("2026-09-12T10:00:00Z"), ZoneOffset.UTC);
        RateLimitProperties props = new RateLimitProperties(
                new RateLimitProperties.Limit(3, Duration.ofMinutes(15)),   // login per account
                new RateLimitProperties.Limit(5, Duration.ofMinutes(15)),   // login per IP
                new RateLimitProperties.Limit(2, Duration.ofHours(1)),      // register per IP
                new RateLimitProperties.Limit(2, Duration.ofHours(1)));     // guest booking per IP
        guard = new RateLimitGuard(new InMemoryRateLimiter(fixed), props);
    }

    @Test
    void checkLoginConsumesNothing() {
        for (int i = 0; i < 50; i++) {
            assertDoesNotThrow(() -> guard.checkLogin("1.1.1.1", "a@b.com"),
                    "a successful login must never cost budget");
        }
    }

    @Test
    void repeatedFailuresExhaustTheAccountBudget() {
        for (int i = 0; i < 3; i++) guard.recordLoginFailure("1.1.1.1", "a@b.com");

        assertThrows(RateLimitExceededException.class,
                () -> guard.checkLogin("1.1.1.1", "a@b.com"));
    }

    @Test
    void accountBudgetFollowsTheAccountAcrossDifferentIps() {
        // Credential stuffing spreads across IPs; the account key is what catches it.
        guard.recordLoginFailure("1.1.1.1", "a@b.com");
        guard.recordLoginFailure("2.2.2.2", "a@b.com");
        guard.recordLoginFailure("3.3.3.3", "a@b.com");

        assertThrows(RateLimitExceededException.class,
                () -> guard.checkLogin("4.4.4.4", "a@b.com"));
    }

    @Test
    void accountKeyIsCaseAndWhitespaceInsensitive() {
        guard.recordLoginFailure("1.1.1.1", "a@b.com");
        guard.recordLoginFailure("1.1.1.1", "A@B.COM");
        guard.recordLoginFailure("1.1.1.1", "  a@b.com  ");

        assertThrows(RateLimitExceededException.class,
                () -> guard.checkLogin("1.1.1.1", "a@b.com"),
                "casing must not create a fresh budget");
    }

    @Test
    void oneAccountBeingThrottledDoesNotAffectAnother() {
        for (int i = 0; i < 3; i++) guard.recordLoginFailure("1.1.1.1", "victim@b.com");

        assertDoesNotThrow(() -> guard.checkLogin("1.1.1.1", "someone-else@b.com"));
    }

    @Test
    void failuresAlsoChargeTheIpBudget() {
        // Password spraying hits many accounts once each, so no account budget
        // ever trips. The IP budget (5 here) is the control that catches it.
        guard.recordLoginFailure("9.9.9.9", "one@b.com");
        guard.recordLoginFailure("9.9.9.9", "two@b.com");
        guard.recordLoginFailure("9.9.9.9", "three@b.com");
        guard.recordLoginFailure("9.9.9.9", "four@b.com");
        guard.recordLoginFailure("9.9.9.9", "five@b.com");

        assertThrows(RateLimitExceededException.class,
                () -> guard.checkLogin("9.9.9.9", "six@b.com"),
                "five single failures across five accounts must exhaust the IP budget");
    }

    @Test
    void anotherIpIsUnaffectedByAThrottledOne() {
        for (int i = 0; i < 5; i++) guard.recordLoginFailure("9.9.9.9", "acct" + i + "@b.com");

        assertDoesNotThrow(() -> guard.checkLogin("8.8.8.8", "fresh@b.com"));
    }

    @Test
    void registrationBudgetIsConsumedPerCall() {
        assertDoesNotThrow(() -> guard.checkAndConsumeRegistration("1.1.1.1"));
        assertDoesNotThrow(() -> guard.checkAndConsumeRegistration("1.1.1.1"));

        assertThrows(RateLimitExceededException.class,
                () -> guard.checkAndConsumeRegistration("1.1.1.1"));
    }

    @Test
    void guestBookingBudgetIsSeparateFromRegistration() {
        guard.checkAndConsumeRegistration("1.1.1.1");
        guard.checkAndConsumeRegistration("1.1.1.1");

        assertDoesNotThrow(() -> guard.checkAndConsumeGuestBooking("1.1.1.1"),
                "registration and booking must not share a counter");
    }

    @Test
    void thrownExceptionCarriesRetryAfter() {
        guard.checkAndConsumeRegistration("1.1.1.1");
        guard.checkAndConsumeRegistration("1.1.1.1");

        RateLimitExceededException ex = assertThrows(RateLimitExceededException.class,
                () -> guard.checkAndConsumeRegistration("1.1.1.1"));

        assertTrue(ex.getRetryAfterSeconds() > 0);
    }

    @Test
    void nullIdentifierDoesNotBlowUp() {
        assertDoesNotThrow(() -> guard.checkLogin("1.1.1.1", null));
        assertDoesNotThrow(() -> guard.recordLoginFailure("1.1.1.1", null));
    }

    @Test
    void oversizedIdentifierIsNeverRetainedAsAKey() {
        // The limiter keeps keys in a map, and the entry cap counts entries, not
        // bytes. A handful of multi-megabyte identifiers would therefore sit in
        // memory indefinitely without ever approaching the cap.
        CapturingLimiter capturing = new CapturingLimiter();
        RateLimitGuard g = new RateLimitGuard(capturing, defaultProps());

        String huge = "x".repeat(10_000_000) + "@b.com";
        g.checkLogin("1.1.1.1", huge);
        g.recordLoginFailure("1.1.1.1", huge);

        assertFalse(capturing.keys.isEmpty());
        for (String key : capturing.keys) {
            assertTrue(key.length() <= 256,
                    "an attacker-controlled key must be truncated before storage, was " + key.length());
        }
    }

    @Test
    void truncationStillNormalisesCaseAndWhitespace() {
        CapturingLimiter capturing = new CapturingLimiter();
        RateLimitGuard g = new RateLimitGuard(capturing, defaultProps());

        g.recordLoginFailure("1.1.1.1", "  A@B.COM  ");

        assertEquals("a@b.com", capturing.keys.get(0),
                "truncation must happen after trimming and lowercasing, not instead of it");
    }

    @Test
    void ordinaryIdentifiersAreLeftIntact() {
        CapturingLimiter capturing = new CapturingLimiter();
        RateLimitGuard g = new RateLimitGuard(capturing, defaultProps());

        g.recordLoginFailure("1.1.1.1", "someone@example.com");

        assertEquals("someone@example.com", capturing.keys.get(0));
    }

    private static RateLimitProperties defaultProps() {
        return new RateLimitProperties(null, null, null, null);
    }

    /** Records every key the guard hands to the limiter. */
    private static final class CapturingLimiter implements RateLimiter {
        private final List<String> keys = new ArrayList<>();

        @Override public Decision tryAcquire(String key, RateLimitPolicy policy) {
            keys.add(key);
            return new Decision(true, 0L);
        }

        @Override public Decision check(String key, RateLimitPolicy policy) {
            keys.add(key);
            return new Decision(true, 0L);
        }
    }
}
