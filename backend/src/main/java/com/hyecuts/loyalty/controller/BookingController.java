package com.hyecuts.loyalty.controller;

import com.hyecuts.loyalty.model.Booking;
import com.hyecuts.loyalty.model.BarberService;
import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.repository.UserRepository;
import com.hyecuts.loyalty.security.AuthorizationUtil;
import com.hyecuts.loyalty.security.CustomUserDetails;
import com.hyecuts.loyalty.service.BarberServiceService;
import com.hyecuts.loyalty.service.BookingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;
    private final UserRepository userRepository;
    private final BarberServiceService barberServiceService;

    public BookingController(BookingService bookingService, 
                             UserRepository userRepository, 
                             BarberServiceService barberServiceService) {
        this.bookingService = bookingService;
        this.userRepository = userRepository;
        this.barberServiceService = barberServiceService;
    }

    public static class CreateBookingRequest {
        public UUID userId;
        public Long serviceId;
        public String appointmentTime; // ISO 8601 string
    }

    // User endpoint
    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody CreateBookingRequest request, @AuthenticationPrincipal CustomUserDetails principal) {
        // The booking always belongs to the caller, regardless of what userId the client sent.
        User user = userRepository.findById(principal.getId()).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body("User not found");
        }

        BarberService service = barberServiceService.getServiceById(request.serviceId).orElse(null);
        if (service == null) {
            return ResponseEntity.badRequest().body("Service not found");
        }

        Booking newBooking = new Booking();
        newBooking.setUser(user);
        newBooking.setService(service);
        newBooking.setTotalPriceMyr(service.getPriceMyr());
        newBooking.setStatus(Booking.BookingStatus.PENDING);

        try {
            // Using Spring's default ISO-8601 parsing for LocalDateTime
            newBooking.setAppointmentTime(java.time.LocalDateTime.parse(request.appointmentTime));
            Booking saved = bookingService.createBooking(newBooking);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // User endpoint
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Booking>> getUserBookings(@PathVariable UUID userId, @AuthenticationPrincipal CustomUserDetails principal) {
        AuthorizationUtil.requireSelfOrAdmin(principal, userId);
        return ResponseEntity.ok(bookingService.getUserBookings(userId));
    }

    // Admin endpoint
    @GetMapping("/all")
    public ResponseEntity<List<Booking>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    // Admin/User endpoint
    @GetMapping("/date/{date}")
    public ResponseEntity<List<Booking>> getBookingsByDate(@PathVariable String date) {
        java.time.LocalDate localDate = java.time.LocalDate.parse(date);
        java.time.LocalDateTime start = localDate.atStartOfDay();
        java.time.LocalDateTime end = localDate.atTime(java.time.LocalTime.MAX);
        return ResponseEntity.ok(bookingService.getBookingsByDateRange(start, end));
    }

    // Admin endpoint
    @PutMapping("/{bookingId}/complete")
    public ResponseEntity<?> completeBooking(@PathVariable UUID bookingId) {
        try {
            Booking completed = bookingService.completeBooking(bookingId);
            return ResponseEntity.ok(completed);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    public static class RescheduleRequest {
        public String newAppointmentTime;
    }

    @PutMapping("/{bookingId}/reschedule")
    public ResponseEntity<?> rescheduleBooking(@PathVariable UUID bookingId, @RequestBody RescheduleRequest request, @AuthenticationPrincipal CustomUserDetails principal) {
        try {
            requireOwnsBooking(bookingId, principal);
            java.time.LocalDateTime newTime = java.time.LocalDateTime.parse(
                request.newAppointmentTime.replace("Z", "").replace("z", "")
            );
            Booking rescheduled = bookingService.rescheduleBooking(bookingId, newTime);
            return ResponseEntity.ok(rescheduled);
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Admin/User endpoint
    @PutMapping("/{bookingId}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable UUID bookingId, @AuthenticationPrincipal CustomUserDetails principal) {
        try {
            requireOwnsBooking(bookingId, principal);
            Booking cancelled = bookingService.cancelBooking(bookingId);
            return ResponseEntity.ok(cancelled);
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private void requireOwnsBooking(UUID bookingId, CustomUserDetails principal) {
        Booking booking = bookingService.getBookingById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        AuthorizationUtil.requireSelfOrAdmin(principal, booking.getUser().getId());
    }
}
