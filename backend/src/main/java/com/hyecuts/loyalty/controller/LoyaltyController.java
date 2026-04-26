package com.hyecuts.loyalty.controller;

import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.service.LoyaltyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/loyalty")
public class LoyaltyController {

    private final LoyaltyService loyaltyService;

    public LoyaltyController(LoyaltyService loyaltyService) {
        this.loyaltyService = loyaltyService;
    }

    @GetMapping("/profile/{userId}")
    public ResponseEntity<User> getProfile(@PathVariable UUID userId) {
        return ResponseEntity.ok(loyaltyService.getUser(userId));
    }

    @PostMapping("/earn/{userId}")
    public ResponseEntity<User> earnPoints(@PathVariable UUID userId, @RequestParam int points) {
        User updatedUser = loyaltyService.addPoints(userId, points);
        return ResponseEntity.ok(updatedUser);
    }
    
    @PostMapping("/redeem/{userId}")
    public ResponseEntity<String> redeemPoints(@PathVariable UUID userId, @RequestParam int cost) {
        boolean success = loyaltyService.redeemPoints(userId, cost);
        if (success) {
            return ResponseEntity.ok("Points redeemed successfully");
        } else {
            return ResponseEntity.badRequest().body("Insufficient points");
        }
    }
}
