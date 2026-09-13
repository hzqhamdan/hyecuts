package com.hyecuts.loyalty.controller;

import com.hyecuts.loyalty.repository.BookingRepository;
import com.hyecuts.loyalty.repository.DailyBookingTotals;
import com.hyecuts.loyalty.repository.ServiceBookingCount;
import com.hyecuts.loyalty.repository.TierCount;
import com.hyecuts.loyalty.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    // Appointment times are stored as Kuala Lumpur wall-clock (BK-016), so
    // "today" must be the KL date — the injected clock is UTC, which would put
    // the chart a day behind between midnight and 08:00 local.
    static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Kuala_Lumpur");
    static final int DAYS = 30;

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final Clock clock;

    public AnalyticsController(BookingRepository bookingRepository, UserRepository userRepository, Clock clock) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.clock = clock;
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary() {
        // Every figure is aggregated in the database (ADM-010); nothing here
        // loads whole tables.
        Map<String, Object> summary = new HashMap<>();

        // 1. Daily revenue & completed appointments, last 30 days including today.
        // Exactly DAYS buckets over a half-open range (ADM-007).
        LocalDate today = LocalDate.ofInstant(clock.instant(), BUSINESS_ZONE);
        LocalDate firstDay = today.minusDays(DAYS - 1);
        Map<LocalDate, DailyBookingTotals> totalsByDay = bookingRepository
                .dailyCompletedTotals(firstDay.atStartOfDay(), today.plusDays(1).atStartOfDay())
                .stream()
                .collect(Collectors.toMap(DailyBookingTotals::day, Function.identity()));

        List<Map<String, Object>> dailyData = new ArrayList<>();
        for (int i = 0; i < DAYS; i++) {
            LocalDate date = firstDay.plusDays(i);
            DailyBookingTotals totals = totalsByDay.get(date);
            Map<String, Object> dayEntry = new HashMap<>();
            dayEntry.put("date", date.toString());
            dayEntry.put("revenue", totals == null ? BigDecimal.ZERO : totals.revenue());
            dayEntry.put("appointments", totals == null ? 0L : totals.appointments());
            dailyData.add(dayEntry);
        }
        summary.put("dailyData", dailyData);

        // 2. Tier Distribution
        Map<String, Long> tierDistribution = userRepository.countByTier().stream()
                .collect(Collectors.toMap(t -> t.tier().name(), TierCount::users));
        summary.put("tierDistribution", tierDistribution);

        // 3. Service Popularity (all bookings, all time)
        Map<String, Long> servicePopularity = bookingRepository.countByServiceName().stream()
                .collect(Collectors.toMap(ServiceBookingCount::serviceName, ServiceBookingCount::bookings));
        summary.put("servicePopularity", servicePopularity);

        return ResponseEntity.ok(summary);
    }
}
