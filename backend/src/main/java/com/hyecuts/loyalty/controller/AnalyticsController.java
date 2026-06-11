package com.hyecuts.loyalty.controller;

import com.hyecuts.loyalty.model.Booking;
import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.repository.BookingRepository;
import com.hyecuts.loyalty.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;

    public AnalyticsController(BookingRepository bookingRepository, UserRepository userRepository) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary() {
        List<Booking> allBookings = bookingRepository.findAll();
        List<User> allUsers = userRepository.findAll();

        Map<String, Object> summary = new HashMap<>();

        // 1. Daily Revenue & Appointment Count (Last 30 days)
        LocalDate thirtyDaysAgo = LocalDate.now().minusDays(30);
        Map<LocalDate, BigDecimal> dailyRevenue = allBookings.stream()
                .filter(b -> b.getStatus() == Booking.BookingStatus.COMPLETED)
                .filter(b -> b.getAppointmentTime().toLocalDate().isAfter(thirtyDaysAgo))
                .collect(Collectors.groupingBy(
                        b -> b.getAppointmentTime().toLocalDate(),
                        Collectors.reducing(BigDecimal.ZERO, Booking::getTotalPriceMyr, BigDecimal::add)
                ));

        Map<LocalDate, Long> dailyCount = allBookings.stream()
                .filter(b -> b.getAppointmentTime().toLocalDate().isAfter(thirtyDaysAgo))
                .collect(Collectors.groupingBy(
                        b -> b.getAppointmentTime().toLocalDate(),
                        Collectors.counting()
                ));

        List<Map<String, Object>> dailyData = new ArrayList<>();
        for (int i = 0; i <= 30; i++) {
            LocalDate date = thirtyDaysAgo.plusDays(i);
            Map<String, Object> dayEntry = new HashMap<>();
            dayEntry.put("date", date.toString());
            dayEntry.put("revenue", dailyRevenue.getOrDefault(date, BigDecimal.ZERO));
            dayEntry.put("appointments", dailyCount.getOrDefault(date, 0L));
            dailyData.add(dayEntry);
        }
        summary.put("dailyData", dailyData);

        // 2. Tier Distribution
        Map<String, Long> tierDistribution = allUsers.stream()
                .collect(Collectors.groupingBy(
                        u -> u.getTier() != null ? u.getTier().name() : "MEMBER",
                        Collectors.counting()
                ));
        summary.put("tierDistribution", tierDistribution);

        // 3. Service Popularity
        Map<String, Long> servicePopularity = allBookings.stream()
                .filter(b -> b.getService() != null)
                .collect(Collectors.groupingBy(
                        b -> b.getService().getName(),
                        Collectors.counting()
                ));
        summary.put("servicePopularity", servicePopularity);

        return ResponseEntity.ok(summary);
    }
}
