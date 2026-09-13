package com.hyecuts.loyalty.security;

import com.hyecuts.loyalty.model.User;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class JwtRequestFilterTest {

    private static final String TOKEN = "a.jwt.token";

    private CustomUserDetailsService userDetailsService;
    private JwtUtil jwtUtil;
    private TokenRevocationService tokenRevocationService;
    private JwtRequestFilter filter;

    private final UUID aliceId = UUID.randomUUID();
    private CustomUserDetails alice;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        userDetailsService = mock(CustomUserDetailsService.class);
        jwtUtil = mock(JwtUtil.class);
        tokenRevocationService = mock(TokenRevocationService.class);
        filter = new JwtRequestFilter(userDetailsService, jwtUtil, tokenRevocationService);

        User user = new User();
        user.setId(aliceId);
        user.setEmail("alice@x.com");
        user.setPasswordHash("hash");
        user.setRole("ROLE_USER");
        alice = new CustomUserDetails(user);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void runWithToken() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + TOKEN);
        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());
    }

    private void stubValidTokenFor(CustomUserDetails principal) {
        when(jwtUtil.validateToken(TOKEN, principal)).thenReturn(true);
        when(jwtUtil.extractJti(TOKEN)).thenReturn("jti-1");
        when(tokenRevocationService.isRevoked("jti-1")).thenReturn(false);
    }

    @Test
    void resolvesThePrincipalByTheUserIdClaimNotTheSubject() throws Exception {
        when(jwtUtil.extractUsername(TOKEN)).thenReturn("alice@x.com");
        when(jwtUtil.extractUserId(TOKEN)).thenReturn(aliceId.toString());
        when(userDetailsService.loadUserById(aliceId)).thenReturn(alice);
        stubValidTokenFor(alice);

        runWithToken();

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(auth);
        assertSame(alice, auth.getPrincipal());
        verify(userDetailsService, never()).loadUserByUsername(anyString());
    }

    @Test
    void ambiguousIdentifierResolutionCannotBreakAnAuthenticatedSession() throws Exception {
        // AUTH-027: once Alice's email is ambiguous — Mallory squatted it as a username,
        // or a case-variant pair exists — resolving by it fails. Resolving by id must
        // not care. Before this change every one of Alice's requests silently arrived
        // unauthenticated.
        when(jwtUtil.extractUsername(TOKEN)).thenReturn("alice@x.com");
        when(userDetailsService.loadUserByUsername("alice@x.com"))
                .thenThrow(new UsernameNotFoundException("User not found"));
        when(jwtUtil.extractUserId(TOKEN)).thenReturn(aliceId.toString());
        when(userDetailsService.loadUserById(aliceId)).thenReturn(alice);
        stubValidTokenFor(alice);

        runWithToken();

        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void malformedUserIdClaimLeavesTheRequestUnauthenticated() throws Exception {
        when(jwtUtil.extractUserId(TOKEN)).thenReturn("not-a-uuid");

        runWithToken();

        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void missingUserIdClaimLeavesTheRequestUnauthenticated() throws Exception {
        when(jwtUtil.extractUserId(TOKEN)).thenReturn(null);

        runWithToken();

        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void unknownUserIdLeavesTheRequestUnauthenticated() throws Exception {
        when(jwtUtil.extractUserId(TOKEN)).thenReturn(aliceId.toString());
        when(userDetailsService.loadUserById(aliceId))
                .thenThrow(new UsernameNotFoundException("User not found"));

        runWithToken();

        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }
}
