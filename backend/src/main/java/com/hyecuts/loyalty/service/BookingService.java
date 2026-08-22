package com.hyecuts.loyalty.service;

import com.hyecuts.loyalty.model.ActivityLog;
import com.hyecuts.loyalty.model.Booking;
import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.repository.ActivityLogRepository;
import com.hyecuts.loyalty.repository.BookingRepository;
import com.hyecuts.loyalty.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Pageable;
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
        if (booking.getUser() == null) {
            throw new RuntimeException("User not found");
        }
        if (booking.getService() == null) {
            throw new RuntimeException("Service not found");
        }
        if (booking.getAppointmentTime() != null && booking.getAppointmentTime().isBefore(java.time.LocalDateTime.now())) {
            throw new RuntimeException("Appointment time cannot be in the past");
        }
        if (!Boolean.TRUE.equals(booking.getService().getIsActive())) {
            throw new RuntimeException("Service is not active");
        }
        if (bookingRepository.existsByAppointmentTimeAndStatusNot(booking.getAppointmentTime(), Booking.BookingStatus.CANCELLED)) {
            throw new RuntimeException("This time slot is already booked.");
        }
        try {
            return bookingRepository.save(booking);
        } catch (DataIntegrityViolationException e) {
            // Two concurrent requests can both pass the check above before either
            // writes; the unique index on (appointment_time) is what actually
            // prevents the double-booking — this just turns that race into a
            // clean error instead of a raw constraint-violation message.
            throw new RuntimeException("This time slot is already booked.");
        }
    }

    public List<Booking> getUserBookings(UUID userId) {
        return bookingRepository.findByUserIdOrderByAppointmentTimeDesc(userId);
    }

    // Was an unbounded findAll() — with enough history this loads every
    // booking (and its nested user/service) into memory and JSON in one go.
    public List<Booking> getAllBookings(Pageable pageable) {
        return bookingRepository.findAllByOrderByAppointmentTimeDesc(pageable).getContent();
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

        if (booking.getStatus() == Booking.BookingStatus.CANCELLED) {
            throw new RuntimeException("Cannot complete a cancelled booking.");
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

        if (newTime != null && newTime.isBefore(java.time.LocalDateTime.now())) {
            throw new RuntimeException("New appointment time cannot be in the past");
        }

        if (bookingRepository.existsByAppointmentTimeAndStatusNotAndIdNot(newTime, Booking.BookingStatus.CANCELLED, bookingId)) {
            throw new RuntimeException("This time slot is already booked.");
        }

        booking.setAppointmentTime(newTime);
        try {
            return bookingRepository.save(booking);
        } catch (DataIntegrityViolationException e) {
            throw new RuntimeException("This time slot is already booked.");
        }
    }

    @Transactional
    public Booking cancelBooking(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        if (booking.getStatus() == Booking.BookingStatus.COMPLETED) {
            throw new RuntimeException("Cannot cancel a completed booking.");
        }

        if (booking.getStatus() == Booking.BookingStatus.CANCELLED) {
            throw new RuntimeException("Booking is already cancelled.");
        }

        booking.setStatus(Booking.BookingStatus.CANCELLED);
        return bookingRepository.save(booking);
    }
}
