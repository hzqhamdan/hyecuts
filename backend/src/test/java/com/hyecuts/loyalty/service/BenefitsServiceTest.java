package com.hyecuts.loyalty.service;

import com.hyecuts.loyalty.model.Tier;
import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.repository.RewardRepository;
import com.hyecuts.loyalty.repository.UserRepository;
import com.hyecuts.loyalty.repository.VoucherRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Birthday bonus eligibility and award. BenefitsService reads LocalDate.now()
 * directly, so "this month" and "this year" are taken from the same clock here.
 */
@ExtendWith(MockitoExtension.class)
class BenefitsServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private GlobalSettingsService globalSettingsService;

    @Mock
    private VoucherRepository voucherRepository;

    @Mock
    private RewardRepository rewardRepository;

    @InjectMocks
    private BenefitsService benefitsService;

    private final UUID userId = UUID.randomUUID();
    private User user;
    private int thisMonth;
    private int thisYear;

    @BeforeEach
    void setUp() {
        LocalDate today = LocalDate.now();
        thisMonth = today.getMonthValue();
        thisYear = today.getYear();

        user = new User();
        user.setId(userId);
        user.setTier(Tier.CONNOISSEUR);
        user.setBirthMonth(thisMonth);
        user.setCurrentPoints(800);
        user.setLifetimePoints(800);
    }

    private void userExists() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    }

    @ParameterizedTest
    @EnumSource(value = Tier.class, names = {"CONNOISSEUR", "PATRON"})
    void canRedeemBirthdayBonus_trueForAnEligibleTierInTheirBirthMonth(Tier tier) {
        user.setTier(tier);
        userExists();

        assertTrue(benefitsService.canRedeemBirthdayBonus(userId));
    }

    @ParameterizedTest
    @EnumSource(value = Tier.class, names = {"MEMBER", "INSIDER", "ARTISAN"})
    void canRedeemBirthdayBonus_falseForTiersBelowConnoisseur(Tier tier) {
        user.setTier(tier);
        userExists();

        assertFalse(benefitsService.canRedeemBirthdayBonus(userId));
    }

    @Test
    void canRedeemBirthdayBonus_falseWithNoTier() {
        user.setTier(null);
        userExists();

        assertFalse(benefitsService.canRedeemBirthdayBonus(userId));
    }

    @Test
    void canRedeemBirthdayBonus_falseOutsideTheBirthMonth() {
        user.setBirthMonth(thisMonth % 12 + 1);
        userExists();

        assertFalse(benefitsService.canRedeemBirthdayBonus(userId));
    }

    @Test
    void canRedeemBirthdayBonus_falseWhenNoBirthMonthIsOnFile() {
        user.setBirthMonth(null);
        userExists();

        assertFalse(benefitsService.canRedeemBirthdayBonus(userId));
    }

    @Test
    void canRedeemBirthdayBonus_falseWhenAlreadyAwardedThisYear() {
        user.setBirthdayBonusYear(thisYear);
        userExists();

        assertFalse(benefitsService.canRedeemBirthdayBonus(userId));
    }

    @Test
    void canRedeemBirthdayBonus_trueAgainTheYearAfterItWasAwarded() {
        user.setBirthdayBonusYear(thisYear - 1);
        userExists();

        assertTrue(benefitsService.canRedeemBirthdayBonus(userId));
    }

    @Test
    void canRedeemBirthdayBonus_throwsForAnUnknownUser() {
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> benefitsService.canRedeemBirthdayBonus(userId));
    }

    @Test
    void awardBirthdayBonus_addsTheConfiguredPointsAndRecordsTheYear() {
        userExists();
        when(globalSettingsService.getBirthdayBonusPoints()).thenReturn(100);

        int awarded = benefitsService.awardBirthdayBonus(userId);

        assertEquals(100, awarded);
        assertEquals(900, user.getCurrentPoints());
        assertEquals(900, user.getLifetimePoints());
        assertEquals(thisYear, user.getBirthdayBonusYear());
        verify(userRepository).save(user);
    }

    @Test
    void awardBirthdayBonus_doesNotDemoteATierAnAdminSetAboveThePoints() {
        // An admin made this member PATRON with only 800 lifetime points; the
        // bonus (800 -> 900) must not knock them down to CONNOISSEUR.
        user.setTier(Tier.PATRON);
        userExists();
        when(globalSettingsService.getBirthdayBonusPoints()).thenReturn(100);

        benefitsService.awardBirthdayBonus(userId);

        assertEquals(900, user.getLifetimePoints());
        assertEquals(Tier.PATRON, user.getTier());
    }

    @Test
    void awardBirthdayBonus_canPromoteATier() {
        user.setLifetimePoints(1450);
        userExists();
        when(globalSettingsService.getBirthdayBonusPoints()).thenReturn(100);

        benefitsService.awardBirthdayBonus(userId);

        assertEquals(Tier.PATRON, user.getTier());
    }

    @Test
    void awardBirthdayBonus_cannotBeClaimedTwiceInOneYear() {
        userExists();
        when(globalSettingsService.getBirthdayBonusPoints()).thenReturn(100);

        benefitsService.awardBirthdayBonus(userId);

        assertThrows(RuntimeException.class, () -> benefitsService.awardBirthdayBonus(userId));
        assertEquals(900, user.getCurrentPoints());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void awardBirthdayBonus_throwsAndSavesNothingWhenNotEligible() {
        user.setBirthMonth(thisMonth % 12 + 1);
        userExists();

        assertThrows(RuntimeException.class, () -> benefitsService.awardBirthdayBonus(userId));
        assertEquals(800, user.getCurrentPoints());
        verify(userRepository, never()).save(any(User.class));
        verify(globalSettingsService, never()).getBirthdayBonusPoints();
    }
}
