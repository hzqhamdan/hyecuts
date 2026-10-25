package com.hyecuts.loyalty.service;

import com.hyecuts.loyalty.exception.InvalidRequestException;
import com.hyecuts.loyalty.model.ActivityLog;
import com.hyecuts.loyalty.model.Badge;
import com.hyecuts.loyalty.model.UserBadge;
import com.hyecuts.loyalty.model.Mission;
import com.hyecuts.loyalty.model.UserMissionProgress;
import com.hyecuts.loyalty.repository.ActivityLogRepository;
import com.hyecuts.loyalty.repository.BadgeRepository;
import com.hyecuts.loyalty.repository.UserBadgeRepository;
import com.hyecuts.loyalty.repository.MissionRepository;
import com.hyecuts.loyalty.repository.UserMissionProgressRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class GamificationService {
    
    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final MissionRepository missionRepository;
    private final UserMissionProgressRepository userMissionProgressRepository;
    private final ActivityLogRepository activityLogRepository;

    public GamificationService(BadgeRepository badgeRepository, 
                               UserBadgeRepository userBadgeRepository,
                               MissionRepository missionRepository,
                               UserMissionProgressRepository userMissionProgressRepository,
                               ActivityLogRepository activityLogRepository) {
        this.badgeRepository = badgeRepository;
        this.userBadgeRepository = userBadgeRepository;
        this.missionRepository = missionRepository;
        this.userMissionProgressRepository = userMissionProgressRepository;
        this.activityLogRepository = activityLogRepository;
    }

    public List<Badge> getAllBadges() {
        return badgeRepository.findAll();
    }
    
    public List<UserBadge> getUserBadges(UUID userId) {
        return userBadgeRepository.findByUser_Id(userId);
    }
    
    public List<Mission> getMissionsByType(String type) {
        return missionRepository.findByType(type);
    }

    public List<UserMissionProgress> getUserMissions(UUID userId) {
        return userMissionProgressRepository.findByUser_Id(userId);
    }

    public List<ActivityLog> getUserActivity(UUID userId) {
        return activityLogRepository.findByUser_IdOrderByTimestampDesc(userId);
    }

    // Was an unbounded findAll() over the entire activity-log table.
    public List<ActivityLog> getAllActivityLogs(Pageable pageable) {
        return activityLogRepository.findAll(pageable).getContent();
    }

    // The mission types the app understands; the lounge lists DAILY and WEEKLY.
    private static final Set<String> MISSION_TYPES = Set.of("DAILY", "WEEKLY", "QUEST");

    // GAM-001: badges and missions used to be saved as-is — a nameless or
    // duplicate badge, a mission with a typo'd type (never shown anywhere),
    // negative reward points or a zero required count all went straight in.
    public Badge createBadge(Badge badge) {
        if (badge.getName() == null || badge.getName().isBlank()) {
            throw new InvalidRequestException("Badge name is required.");
        }
        String name = badge.getName().trim();
        if (badgeRepository.existsByNameIgnoreCase(name)) {
            throw new InvalidRequestException("A badge named \"" + name + "\" already exists.");
        }
        badge.setName(name);
        return badgeRepository.save(badge);
    }

    public Mission createMission(Mission mission) {
        if (mission.getTitle() == null || mission.getTitle().isBlank()) {
            throw new InvalidRequestException("Mission title is required.");
        }
        String type = mission.getType() == null ? "" : mission.getType().trim().toUpperCase(Locale.ROOT);
        if (!MISSION_TYPES.contains(type)) {
            throw new InvalidRequestException("Mission type must be one of DAILY, WEEKLY or QUEST.");
        }
        if (mission.getRewardPoints() == null || mission.getRewardPoints() < 0) {
            throw new InvalidRequestException("Reward points must be zero or more.");
        }
        if (mission.getRequiredCount() == null || mission.getRequiredCount() < 1) {
            throw new InvalidRequestException("Required count must be at least 1.");
        }
        mission.setTitle(mission.getTitle().trim());
        mission.setType(type);
        return missionRepository.save(mission);
    }
}
