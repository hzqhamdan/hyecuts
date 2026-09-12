package com.hyecuts.loyalty.security;

/**
 * A per-key request budget.
 *
 * <p>This interface is the scaling seam. State is per-instance today, which is
 * correct for a single replica; running more than one would need a shared
 * store, and that means adding one implementation of this interface without
 * touching a single call site.
 */
public interface RateLimiter {

    /** Consumes one unit if the budget allows, and reports the outcome. */
    Decision tryAcquire(String key, RateLimitPolicy policy);

    /** Reports budget state without consuming anything. */
    Decision check(String key, RateLimitPolicy policy);

    record Decision(boolean allowed, long retryAfterSeconds) {
    }
}
