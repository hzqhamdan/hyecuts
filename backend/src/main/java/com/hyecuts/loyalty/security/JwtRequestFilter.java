package com.hyecuts.loyalty.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
public class JwtRequestFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtRequestFilter.class);

    private final CustomUserDetailsService userDetailsService;
    private final JwtUtil jwtUtil;
    private final TokenRevocationService tokenRevocationService;

    public JwtRequestFilter(CustomUserDetailsService userDetailsService, JwtUtil jwtUtil, TokenRevocationService tokenRevocationService) {
        this.userDetailsService = userDetailsService;
        this.jwtUtil = jwtUtil;
        this.tokenRevocationService = tokenRevocationService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        final String authorizationHeader = request.getHeader("Authorization");

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")
                && SecurityContextHolder.getContext().getAuthentication() == null) {
            String jwt = authorizationHeader.substring(7);
            try {
                // AUTH-027: resolve by the token's userId claim, never its email subject.
                // An email can become ambiguous — a squatted username, a case-variant
                // pair — and resolving by it meant one user's profile edit could leave
                // another user's every request silently unauthenticated. A primary key
                // cannot be ambiguous. A missing or malformed claim throws here and is
                // handled below by leaving the request unauthenticated.
                UUID userId = UUID.fromString(jwtUtil.extractUserId(jwt));
                UserDetails userDetails = this.userDetailsService.loadUserById(userId);

                if (jwtUtil.validateToken(jwt, userDetails) && !tokenRevocationService.isRevoked(jwtUtil.extractJti(jwt))) {
                    UsernamePasswordAuthenticationToken usernamePasswordAuthenticationToken = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    usernamePasswordAuthenticationToken
                            .setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(usernamePasswordAuthenticationToken);
                }
            } catch (UsernameNotFoundException e) {
                // Token is valid but the user no longer exists — leave unauthenticated.
                log.debug("JWT referenced an unknown user: {}", e.getMessage());
            } catch (Exception e) {
                // Malformed, expired, or tampered token — leave unauthenticated rather
                // than letting the parser exception bubble up as a 500.
                log.debug("Rejected invalid JWT: {}", e.getMessage());
            }
        }
        chain.doFilter(request, response);
    }
}
