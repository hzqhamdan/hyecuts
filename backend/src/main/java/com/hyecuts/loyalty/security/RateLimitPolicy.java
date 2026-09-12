package com.hyecuts.loyalty.security;

import java.time.Duration;

/**
 * One named budget: at most {@code max} events per {@code window}.
 *
 * <p>{@code name} is part of the limiter's storage key, so the same raw key
 * (an IP, say) tracked under two different policies never shares a counter.
 */
public record RateLimitPolicy(String name, int max, Duration window) {

    public RateLimitPolicy {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("policy name is required");
        }
        if (max < 1) {
            throw new IllegalArgumentException("max must be at least 1 for policy " + name);
        }
        if (window == null || window.isZero() || window.isNegative()) {
            throw new IllegalArgumentException("window must be positive for policy " + name);
        }
    }
}
