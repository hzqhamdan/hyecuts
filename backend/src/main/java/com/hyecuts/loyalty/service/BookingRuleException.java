package com.hyecuts.loyalty.service;

/**
 * A booking request broke a business rule (slot taken, booking already
 * completed, outside opening hours, ...). Its message is written for the
 * client and is returned as-is with a 400. Anything else thrown while
 * handling a booking is unexpected and goes to the global handler, which
 * logs it and returns a generic 500 without the raw message (API-002).
 */
public class BookingRuleException extends RuntimeException {
    public BookingRuleException(String message) {
        super(message);
    }
}
