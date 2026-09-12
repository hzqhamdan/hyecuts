package com.hyecuts.loyalty.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

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
}
