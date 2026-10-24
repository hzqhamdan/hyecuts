package com.hyecuts.loyalty.exception;

/**
 * A request the server understood but refuses on validation grounds. Mapped to
 * 400 with the message passed through, so the message must be written for the
 * client and never carry internals.
 */
public class InvalidRequestException extends RuntimeException {
    public InvalidRequestException(String message) {
        super(message);
    }
}
