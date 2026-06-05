package com.hyecuts.loyalty.service;

import com.hyecuts.loyalty.model.Tier;
import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.repository.TierRepository;
import com.hyecuts.loyalty.repository.UserRepository;
import com.hyecuts.loyalty.web.UpdateProfileRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class LoyaltyService {

    private final UserRepository userRepository;
    private final TierRepository tierRepository;

    public LoyaltyService(UserRepository userRepository, TierRepository tierRepository) {
        this.userRepository = userRepository;
        this.tierRepository = tierRepository;
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

        return userRepository.save(user);
    }

    @Transactional
    public User overrideTier(UUID userId, String tierName) {
        User user = getUser(userId);
        Tier tier = tierRepository.findByName(tierName)
                .orElseThrow(() -> new RuntimeException("Tier not found: " + tierName));
        
        user.setTier(tier);
        // Ensure lifetime points match the new tier's minimum requirement if they're below it
        if (user.getLifetimePoints() < tier.getPointsRequired()) {
            user.setLifetimePoints(tier.getPointsRequired());
        }
        
        return userRepository.save(user);
    }

    @Transactional
    public User addPoints(UUID userId, int points) {
        User user = getUser(userId);
        user.setCurrentPoints(user.getCurrentPoints() + points);
        user.setLifetimePoints(user.getLifetimePoints() + points);
        
        updateTier(user);
        
        return userRepository.save(user);
    }

    @Transactional
    public void updateTier(User user) {
        int pts = user.getLifetimePoints();
        List<Tier> tiers = tierRepository.findAll();
        
        // Find the highest tier where points_required <= user's lifetime points
        Tier bestTier = tiers.stream()
                .filter(t -> t.getPointsRequired() <= pts)
                .max(Comparator.comparingInt(Tier::getPointsRequired))
                .orElse(null);

        if (bestTier != null) {
            user.setTier(bestTier);
        }
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
