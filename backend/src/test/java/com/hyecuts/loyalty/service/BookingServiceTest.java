package com.hyecuts.loyalty.service;

import com.hyecuts.loyalty.model.ActivityLog;
import com.hyecuts.loyalty.model.BarberService;
import com.hyecuts.loyalty.model.Booking;
import com.hyecuts.loyalty.model.Tier;
import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.repository.ActivityLogRepository;
import com.hyecuts.loyalty.repository.BookingRepository;
import com.hyecuts.loyalty.repository.UserRepository;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ActivityLogRepository activityLogRepository;

    @Mock
    private LoyaltyService loyaltyService;

    @Mock
    private GlobalSettingsService globalSettingsService;

    @InjectMocks
    private BookingService bookingService;

    private UUID bookingId;
    private UUID userId;
    private User testUser;
    private BarberService testService;
    private Booking testBooking;

    @BeforeEach
    void setUp() {
        bookingId = UUID.randomUUID();
        userId = UUID.randomUUID();

        testUser = new User();
        testUser.setId(userId);
        testUser.setCurrentPoints(0);
        testUser.setLifetimePoints(0);
        testUser.setTier(Tier.MEMBER);

        testService = new BarberService();
        testService.setId(1L);
        testService.setName("Haircut");
        testService.setPriceMyr(BigDecimal.valueOf(30));
        testService.setDurationMinutes(30);
        testService.setIsActive(true);

        testBooking = new Booking();
        testBooking.setId(bookingId);
        testBooking.setUser(testUser);
        testBooking.setService(testService);
        testBooking.setAppointmentTime(LocalDateTime.now().plusDays(1));
        testBooking.setTotalPriceMyr(BigDecimal.valueOf(30));
        testBooking.setStatus(Booking.BookingStatus.PENDING);
    }

    // =============== createBooking() ===============

    @Test
    void createBooking_shouldSaveAndReturnBooking() {
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Booking saved = bookingService.createBooking(testBooking);

        assertNotNull(saved);
        assertEquals(bookingId, saved.getId());
        verify(bookingRepository).save(testBooking);
    }

    @Test
    void createBooking_shouldThrowWhenNoUserAndNoGuestDetails() {
        testBooking.setUser(null);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> bookingService.createBooking(testBooking));
        assertTrue(ex.getMessage().toLowerCase().contains("guest"));
    }

    @Test
    void createBooking_shouldSucceedForGuestWithContactDetails() {
        testBooking.setUser(null);
        testBooking.setGuestName("Jane Guest");
        testBooking.setGuestEmail("jane@example.com");
        testBooking.setGuestPhone("+60123456789");
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Booking saved = bookingService.createBooking(testBooking);

        assertNotNull(saved);
        assertNull(saved.getUser());
        assertEquals("Jane Guest", saved.getGuestName());
        verify(bookingRepository).save(testBooking);
    }

    @Test
    void createBooking_shouldThrowWhenGuestDetailsIncomplete() {
        testBooking.setUser(null);
        testBooking.setGuestName("Jane Guest");
        testBooking.setGuestEmail(""); // missing email

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> bookingService.createBooking(testBooking));
        assertTrue(ex.getMessage().toLowerCase().contains("guest"));
    }

    @Test
    void createBooking_shouldThrowWhenServiceNotFound() {
        testBooking.setService(null);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> bookingService.createBooking(testBooking));
        assertEquals("Service not found", ex.getMessage());
    }

    @Test
    void createBooking_shouldThrowWhenAppointmentTimeIsInPast() {
        testBooking.setAppointmentTime(LocalDateTime.now().minusHours(1));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> bookingService.createBooking(testBooking));
        assertTrue(ex.getMessage().toLowerCase().contains("past"));
    }

    @Test
    void createBooking_shouldHandleNullUserGracefully() {
        testBooking.setUser(null);

        Exception ex = assertThrows(RuntimeException.class,
                () -> bookingService.createBooking(testBooking));
        assertNotNull(ex.getMessage());
    }

    @Test
    void createBooking_shouldHandleNullServiceGracefully() {
        testBooking.setService(null);

        Exception ex = assertThrows(RuntimeException.class,
                () -> bookingService.createBooking(testBooking));
        assertNotNull(ex.getMessage());
    }

    @Test
    void createBooking_shouldThrowWhenServiceIsInactive() {
        testService.setIsActive(false);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> bookingService.createBooking(testBooking));
        assertTrue(ex.getMessage().toLowerCase().contains("active"));
    }

    @Test
    void createBooking_shouldThrowBookingRestrictedExceptionWhenUnderActiveRestriction() {
        testUser.setBookingRestrictedUntil(LocalDateTime.now().plusDays(3));

        BookingRestrictedException ex = assertThrows(BookingRestrictedException.class,
                () -> bookingService.createBooking(testBooking));
        assertNotNull(ex.getRestrictedUntil());
        verify(bookingRepository, never()).save(any(Booking.class));
    }

    @Test
    void createBooking_shouldAllowWhenRestrictionHasExpired() {
        testUser.setBookingRestrictedUntil(LocalDateTime.now().minusDays(1));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Booking saved = bookingService.createBooking(testBooking);

        assertNotNull(saved);
        verify(bookingRepository).save(testBooking);
    }

    // =============== rescheduleBooking() ===============

    @Test
    void rescheduleBooking_shouldUpdateAppointmentTime() {
        LocalDateTime newTime = LocalDateTime.now().plusDays(2);
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(testBooking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Booking updated = bookingService.rescheduleBooking(bookingId, newTime);

        assertEquals(newTime, updated.getAppointmentTime());
        assertEquals(Booking.BookingStatus.PENDING, updated.getStatus());
        verify(bookingRepository).save(testBooking);
    }

    @Test
    void rescheduleBooking_shouldThrowWhenBookingNotFound() {
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class,
                () -> bookingService.rescheduleBooking(bookingId, LocalDateTime.now().plusDays(1)));
    }

    @Test
    void rescheduleBooking_shouldThrowWhenBookingIsCancelled() {
        testBooking.setStatus(Booking.BookingStatus.CANCELLED);
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(testBooking));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> bookingService.rescheduleBooking(bookingId, LocalDateTime.now().plusDays(1)));
        assertTrue(ex.getMessage().toLowerCase().contains("cancell"));
    }

    @Test
    void rescheduleBooking_shouldThrowWhenBookingIsCompleted() {
        testBooking.setStatus(Booking.BookingStatus.COMPLETED);
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(testBooking));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> bookingService.rescheduleBooking(bookingId, LocalDateTime.now().plusDays(1)));
        assertTrue(ex.getMessage().toLowerCase().contains("complet"));
    }

    @Test
    void rescheduleBooking_shouldThrowWhenNewTimeIsInPast() {
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(testBooking));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> bookingService.rescheduleBooking(bookingId, LocalDateTime.now().minusHours(1)));
        assertTrue(ex.getMessage().toLowerCase().contains("past"));
    }

    @Test
    void rescheduleBooking_shouldBeNoOpWhenTimeIsSame() {
        LocalDateTime sameTime = testBooking.getAppointmentTime();
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(testBooking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Booking updated = bookingService.rescheduleBooking(bookingId, sameTime);

        assertEquals(sameTime, updated.getAppointmentTime());
        verify(bookingRepository).save(testBooking);
    }

    @Test
    void rescheduleBooking_shouldIncrementRescheduleCount() {
        LocalDateTime newTime = LocalDateTime.now().plusDays(2);
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(testBooking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Booking updated = bookingService.rescheduleBooking(bookingId, newTime);

        assertEquals(1, updated.getRescheduleCount());
    }

    @Test
    void rescheduleBooking_shouldThrowWhenLimitReached() {
        // BK-047: reschedule count already at the cap — the next attempt
        // must be rejected instead of silently allowed forever.
        testBooking.setRescheduleCount(3);
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(testBooking));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> bookingService.rescheduleBooking(bookingId, LocalDateTime.now().plusDays(2)));
        assertTrue(ex.getMessage().toLowerCase().contains("maximum"));
        verify(bookingRepository, never()).save(any(Booking.class));
    }

    // =============== cancelBooking() ===============

    @Test
    void cancelBooking_shouldCancelBooking() {
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(testBooking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Booking cancelled = bookingService.cancelBooking(bookingId);

        assertEquals(Booking.BookingStatus.CANCELLED, cancelled.getStatus());
        verify(bookingRepository).save(testBooking);
    }

    @Test
    void cancelBooking_shouldThrowWhenBookingNotFound() {
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class,
                () -> bookingService.cancelBooking(bookingId));
    }

    @Test
    void cancelBooking_shouldThrowWhenAlreadyCancelled() {
        testBooking.setStatus(Booking.BookingStatus.CANCELLED);
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(testBooking));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> bookingService.cancelBooking(bookingId));
        assertTrue(ex.getMessage().toLowerCase().contains("cancell"));
    }

    @Test
    void cancelBooking_shouldThrowWhenAlreadyCompleted() {
        testBooking.setStatus(Booking.BookingStatus.COMPLETED);
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(testBooking));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> bookingService.cancelBooking(bookingId));
        assertTrue(ex.getMessage().toLowerCase().contains("complet"));
    }

    @Test
    void cancelBooking_shouldApplyPenaltyWhenWithinLateCancellationWindow() {
        testBooking.setAppointmentTime(LocalDateTime.now().plusHours(2));
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(testBooking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        bookingService.cancelBooking(bookingId);

        verify(loyaltyService).applyPointsPenalty(testUser, 10);
        verify(activityLogRepository).save(argThat(log ->
                log.getActionType() == ActivityLog.TransactionType.CANCELLATION_PENALTY
                        && log.getPointsEarned() == -10));
    }

    @Test
    void cancelBooking_shouldNotApplyPenaltyWhenMoreThan24HoursOut() {
        testBooking.setAppointmentTime(LocalDateTime.now().plusDays(3));
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(testBooking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        bookingService.cancelBooking(bookingId);

        verifyNoInteractions(loyaltyService);
        verify(activityLogRepository, never()).save(any(ActivityLog.class));
    }

    @Test
    void cancelBooking_shouldNotPenalizeGuestBookingEvenWhenLate() {
        // Guest bookings (BK-002) have no points balance to deduct from.
        testBooking.setUser(null);
        testBooking.setGuestName("Jane Guest");
        testBooking.setGuestEmail("jane@example.com");
        testBooking.setGuestPhone("+60123456789");
        testBooking.setAppointmentTime(LocalDateTime.now().plusHours(2));
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(testBooking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Booking cancelled = bookingService.cancelBooking(bookingId);

        assertEquals(Booking.BookingStatus.CANCELLED, cancelled.getStatus());
        verifyNoInteractions(loyaltyService);
    }

    // =============== markNoShow() ===============

    @Test
    void markNoShow_shouldMarkPenalizeAndRestrict() {
        LocalDateTime appointmentTime = testBooking.getAppointmentTime();
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(testBooking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Booking result = bookingService.markNoShow(bookingId);

        assertEquals(Booking.BookingStatus.NO_SHOW, result.getStatus());
        verify(loyaltyService).applyPointsPenalty(testUser, 20);
        verify(activityLogRepository).save(argThat(log ->
                log.getActionType() == ActivityLog.TransactionType.CANCELLATION_PENALTY
                        && log.getPointsEarned() == -20));
        assertEquals(appointmentTime.plusDays(7), testUser.getBookingRestrictedUntil());
        verify(userRepository).save(testUser);
    }

    @Test
    void markNoShow_shouldMarkGuestBookingWithoutPenalizingOrRestricting() {
        testBooking.setUser(null);
        testBooking.setGuestName("Jane Guest");
        testBooking.setGuestEmail("jane@example.com");
        testBooking.setGuestPhone("+60123456789");
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(testBooking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Booking result = bookingService.markNoShow(bookingId);

        assertEquals(Booking.BookingStatus.NO_SHOW, result.getStatus());
        verifyNoInteractions(loyaltyService);
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void markNoShow_shouldThrowWhenBookingNotFound() {
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> bookingService.markNoShow(bookingId));
    }

    @Test
    void markNoShow_shouldThrowWhenAlreadyCancelled() {
        testBooking.setStatus(Booking.BookingStatus.CANCELLED);
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(testBooking));

        assertThrows(RuntimeException.class, () -> bookingService.markNoShow(bookingId));
    }

    @Test
    void markNoShow_shouldThrowWhenAlreadyCompleted() {
        testBooking.setStatus(Booking.BookingStatus.COMPLETED);
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(testBooking));

        assertThrows(RuntimeException.class, () -> bookingService.markNoShow(bookingId));
    }

    // =============== completeBooking() ===============

    @Test
    void completeBooking_shouldCompleteAndAwardPoints() {
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(testBooking));
        when(globalSettingsService.getPointsPerMyr()).thenReturn(10);
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Booking completed = bookingService.completeBooking(bookingId);

        assertEquals(Booking.BookingStatus.COMPLETED, completed.getStatus());
        assertEquals(300, completed.getPointsAwarded());
        verify(loyaltyService).addPointsToUser(testUser, 300);
        verify(activityLogRepository).save(any(ActivityLog.class));
    }

    @Test
    void completeBooking_shouldCompleteGuestBookingWithoutAwardingPoints() {
        testBooking.setUser(null);
        testBooking.setGuestName("Jane Guest");
        testBooking.setGuestEmail("jane@example.com");
        testBooking.setGuestPhone("+60123456789");
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(testBooking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Booking completed = bookingService.completeBooking(bookingId);

        assertEquals(Booking.BookingStatus.COMPLETED, completed.getStatus());
        assertEquals(0, completed.getPointsAwarded());
        verifyNoInteractions(loyaltyService);
        verify(activityLogRepository, never()).save(any(ActivityLog.class));
    }

    @Test
    void completeBooking_shouldThrowWhenBookingNotFound() {
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class,
                () -> bookingService.completeBooking(bookingId));
    }

    @Test
    void completeBooking_shouldThrowWhenAlreadyCompleted() {
        testBooking.setStatus(Booking.BookingStatus.COMPLETED);
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(testBooking));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> bookingService.completeBooking(bookingId));
        assertEquals("Booking is already completed.", ex.getMessage());
    }

    @Test
    void completeBooking_shouldThrowWhenBookingIsCancelled() {
        testBooking.setStatus(Booking.BookingStatus.CANCELLED);
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(testBooking));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> bookingService.completeBooking(bookingId));
        assertTrue(ex.getMessage().toLowerCase().contains("cancell"));
    }

    @Test
    void completeBooking_shouldRoundFractionalPointsInsteadOfTruncating() {
        testBooking.setTotalPriceMyr(BigDecimal.valueOf(25.90));
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(testBooking));
        when(globalSettingsService.getPointsPerMyr()).thenReturn(10);
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Booking completed = bookingService.completeBooking(bookingId);

        // RM 25.90 * 10 = 259, rounded — not `.intValue()`-truncated to 250.
        assertEquals(259, completed.getPointsAwarded());
    }

    @Test
    void completeBooking_shouldClampInsteadOfOverflowingOnHugePointsPerMyr() {
        testBooking.setTotalPriceMyr(BigDecimal.valueOf(999_999));
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(testBooking));
        when(globalSettingsService.getPointsPerMyr()).thenReturn(Integer.MAX_VALUE);
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Booking completed = bookingService.completeBooking(bookingId);

        assertEquals(Integer.MAX_VALUE, completed.getPointsAwarded());
    }

    @Test
    void completeBooking_shouldThrowFriendlyErrorOnConcurrentCompletion() {
        // Simulates two /complete requests racing on the same PENDING booking:
        // both pass the status guards, but the @Version-backed save() only
        // lets one of them win (BK-032).
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(testBooking));
        when(globalSettingsService.getPointsPerMyr()).thenReturn(10);
        when(bookingRepository.save(any(Booking.class)))
                .thenThrow(new org.springframework.dao.OptimisticLockingFailureException("stale version"));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> bookingService.completeBooking(bookingId));
        assertTrue(ex.getMessage().toLowerCase().contains("already completed"));
    }

    @Test
    void completeBooking_shouldHandlePointsAwardFailure() {
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(testBooking));
        when(globalSettingsService.getPointsPerMyr()).thenReturn(10);
        doThrow(new RuntimeException("Points service down"))
                .when(loyaltyService).addPointsToUser(any(User.class), anyInt());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> bookingService.completeBooking(bookingId));
        assertEquals("Points service down", ex.getMessage());
    }

    // =============== getUserBookings() ===============

    @Test
    void getUserBookings_shouldReturnBookingsForUser() {
        when(bookingRepository.findByUserIdOrderByAppointmentTimeDesc(userId))
                .thenReturn(List.of(testBooking));

        List<Booking> bookings = bookingService.getUserBookings(userId);

        assertEquals(1, bookings.size());
        assertEquals(bookingId, bookings.get(0).getId());
    }

    @Test
    void getUserBookings_shouldReturnEmptyListWhenNoBookings() {
        when(bookingRepository.findByUserIdOrderByAppointmentTimeDesc(userId))
                .thenReturn(List.of());

        List<Booking> bookings = bookingService.getUserBookings(userId);

        assertTrue(bookings.isEmpty());
    }

    // =============== getAllBookings() ===============

    @Test
    void getAllBookings_shouldReturnAllBookings() {
        Pageable pageable = PageRequest.of(0, 100);
        when(bookingRepository.findAllByOrderByAppointmentTimeDesc(pageable))
                .thenReturn(new PageImpl<>(List.of(testBooking)));

        List<Booking> bookings = bookingService.getAllBookings(pageable);

        assertEquals(1, bookings.size());
    }

    @Test
    void getAllBookings_shouldReturnEmptyListWhenNoBookings() {
        Pageable pageable = PageRequest.of(0, 100);
        when(bookingRepository.findAllByOrderByAppointmentTimeDesc(pageable))
                .thenReturn(new PageImpl<>(List.of()));

        List<Booking> bookings = bookingService.getAllBookings(pageable);

        assertTrue(bookings.isEmpty());
    }
}
