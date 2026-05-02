package com.hyecuts.loyalty.service;

import com.hyecuts.loyalty.model.Tier;
import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.repository.TierRepository;
import com.hyecuts.loyalty.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
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
    private TierRepository tierRepository;

    @InjectMocks
    private LoyaltyService loyaltyService;

    private User testUser;
    private UUID userId;
    private Tier rookieTier;
    private Tier regularTier;
    private Tier legendTier;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        testUser = new User();
        testUser.setId(userId);
        testUser.setCurrentPoints(0);
        testUser.setLifetimePoints(0);

        rookieTier = new Tier();
        rookieTier.setName("Rookie");
        rookieTier.setPointsRequired(0);

        regularTier = new Tier();
        regularTier.setName("Regular");
        regularTier.setPointsRequired(1000);

        legendTier = new Tier();
        legendTier.setName("Legend");
        legendTier.setPointsRequired(2500);

        testUser.setTier(rookieTier);
    }

    @Test
    void addPoints_shouldUpdatePointsAndTier() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(tierRepository.findAll()).thenReturn(Arrays.asList(rookieTier, regularTier, legendTier));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Add 1200 points - should move to "Regular" tier
        User updatedUser = loyaltyService.addPoints(userId, 1200);

        assertEquals(1200, updatedUser.getCurrentPoints());
        assertEquals(1200, updatedUser.getLifetimePoints());
        assertEquals("Regular", updatedUser.getTier().getName());
        verify(userRepository).save(testUser);
    }

    @Test
    void addPoints_shouldMoveToLegendTier() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(tierRepository.findAll()).thenReturn(Arrays.asList(rookieTier, regularTier, legendTier));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Add 3000 points - should move to "Legend" tier
        User updatedUser = loyaltyService.addPoints(userId, 3000);

        assertEquals(3000, updatedUser.getCurrentPoints());
        assertEquals("Legend", updatedUser.getTier().getName());
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
}
