package com.hyecuts.loyalty.security;

import com.hyecuts.loyalty.config.ClockConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import java.time.Clock;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Exercises only the rate-limiting slice of the Spring context:
 * {@link RateLimitProperties} YAML/property binding, {@link ClockConfig}, the
 * {@link InMemoryRateLimiter} bean and {@link RateLimitGuard}'s wiring.
 *
 * <p>Deliberately NOT a full {@code @SpringBootTest} of the application — that
 * would need a real database, OAuth2 client credentials and a Stripe key,
 * which is a rabbit hole unrelated to what this test is verifying.
 */
@SpringBootTest(
        classes = {ClockConfig.class, InMemoryRateLimiter.class, RateLimitGuard.class},
        webEnvironment = SpringBootTest.WebEnvironment.NONE)
@EnableConfigurationProperties(RateLimitProperties.class)
@TestPropertySource(properties = {
        // A non-default value: proves the binding path actually works rather
        // than silently falling back to RateLimitProperties' compact
        // constructor defaults (which would also make the beans wire up).
        "hyecuts.rate-limit.login-per-account.max=7",
        "hyecuts.rate-limit.login-per-account.window=PT15M",
        "hyecuts.rate-limit.login-per-ip.max=100",
        "hyecuts.rate-limit.login-per-ip.window=PT15M",
        "hyecuts.rate-limit.register-per-ip.max=30",
        "hyecuts.rate-limit.register-per-ip.window=PT1H",
        "hyecuts.rate-limit.guest-booking-per-ip.max=20",
        "hyecuts.rate-limit.guest-booking-per-ip.window=PT1H"
})
class RateLimitContextTest {

    @Autowired private Clock clock;
    @Autowired private RateLimiter limiter;
    @Autowired private RateLimitGuard guard;
    @Autowired private RateLimitProperties properties;

    @Test
    void theRateLimitingSliceWiresUp() {
        assertNotNull(clock);
        assertNotNull(limiter);
        assertNotNull(guard);
        assertNotNull(properties);
    }

    @Test
    void aNonDefaultPropertyValueActuallyBindsThrough() {
        // Default login-per-account max is 10 (RateLimitProperties' compact
        // constructor); this context overrides it to 7 via @TestPropertySource.
        // A test asserting only defaults would pass even if binding were
        // entirely broken, since the record's own defaults would still apply.
        assertEquals(7, properties.loginPerAccount().max(),
                "the overridden property must have bound, not the record's own default");

        for (int i = 0; i < 7; i++) {
            guard.recordLoginFailure("1.1.1.1", "someone@example.com");
        }

        assertThrows(RateLimitExceededException.class,
                () -> guard.checkLogin("1.1.1.1", "someone@example.com"),
                "the bound max of 7 (not the default of 10) should already be exhausted");
    }
}
