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
        User u = loyaltyService.updateUser(userId, request);
        
        // Return a flat map to avoid serialization issues with lazy relations
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("id", u.getId());
        response.put("email", u.getEmail());
        response.put("username", u.getUsername());
        response.put("fullName", u.getFullName());
        response.put("points", u.getCurrentPoints());

        response.put("tier", u.getTier() != null ? u.getTier().name() : "MEMBER");
        
        return ResponseEntity.ok(response);
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
