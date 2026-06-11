package com.hyecuts.loyalty.service;

import com.hyecuts.loyalty.model.Reward;
import com.hyecuts.loyalty.model.Tier;
import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.model.Voucher;
import com.hyecuts.loyalty.repository.RewardRepository;
import com.hyecuts.loyalty.repository.UserRepository;
import com.hyecuts.loyalty.repository.VoucherRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class BenefitsService {

    private final UserRepository userRepository;
    private final GlobalSettingsService globalSettingsService;
    private final VoucherRepository voucherRepository;
    private final RewardRepository rewardRepository;

    public BenefitsService(UserRepository userRepository,
                           GlobalSettingsService globalSettingsService,
                           VoucherRepository voucherRepository,
                           RewardRepository rewardRepository) {
        this.userRepository = userRepository;
        this.globalSettingsService = globalSettingsService;
        this.voucherRepository = voucherRepository;
        this.rewardRepository = rewardRepository;
    }

    public boolean canRedeemBeardTrim(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getTier() != Tier.ARTISAN && user.getTier() != Tier.CONNOISSEUR
                && user.getTier() != Tier.PATRON) {
            return false;
        }

        if (user.getLastBeardTrimRedeemed() == null) {
            return true;
        }

        LocalDate lastRedeemed = user.getLastBeardTrimRedeemed();
        LocalDate now = LocalDate.now();
        return lastRedeemed.getMonth() != now.getMonth() || lastRedeemed.getYear() != now.getYear();
    }

    @Transactional
    public void redeemBeardTrim(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!canRedeemBeardTrim(userId)) {
            throw new RuntimeException("Beard trim already redeemed this month");
        }

        user.setLastBeardTrimRedeemed(LocalDate.now());
        userRepository.save(user);
    }

    public boolean canRedeemBirthdayBonus(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getTier() != Tier.CONNOISSEUR && user.getTier() != Tier.PATRON) {
            return false;
        }

        if (user.getBirthMonth() == null) {
            return false;
        }

        int currentMonth = LocalDate.now().getMonthValue();
        if (user.getBirthMonth() != currentMonth) {
            return false;
        }

        if (user.getBirthdayBonusYear() != null && user.getBirthdayBonusYear() == LocalDate.now().getYear()) {
            return false;
        }

        return true;
    }

    @Transactional
    public int awardBirthdayBonus(UUID userId) {
        if (!canRedeemBirthdayBonus(userId)) {
            throw new RuntimeException("Birthday bonus not available");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        int bonusPoints = globalSettingsService.getBirthdayBonusPoints();
        user.setCurrentPoints(user.getCurrentPoints() + bonusPoints);
        user.setLifetimePoints(user.getLifetimePoints() + bonusPoints);
        user.setBirthdayBonusYear(LocalDate.now().getYear());

        Tier newTier = Tier.forLifetimePoints(user.getLifetimePoints());
        user.setTier(newTier);

        userRepository.save(user);
        return bonusPoints;
    }

    public boolean canRedeemQuarterlyService(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getTier() != Tier.PATRON) {
            return false;
        }

        Reward quarterlyReward = rewardRepository.findByTitle("Quarterly Complimentary Service")
                .orElse(null);
        if (quarterlyReward == null) {
            return false;
        }

        List<Voucher> activeVouchers = voucherRepository.findByUser_Id(userId).stream()
                .filter(v -> v.getReward().getId().equals(quarterlyReward.getId()))
                .filter(v -> v.getStatus() == Voucher.VoucherStatus.ACTIVE)
                .toList();

        return !activeVouchers.isEmpty();
    }

    public boolean hasPriorityBooking(Tier tier) {
        return tier == Tier.CONNOISSEUR || tier == Tier.PATRON;
    }
}
