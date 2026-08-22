package com.hyecuts.loyalty.service;

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

    // Creating entities
    public Badge createBadge(Badge badge) {
        return badgeRepository.save(badge);
    }

    public Mission createMission(Mission mission) {
        return missionRepository.save(mission);
    }
}
