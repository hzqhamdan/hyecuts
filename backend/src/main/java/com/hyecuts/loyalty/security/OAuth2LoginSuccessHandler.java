package com.hyecuts.loyalty.security;

import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final String frontendBaseUrl;

    public OAuth2LoginSuccessHandler(
            JwtUtil jwtUtil,
            UserRepository userRepository,
            @Value("${frontend.base-url}") String frontendBaseUrl) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.frontendBaseUrl = frontendBaseUrl;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = (String) oAuth2User.getAttributes().get("email");

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found after OAuth2 login"));

        String jwt = jwtUtil.generateToken(user.getEmail(), user.getId().toString());
        String displayName = user.getUsername() != null ? user.getUsername() : user.getEmail();

        String redirectUrl = String.format("%s/oauth2/callback?token=%s&userId=%s&role=%s&username=%s",
                frontendBaseUrl,
                URLEncoder.encode(jwt, StandardCharsets.UTF_8),
                URLEncoder.encode(user.getId().toString(), StandardCharsets.UTF_8),
                URLEncoder.encode(user.getRole(), StandardCharsets.UTF_8),
                URLEncoder.encode(displayName, StandardCharsets.UTF_8));

        response.sendRedirect(redirectUrl);
    }
}
