package com.hyecuts.loyalty.security;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Hands the OAuth2 redirect a short-lived, single-use opaque code instead of
 * the real JWT. Putting the JWT itself in the redirect URL (the previous
 * behaviour) leaks it into browser history, Referer headers, and platform
 * access logs; a code that's worthless after one use within a minute closes
 * that off without changing the login UX.
 *
 * In-memory by design — fine for a single instance. If this app ever runs
 * multiple backend replicas behind a load balancer, the exchange call could
 * land on a different instance than the one that issued the code, so this
 * would need to move to a shared store (e.g. the database or Redis).
 */
@Service
public class OAuth2CodeExchangeService {

    private static final long TTL_MILLIS = 60_000; // 1 minute

    private final Map<String, PendingLogin> pendingLogins = new ConcurrentHashMap<>();

    public String issueCode(UUID userId) {
        String code = UUID.randomUUID().toString();
        pendingLogins.put(code, new PendingLogin(userId, Instant.now().toEpochMilli() + TTL_MILLIS));
        return code;
    }

    /** Single-use: the code is removed whether or not it's still valid. */
    public Optional<UUID> consume(String code) {
        if (code == null) {
            return Optional.empty();
        }
        PendingLogin entry = pendingLogins.remove(code);
        if (entry == null || Instant.now().toEpochMilli() > entry.expiresAtMillis()) {
            return Optional.empty();
        }
        return Optional.of(entry.userId());
    }

    private record PendingLogin(UUID userId, long expiresAtMillis) {}
}
