package com.hyecuts.loyalty.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.LocalDateTime;

@Entity
public class RewardRedemption {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userId;
    private Long rewardId;

    private Integer pointsRedeemed;
    
    // Status: PENDING, APPROVED, FULFILLED, CANCELLED
    private String status;

    private LocalDateTime redeemedAt;

    public RewardRedemption() {}

    public RewardRedemption(String userId, Long rewardId, Integer pointsRedeemed, String status) {
        this.userId = userId;
        this.rewardId = rewardId;
        this.pointsRedeemed = pointsRedeemed;
        this.status = status;
        this.redeemedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public Long getRewardId() { return rewardId; }
    public void setRewardId(Long rewardId) { this.rewardId = rewardId; }

    public Integer getPointsRedeemed() { return pointsRedeemed; }
    public void setPointsRedeemed(Integer pointsRedeemed) { this.pointsRedeemed = pointsRedeemed; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getRedeemedAt() { return redeemedAt; }
    public void setRedeemedAt(LocalDateTime redeemedAt) { this.redeemedAt = redeemedAt; }
}
