package com.hyecuts.loyalty.controller;

import com.hyecuts.loyalty.repository.UserRepository;
import com.hyecuts.loyalty.security.CustomUserDetails;
import com.hyecuts.loyalty.security.JwtUtil;
import com.hyecuts.loyalty.security.OAuth2CodeExchangeService;
import com.hyecuts.loyalty.security.RateLimitGuard;
import com.hyecuts.loyalty.security.TokenRevocationService;
import com.hyecuts.loyalty.service.IdentifierAvailability;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AuthController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.REGEX,
                pattern = "com\\.hyecuts\\.loyalty\\.security\\..*"))
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerRateLimitTest {

    @Autowired private MockMvc mockMvc;

    @MockBean private AuthenticationManager authenticationManager;
    @MockBean private UserDetailsService userDetailsService;
    @MockBean private JwtUtil jwtUtil;
    @MockBean private UserRepository userRepository;
    @MockBean private PasswordEncoder passwordEncoder;
    @MockBean private OAuth2CodeExchangeService oauth2CodeExchangeService;
    @MockBean private TokenRevocationService tokenRevocationService;
    @MockBean private RateLimitGuard rateLimitGuard;
    @MockBean private IdentifierAvailability identifierAvailability;

    private static final String LOGIN_BODY =
            "{\"username\":\"a@b.com\",\"password\":\"validpass123\"}";

    @Test
    void loginChecksTheBudgetForTheSubmittedIdentifier() throws Exception {
        // Ordering (check before authenticate) is covered by
        // loginReturns429WhenTheGuardRejects, which asserts the
        // AuthenticationManager is never reached once the guard throws.
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("bad"));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON).content(LOGIN_BODY));

        verify(rateLimitGuard).checkLogin(anyString(), eq("a@b.com"));
    }

    @Test
    void loginRejectsAnOversizedUsernameBeforeItReachesTheLimiter() throws Exception {
        // Without a maximum the identifier is retained as a rate-limiter map
        // key, so an attacker can spend the per-IP budget on multi-megabyte
        // strings and leave them resident. 255 matches the users.email column.
        String oversized = "x".repeat(300) + "@b.com";

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + oversized + "\",\"password\":\"validpass123\"}"))
                .andExpect(status().isBadRequest());

        verify(rateLimitGuard, never()).checkLogin(anyString(), anyString());
    }

    @Test
    void loginStillAcceptsAShortPassword() throws Exception {
        // AuthRequest stays deliberately permissive: a minimum-length rule here
        // would lock out every account whose password predates the policy.
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("bad"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"a@b.com\",\"password\":\"x\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginChargesTheBudgetOnFailure() throws Exception {
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("bad"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON).content(LOGIN_BODY))
                .andExpect(status().isUnauthorized());

        verify(rateLimitGuard).recordLoginFailure(anyString(), eq("a@b.com"));
    }

    @Test
    void successfulLoginChargesNothing() throws Exception {
        // The whole point of charging failures rather than attempts.
        com.hyecuts.loyalty.model.User user = new com.hyecuts.loyalty.model.User();
        user.setId(java.util.UUID.randomUUID());
        user.setEmail("a@b.com");
        user.setRole("ROLE_USER");

        when(authenticationManager.authenticate(any())).thenReturn(
                new UsernamePasswordAuthenticationToken(new CustomUserDetails(user), null, java.util.List.of()));
        when(userRepository.findById(user.getId())).thenReturn(java.util.Optional.of(user));
        when(jwtUtil.generateToken(anyString(), anyString())).thenReturn("a.jwt.token");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON).content(LOGIN_BODY))
                .andExpect(status().isOk());

        verify(rateLimitGuard, never()).recordLoginFailure(anyString(), anyString());
    }

    @Test
    void loginReturns429WhenTheGuardRejects() throws Exception {
        doThrow(new com.hyecuts.loyalty.security.RateLimitExceededException(60L))
                .when(rateLimitGuard).checkLogin(anyString(), anyString());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON).content(LOGIN_BODY))
                .andExpect(status().isTooManyRequests())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                        .header().string("Retry-After", "60"));

        verify(authenticationManager, never()).authenticate(any());
    }

    @Test
    void registerConsumesTheBudget() throws Exception {
        when(identifierAvailability.isTaken(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        when(userRepository.save(any())).thenAnswer(inv -> {
            com.hyecuts.loyalty.model.User u = inv.getArgument(0);
            u.setId(java.util.UUID.randomUUID());
            return u;
        });
        when(jwtUtil.generateToken(anyString(), anyString())).thenReturn("a.jwt.token");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"new@b.com\",\"password\":\"validpass123\"}"))
                .andExpect(status().isOk());

        verify(rateLimitGuard).checkAndConsumeRegistration(anyString());
    }

    @Test
    void registerReturns429AndCreatesNoUserWhenRejected() throws Exception {
        doThrow(new com.hyecuts.loyalty.security.RateLimitExceededException(3600L))
                .when(rateLimitGuard).checkAndConsumeRegistration(anyString());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"new@b.com\",\"password\":\"validpass123\"}"))
                .andExpect(status().isTooManyRequests());

        verify(userRepository, never()).save(any());
    }
}
