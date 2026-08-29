package com.hyecuts.loyalty.service;

import com.hyecuts.loyalty.model.AdminAuditLog;
import com.hyecuts.loyalty.model.Tier;
import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.repository.AdminAuditLogRepository;
import com.hyecuts.loyalty.repository.UserRepository;
import com.hyecuts.loyalty.web.AdminUserSummary;
import com.hyecuts.loyalty.web.UpdateProfileRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class LoyaltyService {

    private final UserRepository userRepository;
    private final GlobalSettingsService globalSettingsService;
    private final PasswordEncoder passwordEncoder;
    private final AdminAuditLogRepository adminAuditLogRepository;

    public LoyaltyService(UserRepository userRepository, GlobalSettingsService globalSettingsService,
                           PasswordEncoder passwordEncoder, AdminAuditLogRepository adminAuditLogRepository) {
        this.userRepository = userRepository;
        this.globalSettingsService = globalSettingsService;
        this.passwordEncoder = passwordEncoder;
        this.adminAuditLogRepository = adminAuditLogRepository;
    }

    public User getUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // Was an unbounded findAll() returning the full User entity (avatar and
    // all) for every member — see AdminUserSummary for what's actually kept.
    public List<AdminUserSummary> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(AdminUserSummary::from).getContent();
    }

    @Transactional
    public User updateUser(UUID userId, UpdateProfileRequest req) {
        User user = getUser(userId);

        if (req.fullName() != null) user.setFullName(req.fullName());

        // Blank means "do not change" (per UpdateProfileRequest's contract) —
        // email/username gate login, so silently wiping one to "" locks the
        // user out with no way back in.
        if (req.email() != null && !req.email().isBlank()) {
            String newEmail = req.email().trim();
            if (!newEmail.equalsIgnoreCase(user.getEmail())) {
                if (userRepository.findByEmail(newEmail).isPresent()) {
                    throw new com.hyecuts.loyalty.exception.EmailAlreadyInUseException(newEmail);
                }
                user.setEmail(newEmail);
            }
        }

        if (req.username() != null && !req.username().isBlank()) {
            String newUsername = req.username().trim();
            if (!newUsername.equalsIgnoreCase(user.getUsername())) {
                if (userRepository.findByUsername(newUsername).isPresent()) {
                    throw new com.hyecuts.loyalty.exception.UsernameAlreadyInUseException(newUsername);
                }
                user.setUsername(newUsername);
            }
        }

        if (req.dob() != null) user.setDob(req.dob());
        if (req.phone() != null) user.setPhone(req.phone());
        if (req.avatar() != null) user.setAvatar(req.avatar());

        if (req.hairProfile() != null) {
            Map<String, String> hp = req.hairProfile();
            if (hp.get("type") != null) user.setHairType(hp.get("type"));
            if (hp.get("length") != null) user.setHairLength(hp.get("length"));
            if (hp.get("scalp") != null) user.setHairScalp(hp.get("scalp"));
        }

        // Extract birth month from dob if present
        if (req.dob() != null && !req.dob().isEmpty()) {
            try {
                String[] parts = req.dob().split("-");
                if (parts.length >= 2) {
                    user.setBirthMonth(Integer.parseInt(parts[1]));
                }
            } catch (NumberFormatException ignored) {}
        }

        return userRepository.save(user);
    }

    @Transactional
    public User overrideTier(UUID userId, String tierName, UUID actorId) {
        User user = getUser(userId);
        Tier previousTier = user.getTier();
        Tier tier;
        try {
            tier = Tier.valueOf(tierName.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid tier: " + tierName);
        }

        // LOY-014: tier is set directly and lifetimePoints is left untouched.
        // Inflating lifetimePoints to match used to corrupt the user's real
        // earned total — and a later demotion couldn't undo it, since the next
        // earn recomputed tier from that still-inflated number and silently
        // re-promoted the user right back.
        user.setTier(tier);

        User saved = userRepository.save(user);
        logAdminAction(actorId, saved, AdminAuditLog.AdminAction.TIER_OVERRIDE,
                previousTier + " -> " + tier);
        return saved;
    }

    // Internal/system callers (e.g. dev-data seeding) that have no logged-in
    // admin behind them — logged with a null actor rather than skipping the
    // audit trail entirely.
    @Transactional
    public User addPoints(UUID userId, int points) {
        return addPoints(userId, points, null);
    }

    @Transactional
    public User addPoints(UUID userId, int points, UUID actorId) {
        User user = getUser(userId);
        User updated = addPointsToUser(user, points);
        logAdminAction(actorId, updated, AdminAuditLog.AdminAction.POINTS_ADJUSTMENT,
                (points >= 0 ? "+" : "") + points + " points (balance now " + updated.getCurrentPoints() + ")");
        return updated;
    }

    private void logAdminAction(UUID actorId, User target, AdminAuditLog.AdminAction action, String details) {
        AdminAuditLog log = new AdminAuditLog();
        log.setActorId(actorId);
        log.setActorEmail(actorId != null
                ? userRepository.findById(actorId).map(User::getEmail).orElse("unknown")
                : "system");
        log.setTargetUserId(target.getId());
        log.setTargetEmail(target.getEmail());
        log.setAction(action);
        log.setDetails(details);
        adminAuditLogRepository.save(log);
    }

    // Was an unbounded findAll() — same rationale as getAllUsers/getAllVouchers.
    public List<AdminAuditLog> getAuditLog(Pageable pageable) {
        return adminAuditLogRepository.findAllByOrderByCreatedAtDesc(pageable).getContent();
    }

    @Transactional
    public User addPointsToUser(User user, int points) {
        int bonusPercent = user.getTier() == Tier.INSIDER || user.getTier() == Tier.ARTISAN
                || user.getTier() == Tier.CONNOISSEUR || user.getTier() == Tier.PATRON
                ? globalSettingsService.getInsiderBonusPercent() : 0;

        // Admin point adjustments are intentionally bidirectional (see
        // AdminController#adjustPoints — deducting points to correct a mistake
        // is a real feature), so this stays sign-agnostic. Everything here uses
        // long arithmetic and clamps to the int range so a large adjustment
        // can't silently overflow into a wildly wrong (often negative) balance.
        long finalPoints = (long) points + ((long) points * bonusPercent / 100);

        long newCurrent = clampToInt((long) user.getCurrentPoints() + finalPoints);
        long newLifetime = clampToInt((long) user.getLifetimePoints() + finalPoints);

        user.setCurrentPoints((int) newCurrent);
        user.setLifetimePoints((int) newLifetime);

        // Promote-only (pairs with LOY-014 above): earning points can raise a
        // tier an admin override left lower than lifetimePoints would justify,
        // but never automatically drops a tier the admin set — same
        // never-auto-demote rule normal earning already followed.
        Tier naturalTier = Tier.forLifetimePoints(user.getLifetimePoints());
        if (user.getTier() == null || naturalTier.ordinal() > user.getTier().ordinal()) {
            user.setTier(naturalTier);
        }

        return userRepository.save(user);
    }

    private static long clampToInt(long value) {
        return Math.max(Integer.MIN_VALUE, Math.min(Integer.MAX_VALUE, value));
    }

    /**
     * Deducts a fixed cancellation/no-show penalty (cancellation-policy.md).
     * Unlike {@link #addPointsToUser}, this only ever touches the spendable
     * currentPoints balance: lifetimePoints (and therefore tier) must never
     * move because of a cancellation, and the balance floors at 0 instead of
     * going negative.
     */
    @Transactional
    public void applyPointsPenalty(User user, int penaltyPoints) {
        user.setCurrentPoints(Math.max(0, user.getCurrentPoints() - penaltyPoints));
        userRepository.save(user);
    }

    /**
     * Erases a member's personal data (PDPA right-to-erasure). This anonymizes
     * the account rather than deleting the row outright: bookings, vouchers,
     * and activity logs all reference the user with no ON DELETE rule, and a
     * real business needs to retain that transaction history for accounting —
     * a hard delete would either violate the FK constraint or silently take
     * that history with it. Randomizing the email/username also invalidates
     * any outstanding JWT for this account, since JwtRequestFilter re-resolves
     * the token's subject against the current email on every request.
     */
    @Transactional
    public void deleteUser(UUID userId) {
        User user = getUser(userId);
        String anonId = UUID.randomUUID().toString();
        user.setEmail("deleted-" + anonId + "@hyecuts.invalid");
        user.setUsername("deleted-" + anonId);
        user.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
        user.setFullName(null);
        user.setPhone(null);
        user.setDob(null);
        user.setAvatar(null);
        user.setHairType(null);
        user.setHairLength(null);
        user.setHairScalp(null);
        user.setOauthProvider(null);
        userRepository.save(user);
    }

    @Transactional
    public boolean redeemPoints(UUID userId, int cost) {
        if (cost < 0) {
            // A negative "cost" would add points instead of spending them —
            // this endpoint must never be usable to mint points.
            return false;
        }
        // Deduct atomically instead of read-then-write: two concurrent redeem
        // calls against the same balance (e.g. both spending the last 500
        // points) could otherwise both pass a "currentPoints >= cost" check
        // before either one wrote, redeeming twice off a single balance.
        return userRepository.deductPointsIfSufficient(userId, cost) > 0;
    }
}
