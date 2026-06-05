package com.hyecuts.loyalty.web;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

import java.util.Map;

/**
 * Payload for {@code PUT /api/loyalty/profile/{userId}}.
 *
 * A {@code null} field (or blank string) means "do not change" so partial
 * updates remain safe even with optional form fields. {@code dob} is kept
 * as a free-form string because the {@code users.dob} column is a
 * {@code VARCHAR} for backward compatibility — see plan "Future work".
 */
public record UpdateProfileRequest(
    @Size(max = 255) String fullName,
    @Email @Size(max = 255) String email,
    @Size(max = 32)  String dob,
    @Size(max = 32)  String phone,
    Map<String, String> hairProfile,
    String avatar
) { }
