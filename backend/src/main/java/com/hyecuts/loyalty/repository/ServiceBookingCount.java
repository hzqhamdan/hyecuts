package com.hyecuts.loyalty.repository;

/** Number of bookings of any status for one service, aggregated in SQL (ADM-010). */
public record ServiceBookingCount(String serviceName, Long bookings) {}
