package com.hyecuts.loyalty.controller;

import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.repository.UserRepository;
import com.hyecuts.loyalty.security.CustomUserDetails;
import com.hyecuts.loyalty.security.RateLimitGuard;
import com.hyecuts.loyalty.service.BarberServiceService;
import com.hyecuts.loyalty.service.BookingService;
import com.hyecuts.loyalty.service.RewardService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * A lost @Version race (LOY-021) surfaces at commit, inside the service call,
 * where these controllers' catch-alls used to turn it into a 400 carrying
 * Hibernate's message (entity name and id). It must reach the global 409
 * handler instead.
 */
@WebMvcTest(controllers = {BookingController.class, RewardController.class},
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.REGEX,
                pattern = "com\\.hyecuts\\.loyalty\\.security\\..*"))
@AutoConfigureMockMvc(addFilters = false)
class ConcurrentUpdateResponseTest {

    @Autowired private MockMvc mockMvc;

    @MockBean private BookingService bookingService;
    @MockBean private RewardService rewardService;
    @MockBean private UserRepository userRepository;
    @MockBean private BarberServiceService barberServiceService;
    @MockBean private RateLimitGuard rateLimitGuard;

    private static ObjectOptimisticLockingFailureException conflict() {
        return new ObjectOptimisticLockingFailureException("com.hyecuts.loyalty.model.User", UUID.randomUUID());
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void completeBooking_returns409WithoutTheRawMessage() throws Exception {
        when(bookingService.completeBooking(any(UUID.class))).thenThrow(conflict());

        mockMvc.perform(put("/api/bookings/{id}/complete", UUID.randomUUID()))
                .andExpect(status().isConflict())
                .andExpect(content().string(not(containsString("com.hyecuts"))));
    }

    @Test
    void markNoShow_returns409() throws Exception {
        when(bookingService.markNoShow(any(UUID.class))).thenThrow(conflict());

        mockMvc.perform(put("/api/bookings/{id}/no-show", UUID.randomUUID()))
                .andExpect(status().isConflict());
    }

    @Test
    void ordinaryServiceErrorsStillReturn400WithTheirMessage() throws Exception {
        when(bookingService.completeBooking(any(UUID.class)))
                .thenThrow(new com.hyecuts.loyalty.service.BookingRuleException("Booking is already completed."));

        mockMvc.perform(put("/api/bookings/{id}/complete", UUID.randomUUID()))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Booking is already completed."));
    }

    @Test
    void redeemReward_returns409WithoutTheRawMessage() throws Exception {
        UUID userId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);
        user.setEmail("member@example.com");
        user.setRole("ROLE_USER");
        CustomUserDetails principal = new CustomUserDetails(user);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
        when(rewardService.redeemReward(any(UUID.class), any(UUID.class))).thenThrow(conflict());

        mockMvc.perform(post("/api/rewards/redeem/{userId}/{rewardId}", userId, UUID.randomUUID()))
                .andExpect(status().isConflict())
                .andExpect(content().string(not(containsString("com.hyecuts"))));
    }
}
