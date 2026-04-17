package com.hyecuts.loyalty.controller;

import com.hyecuts.loyalty.model.ActivityLog;
import com.hyecuts.loyalty.model.Badge;
import com.hyecuts.loyalty.model.UserBadge;
import com.hyecuts.loyalty.model.Mission;
import com.hyecuts.loyalty.model.UserMissionProgress;
import com.hyecuts.loyalty.service.GamificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/gamification")
public class GamificationController {

    private final GamificationService gamificationService;

    public GamificationController(GamificationService gamificationService) {
        this.gamificationService = gamificationService;
    }

    // Badges endpoints
    @GetMapping("/badges")
    public ResponseEntity<List<Badge>> getAllBadges() {
        return ResponseEntity.ok(gamificationService.getAllBadges());
    }

    @PostMapping("/badges")
    public ResponseEntity<Badge> createBadge(@RequestBody Badge badge) {
        return ResponseEntity.ok(gamificationService.createBadge(badge));
    }

    @GetMapping("/badges/{userId}")
    public ResponseEntity<List<UserBadge>> getUserBadges(@PathVariable String userId) {
        return ResponseEntity.ok(gamificationService.getUserBadges(userId));
    }

    // Missions endpoints
    @GetMapping("/missions/type/{type}")
    public ResponseEntity<List<Mission>> getMissionsByType(@PathVariable String type) {
        return ResponseEntity.ok(gamificationService.getMissionsByType(type));
    }

    @PostMapping("/missions")
    public ResponseEntity<Mission> createMission(@RequestBody Mission mission) {
        return ResponseEntity.ok(gamificationService.createMission(mission));
    }

    @GetMapping("/missions/{userId}")
    public ResponseEntity<List<UserMissionProgress>> getUserMissions(@PathVariable String userId) {
        return ResponseEntity.ok(gamificationService.getUserMissions(userId));
    }

    // Activity History endpoint
    @GetMapping("/activity/{userId}")
    public ResponseEntity<List<ActivityLog>> getUserActivity(@PathVariable String userId) {
        return ResponseEntity.ok(gamificationService.getUserActivity(userId));
    }
}
