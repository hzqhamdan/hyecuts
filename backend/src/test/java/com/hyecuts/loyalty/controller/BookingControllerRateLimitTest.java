package com.hyecuts.loyalty.controller;

import com.hyecuts.loyalty.model.BarberService;
import com.hyecuts.loyalty.model.Booking;
import com.hyecuts.loyalty.repository.UserRepository;
import com.hyecuts.loyalty.security.RateLimitExceededException;
import com.hyecuts.loyalty.security.RateLimitGuard;
import com.hyecuts.loyalty.service.BarberServiceService;
import com.hyecuts.loyalty.service.BookingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Optional;

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
}
