package com.hyecuts.loyalty.controller;

import com.hyecuts.loyalty.model.ActivityLog;
import com.hyecuts.loyalty.model.LoyaltyProfile;
import com.hyecuts.loyalty.model.RewardRedemption;
import com.hyecuts.loyalty.service.GamificationService;
import com.hyecuts.loyalty.service.LoyaltyService;
import com.hyecuts.loyalty.service.RewardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final LoyaltyService loyaltyService;
    private final RewardService rewardService;
    private final GamificationService gamificationService;

    public AdminController(LoyaltyService loyaltyService, RewardService rewardService, GamificationService gamificationService) {
        this.loyaltyService = loyaltyService;
        this.rewardService = rewardService;
        this.gamificationService = gamificationService;
    }

    @PostMapping("/redemptions/{redemptionId}/fulfill")
    public ResponseEntity<RewardRedemption> fulfillRedemption(@PathVariable Long redemptionId) {
        return ResponseEntity.ok(rewardService.fulfillRedemption(redemptionId));
    }

    @GetMapping("/redemptions")
    public ResponseEntity<List<RewardRedemption>> getAllRedemptions() {
        return ResponseEntity.ok(rewardService.getAllRedemptions());
    }

    @GetMapping("/activity")
    public ResponseEntity<List<ActivityLog>> getAllActivityLogs() {
        return ResponseEntity.ok(gamificationService.getAllActivityLogs());
    }

    @PostMapping("/points/adjust/{userId}")
    public ResponseEntity<LoyaltyProfile> adjustPoints(@PathVariable String userId, @RequestParam int points) {
        // We use addPoints, which handles both positive (earning) and negative (deducting, though redeemPoints is usually better for that)
        return ResponseEntity.ok(loyaltyService.addPoints(userId, points));
    }
}
