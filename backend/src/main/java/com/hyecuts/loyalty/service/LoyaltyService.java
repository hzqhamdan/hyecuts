package com.hyecuts.loyalty.service;

import com.hyecuts.loyalty.model.LoyaltyProfile;
import com.hyecuts.loyalty.repository.LoyaltyProfileRepository;
import org.springframework.stereotype.Service;

@Service
public class LoyaltyService {

    private final LoyaltyProfileRepository repository;

    public LoyaltyService(LoyaltyProfileRepository repository) {
        this.repository = repository;
    }

    public LoyaltyProfile getOrCreateProfile(String userId) {
        return repository.findByUserId(userId).orElseGet(() -> {
            LoyaltyProfile newProfile = new LoyaltyProfile(userId);
            return repository.save(newProfile);
        });
    }

    public LoyaltyProfile addPoints(String userId, int points) {
        LoyaltyProfile profile = getOrCreateProfile(userId);
        profile.setPointsBalance(profile.getPointsBalance() + points);
        
        updateTier(profile);
        
        return repository.save(profile);
    }

    private void updateTier(LoyaltyProfile profile) {
        int pts = profile.getPointsBalance();
        // Dynamic Tier Thresholds
        if (pts >= 10000) {
            profile.setCurrentTier("Icon");
        } else if (pts >= 5000) {
            profile.setCurrentTier("Master");
        } else if (pts >= 2500) {
            profile.setCurrentTier("Legend");
        } else if (pts >= 1000) {
            profile.setCurrentTier("Regular");
        } else {
            profile.setCurrentTier("Rookie");
        }
    }
    
    // Method to deduct points (for rewards)
    public boolean redeemPoints(String userId, int cost) {
        LoyaltyProfile profile = getOrCreateProfile(userId);
        if (profile.getPointsBalance() >= cost) {
            profile.setPointsBalance(profile.getPointsBalance() - cost);
            repository.save(profile);
            return true;
        }
        return false;
    }
}
