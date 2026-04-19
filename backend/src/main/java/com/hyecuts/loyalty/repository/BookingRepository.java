package com.hyecuts.loyalty.repository;

import com.hyecuts.loyalty.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID> {
    List<Booking> findByUserIdOrderByAppointmentTimeDesc(UUID userId);
    List<Booking> findByUserIdAndStatusOrderByAppointmentTimeDesc(UUID userId, Booking.BookingStatus status);
}
