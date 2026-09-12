package com.hyecuts.loyalty.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(RateLimitGuard.class);

    /**
     * Caps how much of an attacker-controlled identifier is retained as a map
     * key in the limiter. Without this, an unbounded username would sit in
     * memory indefinitely without ever approaching the limiter's entry cap,
     * which counts entries, not bytes.
     */
    private static final int MAX_ACCOUNT_KEY_LENGTH = 256;

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
        denyIfExhausted(ip, "login-per-account", limiter.check(accountKey(identifier), loginPerAccount));
        denyIfExhausted(ip, "login-per-ip", limiter.check(ipKey(ip), loginPerIp));
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
        denyIfExhausted(ip, "register-per-ip", limiter.tryAcquire(ipKey(ip), registerPerIp));
    }

    public void checkAndConsumeGuestBooking(String ip) {
        denyIfExhausted(ip, "guest-booking-per-ip", limiter.tryAcquire(ipKey(ip), guestBookingPerIp));
    }

    private static RateLimitPolicy policy(String name, RateLimitProperties.Limit limit) {
        return new RateLimitPolicy(name, limit.max(), limit.window());
    }

    /**
     * Logs at DEBUG on rejection so a proxy misconfiguration (Railway's proxy
     * falling outside Tomcat's internalProxies range, collapsing every client
     * into one IP bucket) can be diagnosed. Deliberately never logs the
     * account identifier: the HTTP response already hides which budget was
     * exhausted to avoid confirming an account exists, and logging it here
     * would undo that.
     */
    private static void denyIfExhausted(String ip, String policyName, RateLimiter.Decision decision) {
        if (!decision.allowed()) {
            log.debug("Rate limit exceeded for policy '{}' from ip {}", policyName, ip);
            throw new RateLimitExceededException(decision.retryAfterSeconds());
        }
    }

    /**
     * Normalised so casing or stray whitespace cannot buy a fresh budget, then
     * truncated so an attacker-controlled identifier is never retained as an
     * unbounded map key in the limiter (the entry cap there counts entries,
     * not bytes).
     */
    private static String accountKey(String identifier) {
        String normalised = identifier == null ? "" : identifier.trim().toLowerCase(Locale.ROOT);
        return normalised.length() > MAX_ACCOUNT_KEY_LENGTH
                ? normalised.substring(0, MAX_ACCOUNT_KEY_LENGTH)
                : normalised;
    }

    private static String ipKey(String ip) {
        return ip == null ? "unknown" : ip;
    }
}
