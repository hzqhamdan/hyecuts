package com.hyecuts.loyalty.controller;

import com.hyecuts.loyalty.exception.InvalidRequestException;
import com.hyecuts.loyalty.exception.ResourceNotFoundException;
import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.repository.VoucherRepository;
import com.hyecuts.loyalty.security.CustomUserDetails;
import com.hyecuts.loyalty.service.GamificationService;
import com.hyecuts.loyalty.service.LoyaltyService;
import com.hyecuts.loyalty.service.RewardService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Reward redemption used to return every exception's message as a 400, and
 * voucher fulfilment let rule failures fall through to the generic 500. Both
 * now map rule failures to 400, missing records to 404, and anything else to
 * a generic 500.
 */
@WebMvcTest(controllers = {RewardController.class, AdminController.class},
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.REGEX,
                pattern = "com\\.hyecuts\\.loyalty\\.security\\..*"))
@AutoConfigureMockMvc(addFilters = false)
class RewardErrorResponseTest {

    @Autowired private MockMvc mockMvc;

    @MockBean private RewardService rewardService;
    @MockBean private LoyaltyService loyaltyService;
    @MockBean private GamificationService gamificationService;
    @MockBean private VoucherRepository voucherRepository;

    private final UUID userId = UUID.randomUUID();

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    private void signIn(String role) {
        User user = new User();
        user.setId(userId);
        user.setEmail("someone@example.com");
        user.setRole(role);
        CustomUserDetails principal = new CustomUserDetails(user);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }

    @Test
    void redeem_ruleFailureReturns400WithItsMessage() throws Exception {
        signIn("ROLE_USER");
        when(rewardService.redeemReward(any(UUID.class), any(UUID.class)))
                .thenThrow(new InvalidRequestException("Insufficient points"));

        mockMvc.perform(post("/api/rewards/redeem/{userId}/{rewardId}", userId, UUID.randomUUID()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Insufficient points"));
    }

    @Test
    void redeem_missingRewardReturns404() throws Exception {
        signIn("ROLE_USER");
        when(rewardService.redeemReward(any(UUID.class), any(UUID.class)))
                .thenThrow(new ResourceNotFoundException("Reward not found"));

        mockMvc.perform(post("/api/rewards/redeem/{userId}/{rewardId}", userId, UUID.randomUUID()))
                .andExpect(status().isNotFound());
    }

    @Test
    void redeem_unexpectedFailureReturnsAGeneric500() throws Exception {
        signIn("ROLE_USER");
        when(rewardService.redeemReward(any(UUID.class), any(UUID.class)))
                .thenThrow(new IllegalStateException("Could not generate a unique voucher ID."));

        mockMvc.perform(post("/api/rewards/redeem/{userId}/{rewardId}", userId, UUID.randomUUID()))
                .andExpect(status().isInternalServerError())
                .andExpect(content().string(not(containsString("voucher ID"))));
    }

    @Test
    void redeem_forSomeoneElseIsStill403() throws Exception {
        signIn("ROLE_USER");

        mockMvc.perform(post("/api/rewards/redeem/{userId}/{rewardId}", UUID.randomUUID(), UUID.randomUUID()))
                .andExpect(status().isForbidden());
    }

    @Test
    void fulfil_alreadyRedeemedReturns400WithItsMessage() throws Exception {
        // This used to be a generic 500 "unexpected error" for staff.
        signIn("ROLE_ADMIN");
        when(rewardService.fulfillVoucher("V-1234567890"))
                .thenThrow(new InvalidRequestException("Voucher has already been redeemed."));

        mockMvc.perform(post("/api/admin/redemptions/{id}/fulfill", "V-1234567890"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Voucher has already been redeemed."));
    }

    @Test
    void fulfil_unknownVoucherReturns404() throws Exception {
        signIn("ROLE_ADMIN");
        when(rewardService.fulfillVoucher("V-MISSING"))
                .thenThrow(new ResourceNotFoundException("Voucher not found"));

        mockMvc.perform(post("/api/admin/redemptions/{id}/fulfill", "V-MISSING"))
                .andExpect(status().isNotFound());
    }
}
