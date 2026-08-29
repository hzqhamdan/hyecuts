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

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class BookingService {

    // Fixed per cancellation-policy.md v1 — "Tier Grace Allowances" are
    // explicitly deferred to v2, so these aren't wired into GlobalSettings yet.
    private static final int LATE_CANCELLATION_WINDOW_HOURS = 24;
    private static final int LATE_CANCELLATION_PENALTY_POINTS = 10;
    private static final int NO_SHOW_PENALTY_POINTS = 20;
    private static final int NO_SHOW_RESTRICTION_DAYS = 7;
    private static final int MAX_RESCHEDULES = 3;

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
        // A booking either belongs to a logged-in member (booking.user) or
        // carries its own guest contact details (BK-002) — never neither.
        // BookingController is what actually decides which case applies
        // (authenticated principal vs. guest request body); this is just the
        // service-level guard against a caller skipping that.
        if (booking.getUser() == null) {
            if (isBlank(booking.getGuestName()) || isBlank(booking.getGuestEmail()) || isBlank(booking.getGuestPhone())) {
                throw new RuntimeException("Guest bookings require a name, email, and phone number.");
            }
        } else {
            LocalDateTime restrictedUntil = booking.getUser().getBookingRestrictedUntil();
            if (restrictedUntil != null && restrictedUntil.isAfter(LocalDateTime.now())) {
                throw new BookingRestrictedException(restrictedUntil);
            }
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

        // Guest bookings (no linked User — see BK-002) have no loyalty
        // account to earn points into or log activity against.
        User user = booking.getUser();
        if (user != null) {
            int pointsPerMyr = globalSettingsService.getPointsPerMyr();
            int earnedPoints = calculateEarnedPoints(booking.getTotalPriceMyr(), pointsPerMyr);

            booking.setPointsAwarded(earnedPoints);
            loyaltyService.addPointsToUser(user, earnedPoints);

            ActivityLog log = new ActivityLog();
            log.setUser(user);
            log.setPointsEarned(earnedPoints);
            log.setActionType(ActivityLog.TransactionType.BOOKING);
            log.setDescription("Points earned for completing " + booking.getService().getName());
            activityLogRepository.save(log);
        } else {
            booking.setPointsAwarded(0);
        }
        booking.setStatus(Booking.BookingStatus.COMPLETED);

        try {
            return bookingRepository.save(booking);
        } catch (org.springframework.dao.OptimisticLockingFailureException e) {
            // Two concurrent /complete calls both read the same PENDING booking
            // and both pass the guards above; @Version on Booking means only
            // the first save() wins here. Throwing rolls back this whole
            // transaction — including the points award and activity log just
            // above — so the loser awards nothing instead of double-paying.
            throw new RuntimeException("This booking was already completed by another request.");
        }
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

        // BK-047: without a cap, a single booking can be rescheduled indefinitely,
        // effectively squatting on a rotating slot forever.
        if (booking.getRescheduleCount() >= MAX_RESCHEDULES) {
            throw new RuntimeException("This booking has already been rescheduled the maximum number of times ("
                    + MAX_RESCHEDULES + "). Please cancel and book a new appointment.");
        }

        if (bookingRepository.existsByAppointmentTimeAndStatusNotAndIdNot(newTime, Booking.BookingStatus.CANCELLED, bookingId)) {
            throw new RuntimeException("This time slot is already booked.");
        }

        booking.setAppointmentTime(newTime);
        booking.setRescheduleCount(booking.getRescheduleCount() + 1);
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

        // cancellation-policy.md: free more than 24h out, a points penalty
        // inside that window. Checked before flipping status since the
        // penalty is based on how much notice was actually given. Guest
        // bookings (BK-002) have no points balance to penalize.
        boolean isLate = booking.getUser() != null
                && booking.getAppointmentTime() != null
                && !booking.getAppointmentTime().isAfter(LocalDateTime.now().plusHours(LATE_CANCELLATION_WINDOW_HOURS));

        booking.setStatus(Booking.BookingStatus.CANCELLED);
        Booking saved = bookingRepository.save(booking);

        if (isLate) {
            applyPenalty(booking, LATE_CANCELLATION_PENALTY_POINTS,
                    "Late cancellation penalty: " + booking.getService().getName());
        }

        return saved;
    }

    /**
     * Marks a booking as a no-show, applies the points penalty, and puts the
     * member under a booking restriction — all per cancellation-policy.md.
     * There's no scheduler in this app to detect a missed appointment time
     * automatically, so this is an explicit admin action (see
     * BookingController#markNoShow).
     */
    @Transactional
    public Booking markNoShow(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getStatus() != Booking.BookingStatus.PENDING && booking.getStatus() != Booking.BookingStatus.CONFIRMED) {
            throw new RuntimeException("Only a pending or confirmed booking can be marked as a no-show.");
        }

        booking.setStatus(Booking.BookingStatus.NO_SHOW);
        Booking saved = bookingRepository.save(booking);

        // A guest booking (BK-002) still gets marked NO_SHOW for the shop's
        // own records, but there's no account to penalize or restrict.
        User user = booking.getUser();
        if (user != null) {
            applyPenalty(booking, NO_SHOW_PENALTY_POINTS, "No-show penalty: " + booking.getService().getName());
            user.setBookingRestrictedUntil(booking.getAppointmentTime().plusDays(NO_SHOW_RESTRICTION_DAYS));
            userRepository.save(user);
        }

        return saved;
    }

    // BK-035: `.intValue()` on the price truncated any fractional ringgit
    // (RM 25.90 -> 25 points, dropping the .90 entirely) — round to the
    // nearest point instead. BK-037: plain `int * int` here overflowed
    // silently for a large POINTS_PER_MYR (AZ-004) before the result ever
    // reached addPointsToUser's own overflow guard; doing the multiplication
    // in `long` and clamping here closes that gap at the source.
    private int calculateEarnedPoints(BigDecimal priceMyr, int pointsPerMyr) {
        long earned = priceMyr
                .multiply(BigDecimal.valueOf(pointsPerMyr))
                .setScale(0, RoundingMode.HALF_UP)
                .longValue();
        return (int) Math.max(Integer.MIN_VALUE, Math.min(Integer.MAX_VALUE, earned));
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private void applyPenalty(Booking booking, int penaltyPoints, String description) {
        User user = booking.getUser();
        loyaltyService.applyPointsPenalty(user, penaltyPoints);

        ActivityLog log = new ActivityLog();
        log.setUser(user);
        log.setPointsEarned(-penaltyPoints);
        log.setActionType(ActivityLog.TransactionType.CANCELLATION_PENALTY);
        log.setDescription(description);
        activityLogRepository.save(log);
    }
}
