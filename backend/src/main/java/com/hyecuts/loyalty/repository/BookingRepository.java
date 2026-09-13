package com.hyecuts.loyalty.repository;

import com.hyecuts.loyalty.model.Booking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID> {
    @EntityGraph(attributePaths = {"service", "user"})
    List<Booking> findByUserIdOrderByAppointmentTimeDesc(UUID userId);

    @EntityGraph(attributePaths = {"service", "user"})
    List<Booking> findByUserIdAndStatusOrderByAppointmentTimeDesc(UUID userId, Booking.BookingStatus status);

    @EntityGraph(attributePaths = {"service", "user"})
    List<Booking> findAllByOrderByAppointmentTimeDesc();

    // Bounded variant for the admin list — the unbounded one above still backs
    // narrower, inherently-small queries (a single user's history) elsewhere.
    @EntityGraph(attributePaths = {"service", "user"})
    Page<Booking> findAllByOrderByAppointmentTimeDesc(Pageable pageable);

    @EntityGraph(attributePaths = {"service", "user"})
    List<Booking> findByAppointmentTimeBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

    boolean existsByAppointmentTimeAndStatusNot(java.time.LocalDateTime appointmentTime, Booking.BookingStatus status);

    boolean existsByAppointmentTimeAndStatusNotAndIdNot(java.time.LocalDateTime appointmentTime, Booking.BookingStatus status, UUID excludeId);

    // Admin analytics (ADM-010): aggregated in the database instead of loading
    // every booking into memory. Range is half-open, [from, to). Only COMPLETED
    // bookings count, so the appointment line agrees with revenue (ADM-008).
    @Query("SELECT new com.hyecuts.loyalty.repository.DailyBookingTotals("
            + "extract(date from b.appointmentTime), SUM(b.totalPriceMyr), COUNT(b)) "
            + "FROM Booking b "
            + "WHERE b.status = 'COMPLETED' "
            + "AND b.appointmentTime >= :from AND b.appointmentTime < :to "
            + "GROUP BY extract(date from b.appointmentTime)")
    List<DailyBookingTotals> dailyCompletedTotals(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    // Joins the service once rather than lazily loading it per booking.
    @Query("SELECT new com.hyecuts.loyalty.repository.ServiceBookingCount(s.name, COUNT(b)) "
            + "FROM Booking b JOIN b.service s GROUP BY s.name")
    List<ServiceBookingCount> countByServiceName();
}
