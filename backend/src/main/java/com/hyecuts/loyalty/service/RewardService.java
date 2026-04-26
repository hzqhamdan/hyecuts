package com.hyecuts.loyalty.service;

import com.hyecuts.loyalty.model.*;
import com.hyecuts.loyalty.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class RewardService {

    private final RewardRepository rewardRepository;
    private final VoucherRepository voucherRepository;
    private final LoyaltyService loyaltyService;
    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;

    public RewardService(RewardRepository rewardRepository, 
                         VoucherRepository voucherRepository, 
                         LoyaltyService loyaltyService,
                         ActivityLogRepository activityLogRepository,
                         UserRepository userRepository) {
        this.rewardRepository = rewardRepository;
        this.voucherRepository = voucherRepository;
        this.loyaltyService = loyaltyService;
        this.activityLogRepository = activityLogRepository;
        this.userRepository = userRepository;
    }

    public List<Reward> getAllRewards() {
        return rewardRepository.findAll();
    }

    public Reward createReward(Reward reward) {
        return rewardRepository.save(reward);
    }

    @Transactional
    public String redeemReward(UUID userId, UUID rewardId) {
        Optional<Reward> optReward = rewardRepository.findById(rewardId);
        if (optReward.isEmpty()) return "Reward not found";
        
        Reward reward = optReward.get();
        if (reward.getStockCount() != null && reward.getStockCount() <= 0) return "Out of stock";

        User user = loyaltyService.getUser(userId);

        // Deduct points
        boolean isRedeemed = loyaltyService.redeemPoints(userId, reward.getPointsCost());
        if (!isRedeemed) return "Insufficient points";

        // Update stock
        if (reward.getStockCount() != null) {
            reward.setStockCount(reward.getStockCount() - 1);
            rewardRepository.save(reward);
        }

        // Create Voucher
        Voucher voucher = new Voucher();
        voucher.setId("V-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        voucher.setUser(user);
        voucher.setReward(reward);
        voucher.setStatus(Voucher.VoucherStatus.ACTIVE);
        voucherRepository.save(voucher);

        // Log Activity
        ActivityLog log = new ActivityLog();
        log.setUser(user);
        log.setActionType(ActivityLog.TransactionType.REWARD_REDEMPTION);
        log.setDescription("Redeemed: " + reward.getTitle());
        log.setPointsEarned(-reward.getPointsCost());
        activityLogRepository.save(log);

        return "SUCCESS";
    }

    public List<Voucher> getUserVouchers(UUID userId) {
        return voucherRepository.findByUser_Id(userId);
    }

    public List<Voucher> getAllVouchers() {
        return voucherRepository.findAll();
    }

    public Voucher fulfillVoucher(String voucherId) {
        Voucher voucher = voucherRepository.findById(voucherId)
                .orElseThrow(() -> new RuntimeException("Voucher not found"));
        voucher.setStatus(Voucher.VoucherStatus.REDEEMED);
        voucher.setRedeemedAt(java.time.LocalDateTime.now());
        return voucherRepository.save(voucher);
    }
}
