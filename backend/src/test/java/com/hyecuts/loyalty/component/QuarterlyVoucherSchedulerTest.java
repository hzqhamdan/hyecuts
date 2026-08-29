package com.hyecuts.loyalty.component;

import com.hyecuts.loyalty.model.Reward;
import com.hyecuts.loyalty.model.Tier;
import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.model.Voucher;
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
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class QuarterlyVoucherSchedulerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RewardRepository rewardRepository;

    @Mock
    private VoucherRepository voucherRepository;

    @InjectMocks
    private QuarterlyVoucherScheduler scheduler;

    private Reward reward;
    private User patron;

    @BeforeEach
    void setUp() {
        reward = new Reward();
        reward.setId(UUID.randomUUID());
        reward.setTitle("Quarterly Complimentary Service");

        patron = new User();
        patron.setId(UUID.randomUUID());
        patron.setTier(Tier.PATRON);
    }

    @Test
    void issueQuarterlyVouchers_shouldSkipWhenRewardNotFound() {
        when(rewardRepository.findByTitle("Quarterly Complimentary Service")).thenReturn(Optional.empty());

        scheduler.issueQuarterlyVouchers();

        verifyNoInteractions(userRepository, voucherRepository);
    }

    @Test
    void issueQuarterlyVouchers_shouldIssueVoucherWhenMarkSucceeds() {
        when(rewardRepository.findByTitle("Quarterly Complimentary Service")).thenReturn(Optional.of(reward));
        when(userRepository.findByTier(Tier.PATRON)).thenReturn(List.of(patron));
        when(userRepository.markQuarterlyVoucherIssued(eq(patron.getId()), anyString())).thenReturn(1);

        scheduler.issueQuarterlyVouchers();

        ArgumentCaptor<Voucher> captor = ArgumentCaptor.forClass(Voucher.class);
        verify(voucherRepository).save(captor.capture());
        assertEquals(patron, captor.getValue().getUser());
        assertEquals(reward, captor.getValue().getReward());
    }

    @Test
    void issueQuarterlyVouchers_shouldSkipWhenMarkFails() {
        // SCH-004: a 0 here means either this patron already got a voucher
        // this quarter, or a concurrent scheduler replica just claimed the
        // row — either way, don't issue a second voucher.
        when(rewardRepository.findByTitle("Quarterly Complimentary Service")).thenReturn(Optional.of(reward));
        when(userRepository.findByTier(Tier.PATRON)).thenReturn(List.of(patron));
        when(userRepository.markQuarterlyVoucherIssued(eq(patron.getId()), anyString())).thenReturn(0);

        scheduler.issueQuarterlyVouchers();

        verifyNoInteractions(voucherRepository);
    }

    @Test
    void expireStaleVouchers_shouldDelegateToBulkUpdate() {
        when(voucherRepository.expireStaleVouchers(any(LocalDateTime.class))).thenReturn(3);

        scheduler.expireStaleVouchers();

        verify(voucherRepository).expireStaleVouchers(any(LocalDateTime.class));
    }
}
