package com.hyecuts.loyalty.service;

import com.hyecuts.loyalty.model.Tier;
import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.repository.TierRepository;
import com.hyecuts.loyalty.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
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
