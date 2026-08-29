package com.hyecuts.loyalty.controller;

import com.hyecuts.loyalty.repository.UserRepository;
import com.hyecuts.loyalty.security.JwtUtil;
import com.hyecuts.loyalty.security.OAuth2CodeExchangeService;
import com.hyecuts.loyalty.security.TokenRevocationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Verifies the registration constraints are actually <em>enforced</em>, not merely
 * declared.
 *
 * <p>Constraints on a DTO do nothing without {@code @Valid} on the parameter — that
 * exact gap was PRF-003, where {@code UpdateProfileRequest} carried {@code @Email}
 * and {@code @Size} that never ran. A test asserting only on the record would have
 * passed throughout. So these go through MockMvc and assert on HTTP status.
 *
 * <p>Security filters are disabled: the subject here is bean validation, and
 * {@code /api/auth/**} is unauthenticated anyway.
 */
@WebMvcTest(controllers = AuthController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.REGEX,
                pattern = "com\\.hyecuts\\.loyalty\\.security\\..*"))
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerValidationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean private AuthenticationManager authenticationManager;
    @MockBean private UserDetailsService userDetailsService;
    @MockBean private JwtUtil jwtUtil;
    @MockBean private UserRepository userRepository;
    @MockBean private PasswordEncoder passwordEncoder;
    @MockBean private OAuth2CodeExchangeService oauth2CodeExchangeService;
    @MockBean private TokenRevocationService tokenRevocationService;

    private void postRegister(String body, int expectedStatus) throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().is(expectedStatus));
    }

    // =============== AUTH-010: null / missing password ===============

    @Test
    void register_shouldRejectNullPassword() throws Exception {
        // Previously reached passwordEncoder.encode(null) and 500'd.
        postRegister("{\"username\":\"a@b.com\",\"password\":null}", 400);
        verify(passwordEncoder, never()).encode(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_shouldRejectMissingPasswordField() throws Exception {
        postRegister("{\"username\":\"a@b.com\"}", 400);
        verify(userRepository, never()).save(any());
    }

    // =============== AUTH-011: empty / blank identifier ===============

    @Test
    void register_shouldRejectEmptyIdentifier() throws Exception {
        // Used to persist email = "" — and the *second* such account then
        // violated the unique constraint with a 500.
        postRegister("{\"username\":\"\",\"password\":\"validpass123\"}", 400);
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_shouldRejectWhitespaceOnlyIdentifier() throws Exception {
        postRegister("{\"username\":\"   \",\"password\":\"validpass123\"}", 400);
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_shouldRejectNonEmailIdentifier() throws Exception {
        // The value is written to users.email (NOT NULL UNIQUE).
        postRegister("{\"username\":\"not-an-email\",\"password\":\"validpass123\"}", 400);
        verify(userRepository, never()).save(any());
    }

    // =============== AUTH-012: password policy ===============

    @Test
    void register_shouldRejectSingleCharacterPassword() throws Exception {
        postRegister("{\"username\":\"a@b.com\",\"password\":\"a\"}", 400);
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_shouldRejectPasswordJustUnderTheMinimum() throws Exception {
        postRegister("{\"username\":\"a@b.com\",\"password\":\"1234567\"}", 400);
        verify(userRepository, never()).save(any());
    }

    // =============== AUTH-019: oversized input ===============

    @Test
    void register_shouldRejectOversizedIdentifier() throws Exception {
        // 10 000 chars against a VARCHAR(255) column — used to 500 from the DB.
        String huge = "a".repeat(10_000) + "@b.com";
        postRegister("{\"username\":\"" + huge + "\",\"password\":\"validpass123\"}", 400);
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_shouldRejectPasswordBeyondBcryptLimit() throws Exception {
        // BCrypt silently ignores everything past 72 bytes.
        postRegister("{\"username\":\"a@b.com\",\"password\":\"" + "a".repeat(73) + "\"}", 400);
        verify(userRepository, never()).save(any());
    }

    // =============== Login must NOT inherit the registration policy ===============

    @Test
    void login_shouldNotApplyThePasswordLengthPolicy() throws Exception {
        // The whole reason RegisterRequest is a separate type: a min-length rule
        // here would 400 every pre-existing account with a shorter password and
        // lock them out permanently. A short password must still reach the
        // authentication manager and fail as 401, not 400.
        when(authenticationManager.authenticate(any()))
                .thenThrow(new org.springframework.security.authentication.BadCredentialsException("bad"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"legacy@user.com\",\"password\":\"short\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_shouldStillAcceptANonEmailUsername() throws Exception {
        // Sign-in by username is supported (findByEmailOrUsername, AUTH-002);
        // an @Email rule on the shared DTO would have broken it outright.
        when(authenticationManager.authenticate(any()))
                .thenThrow(new org.springframework.security.authentication.BadCredentialsException("bad"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"plainusername\",\"password\":\"whatever\"}"))
                .andExpect(status().isUnauthorized());
        verify(authenticationManager).authenticate(any());
    }

    @Test
    void login_shouldRejectBlankCredentials() throws Exception {
        // Blank can never authenticate, so 400 here discloses nothing about
        // which accounts exist.
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"\",\"password\":\"\"}"))
                .andExpect(status().isBadRequest());
        verify(authenticationManager, never()).authenticate(any());
    }

    // =============== Happy path still works ===============

    @Test
    void register_shouldAcceptAValidPayload() throws Exception {
        when(userRepository.findByEmailOrUsername(anyString(), anyString()))
                .thenReturn(java.util.Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        when(userRepository.save(any())).thenAnswer(inv -> {
            com.hyecuts.loyalty.model.User u = inv.getArgument(0);
            u.setId(java.util.UUID.randomUUID());
            return u;
        });
        when(jwtUtil.generateToken(anyString(), anyString())).thenReturn("a.jwt.token");

        postRegister("{\"username\":\"new@hyecuts.com\",\"password\":\"validpass123\"}", 200);
        verify(userRepository).save(any());
    }

    @Test
    void register_shouldTrimTheIdentifierBeforePersisting() throws Exception {
        // AUTH-021: profile update trimmed but register did not, so " a@b.com "
        // created an account its owner could never match afterwards.
        when(userRepository.findByEmailOrUsername(anyString(), anyString()))
                .thenReturn(java.util.Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        when(userRepository.save(any())).thenAnswer(inv -> {
            com.hyecuts.loyalty.model.User u = inv.getArgument(0);
            u.setId(java.util.UUID.randomUUID());
            return u;
        });
        when(jwtUtil.generateToken(anyString(), anyString())).thenReturn("a.jwt.token");

        postRegister("{\"username\":\"  spaced@hyecuts.com  \",\"password\":\"validpass123\"}", 200);

        verify(userRepository).save(argThat(u ->
                "spaced@hyecuts.com".equals(u.getEmail())
                        && "spaced@hyecuts.com".equals(u.getUsername())));
    }
}
