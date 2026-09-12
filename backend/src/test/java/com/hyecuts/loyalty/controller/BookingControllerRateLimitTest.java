package com.hyecuts.loyalty.controller;

import com.hyecuts.loyalty.model.BarberService;
import com.hyecuts.loyalty.model.Booking;
import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.repository.UserRepository;
import com.hyecuts.loyalty.security.CustomUserDetails;
import com.hyecuts.loyalty.security.RateLimitExceededException;
import com.hyecuts.loyalty.security.RateLimitGuard;
import com.hyecuts.loyalty.service.BarberServiceService;
import com.hyecuts.loyalty.service.BookingService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = BookingController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.REGEX,
                pattern = "com\\.hyecuts\\.loyalty\\.security\\..*"))
@AutoConfigureMockMvc(addFilters = false)
class BookingControllerRateLimitTest {

    @Autowired private MockMvc mockMvc;

    @MockBean private BookingService bookingService;
    @MockBean private UserRepository userRepository;
    @MockBean private BarberServiceService barberServiceService;
    @MockBean private RateLimitGuard rateLimitGuard;

    private static final String GUEST_BODY = """
            {"serviceId":1,"appointmentTime":"2026-12-01T10:00:00",
             "guestName":"Jane","guestEmail":"jane@example.com","guestPhone":"+60123456789"}
            """;

    @BeforeEach
    void setUp() {
        BarberService service = new BarberService();
        service.setId(1L);
        service.setName("Haircut");
        service.setPriceMyr(BigDecimal.valueOf(30));
        when(barberServiceService.getServiceById(1L)).thenReturn(Optional.of(service));
        when(bookingService.createBooking(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    @AfterEach
    void clearSecurityContext() {
        // Defensive: SecurityContextHolder is a ThreadLocal, so a test that sets
        // it must not leak an authenticated principal into whichever test runs
        // next on this thread.
        SecurityContextHolder.clearContext();
    }

    @Test
    void guestBookingConsumesTheBudget() throws Exception {
        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON).content(GUEST_BODY))
                .andExpect(status().isOk());

        verify(rateLimitGuard).checkAndConsumeGuestBooking(anyString());
    }

    @Test
    void guestBookingReturns429AndCreatesNothingWhenRejected() throws Exception {
        doThrow(new RateLimitExceededException(3600L))
                .when(rateLimitGuard).checkAndConsumeGuestBooking(anyString());

        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON).content(GUEST_BODY))
                .andExpect(status().isTooManyRequests());

        verify(bookingService, never()).createBooking(any(Booking.class));
    }

    @Test
    void budgetIsCheckedBeforeTheServiceLookup() throws Exception {
        // Rejection should not cost a database round trip.
        doThrow(new RateLimitExceededException(3600L))
                .when(rateLimitGuard).checkAndConsumeGuestBooking(anyString());

        mockMvc.perform(post("/api/bookings")
                .contentType(MediaType.APPLICATION_JSON).content(GUEST_BODY));

        verify(barberServiceService, never()).getServiceById(any());
    }

    @Test
    void authenticatedBookingIsNotLimited() throws Exception {
        UUID userId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);
        user.setEmail("auth@example.com");
        user.setRole("ROLE_USER");
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        CustomUserDetails principal = new CustomUserDetails(user);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));

        // No guest fields at all — this only succeeds via the authenticated branch.
        String authBody = """
                {"serviceId":1,"appointmentTime":"2026-12-01T10:00:00"}
                """;

        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON).content(authBody))
                .andExpect(status().isOk());

        verify(rateLimitGuard, never()).checkAndConsumeGuestBooking(anyString());
    }

    @Test
    void garbageBearerTokenIsStillTreatedAsGuestAndLimited() throws Exception {
        // addFilters = false means no JwtRequestFilter runs here, so no
        // SecurityContext is ever populated for this request — exactly what
        // happens in production once the filter discards an invalid token.
        // principal == null must still route through the guest branch and
        // still get rate-limited; a header-presence check would skip it.
        mockMvc.perform(post("/api/bookings")
                        .header("Authorization", "Bearer not-a-real-token")
                        .contentType(MediaType.APPLICATION_JSON).content(GUEST_BODY))
                .andExpect(status().isOk());

        verify(rateLimitGuard).checkAndConsumeGuestBooking(anyString());
    }
}
