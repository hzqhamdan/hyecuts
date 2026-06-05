package com.hyecuts.loyalty.web;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.Map;

/**
 * Stable error envelope returned by {@link GlobalExceptionHandler}.
 * {@code fieldErrors} is omitted from the JSON when null so the body stays
 * compact for non-validation errors.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(
    Instant timestamp,
    int status,
    String error,
    String message,
    Map<String, String> fieldErrors
) { }
