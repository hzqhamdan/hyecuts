package com.hyecuts.loyalty.security;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Tracks JWTs (by their "jti" claim) that were explicitly logged out, so a
 * copied/stolen token stops working immediately instead of staying valid for
 * the rest of its 24h lifetime. JwtRequestFilter checks this on every request.
 *
 * In-memory by design — fine for a single instance. Entries are pruned once
 * their token's own expiry passes, so this never grows unbounded. If this app
 * ever runs multiple backend replicas, this would need a shared store (e.g.
 * the database or Redis) so a revocation on one instance is visible to all.
 */
@Service
public class TokenRevocationService {

    private final Map<String, Long> revokedJtis = new ConcurrentHashMap<>();

    public void revoke(String jti, long expiresAtEpochMillis) {
        if (jti == null) {
            return;
        }
        purgeExpired();
        revokedJtis.put(jti, expiresAtEpochMillis);
    }

    public boolean isRevoked(String jti) {
        if (jti == null) {
            return false;
        }
        Long expiresAt = revokedJtis.get(jti);
        if (expiresAt == null) {
            return false;
        }
        if (System.currentTimeMillis() > expiresAt) {
            // The token would have failed expiry validation anyway; no need
            // to keep remembering it as revoked.
            revokedJtis.remove(jti);
            return false;
        }
        return true;
    }

    private void purgeExpired() {
        long now = System.currentTimeMillis();
        revokedJtis.entrySet().removeIf(entry -> entry.getValue() < now);
    }
}
