package com.hyecuts.loyalty.web;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Payload for {@code POST /api/auth/register} (AUTH-010/011/012/019).
 *
 * <p>Deliberately <strong>separate</strong> from {@code AuthController.AuthRequest},
 * which stays annotation-light for {@code /login}. Sharing one annotated DTO across
 * both endpoints would be actively harmful:
 * <ul>
 *   <li>a minimum-length rule on login locks out every existing account whose
 *       password predates the policy — they could never authenticate again;</li>
 *   <li>{@code @Email} on login breaks sign-in by username, which is a supported
 *       path ({@code findByEmailOrUsername}, AUTH-002);</li>
 *   <li>validation failures on login disclose the password policy to anyone
 *       probing the endpoint.</li>
 * </ul>
 *
 * <p>Registration is the one place the rules belong, because {@code identifier}
 * is written to {@code users.email} — a {@code NOT NULL UNIQUE} column — and to
 * {@code users.username}. Letting {@code ""} or a 10 000-character string through
 * produced a 500 from the database rather than a 400 from the API.
 */
public record RegisterRequest(
    // Stored as both email and username. @Email keeps non-address junk out of
    // the email column; max 255 matches the VARCHAR(255) the DB actually has.
    @NotBlank(message = "Email is required")
    @Email(message = "Must be a valid email address")
    @Size(max = 255, message = "Email must be at most 255 characters")
    String username,

    // BCrypt only consumes the first 72 bytes, so anything longer is silently
    // truncated — rejecting is more honest than accepting a passphrase whose
    // tail never counted. (@Size counts characters, so multi-byte input can
    // still land under 72 chars but over 72 bytes; this bounds the common case.)
    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters")
    String password
) {
    /**
     * Normalises the identifier at construction, which is before validation runs.
     *
     * <p>It has to happen here rather than in the handler: {@code @Email} would
     * otherwise reject a merely space-padded address outright, and a mobile
     * keyboard appending a space after autocomplete is ordinary user behaviour,
     * not a malformed request. Doing it in the type also means no future handler
     * can forget to — AUTH-021 was precisely that omission.
     *
     * <p>The password is deliberately left untouched: surrounding whitespace can
     * be a genuine part of a passphrase, and silently trimming it would change
     * the secret out from under whoever chose it.
     */
    public RegisterRequest {
        if (username != null) {
            username = username.trim();
        }
    }
}
