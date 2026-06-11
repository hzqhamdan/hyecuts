package com.hyecuts.loyalty.service;

import com.hyecuts.loyalty.model.Tier;
import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.repository.UserRepository;
import com.hyecuts.loyalty.web.UpdateProfileRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class LoyaltyService {

    private final UserRepository userRepository;
    private final GlobalSettingsService globalSettingsService;

    public LoyaltyService(UserRepository userRepository, GlobalSettingsService globalSettingsService) {
        this.userRepository = userRepository;
        this.globalSettingsService = globalSettingsService;
    }

    public User getUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
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

        int finalPoints = points + (points * bonusPercent / 100);

        user.setCurrentPoints(user.getCurrentPoints() + finalPoints);
        user.setLifetimePoints(user.getLifetimePoints() + finalPoints);
        
        Tier newTier = Tier.forLifetimePoints(user.getLifetimePoints());
        user.setTier(newTier);
        
        return userRepository.save(user);
    }

    @Transactional
    public boolean redeemPoints(UUID userId, int cost) {
        User user = getUser(userId);
        if (user.getCurrentPoints() >= cost) {
            user.setCurrentPoints(user.getCurrentPoints() - cost);
            userRepository.save(user);
            return true;
        }
        return false;
    }
}
