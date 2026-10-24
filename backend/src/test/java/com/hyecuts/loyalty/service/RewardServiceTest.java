package com.hyecuts.loyalty.service;

import com.hyecuts.loyalty.model.ActivityLog;
import com.hyecuts.loyalty.model.Reward;
import com.hyecuts.loyalty.model.Tier;
import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.model.Voucher;
import com.hyecuts.loyalty.repository.ActivityLogRepository;
import com.hyecuts.loyalty.repository.RewardRepository;
import com.hyecuts.loyalty.repository.UserRepository;
import com.hyecuts.loyalty.repository.VoucherRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RewardServiceTest {

    @Mock
    private RewardRepository rewardRepository;

    @Mock
    private VoucherRepository voucherRepository;

    @Mock
    private LoyaltyService loyaltyService;

    @Mock
    private ActivityLogRepository activityLogRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private RewardService rewardService;

    private Voucher voucher;
    private final UUID userId = UUID.randomUUID();
    private final UUID rewardId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        voucher = new Voucher();
        voucher.setId("V-TESTVOUCHER");
        voucher.setStatus(Voucher.VoucherStatus.ACTIVE);
    }

    @Test
    void fulfillVoucher_shouldReturnThePostUpdateState() {
        // RW-024/TEST-001: this used to discard the return value and only
        // verify the mock, so it passed while the caller was handed a stale
        // ACTIVE voucher. The two findById stubs model what the DB actually
        // holds either side of the write, so returning the pre-update entity
        // instead of re-reading now fails here.
        Voucher redeemed = new Voucher();
        redeemed.setId("V-TESTVOUCHER");
        redeemed.setStatus(Voucher.VoucherStatus.REDEEMED);
        redeemed.setRedeemedAt(LocalDateTime.now());

        when(voucherRepository.findById("V-TESTVOUCHER"))
                .thenReturn(Optional.of(voucher))    // read before the update
                .thenReturn(Optional.of(redeemed));  // re-read after it
        when(voucherRepository.fulfillIfActive(eq("V-TESTVOUCHER"), any(LocalDateTime.class)))
                .thenReturn(1);

        Voucher result = rewardService.fulfillVoucher("V-TESTVOUCHER");

        assertEquals(Voucher.VoucherStatus.REDEEMED, result.getStatus());
        assertNotNull(result.getRedeemedAt());
        verify(voucherRepository, times(2)).findById("V-TESTVOUCHER");
    }

    @Test
    void fulfillVoucher_shouldThrowWhenAlreadyRedeemed() {
        voucher.setStatus(Voucher.VoucherStatus.REDEEMED);
        when(voucherRepository.findById("V-TESTVOUCHER"))
                .thenReturn(Optional.of(voucher));
        when(voucherRepository.fulfillIfActive(eq("V-TESTVOUCHER"), any(LocalDateTime.class)))
                .thenReturn(0);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> rewardService.fulfillVoucher("V-TESTVOUCHER"));
        assertTrue(ex.getMessage().toLowerCase().contains("already"));
    }

    @Test
    void fulfillVoucher_shouldThrowWhenExpired() {
        voucher.setExpiresAt(LocalDateTime.now().minusDays(1));
        when(voucherRepository.findById("V-TESTVOUCHER"))
                .thenReturn(Optional.of(voucher));
        when(voucherRepository.fulfillIfActive(eq("V-TESTVOUCHER"), any(LocalDateTime.class)))
                .thenReturn(0);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> rewardService.fulfillVoucher("V-TESTVOUCHER"));
        assertTrue(ex.getMessage().toLowerCase().contains("expired"));
    }

    @Test
    void fulfillVoucher_shouldThrowWhenNotFound() {
        when(voucherRepository.findById("V-MISSING")).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> rewardService.fulfillVoucher("V-MISSING"));
        verify(voucherRepository, never()).fulfillIfActive(anyString(), any(LocalDateTime.class));
    }

    private Reward reward(Integer stockCount, String minTier) {
        Reward reward = new Reward();
        reward.setId(rewardId);
        reward.setTitle("Free Hair Wash");
        reward.setPointsCost(300);
        reward.setIsActive(true);
        reward.setStockCount(stockCount);
        reward.setMinTier(minTier);
        return reward;
    }

    private User member(Tier tier) {
        User user = new User();
        user.setId(userId);
        user.setTier(tier);
        return user;
    }

    private void assertNothingRedeemed() {
        verify(voucherRepository, never()).save(any(Voucher.class));
        verify(activityLogRepository, never()).save(any(ActivityLog.class));
    }

    @Test
    void redeemReward_shouldIssueAnActiveVoucherAndLogTheSpend() {
        Reward reward = reward(5, null);
        User user = member(Tier.MEMBER);
        when(rewardRepository.findById(rewardId)).thenReturn(Optional.of(reward));
        when(loyaltyService.getUser(userId)).thenReturn(user);
        when(rewardRepository.decrementStockIfAvailable(rewardId)).thenReturn(1);
        when(loyaltyService.redeemPoints(userId, 300)).thenReturn(true);

        assertEquals("SUCCESS", rewardService.redeemReward(userId, rewardId));

        ArgumentCaptor<Voucher> voucher = ArgumentCaptor.forClass(Voucher.class);
        verify(voucherRepository).save(voucher.capture());
        assertEquals(Voucher.VoucherStatus.ACTIVE, voucher.getValue().getStatus());
        assertSame(user, voucher.getValue().getUser());
        assertSame(reward, voucher.getValue().getReward());
        // RW-015: the id column is 12 chars — "V-" plus 10 hex characters.
        assertTrue(voucher.getValue().getId().matches("V-[0-9A-F]{10}"), voucher.getValue().getId());

        ArgumentCaptor<ActivityLog> log = ArgumentCaptor.forClass(ActivityLog.class);
        verify(activityLogRepository).save(log.capture());
        assertEquals(ActivityLog.TransactionType.REWARD_REDEMPTION, log.getValue().getActionType());
        assertEquals(-300, log.getValue().getPointsEarned());
    }

    @Test
    void redeemReward_shouldNotTouchStockForAnUnlimitedReward() {
        when(rewardRepository.findById(rewardId)).thenReturn(Optional.of(reward(null, null)));
        when(loyaltyService.getUser(userId)).thenReturn(member(Tier.MEMBER));
        when(loyaltyService.redeemPoints(userId, 300)).thenReturn(true);

        rewardService.redeemReward(userId, rewardId);

        verify(rewardRepository, never()).decrementStockIfAvailable(any(UUID.class));
        verify(voucherRepository).save(any(Voucher.class));
    }

    @Test
    void redeemReward_shouldThrowWhenRewardNotFound() {
        when(rewardRepository.findById(rewardId)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> rewardService.redeemReward(userId, rewardId));
        verify(loyaltyService, never()).redeemPoints(any(UUID.class), anyInt());
        assertNothingRedeemed();
    }

    @Test
    void redeemReward_shouldRejectAnInactiveRewardBeforeSpendingAnything() {
        Reward reward = reward(5, null);
        reward.setIsActive(false);
        when(rewardRepository.findById(rewardId)).thenReturn(Optional.of(reward));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> rewardService.redeemReward(userId, rewardId));
        assertTrue(ex.getMessage().contains("no longer available"));
        verify(rewardRepository, never()).decrementStockIfAvailable(any(UUID.class));
        verify(loyaltyService, never()).redeemPoints(any(UUID.class), anyInt());
        assertNothingRedeemed();
    }

    @Test
    void redeemReward_shouldRejectAUserBelowTheMinimumTier() {
        when(rewardRepository.findById(rewardId)).thenReturn(Optional.of(reward(5, "CONNOISSEUR")));
        when(loyaltyService.getUser(userId)).thenReturn(member(Tier.ARTISAN));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> rewardService.redeemReward(userId, rewardId));
        assertTrue(ex.getMessage().contains("tier"));
        verify(rewardRepository, never()).decrementStockIfAvailable(any(UUID.class));
        verify(loyaltyService, never()).redeemPoints(any(UUID.class), anyInt());
        assertNothingRedeemed();
    }

    @Test
    void redeemReward_shouldAllowAUserExactlyAtTheMinimumTier() {
        when(rewardRepository.findById(rewardId)).thenReturn(Optional.of(reward(null, "connoisseur")));
        when(loyaltyService.getUser(userId)).thenReturn(member(Tier.CONNOISSEUR));
        when(loyaltyService.redeemPoints(userId, 300)).thenReturn(true);

        assertEquals("SUCCESS", rewardService.redeemReward(userId, rewardId));
    }

    @Test
    void redeemReward_shouldRejectAUserWithNoTierWhenOneIsRequired() {
        when(rewardRepository.findById(rewardId)).thenReturn(Optional.of(reward(null, "INSIDER")));
        when(loyaltyService.getUser(userId)).thenReturn(member(null));

        assertThrows(RuntimeException.class, () -> rewardService.redeemReward(userId, rewardId));
        assertNothingRedeemed();
    }

    @Test
    void redeemReward_shouldFailClosedOnAnUnrecognisedMinimumTier() {
        // A typo in minTier must not open the reward to everyone — it is
        // treated as PATRON-only.
        when(rewardRepository.findById(rewardId)).thenReturn(Optional.of(reward(null, "GOLD")));
        when(loyaltyService.getUser(userId)).thenReturn(member(Tier.CONNOISSEUR));

        assertThrows(RuntimeException.class, () -> rewardService.redeemReward(userId, rewardId));
        assertNothingRedeemed();
    }

    @Test
    void redeemReward_unrecognisedMinimumTierShouldStillAdmitAPatron() {
        when(rewardRepository.findById(rewardId)).thenReturn(Optional.of(reward(null, "GOLD")));
        when(loyaltyService.getUser(userId)).thenReturn(member(Tier.PATRON));
        when(loyaltyService.redeemPoints(userId, 300)).thenReturn(true);

        assertEquals("SUCCESS", rewardService.redeemReward(userId, rewardId));
    }

    @Test
    void redeemReward_shouldThrowOutOfStockWithoutSpendingPoints() {
        when(rewardRepository.findById(rewardId)).thenReturn(Optional.of(reward(0, null)));
        when(loyaltyService.getUser(userId)).thenReturn(member(Tier.MEMBER));
        when(rewardRepository.decrementStockIfAvailable(rewardId)).thenReturn(0);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> rewardService.redeemReward(userId, rewardId));
        assertEquals("Out of stock", ex.getMessage());
        verify(loyaltyService, never()).redeemPoints(any(UUID.class), anyInt());
        assertNothingRedeemed();
    }

    @Test
    void redeemReward_shouldThrowOnInsufficientPointsWithoutIssuingAVoucher() {
        // The stock decrement before this is undone by the @Transactional
        // rollback when the exception propagates.
        when(rewardRepository.findById(rewardId)).thenReturn(Optional.of(reward(5, null)));
        when(loyaltyService.getUser(userId)).thenReturn(member(Tier.MEMBER));
        when(rewardRepository.decrementStockIfAvailable(rewardId)).thenReturn(1);
        when(loyaltyService.redeemPoints(userId, 300)).thenReturn(false);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> rewardService.redeemReward(userId, rewardId));
        assertEquals("Insufficient points", ex.getMessage());
        assertNothingRedeemed();
    }

    @Test
    void redeemReward_secondRedeemOfTheLastUnitShouldFail() {
        // The conditional UPDATE lets exactly one caller claim the last unit.
        when(rewardRepository.findById(rewardId)).thenReturn(Optional.of(reward(1, null)));
        when(loyaltyService.getUser(userId)).thenReturn(member(Tier.MEMBER));
        when(rewardRepository.decrementStockIfAvailable(rewardId)).thenReturn(1).thenReturn(0);
        when(loyaltyService.redeemPoints(userId, 300)).thenReturn(true);

        assertEquals("SUCCESS", rewardService.redeemReward(userId, rewardId));
        assertThrows(RuntimeException.class, () -> rewardService.redeemReward(userId, rewardId));

        verify(loyaltyService, times(1)).redeemPoints(userId, 300);
        verify(voucherRepository, times(1)).save(any(Voucher.class));
    }

    @Test
    void redeemReward_shouldRetryTheVoucherIdOnACollision() {
        when(rewardRepository.findById(rewardId)).thenReturn(Optional.of(reward(null, null)));
        when(loyaltyService.getUser(userId)).thenReturn(member(Tier.MEMBER));
        when(loyaltyService.redeemPoints(userId, 300)).thenReturn(true);
        when(voucherRepository.existsById(anyString())).thenReturn(true).thenReturn(false);

        rewardService.redeemReward(userId, rewardId);

        verify(voucherRepository, times(2)).existsById(anyString());
        verify(voucherRepository).save(any(Voucher.class));
    }

    @Test
    void redeemReward_shouldGiveUpRatherThanReuseAnIdAfterRepeatedCollisions() {
        when(rewardRepository.findById(rewardId)).thenReturn(Optional.of(reward(null, null)));
        when(loyaltyService.getUser(userId)).thenReturn(member(Tier.MEMBER));
        when(loyaltyService.redeemPoints(userId, 300)).thenReturn(true);
        when(voucherRepository.existsById(anyString())).thenReturn(true);

        assertThrows(IllegalStateException.class, () -> rewardService.redeemReward(userId, rewardId));
        verify(voucherRepository, never()).save(any(Voucher.class));
    }
}
