package com.hyecuts.loyalty.repository;

import com.hyecuts.loyalty.model.Booking;
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

    @EntityGraph(attributePaths = {"service", "user"})
    List<Booking> findByAppointmentTimeBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

    boolean existsByAppointmentTimeAndStatusNot(java.time.LocalDateTime appointmentTime, Booking.BookingStatus status);

    boolean existsByAppointmentTimeAndStatusNotAndIdNot(java.time.LocalDateTime appointmentTime, Booking.BookingStatus status, UUID excludeId);
}
