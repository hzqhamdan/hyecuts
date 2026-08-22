package com.hyecuts.loyalty.service;

import com.hyecuts.loyalty.model.Tier;
import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.repository.UserRepository;
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
    void overrideTier_shouldUpdateTierAndLifetimePoints() {
        testUser.setCurrentPoints(0);
        testUser.setLifetimePoints(0);
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User updatedUser = loyaltyService.overrideTier(userId, "PATRON");

        assertEquals(Tier.PATRON, updatedUser.getTier());
        assertEquals(1500, updatedUser.getLifetimePoints());
    }

    @Test
    void overrideTier_shouldThrowForInvalidTier() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

        assertThrows(RuntimeException.class, () -> loyaltyService.overrideTier(userId, "INVALID"));
    }
}
