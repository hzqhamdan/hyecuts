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
        when(globalSettingsService.getInsiderBonusPercent()).thenReturn(0);
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
        when(globalSettingsService.getInsiderBonusPercent()).thenReturn(0);
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
        assertEquals(Tier.ARTISAN, updatedUser.getTier());
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
        testUser.setCurrentPoints(500);
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        boolean success = loyaltyService.redeemPoints(userId, 200);

        assertTrue(success);
        assertEquals(300, testUser.getCurrentPoints());
        verify(userRepository).save(testUser);
    }

    @Test
    void redeemPoints_shouldFailWhenInsufficientPoints() {
        testUser.setCurrentPoints(100);
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

        boolean success = loyaltyService.redeemPoints(userId, 200);

        assertFalse(success);
        assertEquals(100, testUser.getCurrentPoints());
        verify(userRepository, never()).save(any(User.class));
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
