package com.hyecuts.loyalty.controller;

import com.hyecuts.loyalty.model.LoyaltyProfile;
import com.hyecuts.loyalty.service.LoyaltyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/loyalty")
public class LoyaltyController {

    private final LoyaltyService loyaltyService;

    public LoyaltyController(LoyaltyService loyaltyService) {
        this.loyaltyService = loyaltyService;
    }

    @GetMapping("/profile/{userId}")
    public ResponseEntity<LoyaltyProfile> getProfile(@PathVariable String userId) {
        return ResponseEntity.ok(loyaltyService.getOrCreateProfile(userId));
    }

    @PostMapping("/earn/{userId}")
    public ResponseEntity<LoyaltyProfile> earnPoints(@PathVariable String userId, @RequestParam int points) {
        // Here we could add logic to ensure points come from a trusted source (e.g. appointment completion event)
        LoyaltyProfile updatedProfile = loyaltyService.addPoints(userId, points);
        return ResponseEntity.ok(updatedProfile);
    }
    
    @PostMapping("/redeem/{userId}")
    public ResponseEntity<String> redeemPoints(@PathVariable String userId, @RequestParam int cost) {
        boolean success = loyaltyService.redeemPoints(userId, cost);
        if (success) {
            return ResponseEntity.ok("Points redeemed successfully");
        } else {
            return ResponseEntity.badRequest().body("Insufficient points");
        }
    }
}
