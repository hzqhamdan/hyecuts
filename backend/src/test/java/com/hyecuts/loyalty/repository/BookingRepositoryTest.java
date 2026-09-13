package com.hyecuts.loyalty.repository;

import com.hyecuts.loyalty.model.BarberService;
import com.hyecuts.loyalty.model.Booking;
import com.hyecuts.loyalty.model.Booking.BookingStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Executes the analytics aggregate queries against a real schema (ADM-010).
 * They replace in-memory streams over findAll(), so a malformed query would
 * otherwise first fail on the admin dashboard in production (DB-018).
 */
@DataJpaTest(properties = "spring.flyway.enabled=false")
class BookingRepositoryTest {

    private static final LocalDate DAY = LocalDate.of(2026, 9, 1);

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private BookingRepository bookingRepository;

    private BarberService service(String name) {
        BarberService service = new BarberService();
        service.setName(name);
        service.setPriceMyr(new BigDecimal("50.00"));
        service.setBasePoints(10);
        service.setDurationMinutes(30);
        entityManager.persist(service);
        return service;
    }

    private void booking(BarberService service, LocalDateTime at, BookingStatus status, String price) {
        Booking booking = new Booking();
        booking.setService(service);
        booking.setAppointmentTime(at);
        booking.setStatus(status);
        booking.setTotalPriceMyr(new BigDecimal(price));
        entityManager.persist(booking);
    }

    private Map<LocalDate, DailyBookingTotals> totals(LocalDateTime from, LocalDateTime to) {
        entityManager.flush();
        return bookingRepository.dailyCompletedTotals(from, to).stream()
                .collect(Collectors.toMap(DailyBookingTotals::day, t -> t));
    }

    @Test
    void dailyCompletedTotals_sumsAndCountsCompletedBookingsPerDay() {
        BarberService cut = service("Cut");
        booking(cut, DAY.atTime(10, 0), BookingStatus.COMPLETED, "50.00");
        booking(cut, DAY.atTime(15, 30), BookingStatus.COMPLETED, "25.50");
        booking(cut, DAY.plusDays(1).atTime(9, 0), BookingStatus.COMPLETED, "40.00");

        Map<LocalDate, DailyBookingTotals> byDay = totals(DAY.atStartOfDay(), DAY.plusDays(2).atStartOfDay());

        assertEquals(2, byDay.size());
        assertEquals(0, new BigDecimal("75.50").compareTo(byDay.get(DAY).revenue()));
        assertEquals(2L, byDay.get(DAY).appointments());
        assertEquals(0, new BigDecimal("40.00").compareTo(byDay.get(DAY.plusDays(1)).revenue()));
        assertEquals(1L, byDay.get(DAY.plusDays(1)).appointments());
    }

    @Test
    void dailyCompletedTotals_ignoresEveryStatusOtherThanCompleted() {
        // ADM-008: cancelled and no-show bookings used to inflate the
        // appointment count while contributing no revenue.
        BarberService cut = service("Cut");
        booking(cut, DAY.atTime(10, 0), BookingStatus.COMPLETED, "50.00");
        booking(cut, DAY.atTime(11, 0), BookingStatus.CANCELLED, "50.00");
        booking(cut, DAY.atTime(12, 0), BookingStatus.NO_SHOW, "50.00");
        booking(cut, DAY.atTime(13, 0), BookingStatus.PENDING, "50.00");
        booking(cut, DAY.atTime(14, 0), BookingStatus.CONFIRMED, "50.00");

        Map<LocalDate, DailyBookingTotals> byDay = totals(DAY.atStartOfDay(), DAY.plusDays(1).atStartOfDay());

        assertEquals(1L, byDay.get(DAY).appointments());
        assertEquals(0, new BigDecimal("50.00").compareTo(byDay.get(DAY).revenue()));
    }

    @Test
    void dailyCompletedTotals_includesTheStartAndExcludesTheEnd() {
        BarberService cut = service("Cut");
        booking(cut, DAY.minusDays(1).atTime(23, 59), BookingStatus.COMPLETED, "1.00");
        booking(cut, DAY.atStartOfDay(), BookingStatus.COMPLETED, "2.00");
        booking(cut, DAY.atTime(23, 59, 59), BookingStatus.COMPLETED, "4.00");
        booking(cut, DAY.plusDays(1).atStartOfDay(), BookingStatus.COMPLETED, "8.00");

        Map<LocalDate, DailyBookingTotals> byDay = totals(DAY.atStartOfDay(), DAY.plusDays(1).atStartOfDay());

        assertEquals(List.of(DAY), List.copyOf(byDay.keySet()));
        assertEquals(0, new BigDecimal("6.00").compareTo(byDay.get(DAY).revenue()));
        assertEquals(2L, byDay.get(DAY).appointments());
    }

    @Test
    void countByServiceName_countsBookingsOfEveryStatusPerService() {
        BarberService cut = service("Cut");
        BarberService shave = service("Shave");
        booking(cut, DAY.atTime(10, 0), BookingStatus.COMPLETED, "50.00");
        booking(cut, DAY.atTime(11, 0), BookingStatus.CANCELLED, "50.00");
        booking(shave, DAY.minusYears(1).atTime(9, 0), BookingStatus.PENDING, "30.00");
        service("Unbooked");
        entityManager.flush();

        Map<String, Long> counts = bookingRepository.countByServiceName().stream()
                .collect(Collectors.toMap(ServiceBookingCount::serviceName, ServiceBookingCount::bookings));

        assertEquals(Map.of("Cut", 2L, "Shave", 1L), counts);
    }
}
