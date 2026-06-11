package com.hyecuts.loyalty.component;

import com.hyecuts.loyalty.model.Tier;
import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.model.Reward;
import com.hyecuts.loyalty.model.Voucher;
import com.hyecuts.loyalty.repository.RewardRepository;
import com.hyecuts.loyalty.repository.UserRepository;
import com.hyecuts.loyalty.repository.VoucherRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

@Component
public class QuarterlyVoucherScheduler {

    private static final Logger log = LoggerFactory.getLogger(QuarterlyVoucherScheduler.class);

    private final UserRepository userRepository;
    private final RewardRepository rewardRepository;
    private final VoucherRepository voucherRepository;

    public QuarterlyVoucherScheduler(UserRepository userRepository,
                                     RewardRepository rewardRepository,
                                     VoucherRepository voucherRepository) {
        this.userRepository = userRepository;
        this.rewardRepository = rewardRepository;
        this.voucherRepository = voucherRepository;
    }

    @Scheduled(cron = "0 0 6 1 JAN,APR,JUL,OCT *")
    @Transactional
    public void issueQuarterlyVouchers() {
        LocalDate today = LocalDate.now();
        String quarterKey = quarterKey(today);

        Reward quarterlyReward = rewardRepository.findByTitle("Quarterly Complimentary Service")
                .orElse(null);
        if (quarterlyReward == null) {
            log.warn("Quarterly Complimentary Service reward not found — skipping issuance");
            return;
        }

        List<User> patrons = userRepository.findAll().stream()
                .filter(u -> u.getTier() == Tier.PATRON)
                .toList();

        int issued = 0;
        for (User patron : patrons) {
            if (quarterKey.equals(patron.getLastQuarterlyVoucherQuarter())) {
                continue;
            }

            Voucher voucher = new Voucher();
            voucher.setId("Q-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            voucher.setUser(patron);
            voucher.setReward(quarterlyReward);
            voucher.setStatus(Voucher.VoucherStatus.ACTIVE);
            voucher.setExpiresAt(endOfQuarter(today));

            voucherRepository.save(voucher);

            patron.setLastQuarterlyVoucherQuarter(quarterKey);
            userRepository.save(patron);

            issued++;
        }

        if (issued > 0) {
            log.info("Issued {} quarterly complimentary vouchers for {}", issued, quarterKey);
        }
    }

    @Scheduled(cron = "0 0 7 * * *")
    @Transactional
    public void expireStaleVouchers() {
        LocalDateTime now = LocalDateTime.now();
        List<Voucher> expired = voucherRepository.findAll().stream()
                .filter(v -> v.getExpiresAt() != null)
                .filter(v -> v.getExpiresAt().isBefore(now))
                .filter(v -> v.getStatus() == Voucher.VoucherStatus.ACTIVE)
                .toList();

        for (Voucher v : expired) {
            v.setStatus(Voucher.VoucherStatus.EXPIRED);
            voucherRepository.save(v);
        }

        if (!expired.isEmpty()) {
            log.info("Expired {} stale vouchers", expired.size());
        }
    }

    static String quarterKey(LocalDate date) {
        int year = date.getYear();
        int quarter = (date.getMonthValue() - 1) / 3 + 1;
        return year + "-Q" + quarter;
    }

    static LocalDateTime endOfQuarter(LocalDate date) {
        int month = date.getMonthValue();
        int endMonth = ((month - 1) / 3 + 1) * 3;
        return YearMonth.of(date.getYear(), endMonth).atEndOfMonth().atTime(23, 59, 59);
    }
}
