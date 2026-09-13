package com.hyecuts.loyalty.controller;

import com.hyecuts.loyalty.model.Tier;
import com.hyecuts.loyalty.repository.BookingRepository;
import com.hyecuts.loyalty.repository.DailyBookingTotals;
import com.hyecuts.loyalty.repository.ServiceBookingCount;
import com.hyecuts.loyalty.repository.TierCount;
import com.hyecuts.loyalty.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnalyticsControllerTest {

    // 2026-09-12T20:00Z is 04:00 on 2026-09-13 in Kuala Lumpur (UTC+8), but
    // still the 12th in UTC — so "today" must come from the business zone.
    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-09-12T20:00:00Z"), ZoneOffset.UTC);
    private static final LocalDate TODAY_KL = LocalDate.of(2026, 9, 13);

    @Mock private BookingRepository bookingRepository;
    @Mock private UserRepository userRepository;

    private AnalyticsController controller;

    @BeforeEach
    void setUp() {
        controller = new AnalyticsController(bookingRepository, userRepository, CLOCK);
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> dailyData(Map<String, Object> summary) {
        return (List<Map<String, Object>>) summary.get("dailyData");
    }

    @Test
    void summary_neverLoadsWholeTables() {
        controller.getSummary();

        verify(bookingRepository, never()).findAll();
        verify(userRepository, never()).findAll();
    }

    @Test
    void summary_queriesTheLast30KualaLumpurDaysAsAHalfOpenRange() {
        controller.getSummary();

        verify(bookingRepository).dailyCompletedTotals(
                TODAY_KL.minusDays(29).atStartOfDay(),
                TODAY_KL.plusDays(1).atStartOfDay());
    }

    @Test
    void summary_returnsExactly30DailyBucketsEndingToday() {
        // ADM-007: the old loop rendered 31 buckets, the first always empty.
        List<Map<String, Object>> days = dailyData(controller.getSummary().getBody());

        assertEquals(30, days.size());
        assertEquals(TODAY_KL.minusDays(29).toString(), days.get(0).get("date"));
        assertEquals(TODAY_KL.toString(), days.get(29).get("date"));
    }

    @Test
    void summary_fillsDaysWithoutCompletedBookingsWithZero() {
        when(bookingRepository.dailyCompletedTotals(any(), any())).thenReturn(List.of(
                new DailyBookingTotals(TODAY_KL.minusDays(29), new BigDecimal("120.00"), 3L),
                new DailyBookingTotals(TODAY_KL, new BigDecimal("45.50"), 1L)));

        List<Map<String, Object>> days = dailyData(controller.getSummary().getBody());

        assertEquals(new BigDecimal("120.00"), days.get(0).get("revenue"));
        assertEquals(3L, days.get(0).get("appointments"));
        assertEquals(BigDecimal.ZERO, days.get(1).get("revenue"));
        assertEquals(0L, days.get(1).get("appointments"));
        assertEquals(new BigDecimal("45.50"), days.get(29).get("revenue"));
        assertEquals(1L, days.get(29).get("appointments"));
    }

    @Test
    void summary_reportsTierAndServiceCountsFromTheAggregateQueries() {
        when(userRepository.countByTier()).thenReturn(List.of(
                new TierCount(Tier.MEMBER, 7L), new TierCount(Tier.PATRON, 2L)));
        when(bookingRepository.countByServiceName()).thenReturn(List.of(
                new ServiceBookingCount("Cut", 11L)));

        Map<String, Object> summary = controller.getSummary().getBody();

        assertEquals(Map.of("MEMBER", 7L, "PATRON", 2L), summary.get("tierDistribution"));
        assertEquals(Map.of("Cut", 11L), summary.get("servicePopularity"));
    }
}
