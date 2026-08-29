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

        List<User> patrons = userRepository.findByTier(Tier.PATRON);

        int issued = 0;
        for (User patron : patrons) {
            // Atomic conditional UPDATE (SCH-004): if two scheduler replicas
            // fire this job at the same tick, only one wins this row and
            // issues a voucher for the quarter — the other sees 0 rows
            // updated and skips.
            if (userRepository.markQuarterlyVoucherIssued(patron.getId(), quarterKey) == 0) {
                continue;
            }

            Voucher voucher = new Voucher();
            voucher.setId(generateUniqueVoucherId("Q-"));
            voucher.setUser(patron);
            voucher.setReward(quarterlyReward);
            voucher.setStatus(Voucher.VoucherStatus.ACTIVE);
            voucher.setExpiresAt(endOfQuarter(today));

            voucherRepository.save(voucher);

            issued++;
        }

        if (issued > 0) {
            log.info("Issued {} quarterly complimentary vouchers for {}", issued, quarterKey);
        }
    }

    @Scheduled(cron = "0 0 7 * * *")
    @Transactional
    public void expireStaleVouchers() {
        int expired = voucherRepository.expireStaleVouchers(LocalDateTime.now());

        if (expired > 0) {
            log.info("Expired {} stale vouchers", expired);
        }
    }

    // RW-015: same check-before-insert as RewardService.generateUniqueVoucherId
    // — the id column is capped at 12 chars, so collisions aren't impossible.
    private String generateUniqueVoucherId(String prefix) {
        for (int attempt = 0; attempt < 5; attempt++) {
            String hex = UUID.randomUUID().toString().replace("-", "");
            String candidate = prefix + hex.substring(0, 10).toUpperCase();
            if (!voucherRepository.existsById(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("Could not generate a unique voucher ID.");
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
