package com.hyecuts.loyalty.service;

import com.hyecuts.loyalty.exception.InvalidRequestException;
import com.hyecuts.loyalty.model.ActivityLog;
import com.hyecuts.loyalty.model.Badge;
import com.hyecuts.loyalty.model.Mission;
import com.hyecuts.loyalty.model.UserBadge;
import com.hyecuts.loyalty.model.UserMissionProgress;
import com.hyecuts.loyalty.repository.ActivityLogRepository;
import com.hyecuts.loyalty.repository.BadgeRepository;
import com.hyecuts.loyalty.repository.MissionRepository;
import com.hyecuts.loyalty.repository.UserBadgeRepository;
import com.hyecuts.loyalty.repository.UserMissionProgressRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.function.Executable;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GamificationServiceTest {

    @Mock private BadgeRepository badgeRepository;
    @Mock private UserBadgeRepository userBadgeRepository;
    @Mock private MissionRepository missionRepository;
    @Mock private UserMissionProgressRepository userMissionProgressRepository;
    @Mock private ActivityLogRepository activityLogRepository;

    @InjectMocks private GamificationService gamificationService;

    private final UUID userId = UUID.randomUUID();

    private static Badge badge(String name) {
        Badge badge = new Badge();
        badge.setName(name);
        return badge;
    }

    private static Mission mission(String title, String type) {
        Mission mission = new Mission();
        mission.setTitle(title);
        mission.setType(type);
        mission.setRewardPoints(50);
        mission.setRequiredCount(1);
        return mission;
    }

    private static void assertRejected(Executable call, String messageFragment) {
        InvalidRequestException ex = assertThrows(InvalidRequestException.class, call);
        assertTrue(ex.getMessage().contains(messageFragment), ex.getMessage());
    }

    @Test
    void getAllBadges_returnsEveryBadge() {
        List<Badge> badges = List.of(badge("First Cut"), badge("Regular"));
        when(badgeRepository.findAll()).thenReturn(badges);

        assertEquals(badges, gamificationService.getAllBadges());
    }

    @Test
    void getUserBadges_onlyQueriesTheGivenUsersBadges() {
        List<UserBadge> owned = List.of(new UserBadge());
        when(userBadgeRepository.findByUser_Id(userId)).thenReturn(owned);

        assertEquals(owned, gamificationService.getUserBadges(userId));
        verify(userBadgeRepository).findByUser_Id(userId);
        verifyNoMoreInteractions(userBadgeRepository);
    }

    @Test
    void getUserBadges_emptyWhenTheUserHasEarnedNone() {
        when(userBadgeRepository.findByUser_Id(userId)).thenReturn(List.of());

        assertTrue(gamificationService.getUserBadges(userId).isEmpty());
    }

    @Test
    void getMissionsByType_passesTheTypeThrough() {
        List<Mission> daily = List.of(mission("Book a cut", "DAILY"));
        when(missionRepository.findByType("DAILY")).thenReturn(daily);

        assertEquals(daily, gamificationService.getMissionsByType("DAILY"));
        verify(missionRepository).findByType("DAILY");
    }

    @Test
    void getMissionsByType_unknownTypeReturnsNothingRatherThanEveryMission() {
        when(missionRepository.findByType("YEARLY")).thenReturn(List.of());

        assertTrue(gamificationService.getMissionsByType("YEARLY").isEmpty());
        verify(missionRepository, never()).findAll();
    }

    @Test
    void getUserMissions_returnsThatUsersProgressIncludingCompletedMissions() {
        UserMissionProgress inProgress = new UserMissionProgress();
        UserMissionProgress completed = new UserMissionProgress();
        when(userMissionProgressRepository.findByUser_Id(userId)).thenReturn(List.of(inProgress, completed));

        assertEquals(List.of(inProgress, completed), gamificationService.getUserMissions(userId));
        verify(userMissionProgressRepository).findByUser_Id(userId);
        verifyNoMoreInteractions(userMissionProgressRepository);
    }

    @Test
    void getUserActivity_usesTheNewestFirstQueryForThatUser() {
        List<ActivityLog> activity = List.of(new ActivityLog(), new ActivityLog());
        when(activityLogRepository.findByUser_IdOrderByTimestampDesc(userId)).thenReturn(activity);

        assertEquals(activity, gamificationService.getUserActivity(userId));
        // Never the whole table: activity is per member.
        verify(activityLogRepository, never()).findAll();
        verify(activityLogRepository, never()).findAll(any(Pageable.class));
    }

    @Test
    void getAllActivityLogs_isPagedAndReturnsOnlyThePageContent() {
        Pageable pageable = PageRequest.of(2, 25);
        List<ActivityLog> page = List.of(new ActivityLog());
        when(activityLogRepository.findAll(pageable)).thenReturn(new PageImpl<>(page, pageable, 51));

        assertEquals(page, gamificationService.getAllActivityLogs(pageable));
        verify(activityLogRepository).findAll(pageable);
        verify(activityLogRepository, never()).findAll();
    }

    @Test
    void createBadge_savesAndReturnsThePersistedBadge() {
        Badge input = badge("Loyal");
        Badge saved = badge("Loyal");
        when(badgeRepository.save(input)).thenReturn(saved);

        assertSame(saved, gamificationService.createBadge(input));
    }

    @Test
    void createMission_savesAndReturnsThePersistedMission() {
        Mission input = mission("Refer a friend", "WEEKLY");
        Mission saved = mission("Refer a friend", "WEEKLY");
        when(missionRepository.save(input)).thenReturn(saved);

        assertSame(saved, gamificationService.createMission(input));
    }

    @Test
    void createBadge_trimsTheName() {
        when(badgeRepository.save(any(Badge.class))).thenAnswer(inv -> inv.getArgument(0));

        assertEquals("Loyal", gamificationService.createBadge(badge("  Loyal  ")).getName());
    }

    @Test
    void createBadge_rejectsAMissingOrBlankName() {
        assertRejected(() -> gamificationService.createBadge(badge(null)), "name is required");
        assertRejected(() -> gamificationService.createBadge(badge("   ")), "name is required");
        verify(badgeRepository, never()).save(any(Badge.class));
    }

    @Test
    void createBadge_rejectsADuplicateNameInAnyCasing() {
        when(badgeRepository.existsByNameIgnoreCase("first cut")).thenReturn(true);

        assertRejected(() -> gamificationService.createBadge(badge("first cut")), "already exists");
        verify(badgeRepository, never()).save(any(Badge.class));
    }

    @Test
    void createMission_normalisesTheTypeAndTrimsTheTitle() {
        when(missionRepository.save(any(Mission.class))).thenAnswer(inv -> inv.getArgument(0));

        Mission saved = gamificationService.createMission(mission("  Book a cut  ", " daily "));

        assertEquals("DAILY", saved.getType());
        assertEquals("Book a cut", saved.getTitle());
    }

    @Test
    void createMission_acceptsEachKnownType() {
        when(missionRepository.save(any(Mission.class))).thenAnswer(inv -> inv.getArgument(0));

        for (String type : List.of("DAILY", "WEEKLY", "QUEST")) {
            assertEquals(type, gamificationService.createMission(mission("M", type)).getType());
        }
    }

    @Test
    void createMission_rejectsAnUnknownOrMissingType() {
        assertRejected(() -> gamificationService.createMission(mission("M", "WEEKLEY")), "DAILY, WEEKLY or QUEST");
        assertRejected(() -> gamificationService.createMission(mission("M", null)), "DAILY, WEEKLY or QUEST");
        verify(missionRepository, never()).save(any(Mission.class));
    }

    @Test
    void createMission_rejectsAMissingTitle() {
        assertRejected(() -> gamificationService.createMission(mission(" ", "DAILY")), "title is required");
    }

    @Test
    void createMission_rejectsNegativeRewardPoints() {
        Mission m = mission("M", "DAILY");
        m.setRewardPoints(-10);
        assertRejected(() -> gamificationService.createMission(m), "Reward points");
    }

    @Test
    void createMission_allowsZeroRewardPoints() {
        when(missionRepository.save(any(Mission.class))).thenAnswer(inv -> inv.getArgument(0));
        Mission m = mission("M", "DAILY");
        m.setRewardPoints(0);

        assertEquals(0, gamificationService.createMission(m).getRewardPoints());
    }

    @Test
    void createMission_rejectsARequiredCountBelowOne() {
        Mission zero = mission("M", "DAILY");
        zero.setRequiredCount(0);
        Mission missing = mission("M", "DAILY");
        missing.setRequiredCount(null);

        assertRejected(() -> gamificationService.createMission(zero), "Required count");
        assertRejected(() -> gamificationService.createMission(missing), "Required count");
    }
}
