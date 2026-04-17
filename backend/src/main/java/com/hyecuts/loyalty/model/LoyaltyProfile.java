package com.hyecuts.loyalty.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class LoyaltyProfile {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String userId; // Links to Auth Service / Firebase UID
    
    private Integer pointsBalance = 0;
    private String currentTier = "Rookie";
    
    // Removed referralCode based on updated requirements
    
    public LoyaltyProfile() {}

    public LoyaltyProfile(String userId) {
        this.userId = userId;
    }

    public Long getId() { return id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    
    public Integer getPointsBalance() { return pointsBalance; }
    public void setPointsBalance(Integer pointsBalance) { this.pointsBalance = pointsBalance; }
    
    public String getCurrentTier() { return currentTier; }
    public void setCurrentTier(String currentTier) { this.currentTier = currentTier; }
}
