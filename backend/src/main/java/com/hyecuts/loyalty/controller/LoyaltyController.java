package com.hyecuts.loyalty.controller;

import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.security.AuthorizationUtil;
import com.hyecuts.loyalty.security.CustomUserDetails;
import com.hyecuts.loyalty.service.LoyaltyService;
import com.hyecuts.loyalty.web.UpdateProfileRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
    public ResponseEntity<User> getProfile(@PathVariable UUID userId, @AuthenticationPrincipal CustomUserDetails principal) {
        AuthorizationUtil.requireSelfOrAdmin(principal, userId);
        return ResponseEntity.ok(loyaltyService.getUser(userId));
    }

    @PutMapping("/profile/{userId}")
    public ResponseEntity<?> updateProfile(@PathVariable UUID userId, @Valid @RequestBody UpdateProfileRequest request, @AuthenticationPrincipal CustomUserDetails principal) {
        AuthorizationUtil.requireSelfOrAdmin(principal, userId);
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

    @DeleteMapping("/profile/{userId}")
    public ResponseEntity<Void> deleteAccount(@PathVariable UUID userId, @AuthenticationPrincipal CustomUserDetails principal) {
        AuthorizationUtil.requireSelfOrAdmin(principal, userId);
        loyaltyService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/earn/{userId}")
    public ResponseEntity<?> earnPoints(@PathVariable UUID userId, @RequestParam int points,
                                         @AuthenticationPrincipal CustomUserDetails principal) {
        // Unlike /admin/points/adjust (intentionally bidirectional, for
        // corrections), "earning" a negative amount is never meaningful — that's
        // effectively a stealth point deduction through the wrong endpoint.
        if (points < 0) {
            return ResponseEntity.badRequest().body("Points to earn must not be negative.");
        }
        User updatedUser = loyaltyService.addPoints(userId, points, principal.getId());
        return ResponseEntity.ok(updatedUser);
    }

    @PostMapping("/redeem/{userId}")
    public ResponseEntity<String> redeemPoints(@PathVariable UUID userId, @RequestParam int cost) {
        if (cost < 0) {
            return ResponseEntity.badRequest().body("Cost must not be negative.");
        }
        boolean success = loyaltyService.redeemPoints(userId, cost);
        if (success) {
            return ResponseEntity.ok("Points redeemed successfully");
        } else {
            return ResponseEntity.badRequest().body("Insufficient points");
        }
    }
}
