package com.hyecuts.loyalty.service;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.EnumMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * Opening hours live in two places: BUSINESS_HOURS in src/data/hyecuts.ts
 * (the slots the UI offers) and BusinessHours here (what the API accepts).
 * This reads the frontend file and fails if they disagree, so changing one
 * without the other is caught in the build instead of by a customer.
 *
 * <p>Skipped when the frontend source isn't present, e.g. a backend-only
 * Docker build context.
 */
class BusinessHoursParityTest {

    private static final Path FRONTEND_HOURS = Path.of("..", "src", "data", "hyecuts.ts");

    private static final Pattern ENTRY = Pattern.compile(
            "\\{\\s*day:\\s*'(\\w+)',\\s*hours:\\s*'([^']+)',\\s*open:\\s*(true|false)\\s*}");

    private static final DateTimeFormatter TWELVE_HOUR =
            DateTimeFormatter.ofPattern("h:mm a", Locale.ENGLISH);

    private record Hours(boolean open, LocalTime opens, LocalTime closes) {}

    private static Map<DayOfWeek, Hours> frontendHours() throws IOException {
        String source = Files.readString(FRONTEND_HOURS);
        int start = source.indexOf("BUSINESS_HOURS");
        assertTrue(start >= 0, "BUSINESS_HOURS not found in " + FRONTEND_HOURS);
        String block = source.substring(start, source.indexOf("];", start));

        Map<DayOfWeek, Hours> hours = new EnumMap<>(DayOfWeek.class);
        Matcher m = ENTRY.matcher(block);
        while (m.find()) {
            DayOfWeek day = DayOfWeek.valueOf(m.group(1).toUpperCase(Locale.ROOT));
            String[] range = m.group(2).split("-");
            assertEquals(2, range.length, "Unparseable hours for " + day + ": " + m.group(2));
            hours.put(day, new Hours(
                    Boolean.parseBoolean(m.group(3)),
                    LocalTime.parse(range[0].trim().toUpperCase(Locale.ROOT), TWELVE_HOUR),
                    LocalTime.parse(range[1].trim().toUpperCase(Locale.ROOT), TWELVE_HOUR)));
        }
        return hours;
    }

    @Test
    void backendHoursMatchTheFrontendsBusinessHours() throws IOException {
        assumeTrue(Files.exists(FRONTEND_HOURS), "frontend source not available");

        Map<DayOfWeek, Hours> frontend = frontendHours();
        assertEquals(7, frontend.size(), "Expected an entry for every day of the week: " + frontend.keySet());

        LocalDate monday = LocalDate.of(2026, 10, 19);
        for (Map.Entry<DayOfWeek, Hours> entry : frontend.entrySet()) {
            LocalDate date = monday.with(TemporalAdjusters.nextOrSame(entry.getKey()));
            Hours h = entry.getValue();
            String day = entry.getKey().toString();

            if (!h.open()) {
                assertFalse(BusinessHours.isOpenAt(LocalDateTime.of(date, LocalTime.NOON)),
                        day + " is closed in the frontend but the backend accepts bookings");
                continue;
            }
            assertTrue(BusinessHours.isOpenAt(LocalDateTime.of(date, h.opens())),
                    day + " opens at " + h.opens() + " in the frontend but the backend rejects it");
            assertFalse(BusinessHours.isOpenAt(LocalDateTime.of(date, h.opens().minusMinutes(1))),
                    day + ": backend accepts a time before the frontend's " + h.opens() + " opening");
            assertTrue(BusinessHours.isOpenAt(LocalDateTime.of(date, h.closes().minusMinutes(1))),
                    day + ": backend rejects a time before the frontend's " + h.closes() + " closing");
            assertFalse(BusinessHours.isOpenAt(LocalDateTime.of(date, h.closes())),
                    day + ": backend accepts the frontend's " + h.closes() + " closing time");
        }
    }
}
