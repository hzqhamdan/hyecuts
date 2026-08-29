package com.hyecuts.loyalty.service;

import com.hyecuts.loyalty.exception.EmailAlreadyInUseException;
import com.hyecuts.loyalty.exception.UsernameAlreadyInUseException;
import com.hyecuts.loyalty.model.AdminAuditLog;
import com.hyecuts.loyalty.model.Tier;
import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.repository.AdminAuditLogRepository;
import com.hyecuts.loyalty.repository.UserRepository;
import com.hyecuts.loyalty.web.UpdateProfileRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class LoyaltyServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private GlobalSettingsService globalSettingsService;

    @Mock
    private AdminAuditLogRepository adminAuditLogRepository;

    @InjectMocks
    private LoyaltyService loyaltyService;

    private User testUser;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        testUser = new User();
        testUser.setId(userId);
        testUser.setCurrentPoints(0);
        testUser.setLifetimePoints(0);
        testUser.setTier(Tier.MEMBER);
        testUser.setEmail("original@hyecuts.com");
        testUser.setUsername("original");
    }

    @Test
    void addPoints_shouldUpdatePointsAndTier() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        // testUser starts at Tier.MEMBER, which never earns the Insider bonus,
        // so addPointsToUser short-circuits past globalSettingsService and this
        // stub is never consulted — don't declare it.
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User updatedUser = loyaltyService.addPoints(userId, 120);

        assertEquals(120, updatedUser.getCurrentPoints());
        assertEquals(120, updatedUser.getLifetimePoints());
        assertEquals(Tier.INSIDER, updatedUser.getTier());
        verify(userRepository).save(testUser);
    }

    @Test
    void addPoints_shouldMoveToArtisanTier() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        // Same as above: MEMBER tier never reaches the bonus lookup.
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User updatedUser = loyaltyService.addPoints(userId, 350);

        assertEquals(350, updatedUser.getCurrentPoints());
        assertEquals(Tier.ARTISAN, updatedUser.getTier());
    }

    @Test
    void addPoints_shouldApplyInsiderBonus() {
        testUser.setTier(Tier.INSIDER);
        testUser.setLifetimePoints(100);
        testUser.setCurrentPoints(100);
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(globalSettingsService.getInsiderBonusPercent()).thenReturn(10);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // 25 points + 10% = 27 (25 + 2 = 27)
        User updatedUser = loyaltyService.addPoints(userId, 25);

        assertEquals(127, updatedUser.getCurrentPoints());
        assertEquals(127, updatedUser.getLifetimePoints());
        // 100 + 27 = 127 lifetime points is still under the Artisan threshold (350).
        assertEquals(Tier.INSIDER, updatedUser.getTier());
    }

    @Test
    void addPoints_shouldMoveToConnoisseur() {
        testUser.setLifetimePoints(350);
        testUser.setCurrentPoints(350);
        testUser.setTier(Tier.ARTISAN);
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(globalSettingsService.getInsiderBonusPercent()).thenReturn(10);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User updatedUser = loyaltyService.addPoints(userId, 400);

        // 400 + 10% = 440, total = 350 + 440 = 790
        assertEquals(790, updatedUser.getCurrentPoints());
        assertEquals(Tier.CONNOISSEUR, updatedUser.getTier());
    }

    @Test
    void redeemPoints_shouldDeductPointsWhenSufficient() {
        // redeemPoints now spends via a single atomic conditional UPDATE
        // (see UserRepository#deductPointsIfSufficient) rather than a
        // read-then-write, so this only needs to stub that query's result.
        when(userRepository.deductPointsIfSufficient(userId, 200)).thenReturn(1);

        boolean success = loyaltyService.redeemPoints(userId, 200);

        assertTrue(success);
    }

    @Test
    void redeemPoints_shouldFailWhenInsufficientPoints() {
        when(userRepository.deductPointsIfSufficient(userId, 200)).thenReturn(0);

        boolean success = loyaltyService.redeemPoints(userId, 200);

        assertFalse(success);
    }

    @Test
    void redeemPoints_shouldRejectNegativeCostWithoutTouchingRepository() {
        boolean success = loyaltyService.redeemPoints(userId, -1000);

        assertFalse(success);
        verify(userRepository, never()).deductPointsIfSufficient(any(UUID.class), anyInt());
    }

    @Test
    void getUser_shouldThrowExceptionWhenNotFound() {
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> loyaltyService.getUser(userId));
    }

    @Test
    void overrideTier_shouldSetTierWithoutInflatingLifetimePoints() {
        // LOY-014: overriding a 0-point user to PATRON must not fabricate
        // 1500 lifetime points for them — the real total stays real.
        testUser.setCurrentPoints(0);
        testUser.setLifetimePoints(0);
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User updatedUser = loyaltyService.overrideTier(userId, "PATRON", null);

        assertEquals(Tier.PATRON, updatedUser.getTier());
        assertEquals(0, updatedUser.getLifetimePoints());
    }

    @Test
    void addPoints_shouldNotAutoDemoteBelowAnAdminOverriddenTier() {
        // LOY-014 follow-through: a user manually pinned to PATRON with real
        // lifetimePoints of 0 must not get silently demoted back to MEMBER by
        // the tier recompute on their very next earn.
        testUser.setTier(Tier.PATRON);
        testUser.setLifetimePoints(0);
        testUser.setCurrentPoints(0);
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User updatedUser = loyaltyService.addPoints(userId, 10);

        assertEquals(Tier.PATRON, updatedUser.getTier());
        assertEquals(10, updatedUser.getLifetimePoints());
    }

    @Test
    void addPoints_shouldStillPromoteWhenLifetimePointsExceedCurrentTier() {
        // Promotion must still work normally after the promote-only change.
        testUser.setTier(Tier.MEMBER);
        testUser.setLifetimePoints(0);
        testUser.setCurrentPoints(0);
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User updatedUser = loyaltyService.addPoints(userId, 120);

        assertEquals(Tier.INSIDER, updatedUser.getTier());
    }

    @Test
    void overrideTier_shouldThrowForInvalidTier() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

        assertThrows(RuntimeException.class, () -> loyaltyService.overrideTier(userId, "INVALID", null));
    }

    // =============== admin audit trail (ADM-002/ADM-003) ===============

    @Test
    void addPoints_shouldWriteAuditLogEntryAttributedToActor() {
        UUID actorId = UUID.randomUUID();
        User admin = new User();
        admin.setId(actorId);
        admin.setEmail("admin@hyecuts.com");

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(userRepository.findById(actorId)).thenReturn(Optional.of(admin));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        loyaltyService.addPoints(userId, 100, actorId);

        verify(adminAuditLogRepository).save(argThat(log ->
                log.getAction() == AdminAuditLog.AdminAction.POINTS_ADJUSTMENT
                        && actorId.equals(log.getActorId())
                        && "admin@hyecuts.com".equals(log.getActorEmail())
                        && userId.equals(log.getTargetUserId())));
    }

    @Test
    void addPoints_shouldAttributeSystemActorWhenNoneGiven() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        loyaltyService.addPoints(userId, 750);

        verify(adminAuditLogRepository).save(argThat(log ->
                log.getActorId() == null && "system".equals(log.getActorEmail())));
    }

    @Test
    void overrideTier_shouldWriteAuditLogEntryWithBeforeAndAfterTier() {
        UUID actorId = UUID.randomUUID();
        User admin = new User();
        admin.setId(actorId);
        admin.setEmail("admin@hyecuts.com");
        testUser.setTier(Tier.MEMBER);

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(userRepository.findById(actorId)).thenReturn(Optional.of(admin));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        loyaltyService.overrideTier(userId, "PATRON", actorId);

        verify(adminAuditLogRepository).save(argThat(log ->
                log.getAction() == AdminAuditLog.AdminAction.TIER_OVERRIDE
                        && log.getDetails().contains("MEMBER")
                        && log.getDetails().contains("PATRON")));
    }

    @Test
    void overrideTier_shouldNotWriteAuditLogEntryOnInvalidTier() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

        assertThrows(RuntimeException.class, () -> loyaltyService.overrideTier(userId, "INVALID", null));

        verifyNoInteractions(adminAuditLogRepository);
    }

    // =============== updateUser blank-field / conflict handling (PRF-003/004/008/009) ===============

    @Test
    void updateUser_shouldTreatBlankEmailAsNoChange() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        UpdateProfileRequest req = new UpdateProfileRequest(null, null, "   ", null, null, null, null);

        User updated = loyaltyService.updateUser(userId, req);

        assertEquals("original@hyecuts.com", updated.getEmail());
    }

    @Test
    void updateUser_shouldTreatBlankUsernameAsNoChange() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        UpdateProfileRequest req = new UpdateProfileRequest(null, "", null, null, null, null, null);

        User updated = loyaltyService.updateUser(userId, req);

        assertEquals("original", updated.getUsername());
    }

    @Test
    void updateUser_shouldThrowEmailAlreadyInUseWhenEmailTaken() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(userRepository.findByEmail("taken@hyecuts.com")).thenReturn(Optional.of(new User()));
        UpdateProfileRequest req = new UpdateProfileRequest(null, null, "taken@hyecuts.com", null, null, null, null);

        assertThrows(EmailAlreadyInUseException.class, () -> loyaltyService.updateUser(userId, req));
    }

    @Test
    void updateUser_shouldThrowUsernameAlreadyInUseWhenUsernameTaken() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(userRepository.findByUsername("taken")).thenReturn(Optional.of(new User()));
        UpdateProfileRequest req = new UpdateProfileRequest(null, "taken", null, null, null, null, null);

        assertThrows(UsernameAlreadyInUseException.class, () -> loyaltyService.updateUser(userId, req));
    }

    @Test
    void updateUser_shouldUpdateEmailAndUsernameWhenAvailable() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(userRepository.findByEmail("new@hyecuts.com")).thenReturn(Optional.empty());
        when(userRepository.findByUsername("newname")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        UpdateProfileRequest req = new UpdateProfileRequest(null, "newname", "new@hyecuts.com", null, null, null, null);

        User updated = loyaltyService.updateUser(userId, req);

        assertEquals("new@hyecuts.com", updated.getEmail());
        assertEquals("newname", updated.getUsername());
    }
}
