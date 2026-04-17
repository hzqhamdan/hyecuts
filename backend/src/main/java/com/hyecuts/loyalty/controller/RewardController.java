package com.hyecuts.loyalty.controller;

import com.hyecuts.loyalty.model.Reward;
import com.hyecuts.loyalty.model.RewardRedemption;
import com.hyecuts.loyalty.service.RewardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    public ResponseEntity<String> redeemReward(@PathVariable String userId, @PathVariable Long rewardId) {
        String result = rewardService.redeemReward(userId, rewardId);
        if ("SUCCESS".equals(result)) {
            return ResponseEntity.ok("Reward redeemed successfully");
        }
        return ResponseEntity.badRequest().body(result);
    }

    @GetMapping("/redemptions/{userId}")
    public ResponseEntity<List<RewardRedemption>> getUserRedemptions(@PathVariable String userId) {
        return ResponseEntity.ok(rewardService.getUserRedemptions(userId));
    }
}
