package com.hyecuts.loyalty.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

/**
 * Rate limit budgets, overridable per environment.
 *
 * <p>The defaults below are estimates, which is exactly why they are
 * configurable: they can be retuned from a Railway environment variable during
 * an incident without waiting for a redeploy.
 *
 * <p>The IP budgets are deliberately loose. This is a mobile-first PWA in a
 * market where every major carrier runs CGNAT, so one IP can represent
 * thousands of unrelated subscribers; a tight per-IP budget would throttle
 * strangers, and would do it during a traffic spike. The per-account login
 * budget is the control doing the real security work, and it is immune to this
 * because it keys on the identifier rather than the address.
 */
@ConfigurationProperties(prefix = "hyecuts.rate-limit")
public record RateLimitProperties(
        Limit loginPerAccount,
        Limit loginPerIp,
        Limit registerPerIp,
        Limit guestBookingPerIp) {

    public record Limit(int max, Duration window) {}

    public RateLimitProperties {
        if (loginPerAccount == null) loginPerAccount = new Limit(10, Duration.ofMinutes(15));
        if (loginPerIp == null) loginPerIp = new Limit(100, Duration.ofMinutes(15));
        if (registerPerIp == null) registerPerIp = new Limit(30, Duration.ofHours(1));
        if (guestBookingPerIp == null) guestBookingPerIp = new Limit(20, Duration.ofHours(1));
    }
}
