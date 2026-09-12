package com.hyecuts.loyalty.security;

/**
 * Thrown when a caller has exhausted a rate-limit budget.
 *
 * <p>The message is deliberately generic and carries no hint about which budget
 * ran out. Distinguishing "this account is throttled" from "this IP is
 * throttled" would confirm that an account exists, which is the enumeration
 * problem AUTH-014 already describes.
 */
public class RateLimitExceededException extends RuntimeException {

    private final long retryAfterSeconds;

    public RateLimitExceededException(long retryAfterSeconds) {
        super("Too many requests. Please try again later.");
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}
