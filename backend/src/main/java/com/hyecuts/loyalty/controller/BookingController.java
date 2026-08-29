package com.hyecuts.loyalty.controller;

import com.hyecuts.loyalty.model.Booking;
import com.hyecuts.loyalty.model.BarberService;
import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.repository.UserRepository;
import com.hyecuts.loyalty.security.AuthorizationUtil;
import com.hyecuts.loyalty.security.CustomUserDetails;
import com.hyecuts.loyalty.service.BarberServiceService;
import com.hyecuts.loyalty.service.BookingRestrictedException;
import com.hyecuts.loyalty.service.BookingService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
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
        // Only used — and required — when the caller isn't authenticated
        // (BK-002: a real guest booking, not the fabricated-confirmation
        // no-op this used to be).
        public String guestName;
        public String guestEmail;
        public String guestPhone;
    }

    // User endpoint — also reachable by guests (see SecurityConfig: POST
    // /api/bookings is the one unauthenticated write in this controller).
    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody CreateBookingRequest request, @AuthenticationPrincipal CustomUserDetails principal) {
        Booking newBooking = new Booking();

        if (principal != null) {
            // The booking always belongs to the caller, regardless of what userId the client sent.
            User user = userRepository.findById(principal.getId()).orElse(null);
            if (user == null) {
                return ResponseEntity.badRequest().body("User not found");
            }
            newBooking.setUser(user);
        } else {
            if (isBlank(request.guestName) || isBlank(request.guestEmail) || isBlank(request.guestPhone)) {
                return ResponseEntity.badRequest().body("Guest bookings require a name, email, and phone number.");
            }
            newBooking.setGuestName(request.guestName.trim());
            newBooking.setGuestEmail(request.guestEmail.trim());
            newBooking.setGuestPhone(request.guestPhone.trim());
        }

        BarberService service = barberServiceService.getServiceById(request.serviceId).orElse(null);
        if (service == null) {
            return ResponseEntity.badRequest().body("Service not found");
        }

        newBooking.setService(service);
        newBooking.setTotalPriceMyr(service.getPriceMyr());
        newBooking.setStatus(Booking.BookingStatus.PENDING);

        try {
            // Using Spring's default ISO-8601 parsing for LocalDateTime
            newBooking.setAppointmentTime(java.time.LocalDateTime.parse(request.appointmentTime));
            Booking saved = bookingService.createBooking(newBooking);
            return ResponseEntity.ok(saved);
        } catch (BookingRestrictedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
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

    // Admin endpoint. Bounded to avoid loading (and returning) the entire
    // bookings table in one response — the frontend doesn't send page/size
    // today, so this defaults to the 100 most recent bookings rather than
    // silently truncating what used to be an unbounded list.
    @GetMapping("/all")
    public ResponseEntity<List<Booking>> getAllBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 200), Sort.by(Sort.Direction.DESC, "appointmentTime"));
        return ResponseEntity.ok(bookingService.getAllBookings(pageable));
    }

    // Admin/User endpoint
    @GetMapping("/date/{date}")
    public ResponseEntity<?> getBookingsByDate(@PathVariable String date) {
        java.time.LocalDate localDate;
        try {
            localDate = java.time.LocalDate.parse(date);
        } catch (java.time.format.DateTimeParseException e) {
            return ResponseEntity.badRequest().body("Malformed date, expected YYYY-MM-DD");
        }
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

    // Admin endpoint. There's no scheduler to detect missed appointments
    // automatically, so staff mark a no-show explicitly; this applies the
    // points penalty and booking restriction from cancellation-policy.md.
    @PutMapping("/{bookingId}/no-show")
    public ResponseEntity<?> markNoShow(@PathVariable UUID bookingId) {
        try {
            Booking updated = bookingService.markNoShow(bookingId);
            return ResponseEntity.ok(updated);
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
        if (booking.getUser() == null) {
            // Guest booking — there's no "self" to match against, so only an
            // admin (e.g. a call-in cancellation handled by staff) can act on it.
            if (!AuthorizationUtil.isAdmin(principal)) {
                throw new AccessDeniedException("Guest bookings can only be managed by an admin.");
            }
            return;
        }
        AuthorizationUtil.requireSelfOrAdmin(principal, booking.getUser().getId());
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
