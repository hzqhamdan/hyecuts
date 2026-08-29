package com.hyecuts.loyalty.service;

import java.time.LocalDateTime;

/**
 * Thrown when a member with an active booking_restricted_until (set after a
 * no-show, see cancellation-policy.md) tries to create a new booking.
 */
public class BookingRestrictedException extends RuntimeException {

    private final LocalDateTime restrictedUntil;

    public BookingRestrictedException(LocalDateTime restrictedUntil) {
        super("You can't book right now due to a recent no-show. You can book again after " + restrictedUntil + ".");
        this.restrictedUntil = restrictedUntil;
    }

    public LocalDateTime getRestrictedUntil() {
        return restrictedUntil;
    }
}
