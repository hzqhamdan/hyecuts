package com.hyecuts.loyalty.controller;

import com.hyecuts.loyalty.model.ActivityLog;
import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.repository.VoucherRepository;
import com.hyecuts.loyalty.service.GamificationService;
import com.hyecuts.loyalty.service.LoyaltyService;
import com.hyecuts.loyalty.service.RewardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

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
    public ResponseEntity<Object> fulfillRedemption(@PathVariable Long redemptionId) {
        return ResponseEntity.ok(rewardService.fulfillVoucher(voucherRepository.toString()));
    }

    @GetMapping("/redemptions")
    public ResponseEntity<List<Object>> getAllRedemptions() {
        return ResponseEntity.ok((List<Object>)(List<?>)rewardService.getAllVouchers());
    }

    @GetMapping("/activity")
    public ResponseEntity<List<ActivityLog>> getAllActivityLogs() {
        return ResponseEntity.ok(gamificationService.getAllActivityLogs());
    }

    @PostMapping("/points/adjust/{userId}")
    public ResponseEntity<User> adjustPoints(@PathVariable UUID userId, @RequestParam int points) {
        return ResponseEntity.ok(loyaltyService.addPoints(userId, points));
    }
}
