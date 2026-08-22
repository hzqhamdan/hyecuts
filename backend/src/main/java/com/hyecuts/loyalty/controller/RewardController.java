package com.hyecuts.loyalty.controller;

import com.hyecuts.loyalty.model.Reward;
import com.hyecuts.loyalty.model.Voucher;
import com.hyecuts.loyalty.security.AuthorizationUtil;
import com.hyecuts.loyalty.security.CustomUserDetails;
import com.hyecuts.loyalty.service.RewardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/rewards")
public class RewardController {

    private final RewardService rewardService;

    public RewardController(RewardService rewardService) {
        this.rewardService = rewardService;
    }

    @GetMapping
    public ResponseEntity<List<Reward>> getAllRewards() {
        return ResponseEntity.ok(rewardService.getAllRewards());
    }

    @PostMapping
    public ResponseEntity<Reward> createReward(@RequestBody Reward reward) {
        return ResponseEntity.ok(rewardService.createReward(reward));
    }

    @PostMapping("/redeem/{userId}/{rewardId}")
    public ResponseEntity<String> redeemReward(@PathVariable UUID userId, @PathVariable UUID rewardId, @AuthenticationPrincipal CustomUserDetails principal) {
        AuthorizationUtil.requireSelfOrAdmin(principal, userId);
        try {
            rewardService.redeemReward(userId, rewardId);
            return ResponseEntity.ok("Reward redeemed successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/vouchers/{userId}")
    public ResponseEntity<List<Voucher>> getUserVouchers(@PathVariable UUID userId, @AuthenticationPrincipal CustomUserDetails principal) {
        AuthorizationUtil.requireSelfOrAdmin(principal, userId);
        return ResponseEntity.ok(rewardService.getUserVouchers(userId));
    }
}
