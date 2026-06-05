package com.hyecuts.loyalty.controller;

import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.service.LoyaltyService;
import com.hyecuts.loyalty.web.UpdateProfileRequest;
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

    @PutMapping("/profile/{userId}")
    public ResponseEntity<?> updateProfile(@PathVariable UUID userId, @RequestBody UpdateProfileRequest request) {
        try {
            User updated = loyaltyService.updateUser(userId, request);
            return ResponseEntity.ok(updated);
        } catch (Throwable t) {
            System.err.println("[CRITICAL-PROFILE-ERROR] " + t.getMessage());
            t.printStackTrace();
            
            java.util.Map<String, Object> error = new java.util.HashMap<>();
            error.put("timestamp", java.time.Instant.now().toString());
            error.put("status", 500);
            error.put("error", "Internal Server Error");
            error.put("message", "Profile update failed: " + t.getMessage());
            error.put("cause", t.getCause() != null ? t.getCause().getMessage() : "Unknown");
            
            return ResponseEntity.status(500).body(error);
        }
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
