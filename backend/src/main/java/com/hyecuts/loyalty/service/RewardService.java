package com.hyecuts.loyalty.service;

import com.hyecuts.loyalty.model.*;
import com.hyecuts.loyalty.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
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
        Reward reward = rewardRepository.findById(rewardId)
                .orElseThrow(() -> new RuntimeException("Reward not found"));

        if (!Boolean.TRUE.equals(reward.getIsActive())) {
            throw new RuntimeException("This reward is no longer available.");
        }

        User user = loyaltyService.getUser(userId);

        if (reward.getMinTier() != null && !reward.getMinTier().isBlank()) {
            Tier requiredTier;
            try {
                requiredTier = Tier.valueOf(reward.getMinTier().toUpperCase());
            } catch (IllegalArgumentException e) {
                // Unrecognised tier name on the reward — fail closed rather than
                // silently letting everyone redeem it.
                requiredTier = Tier.PATRON;
            }
            if (user.getTier() == null || user.getTier().ordinal() < requiredTier.ordinal()) {
                throw new RuntimeException("Your tier does not qualify for this reward.");
            }
        }

        // Claim stock atomically, before touching points: if two requests race for
        // the last unit, the DB-level conditional UPDATE lets only one succeed.
        if (reward.getStockCount() != null) {
            int updated = rewardRepository.decrementStockIfAvailable(rewardId);
            if (updated == 0) {
                throw new RuntimeException("Out of stock");
            }
        }

        // Deduct points. If this fails, the @Transactional rollback also undoes
        // the stock decrement above.
        boolean isRedeemed = loyaltyService.redeemPoints(userId, reward.getPointsCost());
        if (!isRedeemed) {
            throw new RuntimeException("Insufficient points");
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
