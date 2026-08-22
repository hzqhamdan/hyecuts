package com.hyecuts.loyalty.repository;

import com.hyecuts.loyalty.model.Booking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

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
}
