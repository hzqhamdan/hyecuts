package com.hyecuts.loyalty.service;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

class BusinessHoursTest {

    // 2026-10-19 is a Monday, 2026-10-23 a Friday, 2026-10-25 a Sunday.
    @ParameterizedTest(name = "{0} -> {1}")
    @CsvSource({
            "2026-10-19T11:59, false",
            "2026-10-19T12:00, true",
            "2026-10-19T21:30, true",
            "2026-10-19T21:59, true",
            "2026-10-19T22:00, false",
            "2026-10-19T09:00, false",
            "2026-10-23T12:00, false",
            "2026-10-23T14:29, false",
            "2026-10-23T14:30, true",
            "2026-10-23T21:30, true",
            "2026-10-23T22:00, false",
            "2026-10-25T12:00, true"
    })
    void isOpenAt_matchesTheShopsHours(LocalDateTime time, boolean open) {
        assertEquals(open, BusinessHours.isOpenAt(time));
    }
}
