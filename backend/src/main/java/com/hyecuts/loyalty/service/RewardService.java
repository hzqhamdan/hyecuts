package com.hyecuts.loyalty.service;

import com.hyecuts.loyalty.model.Reward;
import com.hyecuts.loyalty.model.RewardRedemption;
import com.hyecuts.loyalty.model.ActivityLog;
import com.hyecuts.loyalty.repository.RewardRepository;
import com.hyecuts.loyalty.repository.RewardRedemptionRepository;
import com.hyecuts.loyalty.repository.ActivityLogRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class RewardService {

    private final RewardRepository rewardRepository;
    private final RewardRedemptionRepository redemptionRepository;
    private final LoyaltyService loyaltyService;
    private final ActivityLogRepository activityLogRepository;

    public RewardService(RewardRepository rewardRepository, 
                         RewardRedemptionRepository redemptionRepository, 
                         LoyaltyService loyaltyService,
                         ActivityLogRepository activityLogRepository) {
        this.rewardRepository = rewardRepository;
        this.redemptionRepository = redemptionRepository;
        this.loyaltyService = loyaltyService;
        this.activityLogRepository = activityLogRepository;
    }

    public List<Reward> getAllRewards() {
        return rewardRepository.findAll();
    }

    public Reward createReward(Reward reward) {
        return rewardRepository.save(reward);
    }

    public String redeemReward(String userId, Long rewardId) {
        Optional<Reward> optReward = rewardRepository.findById(rewardId);
        
        if (optReward.isEmpty()) {
            return "Reward not found";
        }
        
        Reward reward = optReward.get();

        if (reward.getStockAvailable() != null && reward.getStockAvailable() <= 0) {
            return "Out of stock";
        }

        // Deduct points
        boolean isRedeemed = loyaltyService.redeemPoints(userId, reward.getPointsCost());
        
        if (!isRedeemed) {
            return "Insufficient points or tier requirement not met";
        }

        // Update stock
        if (reward.getStockAvailable() != null) {
            reward.setStockAvailable(reward.getStockAvailable() - 1);
            rewardRepository.save(reward);
        }

        // Create Redemption Record
        RewardRedemption redemption = new RewardRedemption(userId, rewardId, reward.getPointsCost(), "PENDING");
        redemptionRepository.save(redemption);

        // Log Activity
        ActivityLog log = new ActivityLog(userId, "REWARD_REDEEMED", "Redeemed " + reward.getTitle(), -reward.getPointsCost());
        activityLogRepository.save(log);

        return "SUCCESS";
    }

    public List<RewardRedemption> getUserRedemptions(String userId) {
        return redemptionRepository.findByUserId(userId);
    }

    public List<RewardRedemption> getAllRedemptions() {
        return redemptionRepository.findAll();
    }

    public RewardRedemption fulfillRedemption(Long redemptionId) {
        Optional<RewardRedemption> opt = redemptionRepository.findById(redemptionId);
        if (opt.isPresent()) {
            RewardRedemption redemption = opt.get();
            redemption.setStatus("FULFILLED");
            return redemptionRepository.save(redemption);
        }
        throw new RuntimeException("Redemption not found");
    }
}
