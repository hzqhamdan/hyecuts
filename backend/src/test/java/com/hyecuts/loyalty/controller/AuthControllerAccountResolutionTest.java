package com.hyecuts.loyalty.controller;

import com.hyecuts.loyalty.model.User;
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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = AuthController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.REGEX,
                pattern = "com\\.hyecuts\\.loyalty\\.security\\..*"))
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerAccountResolutionTest {

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

    @Test
    void loginBuildsItsResponseFromTheAuthenticatedPrincipal() throws Exception {
        // AUTH-027: login used to look the identifier up a second time after
        // authenticating, and that second lookup is where an ambiguous identifier
        // failed. Authentication already resolved the account; use it.
        //
        // The token subject must be the STORED email ("alice@x.com"), not the
        // identifier as typed ("ALICE@X.COM"). JwtUtil.validateToken compares the
        // subject to the account's email on every request, so a typed-casing subject
        // would sign the user in and then reject every request they make. The
        // generateToken stub only matches the stored email, so that mistake fails here.
        UUID aliceId = UUID.randomUUID();
        User alice = new User();
        alice.setId(aliceId);
        alice.setEmail("alice@x.com");
        alice.setUsername("alice");
        alice.setPasswordHash("hash");
        alice.setRole("ROLE_USER");

        when(authenticationManager.authenticate(any())).thenReturn(
                new UsernamePasswordAuthenticationToken(new CustomUserDetails(alice), null, List.of()));
        when(userRepository.findById(aliceId)).thenReturn(Optional.of(alice));
        when(jwtUtil.generateToken("alice@x.com", aliceId.toString())).thenReturn("a.jwt.token");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"ALICE@X.COM\",\"password\":\"validpass123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(aliceId.toString()))
                .andExpect(jsonPath("$.token").value("a.jwt.token"));

        verify(userRepository).findById(aliceId);
        verifyNoMoreInteractions(userRepository);
    }

    @Test
    void loginReturns401WhenAuthenticationYieldsNoUsablePrincipal() throws Exception {
        // Fail closed rather than 500 on a null or unexpected principal.
        when(authenticationManager.authenticate(any())).thenReturn(null);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"alice@x.com\",\"password\":\"validpass123\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void registerRejectsAnIdentifierThatIsAlreadyTaken() throws Exception {
        // A case-variant of an existing email, or somebody's username, must not become a
        // new account — that is how ambiguous rows get created. The case-insensitive,
        // both-columns rule itself is proven in IdentifierAvailabilityTest; this proves
        // registration consults it, with the trimmed identifier.
        when(identifierAvailability.isTaken("jane@x.com")).thenReturn(true);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"  jane@x.com  \",\"password\":\"validpass123\"}"))
                .andExpect(status().isBadRequest());

        verify(identifierAvailability).isTaken("jane@x.com");
        verify(userRepository, never()).save(any());
    }
}
