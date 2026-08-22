package com.hyecuts.loyalty.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Set;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtRequestFilter jwtRequestFilter;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;
    private final OAuth2LoginFailureHandler oAuth2LoginFailureHandler;

    // The deployed frontend's own origin — the same value used to build the
    // OAuth2 redirect URL. Reused here so CORS trusts exactly the one host
    // this backend is actually serving, instead of a platform-wide wildcard.
    @Value("${frontend.base-url}")
    private String frontendBaseUrl;

    public SecurityConfig(JwtRequestFilter jwtRequestFilter,
                          CustomOAuth2UserService customOAuth2UserService,
                          OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler,
                          OAuth2LoginFailureHandler oAuth2LoginFailureHandler) {
        this.jwtRequestFilter = jwtRequestFilter;
        this.customOAuth2UserService = customOAuth2UserService;
        this.oAuth2LoginSuccessHandler = oAuth2LoginSuccessHandler;
        this.oAuth2LoginFailureHandler = oAuth2LoginFailureHandler;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(authz -> authz
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/login/oauth2/**").permitAll()
                .requestMatchers("/oauth2/**").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/actuator/**").hasRole("ADMIN")
                .requestMatchers("/h2-console/**").hasRole("ADMIN")

                // Public catalog data needed before/without login
                .requestMatchers(HttpMethod.GET, "/api/services/active").permitAll()

                // Admin-only surface: user management, points/tier grants, economy
                // settings, redemption fulfilment, catalog writes, and analytics.
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/analytics/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/bookings/all").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/bookings/*/complete").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/services", "/api/rewards", "/api/gamification/badges", "/api/gamification/missions").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/services/*/deactivate").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/services/all").hasRole("ADMIN")
                // These directly mint/burn points outside the normal earn/redeem flows
                // and have no legitimate self-service use.
                .requestMatchers("/api/loyalty/earn/**", "/api/loyalty/redeem/**").hasRole("ADMIN")

                // Everything else requires a logged-in caller; controllers enforce
                // that a non-admin caller may only touch their own userId.
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(userInfo -> userInfo
                    .userService(customOAuth2UserService)
                )
                .successHandler(oAuth2LoginSuccessHandler)
                .failureHandler(oAuth2LoginFailureHandler)
            )
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write(
                        "{\"status\":401,\"error\":\"Unauthorized\",\"message\":\"Authentication required\"}");
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    response.getWriter().write(
                        "{\"status\":403,\"error\":\"Forbidden\",\"message\":\"Access denied\"}");
                })
            )
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .headers(headers -> headers
                // Was frameOptions().disable() app-wide, apparently only to let
                // H2 console frame itself — that stripped clickjacking protection
                // from every response, including the admin dashboard. sameOrigin()
                // still lets H2 console (same origin) frame itself while blocking
                // any other site from framing this app. frame-ancestors backs the
                // same policy at the CSP level for browsers that prefer it.
                .frameOptions(frame -> frame.sameOrigin())
                .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; frame-ancestors 'self'"))
            )
            .addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        // Wildcard patterns like "https://*.vercel.app" trust every tenant on that
        // platform, not just this app's deployment — with allowCredentials(true)
        // that lets any other Vercel/Railway-hosted site read authenticated
        // responses from a logged-in user's browser. Only the local dev origin
        // and this backend's own configured frontend origin are trusted.
        Set<String> allowedOrigins = new LinkedHashSet<>();
        allowedOrigins.add("http://localhost:5173");
        if (frontendBaseUrl != null && !frontendBaseUrl.isBlank()) {
            allowedOrigins.add(frontendBaseUrl.strip());
        }

        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowCredentials(true);
        configuration.setAllowedOrigins(new ArrayList<>(allowedOrigins));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setExposedHeaders(Arrays.asList("Authorization"));
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}

