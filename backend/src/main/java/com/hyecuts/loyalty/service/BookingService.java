package com.hyecuts.loyalty.service;

import com.hyecuts.loyalty.model.ActivityLog;
import com.hyecuts.loyalty.model.Booking;
import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.repository.ActivityLogRepository;
import com.hyecuts.loyalty.repository.BookingRepository;
import com.hyecuts.loyalty.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final GlobalSettingsService globalSettingsService;
    private final UserRepository userRepository;
    private final ActivityLogRepository activityLogRepository;

    public BookingService(BookingRepository bookingRepository,
                          GlobalSettingsService globalSettingsService,
                          UserRepository userRepository,
                          ActivityLogRepository activityLogRepository) {
        this.bookingRepository = bookingRepository;
        this.globalSettingsService = globalSettingsService;
        this.userRepository = userRepository;
        this.activityLogRepository = activityLogRepository;
    }

    public Booking createBooking(Booking booking) {
        return bookingRepository.save(booking);
    }

    public List<Booking> getUserBookings(UUID userId) {
        return bookingRepository.findByUserIdOrderByAppointmentTimeDesc(userId);
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

        // Calculate points based on MYR
        int pointsPerMyr = globalSettingsService.getPointsPerMyr();
        BigDecimal price = booking.getTotalPriceMyr();
        
        // Base points + (Price * Rate)
        int calculatedPoints = booking.getService().getBasePoints() + 
                (price.intValue() * pointsPerMyr);

        booking.setPointsAwarded(calculatedPoints);
        booking.setStatus(Booking.BookingStatus.COMPLETED);
        
        // Update user points
        User user = booking.getUser();
        user.setCurrentPoints(user.getCurrentPoints() + calculatedPoints);
        user.setLifetimePoints(user.getLifetimePoints() + calculatedPoints);
        userRepository.save(user);

        // Log activity
        ActivityLog log = new ActivityLog();
        log.setUser(user);
        log.setPointsEarned(calculatedPoints);
        log.setActionType(ActivityLog.TransactionType.BOOKING);
        log.setDescription("Points earned for completing " + booking.getService().getName());
        activityLogRepository.save(log);

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
