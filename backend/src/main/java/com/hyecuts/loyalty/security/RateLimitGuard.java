package com.hyecuts.loyalty.security;

import org.springframework.stereotype.Service;

import java.util.Locale;

/**
 * Owns every rate-limit key and policy so controllers hold neither.
 *
 * <p>Shaped after {@link AuthorizationUtil}: a cross-cutting check invoked
 * explicitly at the call site. That is how authorization already works in this
 * codebase, and a servlet filter would have been a second, competing mechanism
 * — see the design doc for the full argument.
 */
@Service
public class RateLimitGuard {

    private final RateLimiter limiter;
    private final RateLimitPolicy loginPerAccount;
    private final RateLimitPolicy loginPerIp;
    private final RateLimitPolicy registerPerIp;
    private final RateLimitPolicy guestBookingPerIp;

    public RateLimitGuard(RateLimiter limiter, RateLimitProperties props) {
        this.limiter = limiter;
        this.loginPerAccount = policy("login-per-account", props.loginPerAccount());
        this.loginPerIp = policy("login-per-ip", props.loginPerIp());
        this.registerPerIp = policy("register-per-ip", props.registerPerIp());
        this.guestBookingPerIp = policy("guest-booking-per-ip", props.guestBookingPerIp());
    }

    /**
     * Rejects a login attempt whose budget is already spent. Consumes nothing —
     * a successful sign-in must cost a user no budget at all, otherwise normal
     * heavy use starts to look like an attack.
     */
    public void checkLogin(String ip, String identifier) {
        denyIfExhausted(limiter.check(accountKey(identifier), loginPerAccount));
        denyIfExhausted(limiter.check(ipKey(ip), loginPerIp));
    }

    /**
     * Charges one failed sign-in against both budgets. Failures are what brute
     * force is made of, so failures are what the budget tracks.
     */
    public void recordLoginFailure(String ip, String identifier) {
        limiter.tryAcquire(accountKey(identifier), loginPerAccount);
        limiter.tryAcquire(ipKey(ip), loginPerIp);
    }

    public void checkAndConsumeRegistration(String ip) {
        denyIfExhausted(limiter.tryAcquire(ipKey(ip), registerPerIp));
    }

    public void checkAndConsumeGuestBooking(String ip) {
        denyIfExhausted(limiter.tryAcquire(ipKey(ip), guestBookingPerIp));
    }

    private static RateLimitPolicy policy(String name, RateLimitProperties.Limit limit) {
        return new RateLimitPolicy(name, limit.max(), limit.window());
    }

    private static void denyIfExhausted(RateLimiter.Decision decision) {
        if (!decision.allowed()) {
            throw new RateLimitExceededException(decision.retryAfterSeconds());
        }
    }

    /** Normalised so casing or stray whitespace cannot buy a fresh budget. */
    private static String accountKey(String identifier) {
        return identifier == null ? "" : identifier.trim().toLowerCase(Locale.ROOT);
    }

    private static String ipKey(String ip) {
        return ip == null ? "unknown" : ip;
    }
}
