package com.hyecuts.loyalty.web;

import com.hyecuts.loyalty.model.Tier;
import com.hyecuts.loyalty.model.User;

import java.util.UUID;

/**
 * Trimmed projection of {@link User} for the admin member list
 * (GET /api/admin/users). Excludes avatar, phone, dob, and hair-profile
 * fields — none of which the member list or detail panel display, and which
 * otherwise bloat every row with up to ~1MB of base64 avatar data per member.
 */
public record AdminUserSummary(
        UUID id,
        String email,
        String username,
        String fullName,
        String role,
        Tier tier,
        Integer currentPoints,
        Integer lifetimePoints
) {
    public static AdminUserSummary from(User user) {
        return new AdminUserSummary(
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.getFullName(),
                user.getRole(),
                user.getTier(),
                user.getCurrentPoints(),
                user.getLifetimePoints()
        );
    }
}
