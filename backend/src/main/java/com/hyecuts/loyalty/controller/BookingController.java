package com.hyecuts.loyalty.controller;

import com.hyecuts.loyalty.model.Booking;
import com.hyecuts.loyalty.model.BarberService;
import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.repository.UserRepository;
import com.hyecuts.loyalty.service.BarberServiceService;
import com.hyecuts.loyalty.service.BookingService;
import org.springframework.http.ResponseEntity;
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

    // Public/User endpoint
    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody CreateBookingRequest request) {
        User user = userRepository.findById(request.userId).orElse(null);
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
        // Using Spring's default ISO-8601 parsing for LocalDateTime
        newBooking.setAppointmentTime(java.time.LocalDateTime.parse(request.appointmentTime));
        // Using the service's current MYR price
        newBooking.setTotalPriceMyr(service.getPriceMyr());
        newBooking.setStatus(Booking.BookingStatus.PENDING);
        
        Booking saved = bookingService.createBooking(newBooking);
        return ResponseEntity.ok(saved);
    }

    // Public/User endpoint
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Booking>> getUserBookings(@PathVariable UUID userId) {
        return ResponseEntity.ok(bookingService.getUserBookings(userId));
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

    // Admin/User endpoint
    @PutMapping("/{bookingId}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable UUID bookingId) {
        try {
            Booking cancelled = bookingService.cancelBooking(bookingId);
            return ResponseEntity.ok(cancelled);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
