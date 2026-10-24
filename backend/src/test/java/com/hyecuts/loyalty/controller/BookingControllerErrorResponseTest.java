package com.hyecuts.loyalty.controller;

import com.hyecuts.loyalty.model.BarberService;
import com.hyecuts.loyalty.model.Booking;
import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.repository.UserRepository;
import com.hyecuts.loyalty.security.CustomUserDetails;
import com.hyecuts.loyalty.security.RateLimitGuard;
import com.hyecuts.loyalty.service.BarberServiceService;
import com.hyecuts.loyalty.service.BookingRuleException;
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
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Booking endpoints return a business-rule message as a 400, but anything
 * unexpected goes to the global handler as a generic 500. They used to echo
 * every exception's message, including database and internal errors.
 */
@WebMvcTest(controllers = BookingController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.REGEX,
                pattern = "com\\.hyecuts\\.loyalty\\.security\\..*"))
@AutoConfigureMockMvc(addFilters = false)
class BookingControllerErrorResponseTest {

    @Autowired private MockMvc mockMvc;

    @MockBean private BookingService bookingService;
    @MockBean private UserRepository userRepository;
    @MockBean private BarberServiceService barberServiceService;
    @MockBean private RateLimitGuard rateLimitGuard;

    private final UUID userId = UUID.randomUUID();
    private final UUID bookingId = UUID.randomUUID();

    private static String bookingBody(String appointmentTime) {
        String time = appointmentTime == null ? "null" : "\"" + appointmentTime + "\"";
        return "{\"serviceId\":1,\"appointmentTime\":" + time + ","
                + "\"guestName\":\"Jane\",\"guestEmail\":\"jane@example.com\",\"guestPhone\":\"+60123456789\"}";
    }

    @BeforeEach
    void setUp() {
        BarberService service = new BarberService();
        service.setId(1L);
        service.setName("Haircut");
        service.setPriceMyr(BigDecimal.valueOf(30));
        when(barberServiceService.getServiceById(1L)).thenReturn(Optional.of(service));
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    private void signInAsOwnerOfTheBooking() {
        User user = new User();
        user.setId(userId);
        user.setEmail("member@example.com");
        user.setRole("ROLE_USER");
        Booking booking = new Booking();
        booking.setId(bookingId);
        booking.setUser(user);
        when(bookingService.getBookingById(bookingId)).thenReturn(Optional.of(booking));
        CustomUserDetails principal = new CustomUserDetails(user);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }

    @Test
    void createBooking_ruleFailureReturns400WithItsMessage() throws Exception {
        when(bookingService.createBooking(any())).thenThrow(new BookingRuleException("That time is outside opening hours."));

        mockMvc.perform(post("/api/bookings").contentType(MediaType.APPLICATION_JSON)
                        .content(bookingBody("2026-12-04T12:00:00")))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("That time is outside opening hours."));
    }

    @Test
    void createBooking_unexpectedFailureReturnsAGeneric500() throws Exception {
        when(bookingService.createBooking(any()))
                .thenThrow(new IllegalStateException("could not execute statement [ERROR: relation \"bookings\"]"));

        mockMvc.perform(post("/api/bookings").contentType(MediaType.APPLICATION_JSON)
                        .content(bookingBody("2026-12-01T15:00:00")))
                .andExpect(status().isInternalServerError())
                .andExpect(content().string(not(containsString("relation"))));
    }

    @Test
    void createBooking_slotRaceAtCommitReturns409WithoutTheConstraintName() throws Exception {
        when(bookingService.createBooking(any())).thenThrow(new DataIntegrityViolationException(
                "duplicate key value violates unique constraint \"uq_bookings_active_appointment_time\""));

        mockMvc.perform(post("/api/bookings").contentType(MediaType.APPLICATION_JSON)
                        .content(bookingBody("2026-12-01T15:00:00")))
                .andExpect(status().isConflict())
                .andExpect(content().string("This time slot is already booked."));
    }

    @Test
    void createBooking_malformedTimeReturns400() throws Exception {
        mockMvc.perform(post("/api/bookings").contentType(MediaType.APPLICATION_JSON)
                        .content(bookingBody("next tuesday")))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(containsString("malformed")));
        verify(bookingService, never()).createBooking(any());
    }

    @Test
    void createBooking_missingTimeReturns400() throws Exception {
        mockMvc.perform(post("/api/bookings").contentType(MediaType.APPLICATION_JSON)
                        .content(bookingBody(null)))
                .andExpect(status().isBadRequest());
        verify(bookingService, never()).createBooking(any());
    }

    @Test
    void completeBooking_unexpectedFailureReturnsAGeneric500() throws Exception {
        when(bookingService.completeBooking(bookingId)).thenThrow(new RuntimeException("Points service down"));

        mockMvc.perform(put("/api/bookings/{id}/complete", bookingId))
                .andExpect(status().isInternalServerError())
                .andExpect(content().string(not(containsString("Points service down"))));
    }

    @Test
    void rescheduleBooking_missingTimeReturns400() throws Exception {
        signInAsOwnerOfTheBooking();

        mockMvc.perform(put("/api/bookings/{id}/reschedule", bookingId)
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
        verify(bookingService, never()).rescheduleBooking(any(), any());
    }

    @Test
    void rescheduleBooking_ruleFailureReturns400WithItsMessage() throws Exception {
        signInAsOwnerOfTheBooking();
        when(bookingService.rescheduleBooking(any(UUID.class), any(LocalDateTime.class)))
                .thenThrow(new BookingRuleException("This time slot is already booked."));

        mockMvc.perform(put("/api/bookings/{id}/reschedule", bookingId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newAppointmentTime\":\"2026-12-01T15:00:00\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("This time slot is already booked."));
    }

    @Test
    void cancelBooking_someoneElsesBookingIsStill403() throws Exception {
        signInAsOwnerOfTheBooking();
        User other = new User();
        other.setId(UUID.randomUUID());
        Booking othersBooking = new Booking();
        othersBooking.setUser(other);
        UUID othersId = UUID.randomUUID();
        when(bookingService.getBookingById(othersId)).thenReturn(Optional.of(othersBooking));

        mockMvc.perform(put("/api/bookings/{id}/cancel", othersId))
                .andExpect(status().isForbidden());
        verify(bookingService, never()).cancelBooking(any());
    }

    @Test
    void cancelBooking_unknownBookingReturns400() throws Exception {
        signInAsOwnerOfTheBooking();
        UUID missing = UUID.randomUUID();
        when(bookingService.getBookingById(missing)).thenReturn(Optional.empty());

        mockMvc.perform(put("/api/bookings/{id}/cancel", missing))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Booking not found"));
    }
}
