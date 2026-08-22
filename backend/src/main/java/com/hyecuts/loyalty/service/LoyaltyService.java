package com.hyecuts.loyalty.service;

import com.hyecuts.loyalty.model.Tier;
import com.hyecuts.loyalty.model.User;
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

    public LoyaltyService(UserRepository userRepository, GlobalSettingsService globalSettingsService, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.globalSettingsService = globalSettingsService;
        this.passwordEncoder = passwordEncoder;
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
        
        if (req.email() != null) {
            String newEmail = req.email().trim();
            if (!newEmail.equalsIgnoreCase(user.getEmail())) {
                if (userRepository.findByEmail(newEmail).isPresent()) {
                    throw new RuntimeException("Email already taken");
                }
                user.setEmail(newEmail);
            }
        }

        if (req.username() != null) {
            String newUsername = req.username().trim();
            if (!newUsername.equalsIgnoreCase(user.getUsername())) {
                if (userRepository.findByUsername(newUsername).isPresent()) {
                    throw new RuntimeException("Username already taken");
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
    public User overrideTier(UUID userId, String tierName) {
        User user = getUser(userId);
        Tier tier;
        try {
            tier = Tier.valueOf(tierName.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid tier: " + tierName);
        }
        
        user.setTier(tier);
        if (user.getLifetimePoints() < tier.getMinPoints()) {
            user.setLifetimePoints(tier.getMinPoints());
        }
        
        return userRepository.save(user);
    }

    @Transactional
    public User addPoints(UUID userId, int points) {
        User user = getUser(userId);
        return addPointsToUser(user, points);
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

        Tier newTier = Tier.forLifetimePoints(user.getLifetimePoints());
        user.setTier(newTier);

        return userRepository.save(user);
    }

    private static long clampToInt(long value) {
        return Math.max(Integer.MIN_VALUE, Math.min(Integer.MAX_VALUE, value));
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
