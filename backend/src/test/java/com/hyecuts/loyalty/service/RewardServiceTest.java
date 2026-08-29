package com.hyecuts.loyalty.service;

import com.hyecuts.loyalty.model.Voucher;
import com.hyecuts.loyalty.repository.ActivityLogRepository;
import com.hyecuts.loyalty.repository.RewardRepository;
import com.hyecuts.loyalty.repository.UserRepository;
import com.hyecuts.loyalty.repository.VoucherRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

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
}
