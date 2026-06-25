package com.hyecuts.loyalty.service;

import com.hyecuts.loyalty.model.ActivityLog;
import com.hyecuts.loyalty.model.BarberService;
import com.hyecuts.loyalty.model.Booking;
import com.hyecuts.loyalty.model.Tier;
import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.repository.ActivityLogRepository;
import com.hyecuts.loyalty.repository.BookingRepository;
import com.hyecuts.loyalty.repository.UserRepository;
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
    void createBooking_shouldThrowWhenUserNotFound() {
        testBooking.setUser(null);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> bookingService.createBooking(testBooking));
        assertEquals("User not found", ex.getMessage());
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
        when(bookingRepository.findAllByOrderByAppointmentTimeDesc())
                .thenReturn(List.of(testBooking));

        List<Booking> bookings = bookingService.getAllBookings();

        assertEquals(1, bookings.size());
    }

    @Test
    void getAllBookings_shouldReturnEmptyListWhenNoBookings() {
        when(bookingRepository.findAllByOrderByAppointmentTimeDesc())
                .thenReturn(List.of());

        List<Booking> bookings = bookingService.getAllBookings();

        assertTrue(bookings.isEmpty());
    }
}
