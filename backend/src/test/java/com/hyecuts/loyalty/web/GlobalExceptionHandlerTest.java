package com.hyecuts.loyalty.web;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;

public class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handleAny_shouldNotLeakRawExceptionMessageToClient() {
        // API-002/003: an unanticipated exception's message can contain SQL
        // constraint names, driver errors, or other internals — the client
        // response must never surface it verbatim, even though it's still
        // fully logged server-side.
        Exception ex = new RuntimeException("duplicate key value violates unique constraint \"users_email_key\"");

        ResponseEntity<ApiError> response = handler.handleAny(ex);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().message().contains("constraint"));
        assertEquals("An unexpected error occurred.", response.getBody().message());
    }
}
