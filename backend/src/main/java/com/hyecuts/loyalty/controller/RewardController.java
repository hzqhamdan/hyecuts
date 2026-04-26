package com.hyecuts.loyalty.controller;

import com.hyecuts.loyalty.model.Reward;
import com.hyecuts.loyalty.model.Voucher;
import com.hyecuts.loyalty.service.RewardService;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<String> redeemReward(@PathVariable UUID userId, @PathVariable UUID rewardId) {
        String result = rewardService.redeemReward(userId, rewardId);
        if ("SUCCESS".equals(result)) {
            return ResponseEntity.ok("Reward redeemed successfully");
        }
        return ResponseEntity.badRequest().body(result);
    }

    @GetMapping("/vouchers/{userId}")
    public ResponseEntity<List<Voucher>> getUserVouchers(@PathVariable UUID userId) {
        return ResponseEntity.ok(rewardService.getUserVouchers(userId));
    }
}
