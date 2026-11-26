package com.hyecuts.loyalty.controller;

import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.repository.UserRepository;
import com.hyecuts.loyalty.security.CustomOAuth2UserService;
import com.hyecuts.loyalty.security.CustomUserDetails;
import com.hyecuts.loyalty.security.CustomUserDetailsService;
import com.hyecuts.loyalty.security.JwtUtil;
import com.hyecuts.loyalty.security.OAuth2LoginFailureHandler;
import com.hyecuts.loyalty.security.OAuth2LoginSuccessHandler;
import com.hyecuts.loyalty.security.RateLimitGuard;
import com.hyecuts.loyalty.security.SecurityConfig;
import com.hyecuts.loyalty.security.TokenRevocationService;
import com.hyecuts.loyalty.service.BarberServiceService;
import com.hyecuts.loyalty.service.BookingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The booking read endpoints through the real {@link SecurityConfig} and JWT
 * filter, which the other controller tests leave out.
 *
 * <p>/date/{date} returns whole bookings, with each customer's name, email and
 * phone, and used to be open to any signed-in member. /availability/{date}
 * returns only the taken times, and guests need it to pick a slot.
 */
@WebMvcTest(controllers = BookingController.class)
@Import({SecurityConfig.class, JwtUtil.class})
@TestPropertySource(properties = {
        "jwt.secret=ZGV2LXNlY3JldC1rZXktdGhhdC1pcy1hdC1sZWFzdC0yNTYtYml0cy1sb25nLWZvci1oczI1Ng==",
        "frontend.base-url=http://localhost:5173",
        "spring.security.oauth2.client.registration.google.client-id=test-client",
        "spring.security.oauth2.client.registration.google.client-secret=test-secret",
})
class BookingEndpointSecurityTest {

    private static final LocalDate DAY = LocalDate.of(2026, 11, 2);

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtUtil jwtUtil;

    @MockBean private BookingService bookingService;
    @MockBean private UserRepository userRepository;
    @MockBean private BarberServiceService barberServiceService;
    @MockBean private RateLimitGuard rateLimitGuard;
    @MockBean private CustomUserDetailsService userDetailsService;
    @MockBean private TokenRevocationService tokenRevocationService;
    @MockBean private CustomOAuth2UserService customOAuth2UserService;
    @MockBean private OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;
    @MockBean private OAuth2LoginFailureHandler oAuth2LoginFailureHandler;

    /** A real token for a user with {@code role}, which the real JWT filter accepts. */
    private String bearer(String role) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail(role.toLowerCase() + "@example.com");
        user.setRole(role);
        when(userDetailsService.loadUserById(user.getId())).thenReturn(new CustomUserDetails(user));
        return "Bearer " + jwtUtil.generateToken(user.getEmail(), user.getId().toString());
    }

    @Test
    void aGuestCanSeeWhichTimesAreTaken() throws Exception {
        when(bookingService.getTakenTimes(DAY)).thenReturn(List.of(DAY.atTime(15, 0)));

        mockMvc.perform(get("/api/bookings/availability/2026-11-02"))
                .andExpect(status().isOk())
                .andExpect(content().json("[\"2026-11-02T15:00:00\"]", true));
    }

    @Test
    void aMalformedAvailabilityDateIsA400() throws Exception {
        mockMvc.perform(get("/api/bookings/availability/Monday"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void aGuestCannotListADaysBookings() throws Exception {
        mockMvc.perform(get("/api/bookings/date/2026-11-02"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void aMemberCannotListADaysBookings() throws Exception {
        mockMvc.perform(get("/api/bookings/date/2026-11-02").header("Authorization", bearer("ROLE_USER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void anAdminCanListADaysBookings() throws Exception {
        when(bookingService.getBookingsByDateRange(DAY.atStartOfDay(), DAY.atTime(java.time.LocalTime.MAX)))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/bookings/date/2026-11-02").header("Authorization", bearer("ROLE_ADMIN")))
                .andExpect(status().isOk());
    }
}
