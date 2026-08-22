package com.hyecuts.loyalty.controller;

import com.hyecuts.loyalty.model.ActivityLog;
import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.model.Voucher;
import com.hyecuts.loyalty.repository.VoucherRepository;
import com.hyecuts.loyalty.service.GamificationService;
import com.hyecuts.loyalty.service.LoyaltyService;
import com.hyecuts.loyalty.service.RewardService;
import com.hyecuts.loyalty.web.AdminUserSummary;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    // None of these admin list endpoints send more than this many rows per
    // page even if the caller asks for more — they previously had no bound
    // at all (findAll() over the whole table).
    private static final int MAX_PAGE_SIZE = 200;

    private final LoyaltyService loyaltyService;
    private final RewardService rewardService;
    private final GamificationService gamificationService;
    private final VoucherRepository voucherRepository;

    public AdminController(LoyaltyService loyaltyService, RewardService rewardService, GamificationService gamificationService, VoucherRepository voucherRepository) {
        this.loyaltyService = loyaltyService;
        this.rewardService = rewardService;
        this.gamificationService = gamificationService;
        this.voucherRepository = voucherRepository;
    }

    // Assuming RewardRedemption needs mapping/fix later if it references LoyaltyProfile
    @PostMapping("/redemptions/{redemptionId}/fulfill")
    public ResponseEntity<Object> fulfillRedemption(@PathVariable String redemptionId) {
        return ResponseEntity.ok(rewardService.fulfillVoucher(redemptionId));
    }

    @GetMapping("/redemptions")
    public ResponseEntity<List<Voucher>> getAllRedemptions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, MAX_PAGE_SIZE));
        return ResponseEntity.ok(rewardService.getAllVouchers(pageable));
    }

    @GetMapping("/activity")
    public ResponseEntity<List<ActivityLog>> getAllActivityLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, MAX_PAGE_SIZE), Sort.by(Sort.Direction.DESC, "timestamp"));
        return ResponseEntity.ok(gamificationService.getAllActivityLogs(pageable));
    }

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserSummary>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, MAX_PAGE_SIZE));
        return ResponseEntity.ok(loyaltyService.getAllUsers(pageable));
    }

    @PostMapping("/points/adjust/{userId}")
    public ResponseEntity<User> adjustPoints(@PathVariable UUID userId, @RequestParam int points) {
        return ResponseEntity.ok(loyaltyService.addPoints(userId, points));
    }

    @PostMapping("/tier/override/{userId}")
    public ResponseEntity<User> overrideTier(@PathVariable UUID userId, @RequestParam String tier) {
        return ResponseEntity.ok(loyaltyService.overrideTier(userId, tier));
    }
}
