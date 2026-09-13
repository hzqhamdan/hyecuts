package com.hyecuts.loyalty.repository;

import java.math.BigDecimal;
import java.time.LocalDate;

/** One day's completed-booking revenue and count, aggregated in SQL (ADM-010). */
public record DailyBookingTotals(LocalDate day, BigDecimal revenue, Long appointments) {}
