package com.hyecuts.loyalty.service;

import com.hyecuts.loyalty.model.ActivityLog;
import com.hyecuts.loyalty.model.Booking;
import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.repository.ActivityLogRepository;
import com.hyecuts.loyalty.repository.BookingRepository;
import com.hyecuts.loyalty.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final ActivityLogRepository activityLogRepository;
    private final LoyaltyService loyaltyService;
    private final GlobalSettingsService globalSettingsService;

    public BookingService(BookingRepository bookingRepository,
                          UserRepository userRepository,
                          ActivityLogRepository activityLogRepository,
                          LoyaltyService loyaltyService,
                          GlobalSettingsService globalSettingsService) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.activityLogRepository = activityLogRepository;
        this.loyaltyService = loyaltyService;
        this.globalSettingsService = globalSettingsService;
    }

    public Booking createBooking(Booking booking) {
        return bookingRepository.save(booking);
    }

    public List<Booking> getUserBookings(UUID userId) {
        return bookingRepository.findByUserIdOrderByAppointmentTimeDesc(userId);
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAllByOrderByAppointmentTimeDesc();
    }

    public List<Booking> getBookingsByDateRange(java.time.LocalDateTime start, java.time.LocalDateTime end) {
        return bookingRepository.findByAppointmentTimeBetween(start, end);
    }

    public Optional<Booking> getBookingById(UUID bookingId) {
        return bookingRepository.findById(bookingId);
    }

    @Transactional
    public Booking completeBooking(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getStatus() == Booking.BookingStatus.COMPLETED) {
            throw new RuntimeException("Booking is already completed.");
        }

        int pointsPerMyr = globalSettingsService.getPointsPerMyr();
        int earnedPoints = booking.getTotalPriceMyr().intValue() * pointsPerMyr;

        booking.setPointsAwarded(earnedPoints);
        booking.setStatus(Booking.BookingStatus.COMPLETED);

        // Update user points via LoyaltyService (applies tier bonus)
        User user = booking.getUser();
        loyaltyService.addPointsToUser(user, earnedPoints);

        // Log activity
        ActivityLog log = new ActivityLog();
        log.setUser(user);
        log.setPointsEarned(earnedPoints);
        log.setActionType(ActivityLog.TransactionType.BOOKING);
        log.setDescription("Points earned for completing " + booking.getService().getName());
        activityLogRepository.save(log);

        return bookingRepository.save(booking);
    }

    @Transactional
    public Booking rescheduleBooking(UUID bookingId, java.time.LocalDateTime newTime) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        if (booking.getStatus() == Booking.BookingStatus.COMPLETED || booking.getStatus() == Booking.BookingStatus.CANCELLED) {
            throw new RuntimeException("Cannot reschedule a completed or cancelled booking.");
        }

        booking.setAppointmentTime(newTime);
        return bookingRepository.save(booking);
    }

    @Transactional
    public Booking cancelBooking(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        if (booking.getStatus() == Booking.BookingStatus.COMPLETED) {
            throw new RuntimeException("Cannot cancel a completed booking.");
        }

        booking.setStatus(Booking.BookingStatus.CANCELLED);
        return bookingRepository.save(booking);
    }
}
