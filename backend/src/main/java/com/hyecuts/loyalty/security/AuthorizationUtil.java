package com.hyecuts.loyalty.security;

import org.springframework.security.access.AccessDeniedException;

import java.util.UUID;

/**
 * Central place for the "is the caller allowed to touch this user's data" check
 * that every user-scoped controller needs (profile, bookings, vouchers, gamification).
 */
public final class AuthorizationUtil {

    private AuthorizationUtil() {}

    public static boolean isAdmin(CustomUserDetails principal) {
        return principal != null && "ROLE_ADMIN".equals(principal.getRole());
    }

    /**
     * Throws if the caller is neither the resource owner nor an admin.
     */
    public static void requireSelfOrAdmin(CustomUserDetails principal, UUID targetUserId) {
        if (principal == null) {
            throw new AccessDeniedException("Authentication required");
        }
        if (isAdmin(principal)) {
            return;
        }
        if (!principal.getId().equals(targetUserId)) {
            throw new AccessDeniedException("Not authorized to access this resource");
        }
    }
}
