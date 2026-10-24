package com.hyecuts.loyalty.service;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * The shop's opening hours, enforced server-side so a direct API call can't
 * book outside them (BK-052). Must match BUSINESS_HOURS in
 * src/data/hyecuts.ts, which drives the slots the booking UI offers.
 *
 * <p>An appointment is accepted when it starts at or after opening and before
 * closing; the last slot the UI offers is 9:30 PM.
 */
public final class BusinessHours {

    private static final LocalTime OPEN = LocalTime.of(12, 0);
    private static final LocalTime FRIDAY_OPEN = LocalTime.of(14, 30);
    private static final LocalTime CLOSE = LocalTime.of(22, 0);

    private BusinessHours() {}

    public static boolean isOpenAt(LocalDateTime time) {
        LocalTime open = time.getDayOfWeek() == DayOfWeek.FRIDAY ? FRIDAY_OPEN : OPEN;
        LocalTime start = time.toLocalTime();
        return !start.isBefore(open) && start.isBefore(CLOSE);
    }
}
